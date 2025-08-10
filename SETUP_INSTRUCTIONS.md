# Setup Instructions - Daily Sales & Cash Reconciliation System

This guide will walk you through the complete setup process for the Daily Sales & Cash Reconciliation System.

## 📋 Prerequisites

Before you begin, ensure you have:
- A Google account (personal Gmail or Google Workspace)
- Store manager or administrator permissions
- Basic understanding of Google Sheets
- Email addresses for notifications (manager and admin)

## 🔧 Step-by-Step Setup

### Step 1: Create the Google Sheets Document

1. **Open Google Sheets**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Sign in to your Google account

2. **Create New Spreadsheet**
   - Click the "+" button or "Blank" template
   - Rename the spreadsheet to "Daily Sales Reconciliation"
   - Note the spreadsheet URL (you'll need the ID later)

### Step 2: Set Up Google Apps Script

1. **Open Apps Script Editor**
   - In your Google Sheet, click `Extensions > Apps Script`
   - This opens the Google Apps Script editor in a new tab

2. **Replace Default Code**
   - Delete the existing `myFunction()` code
   - Copy the entire contents of the `Code.gs` file
   - Paste it into the script editor

3. **Save the Project**
   - Click the save icon (💾) or press `Ctrl+S`
   - Rename the project to "Sales Reconciliation System"

4. **Set Script Properties**
   - In Apps Script, go to `Settings` (⚙️) in the left sidebar
   - Scroll down to "Script Properties"
   - Add the following properties:
     - `SPREADSHEET_ID`: Your spreadsheet ID (from the URL)
     - `MANAGER_EMAIL`: Primary email for reports
     - `ADMIN_EMAIL`: Secondary email for alerts

### Step 3: Initialize the System

1. **Run Initial Setup**
   - In the Apps Script editor, select `initializeSpreadsheet` from the function dropdown
   - Click the "Run" button (▶️)

2. **Grant Permissions**
   - You'll see a permission request dialog
   - Click "Review permissions"
   - Select your Google account
   - Click "Allow" to grant necessary permissions
   - The script needs access to:
     - Google Sheets (read/write data)
     - Gmail (send emails)
     - Google Drive (file access)

3. **Verify Setup**
   - Check the "Execution transcript" for any errors
   - You should see "Execution completed" message
   - Return to your Google Sheet and verify new sheets were created

### Step 4: Configure System Settings

1. **Update Settings Sheet**
   - Go to the "Settings" tab in your spreadsheet
   - Update the following values:
     - `Store Name`: Your retail store name
     - `Manager Email`: Email for daily reports
     - `Admin Email`: Email for system alerts
     - `Cash Discrepancy Threshold`: Amount to flag as discrepancy ($5.00 recommended)
     - `Large Discrepancy Threshold`: Amount for immediate alerts ($50.00 recommended)
     - `Daily Report Time`: Time for automated reports (18:00 = 6 PM)

2. **Test Email Configuration**
   - In Apps Script editor, select `testEmailConfiguration` function
   - Click "Run" button
   - Check that test email is received
   - If no email received, verify email addresses in Settings sheet

### Step 5: Set Up Web Interface (Optional)

If you want to use the web interface:

1. **Choose Hosting Option**
   - **Option A**: Google Sites (Recommended for beginners)
   - **Option B**: External web hosting
   - **Option C**: Local development server

2. **Option A - Google Sites Setup**
   - Go to [sites.google.com](https://sites.google.com)
   - Click "Create" to start a new site
   - Choose a blank template
   - Add an "Embed" component
   - Upload your HTML file or embed the code
   - Publish the site

3. **Option B - External Hosting**
   - Upload all files (`index.html`, `styles.css`, `app.js`, etc.) to your web server
   - Ensure HTTPS is enabled for Google APIs
   - Update any configuration paths as needed

### Step 6: Configure Automation Triggers

1. **Verify Triggers**
   - In Apps Script, click "Triggers" (⏰) in the left sidebar
   - You should see triggers for:
     - `runDailyReconciliation` (daily at 6 PM)
     - `onSpreadsheetEdit` (on edit)

2. **Customize Trigger Times** (Optional)
   - Delete existing daily trigger if you want different timing
   - Click "+ Add Trigger"
   - Choose `runDailyReconciliation` function
   - Select "Time-driven" trigger type
   - Choose "Day timer" and set your preferred time

### Step 7: Initial Data Entry Test

1. **Test Manual Entry**
   - Go to the "Sales_Data" sheet
   - Add a test row with sample data:
     - Date: Today's date
     - Register Number: REG001
     - Opening Cash: 200.00
     - Cash Sales: 150.00
     - Card Sales: 300.00
     - Returns & Refunds: 10.00
     - Cash Drops: 100.00
     - Closing Cash: 240.00

2. **Verify Calculations**
   - Check that "Expected Cash", "Cash Difference", "Total Sales", and "Status" columns auto-populate
   - Expected Cash should be: 200 + 150 - 10 - 100 = 240
   - Cash Difference should be: 240 - 240 = 0
   - Status should be: "balanced"

3. **Test Web Interface** (if set up)
   - Open your web interface
   - Navigate to "Data Entry" tab
   - Enter the same test data
   - Verify it appears in the Google Sheet

### Step 8: Test Email Functionality

1. **Test Daily Report**
   - In Apps Script, run `runDailyReconciliation` function manually
   - Check that report email is received
   - Verify report contains your test data

2. **Test Discrepancy Alert**
   - Add a test entry with large cash difference (over $50)
   - Run `runDailyReconciliation` or wait for automatic processing
   - Verify alert email is received

## 🔍 Verification Checklist

After setup, verify these components are working:

- [ ] Google Sheets has all required sheets (Sales_Data, Reconciliation, Dashboard, Settings)
- [ ] Apps Script triggers are active
- [ ] Test emails are received successfully
- [ ] Data validation is working (try entering invalid data)
- [ ] Calculations are accurate (Expected Cash, Cash Difference, etc.)
- [ ] Dashboard formulas are populating
- [ ] Web interface connects to spreadsheet (if using)

## 🚨 Troubleshooting Common Setup Issues

### Permission Errors
**Problem**: "Permission denied" or "Authorization required"
**Solution**: 
- Re-run the authorization process
- Ensure you're signed into correct Google account
- Check if corporate policies restrict Apps Script

### Email Not Sending
**Problem**: Emails not received
**Solution**:
- Verify email addresses in Settings sheet are correct
- Check spam/junk folders
- Ensure "Auto Email Notifications" is set to TRUE
- Run `testEmailConfiguration` function

### Formulas Not Working
**Problem**: Calculated columns showing errors
**Solution**:
- Verify column headers match exactly (case-sensitive)
- Check that all required sheets exist
- Re-run `initializeSpreadsheet` function
- Ensure no empty rows in headers

### Triggers Not Working
**Problem**: Automated functions not running
**Solution**:
- Check trigger configuration in Apps Script
- Verify quota limits aren't exceeded
- Check execution transcript for errors
- Re-create triggers if necessary

### Data Validation Issues
**Problem**: Can't enter certain values
**Solution**:
- Check data validation rules in spreadsheet
- Ensure dates are in correct format (YYYY-MM-DD)
- Verify register numbers match validation list
- Use positive numbers for cash amounts

## 📞 Getting Additional Help

If you encounter issues not covered here:

1. **Check Apps Script Logs**
   - Go to Apps Script editor
   - Click "Executions" to see recent runs
   - Look for detailed error messages

2. **Review Google Documentation**
   - [Google Apps Script Guide](https://developers.google.com/apps-script)
   - [Google Sheets API Documentation](https://developers.google.com/sheets)

3. **Test Components Individually**
   - Test spreadsheet functions first
   - Then test email functionality
   - Finally test web interface (if using)

## 🔐 Security Recommendations

1. **Spreadsheet Sharing**
   - Share with specific people only
   - Use "Editor" access for data entry staff
   - Use "Viewer" access for management
   - Avoid "Anyone with link" sharing for financial data

2. **Email Security**
   - Use secure email addresses
   - Regularly review email recipient lists
   - Consider using Google Groups for team emails

3. **Regular Backups**
   - Download spreadsheet copies weekly
   - Export important data regularly
   - Keep records of configuration changes

## ✅ Next Steps

After successful setup:

1. **Train Your Team**
   - Show staff how to enter daily sales data
   - Explain the reconciliation process
   - Demonstrate the dashboard features

2. **Customize as Needed**
   - Adjust reconciliation thresholds
   - Modify email templates
   - Add custom validation rules

3. **Monitor and Maintain**
   - Review email reports daily
   - Check for data entry accuracy
   - Monitor system performance

4. **Plan for Growth**
   - Consider additional registers
   - Plan for seasonal volume changes
   - Evaluate integration opportunities

---

**Setup Complete!** Your Daily Sales & Cash Reconciliation System is now ready for use. Start with small test transactions and gradually move to full daily operations.
