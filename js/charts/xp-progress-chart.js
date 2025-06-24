// XP Progress Chart (Line Chart)
function createXPProgressChart(data, colors) {
    const svg = document.getElementById('xpProgressSvg');
    if (!svg || !data || data.length === 0) return;
    svg.innerHTML = '';
    const width = svg.clientWidth || 500;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    if (data.length === 0) {
        createNoDataMessage(svg, 'No XP data available');
        return;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const minDate = Math.min(...data.map(d => d.date.getTime()));
    const maxDate = Math.max(...data.map(d => d.date.getTime()));
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    let pathData = '';
    data.forEach((d, i) => {
        const x = ((d.date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const y = chartHeight - (d.value / maxValue) * chartHeight;
        pathData += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
    });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', colors.primary);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    g.appendChild(path);
    data.forEach(d => {
        const x = ((d.date.getTime() - minDate) / (maxDate - minDate)) * chartWidth;
        const y = chartHeight - (d.value / maxValue) * chartHeight;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 4);
        circle.setAttribute('fill', colors.primary);
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${utils.formatDate(d.date)}: ${utils.formatNumber(d.value)} XP`;
        circle.appendChild(title);
        g.appendChild(circle);
    });
    addChartTitle(svg, 'XP Progress Over Time');
} 