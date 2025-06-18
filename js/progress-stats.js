/**
 * Progress Stats - Progress statistics and calculations
 * Handles all progress-related calculations and statistics
 */

class ProgressStats {
    constructor(graphqlClient) {
        this.graphqlClient = graphqlClient;
        this.dataCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Get user progress stats with caching
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

        const data = await this.graphqlClient.query(query);
        const progress = data.progress || [];

        // Only count projects with grade 0 or grade >= 1 as valid
        const validProjects = progress.filter(p => p.grade === 0 || p.grade >= 1);
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log('📊 Calculating project stats:', {
            totalProgress: validProjects.length,
            oneWeekAgo: oneWeekAgo.toISOString(),
            oneMonthAgo: oneMonthAgo.toISOString(),
            now: now.toISOString()
        });

        // Calculate stats with improved logic
        const stats = {
            totalProjects: validProjects.length,
            passedProjects: validProjects.filter(p => p.grade >= 1).length,
            failedProjects: validProjects.filter(p => p.grade === 0).length,
            lastWeekProjects: validProjects.filter(p => {
                try {
                    const projectFinishDate = DataFormatters.getProjectCompletionDate(p);
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
            lastMonthProjects: validProjects.filter(p => {
                try {
                    const projectFinishDate = DataFormatters.getProjectCompletionDate(p);
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

    // Calculate success rate
    static calculateSuccessRate(passedProjects, totalProjects) {
        if (totalProjects === 0) return 0;
        return Math.round((passedProjects / totalProjects) * 100);
    }

    // Get project completion trends
    static getProjectTrends(progress, days = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const projectsInPeriod = progress.filter(p => {
            const completionDate = DataFormatters.getProjectCompletionDate(p);
            return completionDate >= startDate && completionDate <= now;
        });

        return {
            total: projectsInPeriod.length,
            passed: projectsInPeriod.filter(p => p.grade >= 1).length,
            failed: projectsInPeriod.filter(p => p.grade === 0).length,
            successRate: this.calculateSuccessRate(
                projectsInPeriod.filter(p => p.grade >= 1).length,
                projectsInPeriod.length
            )
        };
    }

    // Get skills distribution
    static getSkillsDistribution(progress) {
        const skills = DataFormatters.extractSkills(progress);
        const totalProjects = progress.length;
        
        return skills.map(skill => {
            const skillProjects = progress.filter(p => 
                p.object?.attrs?.skills?.includes(skill)
            ).length;
            
            return {
                skill,
                count: skillProjects,
                percentage: totalProjects > 0 ? Math.round((skillProjects / totalProjects) * 100) : 0
            };
        });
    }

    // Force refresh progress stats (clear cache and reload)
    async refreshProgressStats() {
        console.log('🔄 Refreshing progress stats...');
        this.dataCache.delete('user_progress_stats');
        return await this.getUserProgressStats();
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
}

// Export for use in other modules
window.ProgressStats = ProgressStats; 