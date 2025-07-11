// GraphQL Query Manager
class GraphQLManager {
    constructor() {
        this.userCache = new Map();
        this.dataCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Make GraphQL request with authentication
    async query(query, variables = {}) {
        const token = utils.getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }

        // Validate token format before using
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.error('❌ Invalid JWT format in storage');
            utils.removeToken(); // Clear invalid token
            throw new Error('Invalid token format - please login again');
        }

        console.log('🔍 Making GraphQL request with token length:', token.length);

        try {
            const response = await fetch(CONFIG.GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token.trim()}`
                },
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            console.log('📡 GraphQL response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP error response:', errorText);
                
                if (response.status === 401) {
                    // Token is invalid or expired
                    utils.removeToken();
                    throw new Error('Authentication expired - please login again');
                }
                
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            if (result.errors) {
                console.error('❌ GraphQL errors:', result.errors);
                
                // Check if it's an authentication error
                const authError = result.errors.find(err => 
                    err.message.includes('JWT') || 
                    err.message.includes('authentication') ||
                    err.message.includes('unauthorized')
                );
                
                if (authError) {
                    console.error('🔐 Authentication error detected, clearing token');
                    utils.removeToken();
                    throw new Error('Authentication failed - please login again');
                }
                
                throw new Error(result.errors[0].message);
            }

            console.log('✅ GraphQL query successful');
            return result.data;
        } catch (error) {
            console.error('❌ GraphQL query error:', error);
            
            // If it's a network error, don't clear the token
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error - please check your connection');
            }
            
            throw error;
        }
    }

    // Get current user data
    async getCurrentUser() {
        const cacheKey = 'current_user';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        //we add new here 
        const query = `
            query GetCurrentUser {
                user {
                    id
                    login
                    attrs
                    totalUp
                    totalDown
                    createdAt
                    updatedAt
                }
            }
        `;

        const data = await this.query(query);
        this.setCache(cacheKey, data.user[0]);
        return data.user[0];
    }

    // Get user XP total
    // we add new here  need to fix 
    async getUserXPTotal() {
        const cacheKey = 'user_xp_total';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const query = `
            query GetUserXPTotal {
                transaction_aggregate(where: {type: {_eq: "xp"}}) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
            }
        `;

        const data = await this.query(query);
        const total = parseInt(data.transaction_aggregate.aggregate.sum.amount) || 0;
        this.setCache(cacheKey, total);
        return total;
    }

    // Get user transactions (XP, audits, etc.)
    async getUserTransactions() {
        const cacheKey = 'user_transactions';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const query = `
            query GetUserTransactions {
                transaction(order_by: { createdAt: desc }) {
                    id
                    type
                    amount
                    createdAt
                    path
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;

        const data = await this.query(query);
        this.setCache(cacheKey, data.transaction);
        return data.transaction;
    }

    // Helper method to determine when a project was actually completed
    getProjectCompletionDate(progressRecord) {
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

    // Get user progress stats 
    async getUserProgressStats() {
        const cacheKey = 'user_progress_stats';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        // Query for all progress data with updatedAt to track when projects were actually finished
        const query = `
            query GetUserProgressStats {
                progress(where: {object: {type: {_eq: "project"}}}) {
                    id
                    grade
                    createdAt
                    updatedAt
                    object {
                        type
                        attrs
                    }
                }
            }
        `;

        const data = await this.query(query);
        const progress = data.progress || [];

        // Calculate time thresholds
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log('📊 Calculating project stats:', {
            totalProgress: progress.length,
            oneWeekAgo: oneWeekAgo.toISOString(),
            oneMonthAgo: oneMonthAgo.toISOString(),
            now: now.toISOString()
        });

        // Calculate stats with improved logic
        const stats = {
            totalProjects: progress.length,
            passedProjects: progress.filter(p => p.grade >= 1).length,
            failedProjects: progress.filter(p => p.grade === 0).length,
            lastWeekProjects: progress.filter(p => {
                try {
                    const projectFinishDate = this.getProjectCompletionDate(p);
                    const isInLastWeek = projectFinishDate >= oneWeekAgo && projectFinishDate <= now;
                    
                    if (isInLastWeek) {
                        console.log(`✅ Project completed in last week: ${p.object?.attrs?.name || p.id} at ${projectFinishDate.toISOString()}`);
                    }
                    
                    return isInLastWeek;
                } catch (error) {
                    console.error('❌ Error processing project date:', error, p);
                    return false;
                }
            }).length,
            lastMonthProjects: progress.filter(p => {
                try {
                    const projectFinishDate = this.getProjectCompletionDate(p);
                    const isInLastMonth = projectFinishDate >= oneMonthAgo && projectFinishDate <= now;
                    
                    if (isInLastMonth) {
                        console.log(`✅ Project completed in last month: ${p.object?.attrs?.name || p.id} at ${projectFinishDate.toISOString()}`);
                    }
                    
                    return isInLastMonth;
                } catch (error) {
                    console.error('❌ Error processing project date:', error, p);
                    return false;
                }
            }).length
        };

        console.log('📈 Final project stats:', stats);

        this.setCache(cacheKey, stats);
        return stats;
    }

    // Get user progress data
    async getUserProgress() {
        const cacheKey = 'user_progress';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const query = `
            query GetUserProgress {
                progress(
                    order_by: { createdAt: desc }
                    where: { object: { type: { _eq: "project" } } }
                ) {
                    id
                    grade
                    createdAt
                    updatedAt
                    path
                    object {
                        id
                        name
                        type
                        attrs
                    }
                }
            }
        `;

        const data = await this.query(query);
        this.setCache(cacheKey, data.progress);
        return data.progress;
    }

    // Get user audits
    async getUserAudits() {
        const cacheKey = 'user_audits';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const query = `
            query GetUserAudits {
                transaction(
                    where: { type: { _eq: "audit" } }
                    order_by: { createdAt: desc }
                ) {
                    id
                    type
                    amount
                    createdAt
                    path
                    object {
                        id
                        name
                        type
                    }
                    user {
                        id
                        login
                    }
                }
            }
        `;

        const data = await this.query(query);
        this.setCache(cacheKey, data.transaction);
        return data.transaction;
    }

    // Load all data for the profile
    async loadAllData() {
        try {
            // Load data in parallel for better performance
            const [user, transactions, progress, xpTotal, progressStats] = await Promise.all([
                this.getCurrentUser(),
                this.getUserTransactions(),
                this.getUserProgress(),
                this.getUserXPTotal(),
                this.getUserProgressStats()
            ]);

            // Process and display the data
            this.displayBasicInfo(user, xpTotal, progressStats);
            this.displayXPInfo(transactions, xpTotal);
            this.displaySkillsInfo(progress, progressStats);
            
            // Generate charts
            await this.generateCharts(transactions, progress);

        } catch (error) {
            console.error('❌ Error loading profile data:', error);
            
            // If it's an authentication error, redirect to login
            if (error.message.includes('login again') || error.message.includes('Authentication')) {
                console.log('🔄 Redirecting to login due to auth error');
                if (window.authManager) {
                    window.authManager.handleLogout();
                }
                return;
            }
            
            this.displayError('Failed to load profile data: ' + error.message);
        }
    }

    // Format XP in kB
    formatXP(xp) {
        if (!xp) return '0 kB';
        // Convert to kB (divide by 1000) and round to nearest integer
        const kb = Math.round(xp / 1000);
        // Format with lowercase 'k' and proper spacing
        return `${kb.toLocaleString()} kB`;
    }

    // Format bytes to kB/MB
    formatBytes(bytes) {
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
    calculateAuditRatio(totalUp, totalDown) {
        if (!totalUp || !totalDown) return '0.00';
        const ratio = totalUp / totalDown;
        return ratio.toFixed(1);
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
        const auditRatio = this.calculateAuditRatio(user.totalUp, user.totalDown);
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
                    <span class="info-value">${this.formatBytes(user.totalUp)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Received</span>
                    <span class="info-value">${this.formatBytes(user.totalDown)}</span>
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

        const xpTransactions = transactions.filter(t => t.type === 'xp');
        const lastXP = xpTransactions[0];
        
        // Calculate XP trends
        const lastWeekXP = xpTransactions
            .filter(t => new Date(t.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + t.amount, 0);
        
        const lastMonthXP = xpTransactions
            .filter(t => new Date(t.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + t.amount, 0);

        const xpInfo = `
           
            <div class="info-item">
                <span class="info-label">Last Week XP</span>
                <span class="info-value">${this.formatXP(lastWeekXP)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Month XP</span>
                <span class="info-value">${this.formatXP(lastMonthXP)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Last Activity</span>
                <span class="info-value">${lastXP ? utils.timeAgo(lastXP.createdAt) : 'N/A'}</span>
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
        const skills = this.extractSkills(progress);
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

    // Generate all charts
    async generateCharts(transactions, progress) {
        if (window.chartManager) {
            const xpData = this.prepareXPProgressData(transactions);
            window.chartManager.createXPProgressChart(xpData);

            const successData = this.prepareSuccessRateData(progress);
            window.chartManager.createSuccessRateChart(successData);

            const auditData = this.prepareAuditData(transactions);
            window.chartManager.createAuditChart(auditData);

            const projectXPData = this.prepareProjectXPData(transactions);
            window.chartManager.createProjectXPChart(projectXPData);
        }
    }

    // Prepare XP progress data for chart
    prepareXPProgressData(transactions) {
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
    prepareSuccessRateData(progress) {
        const passed = progress.filter(p => p.grade >= 1).length;
        const failed = progress.filter(p => p.grade === 0).length;
        
        return [
            { label: 'Passed', value: passed, color: CONFIG.CHART_COLORS.success },
            { label: 'Failed', value: failed, color: CONFIG.CHART_COLORS.error }
        ];
    }

    // Prepare audit data
    prepareAuditData(transactions) {
        const audits = transactions.filter(t => t.type === 'audit');
        const upAudits = audits.filter(a => a.amount > 0);
        const downAudits = audits.filter(a => a.amount < 0);
        
        return [
            { label: 'Audits Given', value: upAudits.length, color: CONFIG.CHART_COLORS.success },
            { label: 'Audits Received', value: Math.abs(downAudits.length), color: CONFIG.CHART_COLORS.info }
        ];
    }

    // Prepare project XP data
    prepareProjectXPData(transactions) {
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

    // Extract project name from path
    extractProjectName(path) {
        if (!path) return 'Unknown';
        const parts = path.split('/');
        return parts[parts.length - 1] || 'Unknown';
    }

    // Extract skills from progress data
    extractSkills(progress) {
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

    // Cache management
    setCache(key, data) {
        this.dataCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.dataCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.dataCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache() {
        this.dataCache.clear();
    }

    // Force refresh progress stats (clear cache and reload)
    async refreshProgressStats() {
        console.log('🔄 Refreshing progress stats...');
        this.dataCache.delete('user_progress_stats');
        return await this.getUserProgressStats();
    }
}

// Initialize GraphQL manager
const graphql = new GraphQLManager();