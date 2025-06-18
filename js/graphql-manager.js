/**
 * GraphQL Manager - Main orchestrator for GraphQL operations
 * Coordinates between GraphQL client, progress stats, UI display, and data formatters
 */

class GraphQLManager {
    constructor() {
        // Initialize all modules
        this.graphqlClient = new GraphQLClient();
        this.progressStats = new ProgressStats(this.graphqlClient);
        this.uiDisplay = new UIDisplay();
        this.dataFormatters = DataFormatters;
    }

    // Load all data for the profile
    async loadAllData() {
        try {
            console.log('🚀 Loading profile data...');
            this.uiDisplay.showLoading();

            // Load data in parallel for better performance
            const [user, transactions, progress, xpTotal, progressStats] = await Promise.all([
                this.graphqlClient.getCurrentUser(),
                this.graphqlClient.getUserTransactions(),
                this.graphqlClient.getUserProgress(),
                this.graphqlClient.getUserXPTotal(),
                this.progressStats.getUserProgressStats()
            ]);

            console.log('✅ All data loaded successfully');

            // Display profile header with user's actual name
            this.uiDisplay.displayProfileHeader(user);

            // Process and display the data
            this.uiDisplay.displayBasicInfo(user, xpTotal, progressStats);
            this.uiDisplay.displayXPInfo(transactions, xpTotal);
            this.uiDisplay.displaySkillsInfo(progress, progressStats);
            
            // Generate charts
            await this.uiDisplay.generateCharts(transactions, progress);

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
            
            this.uiDisplay.displayError('Failed to load profile data: ' + error.message);
        }
    }

    // Refresh all data (clear cache and reload)
    async refreshAllData() {
        console.log('🔄 Refreshing all data...');
        this.progressStats.clearCache();
        await this.loadAllData();
    }

    // Get specific data methods for external use
    async getCurrentUser() {
        return await this.graphqlClient.getCurrentUser();
    }

    async getUserXPTotal() {
        return await this.graphqlClient.getUserXPTotal();
    }

    async getUserTransactions() {
        return await this.graphqlClient.getUserTransactions();
    }

    async getUserProgress() {
        return await this.graphqlClient.getUserProgress();
    }

    async getUserProgressStats() {
        return await this.progressStats.getUserProgressStats();
    }

    async refreshProgressStats() {
        return await this.progressStats.refreshProgressStats();
    }

    // Utility methods for external access
    getDataFormatters() {
        return this.dataFormatters;
    }

    getUIDisplay() {
        return this.uiDisplay;
    }

    getProgressStats() {
        return this.progressStats;
    }

    // Clear all caches
    clearAllCaches() {
        this.progressStats.clearCache();
        console.log('🧹 All caches cleared');
    }

    // Get project trends for a specific period
    async getProjectTrends(days = 30) {
        const progress = await this.getUserProgress();
        return ProgressStats.getProjectTrends(progress, days);
    }

    // Get skills distribution
    async getSkillsDistribution() {
        const progress = await this.getUserProgress();
        return ProgressStats.getSkillsDistribution(progress);
    }

    // Update specific UI element
    updateUIElement(elementId, content) {
        this.uiDisplay.updateElement(elementId, content);
    }

    // Display custom error message
    displayError(message) {
        this.uiDisplay.displayError(message);
    }

    // Show loading state
    showLoading() {
        this.uiDisplay.showLoading();
    }

    // Refresh profile header display
    async refreshProfileHeader() {
        try {
            const user = await this.getCurrentUser();
            this.uiDisplay.displayProfileHeader(user);
            console.log('👤 Profile header refreshed');
        } catch (error) {
            console.error('❌ Error refreshing profile header:', error);
        }
    }
}

// Initialize GraphQL manager
const graphql = new GraphQLManager();

// Export for global access
window.graphql = graphql; 