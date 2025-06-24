// ChartManager: Combines all chart modules and exposes the same API as before
class ChartManager {
    constructor() {
        this.colors = CONFIG.CHART_COLORS;
        this.gradients = CONFIG.GRADIENTS;
    }
    createXPProgressChart(data) {
        createXPProgressChart(data, this.colors);
    }
    createSuccessRateChart(data) {
        createSuccessRateChart(data, this.colors);
    }
    createAuditChart(data) {
        createAuditChart(data, this.colors);
    }
    createProjectXPChart(data) {
        createProjectXPChart(data, this.colors);
    }
    createAuditsPointsChart(data) {
        createAuditsPointsChart(data, this.colors);
    }
    createLevelDistributionChart(eventData, currentUserId) {
        createLevelDistributionChart(eventData, currentUserId, this.colors);
    }
    createSkillColumnChart(data) {
        createSkillColumnChart(data, this.colors);
    }
    createCumulativeXPChart(transactions) {
        createCumulativeXPChart(transactions, this.colors);
    }
}
const chartManager = new ChartManager();
window.chartManager = chartManager; 