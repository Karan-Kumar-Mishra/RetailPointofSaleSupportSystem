/**
 * Reconciliation Engine for Sales & Cash Management
 * Handles all reconciliation calculations and validation
 */

class ReconciliationEngine {
    constructor() {
        this.reconciliationRules = {
            cashDiscrepancyThreshold: 5.00,
            largeDiscrepancyThreshold: 50.00,
            maxReturnsPercentage: 10.0,
            minOpeningCash: 100.00
        };
        
        this.lastResults = null;
        this.reconciliationHistory = JSON.parse(localStorage.getItem('reconciliationHistory')) || [];
    }

    /**
     * Run full reconciliation on sales data
     */
    runFullReconciliation(salesData) {
        const results = {
            timestamp: new Date().toISOString(),
            totals: this.calculateTotals(salesData),
            discrepancies: this.findDiscrepancies(salesData),
            validationErrors: this.validateBusinessRules(salesData),
            summary: {},
            overall: {}
        };

        // Calculate summary metrics
        results.summary = this.calculateSummaryMetrics(results);
        
        // Determine overall status
        results.overall = this.determineOverallStatus(results);
        
        // Store results
        this.lastResults = results;
        this.saveReconciliationHistory(results);
        
        return results;
    }

    /**
     * Calculate total values from sales data
     */
    calculateTotals(salesData) {
        const totals = {
            totalEntries: salesData.length,
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            totalReturns: 0,
            totalCashDrops: 0,
            openingCash: 0,
            closingCash: 0,
            expectedCash: 0,
            actualCashPosition: 0,
            totalCashDifference: 0
        };

        salesData.forEach(entry => {
            totals.totalSales += entry.totalSales || (entry.cashSales + entry.cardSales);
            totals.cashSales += entry.cashSales || 0;
            totals.cardSales += entry.cardSales || 0;
            totals.totalReturns += entry.returnsRefunds || 0;
            totals.totalCashDrops += entry.cashDrops || 0;
            totals.openingCash += entry.openingCash || 0;
            totals.closingCash += entry.closingCash || 0;
            totals.totalCashDifference += entry.cashDifference || 0;
        });

        // Calculate expected cash position
        totals.expectedCash = totals.openingCash + totals.cashSales - totals.totalReturns - totals.totalCashDrops;
        totals.actualCashPosition = totals.closingCash;
        totals.overallCashDifference = totals.actualCashPosition - totals.expectedCash;

        return totals;
    }

    /**
     * Find discrepancies in sales data
     */
    findDiscrepancies(salesData) {
        const discrepancies = [];

        salesData.forEach(entry => {
            const issues = [];
            
            // Cash discrepancy check
            const cashDiff = Math.abs(entry.cashDifference || 0);
            if (cashDiff > this.reconciliationRules.cashDiscrepancyThreshold) {
                issues.push({
                    type: 'cash_discrepancy',
                    severity: cashDiff > this.reconciliationRules.largeDiscrepancyThreshold ? 'high' : 'medium',
                    amount: entry.cashDifference,
                    description: `Cash difference of $${entry.cashDifference.toFixed(2)}`
                });
            }

            // Returns validation
            const returnsPercentage = entry.totalSales > 0 ? (entry.returnsRefunds / entry.totalSales) * 100 : 0;
            if (returnsPercentage > this.reconciliationRules.maxReturnsPercentage) {
                issues.push({
                    type: 'high_returns',
                    severity: 'medium',
                    percentage: returnsPercentage,
                    description: `Returns are ${returnsPercentage.toFixed(1)}% of sales`
                });
            }

            // Opening cash validation
            if (entry.openingCash < this.reconciliationRules.minOpeningCash) {
                issues.push({
                    type: 'low_opening_cash',
                    severity: 'low',
                    amount: entry.openingCash,
                    description: `Opening cash below minimum ($${this.reconciliationRules.minOpeningCash})`
                });
            }

            // Zero sales check
            if (entry.totalSales === 0 && entry.cashSales === 0 && entry.cardSales === 0) {
                issues.push({
                    type: 'zero_sales',
                    severity: 'medium',
                    description: 'No sales recorded for this entry'
                });
            }

            // Negative values check
            if (entry.cashSales < 0 || entry.cardSales < 0 || entry.closingCash < 0) {
                issues.push({
                    type: 'negative_values',
                    severity: 'high',
                    description: 'Negative values detected in sales data'
                });
            }

            if (issues.length > 0) {
                discrepancies.push({
                    entryId: entry.id,
                    date: entry.date,
                    registerNumber: entry.registerNumber,
                    cashDifference: entry.cashDifference,
                    issues: issues,
                    overallSeverity: this.calculateOverallSeverity(issues)
                });
            }
        });

        return discrepancies.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.overallSeverity] - severityOrder[a.overallSeverity];
        });
    }

    /**
     * Validate business rules
     */
    validateBusinessRules(salesData) {
        const validationErrors = [];

        // Check for duplicate entries
        const dateRegisterPairs = new Map();
        salesData.forEach(entry => {
            const key = `${entry.date}-${entry.registerNumber}`;
            if (dateRegisterPairs.has(key)) {
                validationErrors.push({
                    type: 'duplicate_entry',
                    severity: 'high',
                    description: `Duplicate entry found for ${entry.registerNumber} on ${entry.date}`,
                    affectedEntries: [dateRegisterPairs.get(key), entry.id]
                });
            } else {
                dateRegisterPairs.set(key, entry.id);
            }
        });

        // Check for missing consecutive dates
        const dates = [...new Set(salesData.map(entry => entry.date))].sort();
        for (let i = 1; i < dates.length; i++) {
            const currentDate = new Date(dates[i]);
            const previousDate = new Date(dates[i - 1]);
            const daysDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
            
            if (daysDiff > 1) {
                validationErrors.push({
                    type: 'missing_dates',
                    severity: 'medium',
                    description: `Gap in sales data between ${dates[i - 1]} and ${dates[i]}`,
                    daysMissing: daysDiff - 1
                });
            }
        }

        // Check for abnormal sales patterns
        if (salesData.length >= 7) {
            const recentSales = salesData.slice(-7);
            const avgSales = recentSales.reduce((sum, entry) => sum + entry.totalSales, 0) / recentSales.length;
            const stdDev = Math.sqrt(
                recentSales.reduce((sum, entry) => sum + Math.pow(entry.totalSales - avgSales, 2), 0) / recentSales.length
            );

            recentSales.forEach(entry => {
                if (Math.abs(entry.totalSales - avgSales) > 2 * stdDev && stdDev > 0) {
                    validationErrors.push({
                        type: 'abnormal_sales',
                        severity: 'medium',
                        description: `Sales amount $${entry.totalSales.toFixed(2)} is unusually ${entry.totalSales > avgSales ? 'high' : 'low'}`,
                        entryId: entry.id,
                        date: entry.date
                    });
                }
            });
        }

        return validationErrors;
    }

    /**
     * Calculate summary metrics
     */
    calculateSummaryMetrics(results) {
        const summary = {
            totalDiscrepancies: results.discrepancies.length,
            highSeverityDiscrepancies: results.discrepancies.filter(d => d.overallSeverity === 'high').length,
            totalCashVariance: Math.abs(results.totals.overallCashDifference),
            reconciliationAccuracy: 0,
            averageDiscrepancy: 0,
            cashRecoveryNeeded: 0
        };

        // Calculate reconciliation accuracy
        const totalEntries = results.totals.totalEntries;
        const balancedEntries = totalEntries - results.discrepancies.length;
        summary.reconciliationAccuracy = totalEntries > 0 ? (balancedEntries / totalEntries) * 100 : 100;

        // Calculate average discrepancy
        if (results.discrepancies.length > 0) {
            summary.averageDiscrepancy = results.discrepancies.reduce(
                (sum, d) => sum + Math.abs(d.cashDifference), 0
            ) / results.discrepancies.length;
        }

        // Calculate cash recovery needed
        summary.cashRecoveryNeeded = results.discrepancies
            .filter(d => d.cashDifference < 0)
            .reduce((sum, d) => sum + Math.abs(d.cashDifference), 0);

        return summary;
    }

    /**
     * Determine overall reconciliation status
     */
    determineOverallStatus(results) {
        const overall = {
            status: 'balanced',
            confidence: 100,
            totalDifference: Math.abs(results.totals.overallCashDifference),
            recommendations: []
        };

        // Determine status based on discrepancies and validation errors
        if (results.summary.highSeverityDiscrepancies > 0 || results.validationErrors.some(e => e.severity === 'high')) {
            overall.status = 'critical';
            overall.confidence = 30;
            overall.recommendations.push('Immediate attention required for high-severity issues');
        } else if (results.discrepancies.length > 0 || results.validationErrors.length > 0) {
            overall.status = 'warning';
            overall.confidence = 70;
            overall.recommendations.push('Review and resolve flagged discrepancies');
        } else if (overall.totalDifference > this.reconciliationRules.cashDiscrepancyThreshold) {
            overall.status = 'discrepancy';
            overall.confidence = 60;
            overall.recommendations.push('Investigate cash position difference');
        }

        // Add specific recommendations
        if (results.summary.reconciliationAccuracy < 90) {
            overall.recommendations.push('Improve data entry procedures to increase accuracy');
        }

        if (results.summary.cashRecoveryNeeded > 0) {
            overall.recommendations.push(`Cash recovery needed: $${results.summary.cashRecoveryNeeded.toFixed(2)}`);
        }

        if (overall.recommendations.length === 0) {
            overall.recommendations.push('All reconciliation checks passed successfully');
        }

        return overall;
    }

    /**
     * Calculate overall severity for multiple issues
     */
    calculateOverallSeverity(issues) {
        if (issues.some(issue => issue.severity === 'high')) return 'high';
        if (issues.some(issue => issue.severity === 'medium')) return 'medium';
        return 'low';
    }

    /**
     * Add new sales data for reconciliation
     */
    addSalesData(salesEntry) {
        // Real-time validation for new entry
        const validation = this.validateSingleEntry(salesEntry);
        
        if (validation.hasErrors) {
            return {
                success: false,
                errors: validation.errors,
                warnings: validation.warnings
            };
        }

        return {
            success: true,
            warnings: validation.warnings
        };
    }

    /**
     * Validate a single sales entry
     */
    validateSingleEntry(entry) {
        const validation = {
            hasErrors: false,
            errors: [],
            warnings: []
        };

        // Required field validation
        if (!entry.date || !entry.registerNumber) {
            validation.hasErrors = true;
            validation.errors.push('Date and register number are required');
        }

        // Cash discrepancy validation
        const cashDiff = Math.abs(entry.cashDifference || 0);
        if (cashDiff > this.reconciliationRules.largeDiscrepancyThreshold) {
            validation.hasErrors = true;
            validation.errors.push(`Large cash discrepancy: $${entry.cashDifference.toFixed(2)}`);
        } else if (cashDiff > this.reconciliationRules.cashDiscrepancyThreshold) {
            validation.warnings.push(`Cash discrepancy detected: $${entry.cashDifference.toFixed(2)}`);
        }

        // Business logic validation
        if (entry.totalSales > 0) {
            const returnsPercentage = (entry.returnsRefunds / entry.totalSales) * 100;
            if (returnsPercentage > this.reconciliationRules.maxReturnsPercentage) {
                validation.warnings.push(`High returns percentage: ${returnsPercentage.toFixed(1)}%`);
            }
        }

        if (entry.openingCash < this.reconciliationRules.minOpeningCash) {
            validation.warnings.push(`Opening cash below recommended minimum`);
        }

        return validation;
    }

    /**
     * Get reconciliation trends over time
     */
    getReconciliationTrends(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentHistory = this.reconciliationHistory.filter(
            result => new Date(result.timestamp) >= cutoffDate
        );

        const trends = {
            accuracyTrend: [],
            discrepancyTrend: [],
            cashVarianceTrend: [],
            period: days
        };

        recentHistory.forEach(result => {
            const date = new Date(result.timestamp).toISOString().split('T')[0];
            trends.accuracyTrend.push({
                date: date,
                value: result.summary.reconciliationAccuracy
            });
            trends.discrepancyTrend.push({
                date: date,
                value: result.summary.totalDiscrepancies
            });
            trends.cashVarianceTrend.push({
                date: date,
                value: result.summary.totalCashVariance
            });
        });

        return trends;
    }

    /**
     * Generate reconciliation report
     */
    generateReconciliationReport(salesData, format = 'summary') {
        const results = this.runFullReconciliation(salesData);
        
        const report = {
            header: {
                title: 'Sales & Cash Reconciliation Report',
                generatedAt: new Date().toISOString(),
                period: this.getReportPeriod(salesData),
                totalEntries: salesData.length
            },
            executive_summary: {
                overallStatus: results.overall.status,
                confidence: results.overall.confidence,
                totalSales: results.totals.totalSales,
                totalDiscrepancies: results.summary.totalDiscrepancies,
                reconciliationAccuracy: results.summary.reconciliationAccuracy,
                cashVariance: results.summary.totalCashVariance
            },
            detailed_findings: format === 'detailed' ? {
                discrepancies: results.discrepancies,
                validationErrors: results.validationErrors,
                totals: results.totals
            } : null,
            recommendations: results.overall.recommendations,
            action_items: this.generateActionItems(results)
        };

        return report;
    }

    /**
     * Generate action items based on reconciliation results
     */
    generateActionItems(results) {
        const actionItems = [];

        // High priority items
        results.discrepancies.filter(d => d.overallSeverity === 'high').forEach(discrepancy => {
            actionItems.push({
                priority: 'high',
                action: `Investigate ${discrepancy.registerNumber} on ${discrepancy.date}`,
                description: `Cash difference: $${discrepancy.cashDifference.toFixed(2)}`,
                assignee: 'Store Manager',
                dueDate: this.addDays(new Date(), 1)
            });
        });

        // Medium priority items
        if (results.summary.reconciliationAccuracy < 95) {
            actionItems.push({
                priority: 'medium',
                action: 'Review data entry procedures',
                description: `Current accuracy: ${results.summary.reconciliationAccuracy.toFixed(1)}%`,
                assignee: 'POS Admin',
                dueDate: this.addDays(new Date(), 7)
            });
        }

        // Low priority items
        if (results.validationErrors.some(e => e.type === 'missing_dates')) {
            actionItems.push({
                priority: 'low',
                action: 'Complete missing sales data',
                description: 'Gaps in daily sales records detected',
                assignee: 'Merchandiser',
                dueDate: this.addDays(new Date(), 14)
            });
        }

        return actionItems.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * Get report period from sales data
     */
    getReportPeriod(salesData) {
        if (salesData.length === 0) return { from: null, to: null };
        
        const dates = salesData.map(entry => entry.date).sort();
        return {
            from: dates[0],
            to: dates[dates.length - 1]
        };
    }

    /**
     * Add days to date
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    }

    /**
     * Save reconciliation history
     */
    saveReconciliationHistory(results) {
        this.reconciliationHistory.push({
            timestamp: results.timestamp,
            summary: results.summary,
            overall: results.overall,
            totalEntries: results.totals.totalEntries
        });

        // Keep only last 90 days of history
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        
        this.reconciliationHistory = this.reconciliationHistory.filter(
            result => new Date(result.timestamp) >= cutoffDate
        );

        localStorage.setItem('reconciliationHistory', JSON.stringify(this.reconciliationHistory));
    }

    /**
     * Get latest reconciliation results
     */
    getLatestResults() {
        return this.lastResults;
    }

    /**
     * Update reconciliation rules
     */
    updateReconciliationRules(newRules) {
        this.reconciliationRules = { ...this.reconciliationRules, ...newRules };
        localStorage.setItem('reconciliationRules', JSON.stringify(this.reconciliationRules));
    }

    /**
     * Get current reconciliation rules
     */
    getReconciliationRules() {
        return { ...this.reconciliationRules };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReconciliationEngine;
}
