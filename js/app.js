// Main App Controller
class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚀 GraphQL Profile Application starting...');
        
        // Setup error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });

        // Handle network status
        window.addEventListener('offline', () => {
            this.showError('You are offline. Some features may not work.');
        });

        window.addEventListener('online', () => {
            console.log('✅ Connection restored');
        });

        // Handle window resize for responsive charts
        window.addEventListener('resize', utils.debounce(() => {
            if (window.chartManager && utils.isAuthenticated()) {
                this.refreshCharts();
            }
        }, 300));

        console.log('✅ Application initialized');
    }

    // Refresh data from the server and update the UI with the new data
    async refreshData() {
        if (!utils.isAuthenticated()) return;

        try {
            console.log('🔄 Refreshing data...');
            utils.showLoading();
            
            if (window.graphql) {
                window.graphql.clearCache();
                await window.graphql.loadAllData();
            }
            
        } catch (error) {
            console.error('❌ Refresh failed:', error);
            this.showError('Failed to refresh data');
        } finally {
            utils.hideLoading();
        }
    }

    refreshCharts() {
        if (!window.chartManager) return;
        
        console.log('📊 Refreshing charts...');
        // Charts will auto-resize based on container size
    }

    showError(message) {
        console.error(message);
        // Create simple error display
        const existingError = document.getElementById('appError');
        if (existingError) existingError.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'appError';
        errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: #fee2e2; color: #dc2626; padding: 1rem;
            border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 300px;
        `;
        errorDiv.innerHTML = `
            ${message}
            <button onclick="this.parentElement.remove()" style="
                float: right; background: none; border: none; 
                color: #dc2626; font-size: 1.2rem; cursor: pointer;
                margin-left: 0.5rem;
            ">×</button>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Initialize
const app = new App();
window.app = app;

console.log('📱 GraphQL Profile Application ready');
