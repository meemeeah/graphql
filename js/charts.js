// SVG Chart Manager to create the charts for the dashboard
class ChartManager {
    constructor() {
        this.colors = CONFIG.CHART_COLORS;
        this.gradients = CONFIG.GRADIENTS;
    }

    // Create XP Progress Chart (Line Chart) to show the XP progress over time
    createXPProgressChart(data) {
        const svg = document.getElementById('xpProgressSvg');
        if (!svg || !data || data.length === 0) return;

        svg.innerHTML = '';
        const width = svg.clientWidth || 500;
        const height = 260;
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (data.length === 0) {
            this.createNoDataMessage(svg, 'No XP data available');
            return;
        }
 
        // Get the max and min values and dates for the chart
        const maxValue = Math.max(...data.map(d => d.value));
        const minDate = Math.min(...data.map(d => d.date.getTime()));
        const maxDate = Math.max(...data.map(d => d.date.getTime()));

        // Create main group for the chart and add it to the SVG element 
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
        svg.appendChild(g);

        // Create line path
        let pathData = '';
        data.forEach((d, i) => {
            const x = ((d.date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
            const y = chartHeight - (d.value / maxValue) * chartHeight;
            pathData += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
        });

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', this.colors.primary);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        g.appendChild(path);

        // Add points to the chart to show the XP progress over time and add a title to the points
        data.forEach(d => {
            const x = ((d.date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
            const y = chartHeight - (d.value / maxValue) * chartHeight;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', this.colors.primary);
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${utils.formatDate(d.date)}: ${utils.formatNumber(d.value)} XP`;
            circle.appendChild(title);
            
            g.appendChild(circle);
        });

        this.addChartTitle(svg, 'XP Progress Over Time');
    }

    // Create Success Rate Chart (Pie Chart) to show the success rate of the projects and the audit ratio
    createSuccessRateChart(data) {
        const svg = document.getElementById('successRateSvg');
        if (!svg || !data || data.length === 0) return;

        svg.innerHTML = '';
        const width = svg.clientWidth || 500;
        const height = 260;
        const radius = Math.min(width, height) / 2 - 40;
        const centerX = width / 2;
        const centerY = height / 2;

        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) {
            this.createNoDataMessage(svg, 'No success data available');
            return;
        }

        let currentAngle = -Math.PI / 2;
        const legendItems = [];

        data.forEach((d, i) => {
            // Use strong, vibrant colors for the chart
            const color = d.label === 'Passed' ? '#48bb78' : '#f56565';
            const angle = (d.value / total) * 2 * Math.PI;
            const endAngle = currentAngle + angle;

            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', color);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '4');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${d.label}: ${d.value} (${Math.round((d.value/total)*100)}%)`;
            path.appendChild(title);
            
            svg.appendChild(path);

            // Add label to the chart to show the success rate of the projects and the audit ratio
            const labelAngle = currentAngle + angle / 2;
            const labelX = centerX + (radius + 30) * Math.cos(labelAngle);
            const labelY = centerY + (radius + 30) * Math.sin(labelAngle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelX);
            text.setAttribute('y', labelY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', color);
            text.setAttribute('font-weight', 'bold');
            text.textContent = `${d.label}: ${d.value}`;
            svg.appendChild(text);

            // Prepare legend item
            legendItems.push({ label: d.label, color });

            currentAngle = endAngle;
        });

        // Add a visible legend below the chart
        let legend = document.getElementById('successRateLegend');
        if (!legend) {
            legend = document.createElement('div');
            legend.id = 'successRateLegend';
            legend.style.display = 'flex';
            legend.style.justifyContent = 'center';
            legend.style.gap = '2rem';
            legend.style.marginTop = '10px';
            legend.style.fontWeight = 'bold';
            legend.style.fontSize = '1rem';
            svg.parentElement.appendChild(legend);
        }
        legend.innerHTML = legendItems.map(item => `
            <span style="display:inline-flex;align-items:center;gap:0.5em;">
                <span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${item.color};border:2px solid #fff;box-shadow:0 0 4px ${item.color}77;"></span>
                <span>${item.label}</span>
            </span>
        `).join('');
        // Do NOT add SVG chart title here (handled by HTML <h4>)
    }

    // Create Audit Chart (Donut Chart) to show the audit ratio of the projects and the success rate of the projects 
    createAuditChart(data) {
        const svg = document.getElementById('auditRatioSvg');
        if (!svg || !data || data.length === 0) return;

        svg.innerHTML = '';
        const width = svg.clientWidth || 500;
        const height = 260;
        const outerRadius = Math.min(width, height) / 2 - 40;
        const innerRadius = outerRadius * 0.6;
        const centerX = width / 2;
        const centerY = height / 2;

        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) {
            this.createNoDataMessage(svg, 'No audit data available');
            return;
        }

        let currentAngle = -Math.PI / 2;

        data.forEach(d => {
            const angle = (d.value / total) * 2 * Math.PI;
            const endAngle = currentAngle + angle;

            const x1Outer = centerX + outerRadius * Math.cos(currentAngle);
            const y1Outer = centerY + outerRadius * Math.sin(currentAngle);
            const x2Outer = centerX + outerRadius * Math.cos(endAngle);
            const y2Outer = centerY + outerRadius * Math.sin(endAngle);
            const x1Inner = centerX + innerRadius * Math.cos(endAngle);
            const y1Inner = centerY + innerRadius * Math.sin(endAngle);
            const x2Inner = centerX + innerRadius * Math.cos(currentAngle);
            const y2Inner = centerY + innerRadius * Math.sin(currentAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const pathData = `M ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer} L ${x1Inner} ${y1Inner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner} Z`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', d.color);
            path.setAttribute('stroke', '#fff');
            path.setAttribute('stroke-width', '2');
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${d.label}: ${d.value}`;
            path.appendChild(title);
            
            svg.appendChild(path);

            currentAngle = endAngle;
        });

        // Add center text to the chart to show the audit ratio of the projects and the success rate of the projects 
        const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        centerText.setAttribute('x', centerX);
        centerText.setAttribute('y', centerY);
        centerText.setAttribute('text-anchor', 'middle');
        centerText.setAttribute('font-size', '16');
        centerText.setAttribute('font-weight', 'bold');
        centerText.textContent = 'Audits';
        svg.appendChild(centerText);

        this.addChartTitle(svg, 'Audit Distribution');
    }

    // Create Project XP Chart (Bar Chart) to show the XP distribution by projects
    createProjectXPChart(data) {
        const svg = document.getElementById('projectXpSvg');
        if (!svg || !data || data.length === 0) return;

        svg.innerHTML = '';
        const width = svg.clientWidth || 500;
        const height = 260;
        const margin = { top: 20, right: 30, bottom: 80, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (data.length === 0) {
            this.createNoDataMessage(svg, 'No project XP data available');
            return;
        }

        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
        svg.appendChild(g);

        // Create bars for the chart to show the XP distribution by projects
        data.forEach((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = i * (barWidth + barSpacing);
            const y = chartHeight - barHeight;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', this.colors.primary);
            
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${d.name}: ${utils.formatNumber(d.value)} XP`;
            rect.appendChild(title);
            
            g.appendChild(rect);

            // Add value label
            const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valueText.setAttribute('x', x + barWidth / 2);
            valueText.setAttribute('y', y - 5);
            valueText.setAttribute('text-anchor', 'middle');
            valueText.setAttribute('font-size', '12');
            valueText.textContent = utils.formatNumber(d.value);
            g.appendChild(valueText);

            // Add project name
            const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            nameText.setAttribute('x', x + barWidth / 2);
            nameText.setAttribute('y', chartHeight + 15);
            nameText.setAttribute('text-anchor', 'middle');
            nameText.setAttribute('font-size', '10');
            nameText.setAttribute('transform', `rotate(45, ${x + barWidth / 2}, ${chartHeight + 15})`);
            nameText.textContent = d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name;
            g.appendChild(nameText);
        });

        this.addChartTitle(svg, 'XP Distribution by Projects');
    }

    // Helper methods to add a title to the chart and create a no data message to the chart if there is no data available 
    addChartTitle(svg, title) {
        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleElement.setAttribute('x', (svg.clientWidth || 500) / 2);
        titleElement.setAttribute('y', 15);
        titleElement.setAttribute('text-anchor', 'middle');
        titleElement.setAttribute('font-size', '16');
        titleElement.setAttribute('font-weight', 'bold');
        titleElement.textContent = title;
        svg.appendChild(titleElement);
    }

    createNoDataMessage(svg, message) {
        const width = svg.clientWidth || 500;
        const height = 260;
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', width / 2);
        text.setAttribute('y', height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '16');
        text.setAttribute('fill', '#9ca3af');
        text.textContent = message;
        svg.appendChild(text);
    }
}

// Initialize chart manager
const chartManager = new ChartManager();
window.chartManager = chartManager;
