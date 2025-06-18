/**
 * GraphQL Client - Core GraphQL operations and authentication
 * Handles all GraphQL queries, authentication, and basic data fetching
 */

class GraphQLClient {
    constructor() {
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
        return data.user[0];
    }

    // Get user XP total
    async getUserXPTotal() {
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
        return parseInt(data.transaction_aggregate.aggregate.sum.amount) || 0;
    }

    // Get user transactions (XP, audits, etc.)
    async getUserTransactions() {
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
        return data.transaction;
    }

    // Get user progress data
    async getUserProgress() {
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
        return data.progress;
    }

    // Get user audits
    async getUserAudits() {
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
        return data.transaction;
    }
}

// Export for use in other modules
window.GraphQLClient = GraphQLClient; 