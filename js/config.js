// Configuration constants
const CONFIG = {
    // API Endpoints - Replace ((DOMAIN)) with actual domain
    // Example: if your school is at https://learn.zone01dakar.sn
    // Then replace ((DOMAIN)) with learn.zone01dakar.sn
    // https://((DOMAIN))/api/graphql-engine/v1/graphql
    GRAPHQL_ENDPOINT: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT: 'https://learn.reboot01.com/api/auth/signin',
    
    // For development/testing, you can use these placeholder endpoints:
    // GRAPHQL_ENDPOINT: 'https://learn.zone01dakar.sn/api/graphql-engine/v1/graphql',
    // SIGNIN_ENDPOINT: 'https://learn.zone01dakar.sn/api/auth/signin',
    
    // STEP-BY-STEP: How to find and replace your domain
    // 1. Go to your school platform in browser
    // 2. Copy the domain from the URL (everything after https:// and before any paths)
    // 3. Replace ((DOMAIN)) above with your actual domain
    // 
    // Example replacements:
    // https://learn.reboot01.com       → learn.reboot01.com
    
    // JWT Storage
    JWT_KEY: 'graphql_jwt_token',
    USER_KEY: 'graphql_user_data',
    
    // Chart colors
    CHART_COLORS: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    },
    
    // Chart gradients
    GRADIENTS: {
        primary: ['#667eea', '#764ba2'],
        success: ['#10b981', '#059669'],
        warning: ['#f59e0b', '#d97706'],
        error: ['#ef4444', '#dc2626']
    }
};

// Utility functions
const utils = {
    // Get stored JWT token
    getToken() {
        return localStorage.getItem(CONFIG.JWT_KEY);
    },
    
    // Store JWT token
    setToken(token) {
        localStorage.setItem(CONFIG.JWT_KEY, token);
    },
    
    // Remove JWT token
    removeToken() {
        localStorage.removeItem(CONFIG.JWT_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
    },
    
    // Get stored user data
    getUserData() {
        const data = localStorage.getItem(CONFIG.USER_KEY);
        return data ? JSON.parse(data) : null;
    },
    
    // Store user data
    setUserData(userData) {
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
    },
    
    // Parse JWT to extract user info
    parseJWT(token) {
        try {
            if (!token || typeof token !== 'string') {
                throw new Error('Invalid token: not a string');
            }
            
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT: must have 3 parts');
            }
            
            const base64Url = parts[1];
            if (!base64Url) {
                throw new Error('Invalid JWT: missing payload');
            }
            
            // Convert base64url to base64
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            
            // Add padding if needed
            while (base64.length % 4) {
                base64 += '=';
            }
            
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            console.log('🔍 JWT payload:', payload);
            return payload;
        } catch (error) {
            console.error('❌ Error parsing JWT:', error);
            console.error('🔍 Token that failed:', token ? token.substring(0, 50) + '...' : 'null');
            return null;
        }
    },
    
    // Format numbers with commas
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    },
    
    // Format dates
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    // Calculate time ago
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    },
    
    // Show loading state
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    },
    
    // Hide loading state
    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    },
    
    // Show error message
    showError(message, elementId = 'loginError') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    },
    
    // Hide error message
    hideError(elementId = 'loginError') {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    },
    
    // Create user initials for avatar
    createInitials(name) {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    },
    
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        
        // Validate token format
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('⚠️ Invalid JWT format in storage, clearing...');
            this.removeToken();
            return false;
        }
        
        // Check if token is expired
        const decoded = this.parseJWT(token);
        if (!decoded || !decoded.exp) return false;
        
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    },
    
    // Debug helper to check token
    debugToken() {
        const token = this.getToken();
        if (!token) {
            console.log('🔍 No token found');
            return;
        }
        
        console.log('🔍 Token debug info:');
        console.log('- Length:', token.length);
        console.log('- Parts:', token.split('.').length);
        console.log('- First 50 chars:', token.substring(0, 50) + '...');
        console.log('- Last 20 chars:', '...' + token.substring(token.length - 20));
        
        const decoded = this.parseJWT(token);
        if (decoded) {
            console.log('- Decoded payload:', decoded);
            console.log('- Expires:', new Date(decoded.exp * 1000));
            console.log('- Valid:', decoded.exp > Date.now() / 1000);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, utils };
} 