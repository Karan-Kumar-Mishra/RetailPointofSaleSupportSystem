# Daily Sales & Cash Reconciliation System

A comprehensive Google Sheets + Apps Script automation solution for retail point-of-sale support, specifically designed to handle daily sales tracking and cash reconciliation for retail operations.

## 🌟 Features

### Core Functionality
- **Automated Daily Sales Tracking**: Record cash and card sales, returns, and cash drops
- **Real-time Cash Reconciliation**: Automatic calculation of expected vs. actual cash positions
- **Data Validation**: Built-in validation rules to ensure data accuracy and consistency
- **Error Detection**: Automated flagging of discrepancies and unusual patterns
- **Email Notifications**: Automated alerts for discrepancies and daily summary reports

### Dashboard & Reporting
- **Interactive Dashboard**: Real-time metrics and key performance indicators
- **Sales Trend Analysis**: 7-day sales trend visualization with Chart.js
- **Payment Method Distribution**: Visual breakdown of cash vs. card sales
- **Reconciliation Status**: Live status updates and accuracy metrics
- **Comprehensive Reports**: Daily, weekly, and monthly reconciliation reports

### Google Workspace Integration
- **Google Sheets Backend**: Centralized data storage with protected formulas
- **Apps Script Automation**: Server-side processing and automation
- **Gmail Integration**: Automated email reports and alerts
- **Form Integration**: Optional Google Forms for mobile data entry

## 🚀 Quick Start

### Prerequisites
- Google Workspace account (personal Gmail accounts work too)
- Basic understanding of Google Sheets
- Store manager or administrator access

### Installation

1. **Create a new Google Sheets document**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new blank spreadsheet
   - Name it "Daily Sales Reconciliation"

2. **Set up the Google Apps Script**
   - In your Google Sheet, go to `Extensions > Apps Script`
   - Delete the default `myFunction()` code
   - Copy and paste the entire contents of `Code.gs` into the script editor
   - Save the project (Ctrl+S)

3. **Initialize the system**
   - In the Apps Script editor, select the `initializeSpreadsheet` function
   - Click the "Run" button (▶️)
   - Grant necessary permissions when prompted
   - Wait for the function to complete

4. **Configure settings**
   - Go to the "Settings" sheet in your Google Sheets document
   - Update the email addresses and store information
   - Adjust reconciliation thresholds as needed

5. **Set up the web interface (optional)**
   - Host the HTML/CSS/JavaScript files on your preferred web server
   - Or use Google Sites for a simple hosting solution

## 📊 Usage Guide

### Adding Sales Data

#### Method 1: Direct Sheet Entry
1. Go to the "Sales_Data" sheet
2. Enter data in the following columns:
   - Date
   - Register Number (REG001, REG002, REG003)
   - Opening Cash
   - Cash Sales
   - Card Sales
   - Returns & Refunds
   - Cash Drops
   - Closing Cash Count

#### Method 2: Web Interface
1. Open the web application
2. Navigate to the "Data Entry" tab
3. Fill in the sales form
4. Click "Save Entry"

#### Method 3: Google Forms (Advanced)
1. Create a Google Form with the required fields
2. Link it to your spreadsheet
3. The Apps Script will automatically process submissions

### Understanding the Dashboard

The dashboard provides real-time insights into your daily operations:

- **Total Sales Today**: Sum of all sales transactions
- **Cash Reconciled**: Successfully balanced cash amounts
- **Discrepancies**: Number of unresolved cash differences
- **Registers Active**: Number of registers with transactions

### Reconciliation Process

The system automatically:
1. Calculates expected cash position
2. Compares with actual closing cash
3. Flags discrepancies above threshold ($5 by default)
4. Sends alerts for large discrepancies ($50+ by default)
5. Updates reconciliation accuracy metrics

### Email Notifications

Automated emails are sent for:
- **Daily Reports**: End-of-day summary (6 PM by default)
- **Discrepancy Alerts**: Immediate alerts for large cash differences
- **Weekly Summaries**: Weekly performance overview

## ⚙️ Configuration

### Email Settings
Update in the "Settings" sheet:
- `Manager Email`: Primary recipient for reports
- `Admin Email`: CC recipient for alerts
- `Daily Report Time`: When to send daily reports (24-hour format)
- `Auto Email Notifications`: Enable/disable automation

### Reconciliation Rules
Adjust thresholds in the "Settings" sheet:
- `Cash Discrepancy Threshold`: Minimum difference to flag ($5 default)
- `Large Discrepancy Threshold`: Amount for immediate alerts ($50 default)
- `Max Returns Percentage`: Warning threshold for returns (10% default)

### Data Validation
The system includes built-in validation for:
- Date formats and ranges
- Register number selection
- Positive number requirements for cash amounts
- Business logic checks (returns percentage, opening cash minimums)

## 📈 Reports & Analytics

### Available Reports
1. **Daily Reconciliation Report**
   - Transaction summary
   - Discrepancy details
   - Reconciliation accuracy
   - Cash position analysis

2. **Weekly Summary Report**
   - Sales trends
   - Average transaction values
   - Reconciliation performance
   - Payment method distribution

3. **Monthly Overview Report**
   - Total sales performance
   - Discrepancy patterns
   - Register performance comparison
   - Accuracy trends

### Exporting Data
- **CSV Export**: Download transaction data for external analysis
- **PDF Reports**: Printable reports for record keeping
- **JSON Export**: Raw data for integration with other systems

## 🔧 Troubleshooting

### Common Issues

#### "Permission denied" errors
- Ensure you've granted all necessary permissions to the Apps Script
- Check that email addresses in settings are valid
- Verify spreadsheet sharing permissions

#### Formulas not calculating
- Check that all required sheets exist (Sales_Data, Reconciliation, Dashboard, Settings)
- Verify that column headers match exactly
- Run `initializeSpreadsheet()` function again if needed

#### Emails not sending
- Verify email addresses in Settings sheet
- Check that "Auto Email Notifications" is set to TRUE
- Test email configuration using `testEmailConfiguration()` function

#### Data validation errors
- Ensure date formats are correct (YYYY-MM-DD)
- Check that register numbers match validation list
- Verify that cash amounts are positive numbers

### Getting Help

1. **Check the Apps Script logs**:
   - Go to Apps Script editor
   - Click "Executions" to see recent runs
   - Look for error messages in red

2. **Verify sheet structure**:
   - Ensure all required sheets exist
   - Check that column headers match expectations
   - Verify data types in each column

3. **Test step by step**:
   - Start with manual data entry
   - Test reconciliation calculations
   - Verify email functionality separately

## 🛡️ Security & Privacy

### Data Protection
- All data is stored in your Google Sheets (your Google account)
- No third-party data storage or transmission
- Email communications use Google's infrastructure
- Local browser storage for web interface preferences only

### Access Control
- Spreadsheet access controlled by Google Sheets sharing settings
- Apps Script runs under your Google account permissions
- Recommend using restricted sharing for sensitive financial data

### Best Practices
- Regularly backup your spreadsheet data
- Use strong passwords for Google accounts
- Review and audit email recipients periodically
- Monitor access logs for unusual activity

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Test changes thoroughly
4. Submit a pull request with detailed description

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Google Apps Script documentation for advanced customization

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Core reconciliation functionality
- Email automation
- Dashboard and reporting
- Google Sheets integration

---

**Built for retail point-of-sale support teams who need reliable, automated cash reconciliation with professional reporting capabilities.**
