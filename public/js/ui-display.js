/**
 * UI Display - User interface display logic
 * Handles all DOM manipulation and display methods
 */

class UIDisplay {
    constructor() {
        this.dataFormatters = DataFormatters;
    }

    // Display basic user information
    displayBasicInfo(user, xpTotal, progressStats) {
        const basicInfoElement = document.getElementById('basicInfo');
        if (!basicInfoElement || !user || user.length === 0) {
            basicInfoElement.innerHTML = '<div class="loading-placeholder">No user data available</div>';
            return;
        }

        const userData = Array.isArray(user) ? user[0] : user;
        const totalProjects = progressStats?.totalProjects || 0;
        const passedProjects = progressStats?.passedProjects || 0;
        const successRate = totalProjects > 0 ? Math.round((passedProjects / totalProjects) * 100) : 0;
        const auditRatio = this.dataFormatters.calculateAuditRatio(user.totalUp, user.totalDown);
        const memberSince = new Date(user.createdAt).toLocaleDateString();
        const lastUpdate = new Date(user.updatedAt).toLocaleDateString();
        
        const basicInfo = `
            <div class="info-item">
                <span class="info-label">Login</span>
                <span class="info-value">${userData.login}</span>
            </div>
            <div class="info-item">
                <span class="info-label">User ID</span>
                <span class="info-value">${userData.id}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">${userData.attrs.email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Projects Completed</span>
                <span class="info-value">${totalProjects}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Projects Passed</span>
                <span class="info-value">${passedProjects}</span>
            </div>
            <div class="audit-info">
                <div class="info-item">
                    <span class="info-label">Done</span>
                    <span class="info-value">${this.dataFormatters.formatBytes(user.totalUp)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Received</span>
                    <span class="info-value">${this.dataFormatters.formatBytes(user.totalDown)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Audit Ratio</span>
                    <span class="info-value ${parseFloat(auditRatio) < 1 ? 'warning' : ''}">${auditRatio}</span>
                </div>
                ${parseFloat(auditRatio) < 1 ? '<div class="audit-warning">Make more audits!</div>' : ''}
            </div>
            <div class="info-item">
                <span class="info-label">Member Since</span>
                <span class="info-value">${utils.formatDate(userData.createdAt)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Update</span>
                <span class="info-value">${utils.formatDate(user.updatedAt)}</span>
            </div>
        `;
        
        basicInfoElement.innerHTML = basicInfo;
    }

    // Display XP information
    displayXPInfo(transactions, totalXP) {
        const xpInfoElement = document.getElementById('xpInfo');
        if (!xpInfoElement) return;

        const xpTrends = this.dataFormatters.calculateXPTrends(transactions);
        
        const xpInfo = `
            
            <div class="info-item">
                <span class="info-label">Last Week XP</span>
                <span class="info-value xp-week">${this.dataFormatters.formatXP(xpTrends.lastWeekXP)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Month XP</span>
                <span class="info-value xp-month">${this.dataFormatters.formatXP(xpTrends.lastMonthXP)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Activity</span>
                <span class="info-value">${xpTrends.lastXP ? utils.timeAgo(xpTrends.lastXP.createdAt) : 'N/A'}</span>
            </div>
        `;
        
        xpInfoElement.innerHTML = xpInfo;
    }

    // Display skills and achievements
    displaySkillsInfo(progress, progressStats) {
        const skillsInfoElement = document.getElementById('skillsInfo');
        if (!skillsInfoElement) return;

        const passedProjects = progressStats?.passedProjects || 0;
        const failedProjects = progressStats?.failedProjects || 0;
        const totalProjects = progressStats?.totalProjects || 0;
        const successRate = totalProjects > 0 ? Math.round((passedProjects / totalProjects) * 100) : 0;
        const lastWeekProjects = progressStats?.lastWeekProjects || 0;
        const lastMonthProjects = progressStats?.lastMonthProjects || 0;

        // Calculate date ranges for display
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Extract and sort skills by frequency
        const skills = this.dataFormatters.extractSkills(progress);
        const skillTags = skills.slice(0, 10).map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');

        const skillsInfo = `
            <div class="info-item">
                <span class="info-label">Projects Passed</span>
                <span class="info-value">${passedProjects}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Projects Failed</span>
                <span class="info-value">${failedProjects}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Week Projects</span>
                <span class="info-value">${lastWeekProjects}</span>
                <div class="info-subtitle">${utils.formatDate(oneWeekAgo)} - ${utils.formatDate(now)}</div>
            </div>
            <div class="info-item">
                <span class="info-label">Last Month Projects</span>
                <span class="info-value">${lastMonthProjects}</span>
                <div class="info-subtitle">${utils.formatDate(oneMonthAgo)} - ${utils.formatDate(now)}</div>
            </div>
            
        `;
        
        skillsInfoElement.innerHTML = skillsInfo;
    }

    // Display user rank and level
    displayRank(events, totalXP) {
        // Remove the rank display entirely
        const rankContainer = document.getElementById('rankContainer');
        if (rankContainer) {
            rankContainer.innerHTML = '';
            rankContainer.style.display = 'none';
        }
    }

    // Display Audits Points Chart and Ratio
    displayAuditsPointsChart(userData) {
        if (!userData) return;
        const auditsData = this.dataFormatters.prepareAuditsPointsData(userData.totalUp, userData.totalDown);
        if (window.chartManager) {
            window.chartManager.createAuditsPointsChart(auditsData);
        }
        // Display audit ratio
        const ratio = userData.totalDown ? (userData.totalUp / userData.totalDown) : 0;
        const roundedRatio = Math.round(ratio * 100) / 100;
        const ratioDiv = document.getElementById('auditRatioDisplay');
        if (ratioDiv) {
            ratioDiv.textContent = `Audit Ratio: ${roundedRatio}`;
        }
    }

    // Generate all charts
    async generateCharts(transactions, progress, userData) {
        if (window.chartManager) {
            const xpData = this.dataFormatters.prepareXPProgressData(transactions);
            window.chartManager.createXPProgressChart(xpData);

            const successData = this.dataFormatters.prepareSuccessRateData(progress);
            window.chartManager.createSuccessRateChart(successData);

            const auditData = this.dataFormatters.prepareAuditData(transactions);
            window.chartManager.createAuditChart(auditData);

            // Arrange all projects from oldest to newest based on first appearance in progress
            const projectOrder = [];
            const seen = new Set();
            progress
                .filter(p => p.object && p.object.name)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .forEach(p => {
                    if (!seen.has(p.object.name)) {
                        seen.add(p.object.name);
                        projectOrder.push(p.object.name);
                    }
                });
            const projectXPData = this.dataFormatters.prepareProjectXPData(transactions, projectOrder);
            // Sort the chart data to match the projectOrder (oldest to newest)
            const projectXPDataOrdered = projectOrder
                .map(name => projectXPData.find(d => d.name === name))
                .filter(Boolean);
            window.chartManager.createProjectXPChart(projectXPDataOrdered);

            // Audits Points Chart
            if (userData) {
                this.displayAuditsPointsChart(userData);
            }

            // Skill Best Scores ColumnChart
            const skillData = this.dataFormatters.prepareSkillColumnChartData(transactions);
            window.chartManager.createSkillColumnChart(skillData);

            // Cumulative XP Chart
            window.chartManager.createCumulativeXPChart(transactions);
        }
    }

    // Display error message
    displayError(message) {
        const elements = ['basicInfo', 'xpInfo', 'skillsInfo'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="loading-placeholder">${message}</div>`;
            }
        });
    }

    // Show loading state
    showLoading() {
        const elements = ['basicInfo', 'xpInfo', 'skillsInfo'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="loading-placeholder">Loading...</div>';
            }
        });
    }

    // Update specific element content
    updateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    // Display user profile header with name and avatar
    displayProfileHeader(user) {
        if (!user) return;

        const userData = Array.isArray(user) ? user[0] : user;
        
        // Extract user information
        const login = userData.login || 'Unknown User';
        const attrs = userData.attrs || {};
        
        // Debug: Log all available attributes
        console.log('🔍 User attributes available:', attrs);
        
        // Try to get the actual name from different possible sources
        let displayName = login; // Default to login
        
        // Check for name in attrs (common patterns)
        if (attrs.name) {
            displayName = attrs.name;
        } else if (attrs.firstName && attrs.lastName) {
            displayName = `${attrs.firstName} ${attrs.lastName}`;
        } else if (attrs.first_name && attrs.last_name) {
            displayName = `${attrs.first_name} ${attrs.last_name}`;
        } else if (attrs.fullName) {
            displayName = attrs.fullName;
        } else if (attrs.full_name) {
            displayName = attrs.full_name;
        } else if (attrs.displayName) {
            displayName = attrs.displayName;
        } else if (attrs.display_name) {
            displayName = attrs.display_name;
        } else if (attrs.email) {
            // If no name found, try to extract from email
            const emailName = attrs.email.split('@')[0];
            if (emailName && emailName !== login) {
                displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }
        }

        // Create initials from the display name
        const initials = this.createInitials(displayName);
        
        // Update profile header elements
        const userNameElement = document.getElementById('userName');
        const userLoginElement = document.getElementById('userLogin');
        const userInitialsElement = document.getElementById('userInitials');
        const userGreetingElement = document.getElementById('userGreeting');

        if (userNameElement) {
            userNameElement.textContent = displayName;
        }

        if (userLoginElement) {
            userLoginElement.textContent = `@${login}`;
        }

        if (userInitialsElement) {
            userInitialsElement.textContent = initials;
        }

        if (userGreetingElement) {
            userGreetingElement.textContent = `Welcome, ${displayName}`;
        }

        // Add additional user info if available
        this.displayAdditionalUserInfo(userData);

        console.log('👤 Profile header updated:', {
            displayName,
            login,
            initials,
            attrs: Object.keys(attrs)
        });
    }

    // Display additional user information if available
    displayAdditionalUserInfo(userData) {
        const attrs = userData.attrs || {};
        
        // Create additional info element if it doesn't exist
        let additionalInfoElement = document.querySelector('.user-additional-info');
        if (!additionalInfoElement) {
            const userDetailsElement = document.querySelector('.user-details');
            if (userDetailsElement) {
                additionalInfoElement = document.createElement('div');
                additionalInfoElement.className = 'user-additional-info';
                userDetailsElement.appendChild(additionalInfoElement);
            }
        }

        if (!additionalInfoElement) return;

        // Collect additional information
        const additionalInfo = [];
        
        if (attrs.email) {
            additionalInfo.push(`📧 ${attrs.email}`);
        }
        
        if (attrs.location) {
            additionalInfo.push(`📍 ${attrs.location}`);
        }
        
        if (attrs.bio) {
            additionalInfo.push(`💬 ${attrs.bio}`);
        }
        
        if (attrs.company) {
            additionalInfo.push(`🏢 ${attrs.company}`);
        }
        
        if (attrs.website) {
            additionalInfo.push(`🌐 ${attrs.website}`);
        }

        // Display additional info
        if (additionalInfo.length > 0) {
            additionalInfoElement.innerHTML = `
                <div class="user-additional-details">
                    ${additionalInfo.map(info => `<span class="user-detail-item">${info}</span>`).join('')}
                </div>
            `;
        } else {
            additionalInfoElement.innerHTML = '';
        }
    }

    // Create initials from a name
    createInitials(name) {
        if (!name || typeof name !== 'string') return '?';
        
        // Split by spaces and get first letter of each word
        const words = name.trim().split(/\s+/);
        const initials = words.map(word => word.charAt(0).toUpperCase()).join('');
        
        // Return up to 2 initials
        return initials.substring(0, 2);
    }
}

// Export for use in other modules
window.UIDisplay = UIDisplay; 