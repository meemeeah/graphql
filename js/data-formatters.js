/**
 * Data Formatters - Data formatting and utility functions
 * Handles data transformation, calculations, and formatting utilities
 */

class DataFormatters {
    // Format XP in kB
    static formatXP(xp) {
        if (!xp) return '0 kB';
        // Convert to kB (divide by 1000) and round to nearest integer
        const kb = Math.round(xp / 1000);
        // Format with lowercase 'k' and proper spacing
        return `${kb.toLocaleString()} kB`;
    }

    // Format bytes to kB/MB
    static formatBytes(bytes) {
        if (!bytes) return '0 kB';
        if (bytes < 1000000) {
            // Convert to kB
            const kb = Math.round(bytes / 1000);
            return `${kb.toLocaleString()} kB`;
        } else {
            // Convert to MB
            const mb = (bytes / 1000000).toFixed(2);
            return `${mb} MB`;
        }
    }

    // Calculate and format audit ratio
    static calculateAuditRatio(totalUp, totalDown) {
        if (!totalUp || !totalDown) return '0.00';
        const ratio = totalUp / totalDown;
        return ratio.toFixed(1);
    }

    // Extract project name from path
    static extractProjectName(path) {
        if (!path) return 'Unknown';
        const parts = path.split('/');
        return parts[parts.length - 1] || 'Unknown';
    }

    // Extract skills from progress data
    static extractSkills(progress) {
        const skills = new Map();
        progress.forEach(p => {
            if (p.object?.attrs?.skills) {
                const projectSkills = p.object.attrs.skills;
                projectSkills.forEach(skill => {
                    skills.set(skill, (skills.get(skill) || 0) + 1);
                });
            }
        });
        return Array.from(skills.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([skill]) => skill);
    }

    // Helper method to determine when a project was actually completed
    static getProjectCompletionDate(progressRecord) {
        try {
            // If there's an updatedAt date, use it (indicates when the project was last modified/finished)
            if (progressRecord.updatedAt) {
                const updatedDate = new Date(progressRecord.updatedAt);
                if (!isNaN(updatedDate.getTime())) {
                    return updatedDate;
                }
            }
            
            // Fallback to createdAt if updatedAt is not available or invalid
            if (progressRecord.createdAt) {
                const createdDate = new Date(progressRecord.createdAt);
                if (!isNaN(createdDate.getTime())) {
                    return createdDate;
                }
            }
            
            // If both dates are invalid, return current date as fallback
            console.warn('⚠️ Invalid dates in progress record:', progressRecord);
            return new Date();
        } catch (error) {
            console.error('❌ Error parsing project completion date:', error, progressRecord);
            return new Date();
        }
    }

    // Calculate XP trends from transactions
    static calculateXPTrends(transactions) {
        const xpTransactions = transactions.filter(t => t.type === 'xp');
        
        const lastWeekXP = xpTransactions
            .filter(t => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const lastMonthXP = xpTransactions
            .filter(t => new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            lastWeekXP,
            lastMonthXP,
            lastXP: xpTransactions[0]
        };
    }

    // Prepare XP progress data for chart
    static prepareXPProgressData(transactions) {
        const xpTransactions = transactions
            .filter(t => t.type === 'xp')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        let cumulativeXP = 0;
        return xpTransactions.map(t => {
            cumulativeXP += t.amount;
            return {
                date: new Date(t.createdAt),
                value: cumulativeXP,
                amount: t.amount
            };
        });
    }

    // Prepare success rate data
    static prepareSuccessRateData(progress) {
        const passed = progress.filter(p => p.grade >= 1).length;
        const failed = progress.filter(p => p.grade === 0).length;
        
        return [
            { label: 'Passed', value: passed, color: CONFIG.CHART_COLORS.success },
            { label: 'Failed', value: failed, color: CONFIG.CHART_COLORS.error }
        ];
    }

    // Prepare audit data
    static prepareAuditData(transactions) {
        const audits = transactions.filter(t => t.type === 'audit');
        const upAudits = audits.filter(a => a.amount > 0);
        const downAudits = audits.filter(a => a.amount < 0);
        
        return [
            { label: 'Audits Given', value: upAudits.length, color: CONFIG.CHART_COLORS.success },
            { label: 'Audits Received', value: Math.abs(downAudits.length), color: CONFIG.CHART_COLORS.info }
        ];
    }

    // Prepare project XP data
    static prepareProjectXPData(transactions) {
        const xpByProject = {};
        transactions
            .filter(t => t.type === 'xp')
            .forEach(t => {
                const projectName = this.extractProjectName(t.path);
                xpByProject[projectName] = (xpByProject[projectName] || 0) + t.amount;
            });

        return Object.entries(xpByProject)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
    }
}

// Export for use in other modules
window.DataFormatters = DataFormatters; 