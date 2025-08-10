/**
 * Email Service for Sales & Cash Reconciliation System
 * Handles email notifications and report generation
 */

class EmailService {
    constructor() {
        this.emailSettings = JSON.parse(localStorage.getItem('emailSettings')) || {
            managerEmail: '',
            adminEmail: '',
            autoNotifications: true,
            dailyReportTime: '18:00',
            discrepancyThreshold: 50.00
        };
        
        this.emailTemplates = {
            reconciliation: this.getReconciliationTemplate(),
            discrepancy: this.getDiscrepancyTemplate(),
            daily: this.getDailyReportTemplate()
        };
        
        this.initializeEmailService();
    }

    /**
     * Initialize email service
     */
    initializeEmailService() {
        // Check if we're running in a Google Apps Script environment
        this.isGoogleAppsScript = typeof GmailApp !== 'undefined';
        
        if (!this.isGoogleAppsScript) {
            console.log('Email service initialized in web mode - emails will be simulated');
        }
    }

    /**
     * Send reconciliation report email
     */
    async sendReconciliationReport(reportData) {
        try {
            const emailData = {
                to: this.emailSettings.managerEmail || 'manager@store.com',
                cc: this.emailSettings.adminEmail || 'admin@store.com',
                subject: `Daily Reconciliation Report - ${reportData.period?.from || new Date().toISOString().split('T')[0]}`,
                htmlBody: this.generateReconciliationEmailBody(reportData),
                attachments: []
            };

            // Add CSV attachment if available
            if (reportData.entries && reportData.entries.length > 0) {
                const csvContent = this.generateCSVAttachment(reportData.entries);
                emailData.attachments.push({
                    fileName: `reconciliation_${reportData.period?.from || 'today'}.csv`,
                    content: csvContent,
                    mimeType: 'text/csv'
                });
            }

            const result = await this.sendEmail(emailData);
            
            if (result.success) {
                this.showEmailModal('Reconciliation Report Sent', 
                    `Report has been sent to ${emailData.to}`, 'success');
            } else {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Failed to send reconciliation report:', error);
            this.showEmailModal('Email Failed', 
                `Failed to send report: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Send discrepancy alert email
     */
    async sendDiscrepancyAlert(discrepancies) {
        try {
            const totalDiscrepancy = discrepancies.reduce((sum, d) => 
                sum + Math.abs(d.cashDifference), 0);

            if (totalDiscrepancy < this.emailSettings.discrepancyThreshold) {
                console.log('Discrepancy below threshold, no email sent');
                return { success: true, skipped: true };
            }

            const emailData = {
                to: this.emailSettings.managerEmail || 'manager@store.com',
                cc: this.emailSettings.adminEmail || 'admin@store.com',
                subject: `🚨 Cash Discrepancy Alert - $${totalDiscrepancy.toFixed(2)}`,
                htmlBody: this.generateDiscrepancyEmailBody(discrepancies, totalDiscrepancy),
                priority: 'high'
            };

            const result = await this.sendEmail(emailData);
            
            if (result.success) {
                this.showEmailModal('Discrepancy Alert Sent', 
                    `Alert has been sent to management`, 'warning');
            } else {
                throw new Error(result.error);
            }

            return result;
        } catch (error) {
            console.error('Failed to send discrepancy alert:', error);
            this.showEmailModal('Email Failed', 
                `Failed to send alert: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Send daily summary email
     */
    async sendDailySummary(summaryData) {
        try {
            const emailData = {
                to: this.emailSettings.managerEmail || 'manager@store.com',
                subject: `Daily Sales Summary - ${summaryData.date}`,
                htmlBody: this.generateDailySummaryEmailBody(summaryData)
            };

            const result = await this.sendEmail(emailData);
            
            if (result.success) {
                this.showEmailModal('Daily Summary Sent', 
                    `Summary has been sent to management`, 'info');
            }

            return result;
        } catch (error) {
            console.error('Failed to send daily summary:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email (handles both Google Apps Script and web environments)
     */
    async sendEmail(emailData) {
        if (this.isGoogleAppsScript) {
            return this.sendEmailViaGmailAPI(emailData);
        } else {
            return this.simulateEmailSend(emailData);
        }
    }

    /**
     * Send email via Gmail API (Google Apps Script environment)
     */
    sendEmailViaGmailAPI(emailData) {
        try {
            // This will work in Google Apps Script environment
            if (typeof GmailApp !== 'undefined') {
                const options = {
                    htmlBody: emailData.htmlBody,
                    cc: emailData.cc || '',
                    attachments: emailData.attachments || []
                };

                GmailApp.sendEmail(emailData.to, emailData.subject, '', options);
                
                return { success: true, messageId: Date.now().toString() };
            } else {
                throw new Error('Gmail API not available');
            }
        } catch (error) {
            console.error('Gmail API send failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Simulate email send (web environment)
     */
    async simulateEmailSend(emailData) {
        // In a real implementation, this would call your backend email service
        console.log('Simulating email send:', emailData);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store sent email for demonstration
        const sentEmails = JSON.parse(localStorage.getItem('sentEmails')) || [];
        sentEmails.push({
            ...emailData,
            timestamp: new Date().toISOString(),
            messageId: Date.now().toString()
        });
        localStorage.setItem('sentEmails', JSON.stringify(sentEmails));
        
        return { 
            success: true, 
            messageId: Date.now().toString(),
            simulated: true 
        };
    }

    /**
     * Generate reconciliation email body
     */
    generateReconciliationEmailBody(reportData) {
        const template = this.emailTemplates.reconciliation;
        
        return template
            .replace('{{DATE}}', reportData.period?.from || new Date().toISOString().split('T')[0])
            .replace('{{TOTAL_SALES}}', '$' + (reportData.summary?.totalSales || 0).toFixed(2))
            .replace('{{TOTAL_ENTRIES}}', reportData.summary?.totalEntries || 0)
            .replace('{{DISCREPANCIES}}', reportData.summary?.totalDiscrepancies || 0)
            .replace('{{ACCURACY}}', (reportData.summary?.reconciliationAccuracy || 100).toFixed(1) + '%')
            .replace('{{CASH_VARIANCE}}', '$' + (reportData.summary?.avgDiscrepancy || 0).toFixed(2))
            .replace('{{ENTRIES_TABLE}}', this.generateEntriesTable(reportData.entries || []))
            .replace('{{TIMESTAMP}}', new Date().toLocaleString());
    }

    /**
     * Generate discrepancy email body
     */
    generateDiscrepancyEmailBody(discrepancies, totalAmount) {
        const template = this.emailTemplates.discrepancy;
        
        return template
            .replace('{{TOTAL_AMOUNT}}', '$' + totalAmount.toFixed(2))
            .replace('{{DISCREPANCY_COUNT}}', discrepancies.length)
            .replace('{{DISCREPANCIES_TABLE}}', this.generateDiscrepanciesTable(discrepancies))
            .replace('{{TIMESTAMP}}', new Date().toLocaleString());
    }

    /**
     * Generate daily summary email body
     */
    generateDailySummaryEmailBody(summaryData) {
        const template = this.emailTemplates.daily;
        
        return template
            .replace('{{DATE}}', summaryData.date)
            .replace('{{TOTAL_SALES}}', '$' + summaryData.totalSales.toFixed(2))
            .replace('{{CASH_SALES}}', '$' + summaryData.cashSales.toFixed(2))
            .replace('{{CARD_SALES}}', '$' + summaryData.cardSales.toFixed(2))
            .replace('{{TRANSACTIONS}}', summaryData.totalTransactions)
            .replace('{{ACCURACY}}', summaryData.reconciliationAccuracy.toFixed(1) + '%')
            .replace('{{DISCREPANCIES}}', summaryData.discrepanciesCount)
            .replace('{{TIMESTAMP}}', new Date().toLocaleString());
    }

    /**
     * Generate entries table for email
     */
    generateEntriesTable(entries) {
        if (entries.length === 0) {
            return '<tr><td colspan="6" style="text-align: center; color: #666;">No entries for this period</td></tr>';
        }

        return entries.map(entry => `
            <tr>
                <td>${entry.date}</td>
                <td>${entry.registerNumber}</td>
                <td>$${entry.cashSales.toFixed(2)}</td>
                <td>$${entry.cardSales.toFixed(2)}</td>
                <td>$${entry.totalSales.toFixed(2)}</td>
                <td style="color: ${entry.cashDifference === 0 ? '#28a745' : 
                    Math.abs(entry.cashDifference) <= 5 ? '#ffc107' : '#dc3545'};">
                    $${entry.cashDifference.toFixed(2)}
                </td>
            </tr>
        `).join('');
    }

    /**
     * Generate discrepancies table for email
     */
    generateDiscrepanciesTable(discrepancies) {
        return discrepancies.map(d => `
            <tr>
                <td>${d.date}</td>
                <td>${d.registerNumber}</td>
                <td style="color: #dc3545; font-weight: bold;">$${d.cashDifference.toFixed(2)}</td>
                <td>${d.issues?.map(issue => issue.description).join(', ') || 'Cash discrepancy'}</td>
            </tr>
        `).join('');
    }

    /**
     * Generate CSV attachment
     */
    generateCSVAttachment(entries) {
        const headers = ['Date', 'Register', 'Cash Sales', 'Card Sales', 'Total Sales', 'Cash Difference', 'Status'];
        const rows = entries.map(entry => [
            entry.date,
            entry.registerNumber,
            entry.cashSales.toFixed(2),
            entry.cardSales.toFixed(2),
            entry.totalSales.toFixed(2),
            entry.cashDifference.toFixed(2),
            entry.status
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * Show email modal
     */
    showEmailModal(title, message, type = 'info') {
        const modal = document.getElementById('emailModal');
        if (!modal) return;

        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('#email-modal-body');
        
        if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-envelope me-2"></i>${title}`;
        if (modalBody) {
            const iconClass = type === 'success' ? 'check-circle text-success' : 
                             type === 'error' ? 'exclamation-circle text-danger' :
                             type === 'warning' ? 'exclamation-triangle text-warning' :
                             'info-circle text-info';
            
            modalBody.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-${iconClass} fa-2x me-3"></i>
                    <div>
                        <p class="mb-0">${message}</p>
                        <small class="text-muted">Sent at ${new Date().toLocaleString()}</small>
                    </div>
                </div>
            `;
        }

        // Show modal using Bootstrap
        if (typeof bootstrap !== 'undefined') {
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
        }
    }

    /**
     * Schedule daily report
     */
    scheduleDailyReport() {
        if (!this.emailSettings.autoNotifications) return;

        const now = new Date();
        const scheduledTime = this.emailSettings.dailyReportTime.split(':');
        const scheduledDate = new Date();
        scheduledDate.setHours(parseInt(scheduledTime[0]), parseInt(scheduledTime[1]), 0, 0);

        // If scheduled time has passed today, schedule for tomorrow
        if (scheduledDate <= now) {
            scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        const timeUntilScheduled = scheduledDate.getTime() - now.getTime();

        setTimeout(() => {
            this.sendScheduledDailyReport();
            // Schedule next day
            this.scheduleDailyReport();
        }, timeUntilScheduled);

        console.log(`Daily report scheduled for ${scheduledDate.toLocaleString()}`);
    }

    /**
     * Send scheduled daily report
     */
    async sendScheduledDailyReport() {
        try {
            // Get today's data from the main app
            if (typeof window.app !== 'undefined') {
                const todayData = window.app.salesData.filter(
                    entry => entry.date === new Date().toISOString().split('T')[0]
                );

                const summaryData = {
                    date: new Date().toISOString().split('T')[0],
                    totalSales: todayData.reduce((sum, entry) => sum + entry.totalSales, 0),
                    cashSales: todayData.reduce((sum, entry) => sum + entry.cashSales, 0),
                    cardSales: todayData.reduce((sum, entry) => sum + entry.cardSales, 0),
                    totalTransactions: todayData.length,
                    discrepanciesCount: todayData.filter(entry => Math.abs(entry.cashDifference) > 5).length,
                    reconciliationAccuracy: todayData.length > 0 ? 
                        ((todayData.length - todayData.filter(entry => Math.abs(entry.cashDifference) > 5).length) / todayData.length) * 100 : 100
                };

                await this.sendDailySummary(summaryData);
            }
        } catch (error) {
            console.error('Failed to send scheduled daily report:', error);
        }
    }

    /**
     * Update email settings
     */
    updateEmailSettings(newSettings) {
        this.emailSettings = { ...this.emailSettings, ...newSettings };
        localStorage.setItem('emailSettings', JSON.stringify(this.emailSettings));
    }

    /**
     * Get email settings
     */
    getEmailSettings() {
        return { ...this.emailSettings };
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        const testEmailData = {
            to: this.emailSettings.managerEmail || 'test@example.com',
            subject: 'Test Email - Sales Reconciliation System',
            htmlBody: `
                <h3>Email Configuration Test</h3>
                <p>This is a test email to verify that the email service is working correctly.</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>System:</strong> Daily Sales & Cash Reconciliation</p>
            `
        };

        return await this.sendEmail(testEmailData);
    }

    // Email templates
    getReconciliationTemplate() {
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
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
                    th { background-color: #f8f9fa; font-weight: 600; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 Daily Reconciliation Report</h1>
                        <p>Sales & Cash Reconciliation Summary for {{DATE}}</p>
                    </div>
                    
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">{{TOTAL_SALES}}</div>
                            <div class="metric-label">Total Sales</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">{{TOTAL_ENTRIES}}</div>
                            <div class="metric-label">Transactions</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">{{DISCREPANCIES}}</div>
                            <div class="metric-label">Discrepancies</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">{{ACCURACY}}</div>
                            <div class="metric-label">Accuracy</div>
                        </div>
                    </div>
                    
                    <h3>Transaction Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Register</th>
                                <th>Cash Sales</th>
                                <th>Card Sales</th>
                                <th>Total Sales</th>
                                <th>Cash Difference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{ENTRIES_TABLE}}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Generated automatically by Sales Reconciliation System at {{TIMESTAMP}}</p>
                        <p>Please review any discrepancies and take appropriate action.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getDiscrepancyTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #fff3cd; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-left: 5px solid #dc3545; }
                    .header { color: #dc3545; margin-bottom: 20px; }
                    .alert { background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f5c6cb; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
                    th { background-color: #f8f9fa; font-weight: 600; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚨 Cash Discrepancy Alert</h1>
                        <h2>Total Discrepancy: {{TOTAL_AMOUNT}}</h2>
                    </div>
                    
                    <div class="alert">
                        <strong>Immediate Attention Required:</strong> {{DISCREPANCY_COUNT}} discrepancies detected that exceed the threshold.
                    </div>
                    
                    <h3>Discrepancy Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Register</th>
                                <th>Cash Difference</th>
                                <th>Issue Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{DISCREPANCIES_TABLE}}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        <p>Alert generated at {{TIMESTAMP}}</p>
                        <p><strong>Action Required:</strong> Please investigate these discrepancies immediately and take corrective action.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getDailyReportTemplate() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { background-color: #198754; color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 8px 8px 0 0; }
                    .metric-row { display: flex; justify-content: space-between; margin: 15px 0; }
                    .metric { text-align: center; flex: 1; padding: 15px; background-color: #f8f9fa; border-radius: 6px; margin: 0 5px; }
                    .metric-value { font-size: 20px; font-weight: bold; color: #198754; }
                    .metric-label { font-size: 12px; color: #6c757d; }
                    .summary { background-color: #d1ecf1; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0dcaf0; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📈 Daily Sales Summary</h1>
                        <p>Sales performance report for {{DATE}}</p>
                    </div>
                    
                    <div class="metric-row">
                        <div class="metric">
                            <div class="metric-value">{{TOTAL_SALES}}</div>
                            <div class="metric-label">Total Sales</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">{{TRANSACTIONS}}</div>
                            <div class="metric-label">Transactions</div>
                        </div>
                    </div>
                    
                    <div class="metric-row">
                        <div class="metric">
                            <div class="metric-value">{{CASH_SALES}}</div>
                            <div class="metric-label">Cash Sales</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">{{CARD_SALES}}</div>
                            <div class="metric-label">Card Sales</div>
                        </div>
                    </div>
                    
                    <div class="summary">
                        <h4>Reconciliation Summary</h4>
                        <p><strong>Accuracy:</strong> {{ACCURACY}}</p>
                        <p><strong>Discrepancies:</strong> {{DISCREPANCIES}}</p>
                    </div>
                    
                    <div class="footer">
                        <p>Report generated at {{TIMESTAMP}}</p>
                        <p>Automated daily summary from Sales Reconciliation System</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
}
