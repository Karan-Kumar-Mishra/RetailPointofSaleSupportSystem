/**
 * Dashboard Manager for Sales & Cash Reconciliation System
 * Handles metrics display and chart generation
 */

class DashboardManager {
    constructor(initialData = []) {
        this.salesData = initialData;
        this.charts = {};
        this.updateIntervals = {};
        
        this.initializeCharts();
        this.startRealTimeUpdates();
    }

    /**
     * Initialize chart instances
     */
    initializeCharts() {
        // Initialize sales trend chart
        this.initializeSalesChart();
        
        // Initialize payment methods chart
        this.initializePaymentChart();
    }

    /**
     * Initialize sales trend line chart
     */
    initializeSalesChart() {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;

        this.charts.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Sales',
                    data: [],
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Cash Sales',
                    data: [],
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Card Sales',
                    data: [],
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sales Trend (Last 7 Days)'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 7
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Initialize payment methods pie chart
     */
    initializePaymentChart() {
        const ctx = document.getElementById('payment-chart');
        if (!ctx) return;

        this.charts.paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cash', 'Card'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        '#198754',
                        '#0d6efd'
                    ],
                    borderColor: [
                        '#ffffff',
                        '#ffffff'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Payment Methods (Today)'
                    },
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Update all dashboard metrics
     */
    updateMetrics(salesData) {
        this.salesData = salesData;
        
        const todayData = this.getTodayData();
        const metrics = this.calculateMetrics(todayData);
        
        this.updateMetricCards(metrics);
        this.updateCharts(salesData);
    }

    /**
     * Get today's sales data
     */
    getTodayData() {
        const today = new Date().toISOString().split('T')[0];
        return this.salesData.filter(entry => entry.date === today);
    }

    /**
     * Calculate key metrics
     */
    calculateMetrics(todayData) {
        const metrics = {
            totalSalesToday: 0,
            cashReconciled: 0,
            discrepanciesCount: 0,
            registersActive: new Set(),
            averageTransaction: 0,
            cashRecoveryNeeded: 0,
            reconciliationAccuracy: 100
        };

        if (todayData.length === 0) {
            return metrics;
        }

        // Calculate totals
        todayData.forEach(entry => {
            metrics.totalSalesToday += entry.totalSales || (entry.cashSales + entry.cardSales);
            metrics.registersActive.add(entry.registerNumber);
            
            // Check if reconciled (difference within threshold)
            const cashDiff = Math.abs(entry.cashDifference || 0);
            if (cashDiff <= 5) {
                metrics.cashReconciled += entry.closingCash || 0;
            } else {
                metrics.discrepanciesCount++;
                if (entry.cashDifference < 0) {
                    metrics.cashRecoveryNeeded += Math.abs(entry.cashDifference);
                }
            }
        });

        // Calculate derived metrics
        metrics.registersActive = metrics.registersActive.size;
        metrics.averageTransaction = todayData.length > 0 ? metrics.totalSalesToday / todayData.length : 0;
        metrics.reconciliationAccuracy = todayData.length > 0 ? 
            ((todayData.length - metrics.discrepanciesCount) / todayData.length) * 100 : 100;

        return metrics;
    }

    /**
     * Update metric cards with new values
     */
    updateMetricCards(metrics) {
        // Total Sales Today
        this.updateMetricCard('total-sales-today', metrics.totalSalesToday, 'currency');
        
        // Cash Reconciled
        this.updateMetricCard('cash-reconciled', metrics.cashReconciled, 'currency');
        
        // Discrepancies Count
        this.updateMetricCard('discrepancies-count', metrics.discrepanciesCount, 'number');
        
        // Registers Active
        this.updateMetricCard('registers-active', metrics.registersActive, 'number');
    }

    /**
     * Update a single metric card
     */
    updateMetricCard(elementId, value, format) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let formattedValue;
        switch (format) {
            case 'currency':
                formattedValue = '$' + value.toFixed(2);
                break;
            case 'percentage':
                formattedValue = value.toFixed(1) + '%';
                break;
            case 'number':
                formattedValue = value.toString();
                break;
            default:
                formattedValue = value.toString();
        }

        // Animate the value change
        this.animateValueChange(element, formattedValue);
    }

    /**
     * Animate value changes in metric cards
     */
    animateValueChange(element, newValue) {
        const currentValue = element.textContent;
        
        if (currentValue !== newValue) {
            element.style.transition = 'all 0.3s ease';
            element.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
            }, 150);
        }
    }

    /**
     * Update charts with new data
     */
    updateCharts(salesData) {
        this.updateSalesChart(salesData);
        this.updatePaymentChart(salesData);
    }

    /**
     * Update sales trend chart
     */
    updateSalesChart(salesData) {
        if (!this.charts.salesChart) return;

        const last7Days = this.getLast7DaysData(salesData);
        const chartData = this.prepareSalesChartData(last7Days);

        this.charts.salesChart.data.labels = chartData.labels;
        this.charts.salesChart.data.datasets[0].data = chartData.totalSales;
        this.charts.salesChart.data.datasets[1].data = chartData.cashSales;
        this.charts.salesChart.data.datasets[2].data = chartData.cardSales;
        
        this.charts.salesChart.update('active');
    }

    /**
     * Get last 7 days of sales data
     */
    getLast7DaysData(salesData) {
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            const dayData = salesData.filter(entry => entry.date === dateString);
            last7Days.push({
                date: dateString,
                data: dayData
            });
        }
        
        return last7Days;
    }

    /**
     * Prepare data for sales chart
     */
    prepareSalesChartData(last7Days) {
        const chartData = {
            labels: [],
            totalSales: [],
            cashSales: [],
            cardSales: []
        };

        last7Days.forEach(day => {
            // Format date for display
            const date = new Date(day.date);
            const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            chartData.labels.push(label);

            // Calculate daily totals
            const dailyTotals = day.data.reduce((totals, entry) => {
                totals.total += entry.totalSales || (entry.cashSales + entry.cardSales);
                totals.cash += entry.cashSales || 0;
                totals.card += entry.cardSales || 0;
                return totals;
            }, { total: 0, cash: 0, card: 0 });

            chartData.totalSales.push(dailyTotals.total);
            chartData.cashSales.push(dailyTotals.cash);
            chartData.cardSales.push(dailyTotals.card);
        });

        return chartData;
    }

    /**
     * Update payment methods chart
     */
    updatePaymentChart(salesData) {
        if (!this.charts.paymentChart) return;

        const todayData = this.getTodayData();
        const paymentTotals = this.calculatePaymentTotals(todayData);

        this.charts.paymentChart.data.datasets[0].data = [
            paymentTotals.cash,
            paymentTotals.card
        ];
        
        this.charts.paymentChart.update('active');
    }

    /**
     * Calculate payment method totals
     */
    calculatePaymentTotals(todayData) {
        return todayData.reduce((totals, entry) => {
            totals.cash += entry.cashSales || 0;
            totals.card += entry.cardSales || 0;
            return totals;
        }, { cash: 0, card: 0 });
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        // Update metrics every 30 seconds
        this.updateIntervals.metrics = setInterval(() => {
            if (this.salesData.length > 0) {
                this.updateMetrics(this.salesData);
            }
        }, 30000);

        // Update time-based elements every minute
        this.updateIntervals.time = setInterval(() => {
            this.updateTimeElements();
        }, 60000);
    }

    /**
     * Update time-based elements
     */
    updateTimeElements() {
        const now = new Date();
        
        // Update current time display
        const timeElements = document.querySelectorAll('.current-time');
        timeElements.forEach(element => {
            element.textContent = now.toLocaleTimeString();
        });

        // Update last updated timestamp
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = now.toLocaleTimeString();
        }
    }

    /**
     * Generate dashboard summary report
     */
    generateDashboardReport() {
        const todayData = this.getTodayData();
        const metrics = this.calculateMetrics(todayData);
        const last7DaysData = this.getLast7DaysData(this.salesData);

        const report = {
            summary: {
                date: new Date().toISOString().split('T')[0],
                totalSalesToday: metrics.totalSalesToday,
                reconciliationAccuracy: metrics.reconciliationAccuracy,
                discrepanciesCount: metrics.discrepanciesCount,
                registersActive: metrics.registersActive
            },
            trends: {
                weeklyTrend: this.calculateWeeklyTrend(last7DaysData),
                averageDailySales: this.calculateAverageDailySales(last7DaysData),
                paymentMethodDistribution: this.calculatePaymentDistribution(todayData)
            },
            alerts: this.generateDashboardAlerts(metrics, todayData)
        };

        return report;
    }

    /**
     * Calculate weekly sales trend
     */
    calculateWeeklyTrend(last7DaysData) {
        const dailySales = last7DaysData.map(day => {
            return day.data.reduce((total, entry) => {
                return total + (entry.totalSales || (entry.cashSales + entry.cardSales));
            }, 0);
        });

        if (dailySales.length < 2) return 0;

        const firstHalf = dailySales.slice(0, Math.floor(dailySales.length / 2));
        const secondHalf = dailySales.slice(Math.floor(dailySales.length / 2));

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    }

    /**
     * Calculate average daily sales
     */
    calculateAverageDailySales(last7DaysData) {
        const totalSales = last7DaysData.reduce((total, day) => {
            return total + day.data.reduce((dayTotal, entry) => {
                return dayTotal + (entry.totalSales || (entry.cashSales + entry.cardSales));
            }, 0);
        }, 0);

        return last7DaysData.length > 0 ? totalSales / last7DaysData.length : 0;
    }

    /**
     * Calculate payment method distribution
     */
    calculatePaymentDistribution(todayData) {
        const totals = this.calculatePaymentTotals(todayData);
        const totalSales = totals.cash + totals.card;

        if (totalSales === 0) {
            return { cash: 0, card: 0 };
        }

        return {
            cash: (totals.cash / totalSales) * 100,
            card: (totals.card / totalSales) * 100
        };
    }

    /**
     * Generate dashboard alerts
     */
    generateDashboardAlerts(metrics, todayData) {
        const alerts = [];

        // High discrepancy alert
        if (metrics.discrepanciesCount > 2) {
            alerts.push({
                type: 'warning',
                message: `${metrics.discrepanciesCount} discrepancies detected today`,
                action: 'Review reconciliation tab for details'
            });
        }

        // Low reconciliation accuracy alert
        if (metrics.reconciliationAccuracy < 90) {
            alerts.push({
                type: 'error',
                message: `Low reconciliation accuracy: ${metrics.reconciliationAccuracy.toFixed(1)}%`,
                action: 'Check data entry procedures'
            });
        }

        // Cash recovery needed alert
        if (metrics.cashRecoveryNeeded > 50) {
            alerts.push({
                type: 'critical',
                message: `Cash recovery needed: $${metrics.cashRecoveryNeeded.toFixed(2)}`,
                action: 'Investigate cash shortfalls immediately'
            });
        }

        // No sales alert
        if (todayData.length === 0) {
            alerts.push({
                type: 'info',
                message: 'No sales data entered for today',
                action: 'Begin entering daily sales data'
            });
        }

        return alerts;
    }

    /**
     * Refresh dashboard data
     */
    refreshDashboard(salesData) {
        this.salesData = salesData;
        this.updateMetrics(salesData);
        
        // Show refresh indicator
        this.showRefreshIndicator();
    }

    /**
     * Show refresh indicator
     */
    showRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'position-fixed top-0 end-0 m-3 alert alert-info';
        indicator.style.zIndex = '9999';
        indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin me-1"></i>Dashboard refreshed';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentElement) {
                indicator.parentElement.removeChild(indicator);
            }
        }, 2000);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        Object.values(this.updateIntervals).forEach(interval => {
            clearInterval(interval);
        });
        this.updateIntervals = {};
    }

    /**
     * Destroy dashboard instance
     */
    destroy() {
        this.stopRealTimeUpdates();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
}
