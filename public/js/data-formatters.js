/**
 * Data Formatters - Data formatting and utility functions
 * Handles data transformation, calculations, and formatting utilities
 */

class DataFormatters {
    // Format XP in XP
    static formatXP(xp) {
        if (!xp) return '0 XP';
        // Format with XP suffix and proper spacing
        return `${xp.toLocaleString()} XP`;
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

    // Calculate XP progress towards the next level
    static getLevelProgressInfo(totalXP) {
        let level = 0;
        let xpForNext = 1000; // XP required for the first level
        let xpAccumulated = 0;

        // Determine the XP thresholds up to the user's current totalXP
        while (xpAccumulated + xpForNext < totalXP) {
            xpAccumulated += xpForNext;
            level++;
            xpForNext = Math.floor(xpForNext * 1.1); // XP for next level increases
        }

        const xpIntoLevel = totalXP - xpAccumulated;
        const progressToNextLevel = (xpIntoLevel / xpForNext) * 100;
        const xpNeededForNext = xpForNext - xpIntoLevel;

        return {
            xpNeededForNext,
            progressToNextLevel,
        };
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
    static prepareProjectXPData(transactions, completedProjects = null) {
        const xpByProject = {};
        transactions
            .filter(t => t.type === 'xp')
            .forEach(t => {
                const projectName = this.extractProjectName(t.path);
                // Only include if completedProjects is not provided or projectName is in completedProjects
                if (!completedProjects || completedProjects.includes(projectName)) {
                    xpByProject[projectName] = (xpByProject[projectName] || 0) + t.amount;
                }
            });

        return Object.entries(xpByProject)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
    }

    // Prepare data for Audits Points Chart
    static prepareAuditsPointsData(totalUp, totalDown) {
        return [
            { label: 'Done', value: totalUp || 0, color: CONFIG.CHART_COLORS.success },
            { label: 'Received', value: totalDown || 0, color: CONFIG.CHART_COLORS.info }
        ];
    }

    // Prepare skill data for ColumnChart (top 6 skills by highest amount)
    static prepareSkillColumnChartData(transactions) {
        // Only consider transactions where type starts with 'skill_'
        const skills = [];
        transactions.forEach(transaction => {
            const typeParts = transaction.type.split('_', 2);
            if (typeParts[0] === 'skill' && typeParts.length === 2) {
                const skillName = typeParts[1];
                // Check if skill already found in the array
                const skill = skills.find(s => s.name === skillName);
                if (skill) {
                    if (skill.value < transaction.amount) {
                        skill.value = transaction.amount;
                    }
                } else {
                    skills.push({
                        name: skillName,
                        value: transaction.amount
                    });
                }
            }
        });
        // Sort by value descending and take top 6
        return skills.sort((a, b) => b.value - a.value).slice(0, 6);
    }
}

// Export for use in other modules
window.DataFormatters = DataFormatters; 