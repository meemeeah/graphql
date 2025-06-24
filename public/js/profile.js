class ProfileManager {
    constructor() {
        this.graphql = new GraphQLClient('https://learn.reboot01.com/api/graphql-engine/v1/graphql');
        this.loadProfileData();
    }

    async loadProfileData() {
        try {
            // Load all required data
            const [userInfo, xpProgress, skillsAchievements] = await Promise.all([
                this.graphql.getUserInfo(),
                this.graphql.getUserXPAndProgress(),
                this.graphql.getUserSkillsAndAchievements()
            ]);

            this.updateBasicInfo(userInfo.user[0]);
            this.updateXPAndProgress(xpProgress);
            this.updateSkillsAndAchievements(skillsAchievements);
        } catch (error) {
            console.error('Error loading profile data:', error);
            this.showError('Error loading profile data. Please try refreshing the page.');
        }
    }

    updateBasicInfo(user) {
        // Update Basic Information section
        document.getElementById('userId').textContent = user.id;
        document.getElementById('userLogin').textContent = user.login;
        document.getElementById('memberSince').textContent = this.formatDate(user.createdAt);
        
        // Calculate audit ratio
        const auditRatio = this.calculateAuditRatio();
        document.getElementById('auditRatio').textContent = auditRatio.toFixed(2);
    }

    updateXPAndProgress(data) {
        const { transaction, progress } = data;
        
        // Calculate total XP
        const totalXP = transaction.reduce((sum, t) => sum + t.amount, 0);
        document.getElementById('totalXP').textContent = this.formatNumber(totalXP) + ' XP';
        
        // Calculate projects completed
        const completedProjects = progress.filter(p => p.grade === 1).length;
        document.getElementById('projectsCompleted').textContent = completedProjects;
        
        // Calculate average XP per project
        const avgXP = completedProjects > 0 ? Math.round(totalXP / completedProjects) : 0;
        document.getElementById('avgXPPerProject').textContent = this.formatNumber(avgXP) + ' XP';
        
        // Update last activity
        const lastActivity = this.getLastActivity(transaction, progress);
        document.getElementById('lastActivity').textContent = lastActivity;
    }

    updateSkillsAndAchievements(data) {
        const { progress, transaction } = data;
        
        // Calculate success rate
        const totalProjects = progress.length;
        const passedProjects = progress.filter(p => p.grade === 1).length;
        const successRate = totalProjects > 0 ? (passedProjects / totalProjects) * 100 : 0;
        document.getElementById('successRate').textContent = Math.round(successRate) + '%';
        
        // Update projects passed/failed
        document.getElementById('projectsPassed').textContent = passedProjects;
        document.getElementById('projectsFailed').textContent = totalProjects - passedProjects;
        
        // Update skills
        const skills = this.extractSkills(progress);
        document.getElementById('skillsList').innerHTML = skills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
    }

    // Helper methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // calculateAuditRatio() {
    //     // Implementation depends on your data structure
    //     return 0.80; // Placeholder
    // }

    getLastActivity(transactions, progress) {
        const allActivities = [
            ...transactions.map(t => new Date(t.createdAt)),
            ...progress.map(p => new Date(p.createdAt))
        ];
        
        if (allActivities.length === 0) return 'No activity';
        
        const lastActivity = new Date(Math.max(...allActivities));
        const now = new Date();
        const diffHours = Math.floor((now - lastActivity) / (1000 * 60 * 60));
        
        if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else {
            return this.formatDate(lastActivity);
        }
    }

    extractSkills(progress) {
        const skills = new Set();
        progress.forEach(p => {
            if (p.object && p.object.attrs) {
                const attrs = JSON.parse(p.object.attrs);
                if (attrs.skills) {
                    attrs.skills.forEach(skill => skills.add(skill));
                }
            }
        });
        return Array.from(skills);
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 5000);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
}); 