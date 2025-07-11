// Main App Controller
class App {
    constructor() {
        this.svgLoader = null;
        this.init();
    }

    async init() {
        console.log('🚀 GraphQL Profile Application starting...');
        
        // Initialize SVG Loader
        this.svgLoader = new SVGLoader();
        await this.svgLoader.preloadAll();
        
        // Load SVG icons for sections
        await this.loadSectionIcons();
        
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

        // Automatically refresh all profile data every 60 seconds
        setInterval(() => {
            if (window.graphql && utils.isAuthenticated()) {
                window.graphql.loadAllData();
            }
        }, 60000); // 60,000 ms = 60 seconds
    }

    // Load SVG icons for different sections
    async loadSectionIcons() {
        try {
            await this.svgLoader.insertSVG('basicInfoIcon', 'user-profile.svg', {
                class: 'svg-primary',
                width: '20',
                height: '20'
            });
            
            await this.svgLoader.insertSVG('xpInfoIcon', 'xp-icon.svg', {
                class: 'svg-success',
                width: '20',
                height: '20'
            });
            
            await this.svgLoader.insertSVG('skillsInfoIcon', 'chart-icon.svg', {
                class: 'svg-secondary',
                width: '20',
                height: '20'
            });
            
            console.log('✅ Section icons loaded successfully');
        } catch (error) {
            console.error('❌ Error loading section icons:', error);
        }
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

// GraphQL query for user level distribution
const LEVEL_DISTRIBUTION_QUERY = `
query {
    event_user(where: { eventId: { _in: [20, 72, 250] } }) {
        level
        userId
        userLogin
        eventId
        user {
            id
            login
        }
    }
}`;

// Function to fetch level distribution data
async function fetchLevelDistribution() {
    try {
        const token = localStorage.getItem('graphql_jwt_token');
        if (!token) return null;

        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: LEVEL_DISTRIBUTION_QUERY })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.data.event_user;
    } catch (error) {
        console.error('Error fetching level distribution:', error);
        return null;
    }
}

// Function to render level distribution chart
async function renderLevelDistribution() {
    const levelData = await fetchLevelDistribution();
    if (!levelData) return;

    // Try to get current user ID from backend (preferred)
    let currentUserId = null;
    if (window.graphql && typeof window.graphql.getCurrentUser === 'function') {
        try {
            const user = await window.graphql.getCurrentUser();
            currentUserId = user && user.id ? user.id : null;
        } catch (e) {
            currentUserId = null;
        }
    }
    // Fallback: get from localStorage
    if (!currentUserId) {
        const userData = localStorage.getItem('graphql_user_data');
        currentUserId = userData ? JSON.parse(userData).id : null;
    }

    // Render the chart using chartManager
    if (window.chartManager) {
        window.chartManager.createLevelDistributionChart(levelData, currentUserId);
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    renderLevelDistribution();
    initializeApp();
    setupChartMenus();
});

// Add or update a function to load all data and render all charts, including audits points
async function loadAllProfileData() {
    try {
        // Check if user is authenticated before making any GraphQL calls
        if (!utils.isAuthenticated()) {
            console.log('User not authenticated, skipping profile data load');
            return;
        }

        const graphql = window.graphql || new GraphQLClient();
        const uiDisplay = window.uiDisplay || new UIDisplay();
        window.graphql = graphql;
        window.uiDisplay = uiDisplay;

        // Fetch all required data
        const [userData, transactions, progress] = await Promise.all([
            graphql.getCurrentUser(),
            graphql.getUserTransactions(),
            graphql.getUserProgress()
        ]);

        // Render all charts, including audits points
        uiDisplay.generateCharts(transactions, progress, userData);
    } catch (error) {
        console.error('Error loading profile data:', error);
        // If it's an authentication error, redirect to login
        if (error.message.includes('authentication') || error.message.includes('token')) {
            console.log('Authentication error detected, redirecting to login');
            if (window.authManager) {
                window.authManager.handleLogout();
            }
        }
    }
}

// Call this function when the profile page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only load profile data if user is authenticated
        if (utils.isAuthenticated()) {
            loadAllProfileData();
        }
    });
} else {
    // Only load profile data if user is authenticated
    if (utils.isAuthenticated()) {
        loadAllProfileData();
    }
}

function initializeApp() {
    // ... existing code ...
}

function setupChartMenus() {
    const menuButtons = document.querySelectorAll('.menu-btn');

    menuButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = button.nextElementSibling;
            closeAllDropdowns(dropdown);
            dropdown.classList.toggle('show');
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.chart-menu')) {
            closeAllDropdowns();
        }
    });

    const downloadOptions = document.querySelectorAll('.download-option');
    downloadOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            const format = option.dataset.format;
            const chartContainer = option.closest('.chart-container');
            const svg = chartContainer.querySelector('svg');
            const title = chartContainer.querySelector('h4').textContent.trim();
            downloadChart(svg, format, title);
        });
    });
}

function closeAllDropdowns(exceptDropdown = null) {
    const dropdowns = document.querySelectorAll('.menu-dropdown');
    dropdowns.forEach(dropdown => {
        if (dropdown !== exceptDropdown) {
            dropdown.classList.remove('show');
        }
    });
}

function downloadChart(svg, format, title) {
    const svgRect = svg.getBoundingClientRect();
    const width = svgRect.width;
    const height = svgRect.height;

    // Create a clone to work with
    const clonedSvg = svg.cloneNode(true);
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clonedSvg);

    // For raster formats, add a white background
    if (format !== 'svg') {
        const whiteBackground = `<rect x="0" y="0" width="${width}" height="${height}" fill="white"></rect>`;
        svgString = svgString.replace('>', `>${whiteBackground}`);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.download = `${title.replace(/ /g, '_')}.${format}`;

    if (format === 'svg') {
        downloadLink.href = url;
        downloadLink.click();
        URL.revokeObjectURL(url);
    } else {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            downloadLink.href = canvas.toDataURL(`image/${format}`);
            downloadLink.click();
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            console.error('Failed to load SVG image for conversion.');
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }
}
