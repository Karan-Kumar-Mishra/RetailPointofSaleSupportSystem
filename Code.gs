/**
 * Google Apps Script Code for Sales & Cash Reconciliation System
 * Handles backend automation, data processing, and email notifications
 */

// Configuration constants
const CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  SHEET_NAMES: {
    SALES_DATA: 'Sales_Data',
    RECONCILIATION: 'Reconciliation',
    DASHBOARD: 'Dashboard',
    SETTINGS: 'Settings'
  },
  EMAIL_SETTINGS: {
    MANAGER_EMAIL: PropertiesService.getScriptProperties().getProperty('MANAGER_EMAIL') || '',
    ADMIN_EMAIL: PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || '',
    DAILY_REPORT_TIME: '18:00'
  },
  RECONCILIATION_RULES: {
    CASH_DISCREPANCY_THRESHOLD: 5.00,
    LARGE_DISCREPANCY_THRESHOLD: 50.00,
    MAX_RETURNS_PERCENTAGE: 10.0
  }
};

/**
 * Initialize the spreadsheet and set up automation
 */
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create required sheets if they don't exist
    createRequiredSheets(spreadsheet);
    
    // Set up data validation and formatting
    setupDataValidation(spreadsheet);
    
    // Create triggers for automation
    setupTriggers();
    
    // Initialize dashboard formulas
    setupDashboardFormulas(spreadsheet);
    
    Logger.log('Spreadsheet initialized successfully');
    return { success: true, message: 'Spreadsheet initialized successfully' };
  } catch (error) {
    Logger.log('Error initializing spreadsheet: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Create required sheets with proper structure
 */
function createRequiredSheets(spreadsheet) {
  const sheetNames = Object.values(CONFIG.SHEET_NAMES);
  
  sheetNames.forEach(sheetName => {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      Logger.log(`Created sheet: ${sheetName}`);
    }
    
    // Setup sheet-specific structure
    switch (sheetName) {
      case CONFIG.SHEET_NAMES.SALES_DATA:
        setupSalesDataSheet(sheet);
        break;
      case CONFIG.SHEET_NAMES.RECONCILIATION:
        setupReconciliationSheet(sheet);
        break;
      case CONFIG.SHEET_NAMES.DASHBOARD:
        setupDashboardSheet(sheet);
        break;
      case CONFIG.SHEET_NAMES.SETTINGS:
        setupSettingsSheet(sheet);
        break;
    }
  });
}

/**
 * Setup Sales Data sheet structure
 */
function setupSalesDataSheet(sheet) {
  const headers = [
    'Entry ID', 'Date', 'Register Number', 'Opening Cash', 'Cash Sales', 
    'Card Sales', 'Returns & Refunds', 'Cash Drops', 'Closing Cash',
    'Expected Cash', 'Cash Difference', 'Total Sales', 'Status', 'Timestamp'
  ];
  
  // Set headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // Entry ID
  sheet.setColumnWidth(2, 100); // Date
  sheet.setColumnWidth(3, 120); // Register Number
  sheet.setColumnWidths(4, 9, 100); // Cash columns
  sheet.setColumnWidth(13, 100); // Status
  sheet.setColumnWidth(14, 150); // Timestamp
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for status column
  const statusRange = sheet.getRange('M2:M1000');
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['balanced', 'discrepancy', 'warning'])
    .build();
  statusRange.setDataValidation(statusValidation);
}

/**
 * Setup Reconciliation sheet structure
 */
function setupReconciliationSheet(sheet) {
  const headers = [
    'Date', 'Total Entries', 'Total Sales', 'Cash Sales', 'Card Sales',
    'Total Discrepancies', 'Large Discrepancies', 'Reconciliation Accuracy',
    'Total Cash Difference', 'Status', 'Last Updated'
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#34a853');
  headerRange.setFontColor('white');
  
  sheet.setFrozenRows(1);
  
  // Set up formulas for automatic calculation
  setupReconciliationFormulas(sheet);
}

/**
 * Setup Dashboard sheet structure
 */
function setupDashboardSheet(sheet) {
  // Create dashboard layout
  sheet.getRange('A1').setValue('DAILY SALES & CASH RECONCILIATION DASHBOARD');
  sheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  sheet.getRange('A1:F1').merge();
  
  // Key metrics section
  const metricsHeaders = ['Metric', 'Today', 'Yesterday', 'This Week', 'This Month'];
  sheet.getRange('A3:E3').setValues([metricsHeaders]);
  sheet.getRange('A3:E3').setFontWeight('bold').setBackground('#ff9900').setFontColor('white');
  
  const metrics = [
    ['Total Sales', '', '', '', ''],
    ['Cash Sales', '', '', '', ''],
    ['Card Sales', '', '', '', ''],
    ['Discrepancies', '', '', '', ''],
    ['Reconciliation Accuracy', '', '', '', '']
  ];
  
  sheet.getRange('A4:E8').setValues(metrics);
  
  // Set up chart data area
  sheet.getRange('A10').setValue('SALES TREND DATA');
  sheet.getRange('A10').setFontWeight('bold');
}

/**
 * Setup Settings sheet
 */
function setupSettingsSheet(sheet) {
  const settings = [
    ['Setting', 'Value', 'Description'],
    ['Store Name', 'Main Store', 'Name of the retail store'],
    ['Manager Email', CONFIG.EMAIL_SETTINGS.MANAGER_EMAIL, 'Email for daily reports'],
    ['Admin Email', CONFIG.EMAIL_SETTINGS.ADMIN_EMAIL, 'Email for system alerts'],
    ['Cash Discrepancy Threshold', CONFIG.RECONCILIATION_RULES.CASH_DISCREPANCY_THRESHOLD, 'Threshold for flagging discrepancies'],
    ['Large Discrepancy Threshold', CONFIG.RECONCILIATION_RULES.LARGE_DISCREPANCY_THRESHOLD, 'Threshold for critical alerts'],
    ['Max Returns Percentage', CONFIG.RECONCILIATION_RULES.MAX_RETURNS_PERCENTAGE, 'Maximum allowed returns percentage'],
    ['Daily Report Time', CONFIG.EMAIL_SETTINGS.DAILY_REPORT_TIME, 'Time to send daily reports'],
    ['Auto Email Notifications', 'TRUE', 'Enable automatic email notifications']
  ];
  
  sheet.getRange(1, 1, settings.length, 3).setValues(settings);
  sheet.getRange('A1:C1').setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  sheet.setFrozenRows(1);
}

/**
 * Setup data validation rules
 */
function setupDataValidation(spreadsheet) {
  const salesSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.SALES_DATA);
  
  // Date validation
  const dateRange = salesSheet.getRange('B2:B1000');
  const dateValidation = SpreadsheetApp.newDataValidation()
    .requireDate()
    .build();
  dateRange.setDataValidation(dateValidation);
  
  // Register number validation
  const registerRange = salesSheet.getRange('C2:C1000');
  const registerValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['REG001', 'REG002', 'REG003'])
    .build();
  registerRange.setDataValidation(registerValidation);
  
  // Positive number validation for cash amounts
  const cashRanges = ['D2:D1000', 'E2:E1000', 'F2:F1000', 'I2:I1000'];
  cashRanges.forEach(range => {
    const cashRange = salesSheet.getRange(range);
    const cashValidation = SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThanOrEqualTo(0)
      .build();
    cashRange.setDataValidation(cashValidation);
  });
}

/**
 * Setup reconciliation formulas
 */
function setupReconciliationFormulas(reconciliationSheet) {
  // Add formulas that will calculate daily reconciliation summaries
  const formulas = [
    // Today's data
    ['=TODAY()', 
     '=COUNTIFS(Sales_Data!B:B,A2)', 
     '=SUMIFS(Sales_Data!L:L,Sales_Data!B:B,A2)',
     '=SUMIFS(Sales_Data!E:E,Sales_Data!B:B,A2)',
     '=SUMIFS(Sales_Data!F:F,Sales_Data!B:B,A2)',
     '=COUNTIFS(Sales_Data!B:B,A2,Sales_Data!M:M,"discrepancy")',
     '=COUNTIFS(Sales_Data!B:B,A2,Sales_Data!K:K,">"&50)',
     '=IF(B2>0,(B2-F2)/B2*100,100)',
     '=SUMIFS(Sales_Data!K:K,Sales_Data!B:B,A2)',
     '=IF(F2=0,"balanced",IF(F2<=2,"warning","discrepancy"))',
     '=NOW()']
  ];
  
  reconciliationSheet.getRange('A2:K2').setFormulas(formulas);
}

/**
 * Setup dashboard formulas
 */
function setupDashboardFormulas(spreadsheet) {
  const dashboardSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.DASHBOARD);
  
  // Today's metrics
  const todayFormulas = [
    '=SUMIFS(Sales_Data!L:L,Sales_Data!B:B,TODAY())',
    '=SUMIFS(Sales_Data!E:E,Sales_Data!B:B,TODAY())',
    '=SUMIFS(Sales_Data!F:F,Sales_Data!B:B,TODAY())',
    '=COUNTIFS(Sales_Data!B:B,TODAY(),Sales_Data!M:M,"discrepancy")',
    '=IF(COUNTIFS(Sales_Data!B:B,TODAY())>0,(COUNTIFS(Sales_Data!B:B,TODAY())-COUNTIFS(Sales_Data!B:B,TODAY(),Sales_Data!M:M,"discrepancy"))/COUNTIFS(Sales_Data!B:B,TODAY())*100,100)'
  ];
  
  dashboardSheet.getRange('B4:B8').setFormulas(todayFormulas);
}

/**
 * Setup triggers for automation
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Daily reconciliation trigger
  ScriptApp.newTrigger('runDailyReconciliation')
    .timeBased()
    .everyDays(1)
    .atHour(18)
    .create();
  
  // Form submission trigger (if using Google Forms)
  ScriptApp.newTrigger('onSalesDataSubmission')
    .onFormSubmit()
    .create();
  
  // Spreadsheet edit trigger
  ScriptApp.newTrigger('onSpreadsheetEdit')
    .onEdit()
    .create();
  
  Logger.log('Triggers set up successfully');
}

/**
 * Add new sales entry
 */
function addSalesEntry(salesData) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const salesSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.SALES_DATA);
    
    // Generate entry ID
    const entryId = 'ENT_' + Date.now();
    
    // Calculate derived values
    const expectedCash = salesData.openingCash + salesData.cashSales - salesData.returnsRefunds - salesData.cashDrops;
    const cashDifference = salesData.closingCash - expectedCash;
    const totalSales = salesData.cashSales + salesData.cardSales;
    const status = Math.abs(cashDifference) <= CONFIG.RECONCILIATION_RULES.CASH_DISCREPANCY_THRESHOLD ? 'balanced' : 'discrepancy';
    
    // Prepare row data
    const rowData = [
      entryId,
      salesData.date,
      salesData.registerNumber,
      salesData.openingCash,
      salesData.cashSales,
      salesData.cardSales,
      salesData.returnsRefunds,
      salesData.cashDrops,
      salesData.closingCash,
      expectedCash,
      cashDifference,
      totalSales,
      status,
      new Date()
    ];
    
    // Add to sheet
    salesSheet.appendRow(rowData);
    
    // Update reconciliation if needed
    updateReconciliation();
    
    // Check for discrepancies and send alerts
    if (Math.abs(cashDifference) > CONFIG.RECONCILIATION_RULES.LARGE_DISCREPANCY_THRESHOLD) {
      sendDiscrepancyAlert([{
        entryId: entryId,
        date: salesData.date,
        registerNumber: salesData.registerNumber,
        cashDifference: cashDifference
      }]);
    }
    
    Logger.log(`Sales entry added: ${entryId}`);
    return { success: true, entryId: entryId };
  } catch (error) {
    Logger.log('Error adding sales entry: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Run daily reconciliation
 */
function runDailyReconciliation() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const salesSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.SALES_DATA);
    const reconciliationSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.RECONCILIATION);
    
    // Get today's data
    const today = new Date();
    const todayString = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    const salesData = getSalesDataForDate(todayString);
    const reconciliationResults = calculateReconciliation(salesData);
    
    // Update reconciliation sheet
    updateReconciliationSheet(reconciliationSheet, reconciliationResults);
    
    // Send daily report
    sendDailyReport(reconciliationResults);
    
    Logger.log('Daily reconciliation completed successfully');
    return reconciliationResults;
  } catch (error) {
    Logger.log('Error in daily reconciliation: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Get sales data for a specific date
 */
function getSalesDataForDate(date) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.SALES_DATA);
  
  const data = salesSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find date column index
  const dateColumnIndex = headers.indexOf('Date');
  
  // Filter data for the specified date
  const filteredData = data.slice(1).filter(row => {
    const rowDate = Utilities.formatDate(new Date(row[dateColumnIndex]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    return rowDate === date;
  });
  
  // Convert to objects
  return filteredData.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Calculate reconciliation results
 */
function calculateReconciliation(salesData) {
  const results = {
    date: new Date(),
    totalEntries: salesData.length,
    totalSales: 0,
    cashSales: 0,
    cardSales: 0,
    totalDiscrepancies: 0,
    largeDiscrepancies: 0,
    totalCashDifference: 0,
    discrepancies: []
  };
  
  salesData.forEach(entry => {
    results.totalSales += entry['Total Sales'] || 0;
    results.cashSales += entry['Cash Sales'] || 0;
    results.cardSales += entry['Card Sales'] || 0;
    results.totalCashDifference += entry['Cash Difference'] || 0;
    
    const cashDiff = Math.abs(entry['Cash Difference'] || 0);
    if (cashDiff > CONFIG.RECONCILIATION_RULES.CASH_DISCREPANCY_THRESHOLD) {
      results.totalDiscrepancies++;
      
      if (cashDiff > CONFIG.RECONCILIATION_RULES.LARGE_DISCREPANCY_THRESHOLD) {
        results.largeDiscrepancies++;
      }
      
      results.discrepancies.push({
        entryId: entry['Entry ID'],
        date: entry['Date'],
        registerNumber: entry['Register Number'],
        cashDifference: entry['Cash Difference']
      });
    }
  });
  
  results.reconciliationAccuracy = results.totalEntries > 0 ? 
    ((results.totalEntries - results.totalDiscrepancies) / results.totalEntries) * 100 : 100;
  
  results.status = results.largeDiscrepancies > 0 ? 'critical' :
                   results.totalDiscrepancies > 0 ? 'warning' : 'balanced';
  
  return results;
}

/**
 * Update reconciliation sheet
 */
function updateReconciliationSheet(sheet, results) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  // Check if today's data already exists
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    const rowDate = Utilities.formatDate(new Date(data[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (rowDate === today) {
      rowIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    new Date(),
    results.totalEntries,
    results.totalSales,
    results.cashSales,
    results.cardSales,
    results.totalDiscrepancies,
    results.largeDiscrepancies,
    results.reconciliationAccuracy,
    results.totalCashDifference,
    results.status,
    new Date()
  ];
  
  if (rowIndex > 0) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Add new row
    sheet.appendRow(rowData);
  }
}

/**
 * Send daily report email
 */
function sendDailyReport(reconciliationResults) {
  try {
    const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    const settings = getSettings(settingsSheet);
    
    if (!settings['Auto Email Notifications'] || settings['Auto Email Notifications'].toString().toLowerCase() !== 'true') {
      Logger.log('Email notifications disabled');
      return;
    }
    
    const managerEmail = settings['Manager Email'];
    if (!managerEmail) {
      Logger.log('Manager email not configured');
      return;
    }
    
    const subject = `Daily Reconciliation Report - ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}`;
    const htmlBody = generateDailyReportHtml(reconciliationResults);
    
    GmailApp.sendEmail(managerEmail, subject, '', {
      htmlBody: htmlBody,
      cc: settings['Admin Email'] || ''
    });
    
    Logger.log(`Daily report sent to ${managerEmail}`);
  } catch (error) {
    Logger.log('Error sending daily report: ' + error.toString());
  }
}

/**
 * Send discrepancy alert email
 */
function sendDiscrepancyAlert(discrepancies) {
  try {
    const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    const settings = getSettings(settingsSheet);
    
    const managerEmail = settings['Manager Email'];
    if (!managerEmail) {
      Logger.log('Manager email not configured');
      return;
    }
    
    const totalAmount = discrepancies.reduce((sum, d) => sum + Math.abs(d.cashDifference), 0);
    const subject = `🚨 Cash Discrepancy Alert - $${totalAmount.toFixed(2)}`;
    const htmlBody = generateDiscrepancyAlertHtml(discrepancies, totalAmount);
    
    GmailApp.sendEmail(managerEmail, subject, '', {
      htmlBody: htmlBody,
      cc: settings['Admin Email'] || ''
    });
    
    Logger.log(`Discrepancy alert sent to ${managerEmail}`);
  } catch (error) {
    Logger.log('Error sending discrepancy alert: ' + error.toString());
  }
}

/**
 * Get settings from settings sheet
 */
function getSettings(settingsSheet) {
  const data = settingsSheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    settings[data[i][0]] = data[i][1];
  }
  
  return settings;
}

/**
 * Generate daily report HTML
 */
function generateDailyReportHtml(results) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: #0d6efd; color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background-color: #f8f9fa; border-radius: 6px; min-width: 120px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #0d6efd; }
        .metric-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .status-${results.status} { color: ${results.status === 'balanced' ? '#28a745' : results.status === 'warning' ? '#ffc107' : '#dc3545'}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Daily Reconciliation Report</h1>
          <p>Sales & Cash Reconciliation Summary for ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')}</p>
        </div>
        
        <div class="metrics">
          <div class="metric">
            <div class="metric-value">$${results.totalSales.toFixed(2)}</div>
            <div class="metric-label">Total Sales</div>
          </div>
          <div class="metric">
            <div class="metric-value">${results.totalEntries}</div>
            <div class="metric-label">Transactions</div>
          </div>
          <div class="metric">
            <div class="metric-value">${results.totalDiscrepancies}</div>
            <div class="metric-label">Discrepancies</div>
          </div>
          <div class="metric">
            <div class="metric-value">${results.reconciliationAccuracy.toFixed(1)}%</div>
            <div class="metric-label">Accuracy</div>
          </div>
        </div>
        
        <h3>Status: <span class="status-${results.status}">${results.status.toUpperCase()}</span></h3>
        
        ${results.discrepancies.length > 0 ? `
          <h4>Discrepancies Requiring Attention:</h4>
          <ul>
            ${results.discrepancies.map(d => `
              <li>${d.registerNumber} on ${Utilities.formatDate(new Date(d.date), Session.getScriptTimeZone(), 'yyyy-MM-dd')}: $${d.cashDifference.toFixed(2)}</li>
            `).join('')}
          </ul>
        ` : '<p>✅ No discrepancies detected today!</p>'}
        
        <p><small>Generated automatically at ${new Date().toLocaleString()}</small></p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate discrepancy alert HTML
 */
function generateDiscrepancyAlertHtml(discrepancies, totalAmount) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #fff3cd; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #dc3545; }
        .header { color: #dc3545; margin-bottom: 20px; }
        .alert { background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Cash Discrepancy Alert</h1>
          <h2>Total Discrepancy: $${totalAmount.toFixed(2)}</h2>
        </div>
        
        <div class="alert">
          <strong>Immediate Attention Required:</strong> ${discrepancies.length} discrepancies detected that exceed the threshold.
        </div>
        
        <h3>Discrepancy Details:</h3>
        <ul>
          ${discrepancies.map(d => `
            <li><strong>${d.registerNumber}</strong> on ${Utilities.formatDate(new Date(d.date), Session.getScriptTimeZone(), 'yyyy-MM-dd')}: $${d.cashDifference.toFixed(2)}</li>
          `).join('')}
        </ul>
        
        <p><strong>Action Required:</strong> Please investigate these discrepancies immediately and take corrective action.</p>
        <p><small>Alert generated at ${new Date().toLocaleString()}</small></p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Handle form submissions
 */
function onSalesDataSubmission(e) {
  try {
    // This function will be called when a Google Form is submitted
    // Parse the form data and add to sales sheet
    const formData = e.values;
    
    // Map form values to sales data structure
    const salesData = {
      date: formData[1], // Assuming date is in second column
      registerNumber: formData[2],
      openingCash: parseFloat(formData[3]) || 0,
      cashSales: parseFloat(formData[4]) || 0,
      cardSales: parseFloat(formData[5]) || 0,
      returnsRefunds: parseFloat(formData[6]) || 0,
      cashDrops: parseFloat(formData[7]) || 0,
      closingCash: parseFloat(formData[8]) || 0
    };
    
    addSalesEntry(salesData);
  } catch (error) {
    Logger.log('Error handling form submission: ' + error.toString());
  }
}

/**
 * Handle spreadsheet edits
 */
function onSpreadsheetEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    
    // If edit is in Sales_Data sheet, update calculations
    if (sheet.getName() === CONFIG.SHEET_NAMES.SALES_DATA) {
      updateCalculatedFields(sheet, range);
    }
  } catch (error) {
    Logger.log('Error handling spreadsheet edit: ' + error.toString());
  }
}

/**
 * Update calculated fields when data is edited
 */
function updateCalculatedFields(sheet, range) {
  const row = range.getRow();
  if (row === 1) return; // Skip header row
  
  const rowData = sheet.getRange(row, 1, 1, 14).getValues()[0];
  
  // Calculate expected cash and cash difference
  const openingCash = rowData[3] || 0;
  const cashSales = rowData[4] || 0;
  const returnsRefunds = rowData[6] || 0;
  const cashDrops = rowData[7] || 0;
  const closingCash = rowData[8] || 0;
  
  const expectedCash = openingCash + cashSales - returnsRefunds - cashDrops;
  const cashDifference = closingCash - expectedCash;
  const totalSales = cashSales + (rowData[5] || 0); // Cash + Card sales
  const status = Math.abs(cashDifference) <= CONFIG.RECONCILIATION_RULES.CASH_DISCREPANCY_THRESHOLD ? 'balanced' : 'discrepancy';
  
  // Update calculated columns
  sheet.getRange(row, 10).setValue(expectedCash); // Expected Cash
  sheet.getRange(row, 11).setValue(cashDifference); // Cash Difference
  sheet.getRange(row, 12).setValue(totalSales); // Total Sales
  sheet.getRange(row, 13).setValue(status); // Status
  sheet.getRange(row, 14).setValue(new Date()); // Timestamp
}

/**
 * Export data for external use
 */
function exportData(dateFrom, dateTo) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const salesSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.SALES_DATA);
    
    const data = salesSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Filter data by date range
    const filteredData = data.slice(1).filter(row => {
      const rowDate = new Date(row[1]); // Date column
      return rowDate >= new Date(dateFrom) && rowDate <= new Date(dateTo);
    });
    
    return {
      headers: headers,
      data: filteredData,
      summary: calculateReconciliation(filteredData.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      }))
    };
  } catch (error) {
    Logger.log('Error exporting data: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Update reconciliation from external trigger
 */
function updateReconciliation() {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const salesData = getSalesDataForDate(today);
  const results = calculateReconciliation(salesData);
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const reconciliationSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.RECONCILIATION);
  
  updateReconciliationSheet(reconciliationSheet, results);
  
  return results;
}

/**
 * Test email configuration
 */
function testEmailConfiguration() {
  try {
    const settingsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    const settings = getSettings(settingsSheet);
    
    const testEmail = settings['Manager Email'];
    if (!testEmail) {
      throw new Error('Manager email not configured');
    }
    
    GmailApp.sendEmail(testEmail, 'Test Email - Sales Reconciliation System', '', {
      htmlBody: `
        <h3>Email Configuration Test</h3>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>System:</strong> Daily Sales & Cash Reconciliation</p>
      `
    });
    
    Logger.log('Test email sent successfully');
    return { success: true, message: 'Test email sent successfully' };
  } catch (error) {
    Logger.log('Error sending test email: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}
