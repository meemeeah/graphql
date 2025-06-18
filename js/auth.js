// Authentication Module
class AuthManager {
    constructor() {
        this.initializeEventListeners();
    }

    // Initialize event listeners for login and logout buttons and check authentication status on page load and when the page is refreshed 
    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Check authentication status on page load
        this.checkAuthStatus();
    }

    // Handle user login
    async handleLogin() {
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('.login-btn');
        const btnText = document.querySelector('.btn-text');
        const btnSpinner = document.querySelector('.btn-spinner');

        // Validation
        if (!identifier || !password) {
            utils.showError('Please enter both username/email and password.');
            return;
        }

        // Clear previous errors
        utils.hideError();

        // Show loading state
        loginBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        try {
            // Create Basic Auth header
            const credentials = btoa(`${identifier}:${password}`);
            
            // Make login request
            const response = await fetch(CONFIG.SIGNIN_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Get JWT token from response
                let token = await response.text();
                
                // Clean the token - remove quotes, whitespace, and newlines
                token = token.trim().replace(/^["']|["']$/g, '');
                
                console.log('🔐 Token received, length:', token.length);
                console.log('🔍 Token starts with:', token.substring(0, 20) + '...');
                
                if (token && token.length > 20) {
                    // Validate token format (JWT should have 3 parts separated by dots)
                    const tokenParts = token.split('.');
                    if (tokenParts.length !== 3) {
                        throw new Error('Invalid JWT format - token should have 3 parts');
                    }
                    
                    // Store clean token
                    utils.setToken(token);
                    
                    // Parse JWT to get user info
                    const userInfo = utils.parseJWT(token);
                    if (userInfo) {
                        utils.setUserData(userInfo);
                        console.log('✅ Token parsed successfully, user:', userInfo.sub);
                    } else {
                        console.warn('⚠️ Could not parse JWT payload');
                    }

                    // Redirect to profile page
                    this.showProfilePage();
                } else {
                    throw new Error('No valid token received from server');
                }
            } else {
                // Handle different error status codes
                let errorMessage = 'Login failed. Please check your credentials.';
                
                switch (response.status) {
                    case 401:
                        errorMessage = 'Invalid username/email or password.';
                        break;
                    case 403:
                        errorMessage = 'Access forbidden. Please contact support.';
                        break;
                    case 429:
                        errorMessage = 'Too many login attempts. Please try again later.';
                        break;
                    case 500:
                        errorMessage = 'Server error. Please try again later.';
                        break;
                    default:
                        errorMessage = `Login failed (${response.status}). Please try again.`;
                }
                
                utils.showError(errorMessage);
            }
        } catch (error) {
            console.error('Login error:', error);
            utils.showError('Connection error. Please check your internet connection and try again.');
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }

    // Handle user logout
    handleLogout() {
        // Clear stored data
        utils.removeToken();
        
        // Show login page
        this.showLoginPage();
        
        // Reset form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        // Clear any error messages
        utils.hideError();
        
        console.log('User logged out successfully');
    }

    // Check authentication status
    checkAuthStatus() {
        if (utils.isAuthenticated()) {
            this.showProfilePage();
        } else {
            this.showLoginPage();
        }
    }

    // Show login page
    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const profilePage = document.getElementById('profilePage');
        
        if (loginPage && profilePage) {
            loginPage.classList.remove('hidden');
            profilePage.classList.add('hidden');
        }
        
        // Focus on identifier input
        const identifierInput = document.getElementById('identifier');
        if (identifierInput) {
            setTimeout(() => identifierInput.focus(), 100);
        }
    }

    // Show profile page after successful login and load profile data from the server and update the UI with the new data 
    showProfilePage() {
        const loginPage = document.getElementById('loginPage');
        const profilePage = document.getElementById('profilePage');
        
        if (loginPage && profilePage) {
            loginPage.classList.add('hidden');
            profilePage.classList.remove('hidden');
        }

        // Load profile data
        this.loadProfileData();
    }

    // Load profile data after successful login
    async loadProfileData() {
        try {
            utils.showLoading();
            
            // Get user data from JWT
            const token = utils.getToken();
            if (!token) {
                this.handleLogout();
                return;
            }

            const userInfo = utils.parseJWT(token);
            if (!userInfo) {
                this.handleLogout();
                return;
            }

            // Update UI with user info
            this.updateUserInterface(userInfo);
            
            // Load GraphQL data
            await graphql.loadAllData();
            
        } catch (error) {
            console.error('Error loading profile data:', error);
            utils.showError('Error loading profile data. Please try refreshing the page.');
        } finally {
            utils.hideLoading();
        }
    }

    // Update user interface with user information
    updateUserInterface(userInfo) {
        // Update user greeting (temporary until GraphQL data loads)
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting && userInfo.sub) {
            userGreeting.textContent = `Welcome, ${userInfo.sub}`;
        }

        // Note: Profile header (userName, userLogin, userInitials) will be updated
        // by the GraphQL manager with actual user data from the server
        console.log('🔐 User interface updated with JWT data, waiting for GraphQL data...');
    }

    // Get current user ID from JWT
    getCurrentUserId() {
        const token = utils.getToken();
        if (!token) return null;

        const userInfo = utils.parseJWT(token);
        return userInfo ? userInfo.sub : null;
    }

    // Check if token is about to expire (within 5 minutes)
    isTokenExpiring() {
        const token = utils.getToken();
        if (!token) return true;

        const userInfo = utils.parseJWT(token);
        if (!userInfo || !userInfo.exp) return true;

        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = userInfo.exp - currentTime;
        
        // Return true if token expires within 5 minutes
        return timeUntilExpiry < 300;
    }

    // Auto-logout when token expires
    startTokenExpiryCheck() {
        setInterval(() => {
            if (!utils.isAuthenticated()) {
                console.log('Token expired, logging out...');
                this.handleLogout();
            }
        }, 60000); // Check every minute
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
    
    // Start token expiry checking
    if (utils.isAuthenticated()) {
        window.authManager.startTokenExpiryCheck();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} 