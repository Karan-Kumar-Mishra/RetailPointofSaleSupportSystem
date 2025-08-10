/**
 * Daily Sales & Cash Reconciliation System
 * Main Application JavaScript
 */

class SalesReconciliationApp {
    constructor() {
        this.salesData = JSON.parse(localStorage.getItem('salesData')) || [];
        this.reconciliationData = JSON.parse(localStorage.getItem('reconciliationData')) || [];
        this.appSettings = JSON.parse(localStorage.getItem('appSettings')) || {
            storeName: 'Main Store',
            currency: 'USD',
            autoSave: true,
            emailNotifications: true
        };
        
        this.initializeApp();
        this.bindEvents();
        this.loadRecentEntries();
        this.updateCurrentDate();
        
        // Auto-save interval (every 30 seconds)
        if (this.appSettings.autoSave) {
            setInterval(() => this.autoSave(), 30000);
        }
    }

    initializeApp() {
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        document.getElementById('report-date-from').value = today;
        document.getElementById('report-date-to').value = today;
        
        // Set store name
        document.getElementById('store-name').textContent = this.appSettings.storeName;
        
        // Initialize dashboard
        if (typeof DashboardManager !== 'undefined') {
            this.dashboard = new DashboardManager(this.salesData);
        }
        
        // Initialize reconciliation
        if (typeof ReconciliationEngine !== 'undefined') {
            this.reconciliation = new ReconciliationEngine();
        }
        
        // Initialize email service
        if (typeof EmailService !== 'undefined') {
            this.emailService = new EmailService();
        }
    }

    bindEvents() {
        // Sales form submission
        document.getElementById('sales-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSalesFormSubmission();
        });

        // Reconciliation actions
        document.getElementById('run-reconciliation')?.addEventListener('click', () => {
            this.runReconciliation();
        });

        document.getElementById('flag-discrepancies')?.addEventListener('click', () => {
            this.flagDiscrepancies();
        });

        document.getElementById('send-report')?.addEventListener('click', () => {
            this.sendEmailReport();
        });

        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportData();
        });

        // Report generation
        document.getElementById('generate-report')?.addEventListener('click', () => {
            this.generateReport();
        });

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.handleTabSwitch(e.target.getAttribute('data-bs-target'));
            });
        });

        // Form validation on input
        this.bindFormValidation();
    }

    bindFormValidation() {
        const form = document.getElementById('sales-form');
        const inputs = form.querySelectorAll('input[type="number"]');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateSalesData();
            });
        });
    }

    handleSalesFormSubmission() {
        const formData = this.collectSalesFormData();
        
        if (this.validateSalesFormData(formData)) {
            this.saveSalesEntry(formData);
            this.displaySuccessMessage('Sales data saved successfully!');
            this.clearSalesForm();
            this.loadRecentEntries();
            this.updateDashboard();
        }
    }

    collectSalesFormData() {
        return {
            id: Date.now().toString(),
            date: document.getElementById('transaction-date').value,
            registerNumber: document.getElementById('register-number').value,
            openingCash: parseFloat(document.getElementById('opening-cash').value) || 0,
            cashSales: parseFloat(document.getElementById('cash-sales').value) || 0,
            cardSales: parseFloat(document.getElementById('card-sales').value) || 0,
            returnsRefunds: parseFloat(document.getElementById('returns-refunds').value) || 0,
            cashDrops: parseFloat(document.getElementById('cash-drops').value) || 0,
            closingCash: parseFloat(document.getElementById('closing-cash').value) || 0,
            timestamp: new Date().toISOString()
        };
    }

    validateSalesFormData(data) {
        const errors = [];
        
        // Required field validation
        if (!data.date) errors.push('Transaction date is required');
        if (!data.registerNumber) errors.push('Register number is required');
        if (data.openingCash < 0) errors.push('Opening cash cannot be negative');
        if (data.cashSales < 0) errors.push('Cash sales cannot be negative');
        if (data.cardSales < 0) errors.push('Card sales cannot be negative');
        if (data.closingCash < 0) errors.push('Closing cash cannot be negative');
        
        // Business logic validation
        const expectedCash = data.openingCash + data.cashSales - data.returnsRefunds - data.cashDrops;
        const cashDifference = Math.abs(data.closingCash - expectedCash);
        
        if (cashDifference > 10) {
            errors.push(`Large cash discrepancy detected: $${cashDifference.toFixed(2)}`);
        }
        
        // Display validation results
        this.displayValidationResults(errors);
        
        return errors.length === 0;
    }

    displayValidationResults(errors) {
        const container = document.getElementById('validation-messages');
        container.innerHTML = '';
        
        if (errors.length === 0) {
            container.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-1"></i>
                    All validation checks passed. Data is ready to save.
                </div>
            `;
        } else {
            const errorHtml = errors.map(error => `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    ${error}
                </div>
            `).join('');
            container.innerHTML = errorHtml;
        }
    }

    validateSalesData() {
        const formData = this.collectSalesFormData();
        
        // Real-time validation feedback
        const openingCash = formData.openingCash;
        const cashSales = formData.cashSales;
        const returnsRefunds = formData.returnsRefunds;
        const cashDrops = formData.cashDrops;
        const closingCash = formData.closingCash;
        
        const expectedCash = openingCash + cashSales - returnsRefunds - cashDrops;
        const difference = closingCash - expectedCash;
        
        // Update expected cash display
        this.updateExpectedCashDisplay(expectedCash, difference);
    }

    updateExpectedCashDisplay(expectedCash, difference) {
        // Create or update expected cash indicator
        let indicator = document.getElementById('expected-cash-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'expected-cash-indicator';
            indicator.className = 'mt-2 p-2 rounded';
            document.getElementById('closing-cash').parentNode.appendChild(indicator);
        }
        
        const absOfDifference = Math.abs(difference);
        let statusClass = 'bg-light';
        let statusText = 'Enter closing cash to see comparison';
        
        if (expectedCash > 0) {
            if (absOfDifference === 0) {
                statusClass = 'bg-success text-white';
                statusText = `Perfect match! Expected: $${expectedCash.toFixed(2)}`;
            } else if (absOfDifference <= 5) {
                statusClass = 'bg-warning text-dark';
                statusText = `Small difference: $${difference.toFixed(2)} (Expected: $${expectedCash.toFixed(2)})`;
            } else {
                statusClass = 'bg-danger text-white';
                statusText = `Large discrepancy: $${difference.toFixed(2)} (Expected: $${expectedCash.toFixed(2)})`;
            }
        }
        
        indicator.className = `mt-2 p-2 rounded ${statusClass}`;
        indicator.innerHTML = `
            <small>
                <i class="fas fa-calculator me-1"></i>
                ${statusText}
            </small>
        `;
    }

    saveSalesEntry(data) {
        // Add calculated fields
        data.totalSales = data.cashSales + data.cardSales;
        data.expectedCash = data.openingCash + data.cashSales - data.returnsRefunds - data.cashDrops;
        data.cashDifference = data.closingCash - data.expectedCash;
        data.status = Math.abs(data.cashDifference) <= 5 ? 'balanced' : 'discrepancy';
        
        this.salesData.push(data);
        this.saveToLocalStorage();
        
        // Trigger reconciliation update
        if (this.reconciliation) {
            this.reconciliation.addSalesData(data);
        }
    }

    loadRecentEntries() {
        const tbody = document.getElementById('recent-entries-body');
        const recentEntries = this.salesData.slice(-5).reverse();
        
        if (recentEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-inbox me-1"></i>
                        No entries yet. Add your first sales record above.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = recentEntries.map(entry => `
            <tr>
                <td>${this.formatDate(entry.date)}</td>
                <td>${entry.registerNumber}</td>
                <td>$${entry.totalSales.toFixed(2)}</td>
                <td>
                    <span class="status-indicator ${entry.status}">
                        <i class="fas fa-${entry.status === 'balanced' ? 'check' : 'exclamation-triangle'} me-1"></i>
                        ${entry.status === 'balanced' ? 'Balanced' : 'Discrepancy'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.editEntry('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    editEntry(entryId) {
        const entry = this.salesData.find(e => e.id === entryId);
        if (entry) {
            // Populate form with entry data
            document.getElementById('transaction-date').value = entry.date;
            document.getElementById('register-number').value = entry.registerNumber;
            document.getElementById('opening-cash').value = entry.openingCash;
            document.getElementById('cash-sales').value = entry.cashSales;
            document.getElementById('card-sales').value = entry.cardSales;
            document.getElementById('returns-refunds').value = entry.returnsRefunds;
            document.getElementById('cash-drops').value = entry.cashDrops;
            document.getElementById('closing-cash').value = entry.closingCash;
            
            // Remove the original entry
            this.deleteEntry(entryId, false);
            
            this.displayInfoMessage('Entry loaded for editing. Make changes and save.');
        }
    }

    deleteEntry(entryId, confirm = true) {
        if (confirm && !window.confirm('Are you sure you want to delete this entry?')) {
            return;
        }
        
        this.salesData = this.salesData.filter(e => e.id !== entryId);
        this.saveToLocalStorage();
        this.loadRecentEntries();
        this.updateDashboard();
        
        if (confirm) {
            this.displaySuccessMessage('Entry deleted successfully.');
        }
    }

    runReconciliation() {
        if (!this.reconciliation) {
            this.displayErrorMessage('Reconciliation engine not available.');
            return;
        }
        
        const results = this.reconciliation.runFullReconciliation(this.salesData);
        this.displayReconciliationResults(results);
        this.updateReconciliationStatus(results);
    }

    displayReconciliationResults(results) {
        const container = document.getElementById('reconciliation-results');
        
        container.innerHTML = `
            <div class="reconciliation-item ${results.overall.status}">
                <h6>Overall Status</h6>
                <div class="value">${results.overall.status.toUpperCase()}</div>
                <div class="difference">Total Difference: $${results.overall.totalDifference.toFixed(2)}</div>
            </div>
            
            <div class="reconciliation-item">
                <h6>Total Sales</h6>
                <div class="value">$${results.totals.totalSales.toFixed(2)}</div>
                <div class="difference">Cash: $${results.totals.cashSales.toFixed(2)} | Card: $${results.totals.cardSales.toFixed(2)}</div>
            </div>
            
            <div class="reconciliation-item">
                <h6>Cash Position</h6>
                <div class="value">$${results.totals.totalCashPosition.toFixed(2)}</div>
                <div class="difference">Expected: $${results.totals.expectedCash.toFixed(2)}</div>
            </div>
            
            <div class="reconciliation-item">
                <h6>Discrepancies</h6>
                <div class="value">${results.discrepancies.length}</div>
                <div class="difference">Flagged entries requiring attention</div>
            </div>
        `;
        
        if (results.discrepancies.length > 0) {
            container.innerHTML += `
                <div class="reconciliation-item discrepancy">
                    <h6>Flagged Entries</h6>
                    <div class="discrepancy-list">
                        ${results.discrepancies.map(d => `
                            <div class="mb-2">
                                <strong>${d.registerNumber}</strong> (${this.formatDate(d.date)})
                                <br>
                                <small>Difference: $${d.cashDifference.toFixed(2)}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    updateReconciliationStatus(results) {
        const statusContainer = document.getElementById('reconciliation-status');
        const status = results.overall.status;
        let statusBadge, statusText;
        
        switch (status) {
            case 'balanced':
                statusBadge = 'bg-success';
                statusText = 'All reconciliation checks passed';
                break;
            case 'warning':
                statusBadge = 'bg-warning';
                statusText = 'Minor discrepancies detected';
                break;
            case 'discrepancy':
                statusBadge = 'bg-danger';
                statusText = 'Significant discrepancies require attention';
                break;
            default:
                statusBadge = 'bg-secondary';
                statusText = 'Ready to reconcile';
        }
        
        statusContainer.innerHTML = `
            <div class="status-item">
                <span class="badge ${statusBadge}">${status.toUpperCase()}</span>
                <span class="ms-2">${statusText}</span>
            </div>
            <div class="mt-2 text-muted">
                <small>Last reconciliation: ${new Date().toLocaleString()}</small>
            </div>
        `;
    }

    flagDiscrepancies() {
        const discrepancies = this.salesData.filter(entry => 
            Math.abs(entry.cashDifference) > 5
        );
        
        if (discrepancies.length === 0) {
            this.displaySuccessMessage('No significant discrepancies found.');
            return;
        }
        
        const flaggedHtml = discrepancies.map(entry => `
            <div class="alert alert-warning">
                <strong>${entry.registerNumber}</strong> - ${this.formatDate(entry.date)}
                <br>
                Cash difference: $${entry.cashDifference.toFixed(2)}
                <br>
                <small>Expected: $${entry.expectedCash.toFixed(2)}, Actual: $${entry.closingCash.toFixed(2)}</small>
            </div>
        `).join('');
        
        document.getElementById('reconciliation-results').innerHTML = `
            <div class="card">
                <div class="card-header bg-warning text-dark">
                    <h6><i class="fas fa-flag me-2"></i>Flagged Discrepancies (${discrepancies.length})</h6>
                </div>
                <div class="card-body">
                    ${flaggedHtml}
                </div>
            </div>
        `;
    }

    sendEmailReport() {
        if (!this.emailService) {
            this.displayErrorMessage('Email service not available.');
            return;
        }
        
        const reportData = this.generateReportData('daily');
        this.emailService.sendReconciliationReport(reportData);
    }

    exportData() {
        const exportData = {
            salesData: this.salesData,
            reconciliationData: this.reconciliationData,
            exportDate: new Date().toISOString(),
            storeName: this.appSettings.storeName
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_reconciliation_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.displaySuccessMessage('Data exported successfully.');
    }

    generateReport() {
        const reportType = document.getElementById('report-type').value;
        const dateFrom = document.getElementById('report-date-from').value;
        const dateTo = document.getElementById('report-date-to').value;
        
        const reportData = this.generateReportData(reportType, dateFrom, dateTo);
        this.displayGeneratedReport(reportData);
    }

    generateReportData(type, dateFrom = null, dateTo = null) {
        const today = new Date().toISOString().split('T')[0];
        const fromDate = dateFrom || today;
        const toDate = dateTo || today;
        
        const filteredData = this.salesData.filter(entry => 
            entry.date >= fromDate && entry.date <= toDate
        );
        
        const summary = {
            totalEntries: filteredData.length,
            totalSales: filteredData.reduce((sum, entry) => sum + entry.totalSales, 0),
            totalCashSales: filteredData.reduce((sum, entry) => sum + entry.cashSales, 0),
            totalCardSales: filteredData.reduce((sum, entry) => sum + entry.cardSales, 0),
            totalDiscrepancies: filteredData.filter(entry => Math.abs(entry.cashDifference) > 5).length,
            avgDiscrepancy: filteredData.length > 0 ? 
                filteredData.reduce((sum, entry) => sum + Math.abs(entry.cashDifference), 0) / filteredData.length : 0
        };
        
        return {
            type,
            period: { from: fromDate, to: toDate },
            summary,
            entries: filteredData,
            generatedAt: new Date().toISOString()
        };
    }

    displayGeneratedReport(reportData) {
        const container = document.getElementById('report-output');
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h6>
                        ${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report
                        (${this.formatDate(reportData.period.from)} - ${this.formatDate(reportData.period.to)})
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="text-center">
                                <h4 class="text-primary">$${reportData.summary.totalSales.toFixed(2)}</h4>
                                <small class="text-muted">Total Sales</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h4 class="text-success">${reportData.summary.totalEntries}</h4>
                                <small class="text-muted">Transactions</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h4 class="text-warning">${reportData.summary.totalDiscrepancies}</h4>
                                <small class="text-muted">Discrepancies</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <h4 class="text-info">$${reportData.summary.avgDiscrepancy.toFixed(2)}</h4>
                                <small class="text-muted">Avg Discrepancy</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Register</th>
                                    <th>Cash Sales</th>
                                    <th>Card Sales</th>
                                    <th>Total Sales</th>
                                    <th>Cash Difference</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reportData.entries.map(entry => `
                                    <tr>
                                        <td>${this.formatDate(entry.date)}</td>
                                        <td>${entry.registerNumber}</td>
                                        <td>$${entry.cashSales.toFixed(2)}</td>
                                        <td>$${entry.cardSales.toFixed(2)}</td>
                                        <td>$${entry.totalSales.toFixed(2)}</td>
                                        <td class="${entry.cashDifference === 0 ? 'text-success' : 
                                                     Math.abs(entry.cashDifference) <= 5 ? 'text-warning' : 'text-danger'}">
                                            $${entry.cashDifference.toFixed(2)}
                                        </td>
                                        <td>
                                            <span class="status-indicator ${entry.status}">
                                                ${entry.status === 'balanced' ? 'Balanced' : 'Discrepancy'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="mt-3 text-end">
                        <button class="btn btn-outline-primary me-2" onclick="window.print()">
                            <i class="fas fa-print me-1"></i>Print Report
                        </button>
                        <button class="btn btn-primary" onclick="app.exportReport('${reportData.type}')">
                            <i class="fas fa-download me-1"></i>Export CSV
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    exportReport(reportType) {
        const reportData = this.generateReportData(reportType);
        const csv = this.convertToCSV(reportData.entries);
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    convertToCSV(data) {
        const headers = ['Date', 'Register', 'Opening Cash', 'Cash Sales', 'Card Sales', 'Returns', 'Cash Drops', 'Closing Cash', 'Difference', 'Status'];
        const rows = data.map(entry => [
            entry.date,
            entry.registerNumber,
            entry.openingCash,
            entry.cashSales,
            entry.cardSales,
            entry.returnsRefunds,
            entry.cashDrops,
            entry.closingCash,
            entry.cashDifference,
            entry.status
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    handleTabSwitch(targetTab) {
        switch (targetTab) {
            case '#dashboard':
                this.updateDashboard();
                break;
            case '#reconciliation':
                this.loadReconciliationData();
                break;
            case '#reports':
                this.loadReportsData();
                break;
        }
    }

    updateDashboard() {
        if (this.dashboard) {
            this.dashboard.updateMetrics(this.salesData);
            this.dashboard.updateCharts(this.salesData);
        }
    }

    loadReconciliationData() {
        // Update reconciliation tab with latest data
        if (this.reconciliation) {
            const results = this.reconciliation.getLatestResults();
            if (results) {
                this.displayReconciliationResults(results);
            }
        }
    }

    loadReportsData() {
        // Initialize reports tab
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('report-date-from').value = today;
        document.getElementById('report-date-to').value = today;
    }

    clearSalesForm() {
        document.getElementById('sales-form').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transaction-date').value = today;
        
        // Clear expected cash indicator
        const indicator = document.getElementById('expected-cash-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    updateCurrentDate() {
        const now = new Date();
        document.getElementById('current-date').textContent = now.toLocaleDateString();
        
        // Update last updated time
        setInterval(() => {
            document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
        }, 60000);
    }

    autoSave() {
        this.saveToLocalStorage();
        // Show brief auto-save indicator
        const indicator = document.createElement('div');
        indicator.className = 'position-fixed top-0 end-0 m-3 alert alert-success';
        indicator.style.zIndex = '9999';
        indicator.innerHTML = '<i class="fas fa-check me-1"></i>Auto-saved';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            document.body.removeChild(indicator);
        }, 2000);
    }

    saveToLocalStorage() {
        localStorage.setItem('salesData', JSON.stringify(this.salesData));
        localStorage.setItem('reconciliationData', JSON.stringify(this.reconciliationData));
        localStorage.setItem('appSettings', JSON.stringify(this.appSettings));
    }

    // Utility methods
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.appSettings.currency
        }).format(amount);
    }

    displaySuccessMessage(message) {
        this.showToast(message, 'success');
    }

    displayErrorMessage(message) {
        this.showToast(message, 'error');
    }

    displayInfoMessage(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `position-fixed top-0 end-0 m-3 alert alert-${type === 'error' ? 'danger' : type}`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-1"></i>
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SalesReconciliationApp();
});
