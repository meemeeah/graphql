// Project XP Chart (Bar Chart)
function createProjectXPChart(data, colors) {
    const svg = document.getElementById('projectXpSvg');
    if (!svg || !data || data.length === 0) return;
    svg.innerHTML = '';
    const width = svg.clientWidth || 500;
    const height = 260;
    const margin = { top: 20, right: 30, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    if (data.length === 0) {
        createNoDataMessage(svg, 'No project XP data available');
        return;
    }
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    data.forEach((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = i * (barWidth + barSpacing);
        const y = chartHeight - barHeight;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', colors.primary);
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${d.name}: ${utils.formatNumber(d.value)} XP`;
        rect.appendChild(title);
        g.appendChild(rect);
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', x + barWidth / 2);
        valueText.setAttribute('y', y - 5);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('font-size', '12');
        valueText.textContent = utils.formatNumber(d.value);
        g.appendChild(valueText);
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', x + barWidth / 2);
        nameText.setAttribute('y', chartHeight + 15);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-size', '10');
        nameText.setAttribute('transform', `rotate(45, ${x + barWidth / 2}, ${chartHeight + 15})`);
        nameText.textContent = d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name;
        g.appendChild(nameText);
    });
    addChartTitle(svg, '');
} 