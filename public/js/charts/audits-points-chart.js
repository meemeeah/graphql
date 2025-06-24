// Audits Points Chart (Horizontal Bar Chart)
function createAuditsPointsChart(data, colors) {
    const svg = document.getElementById('auditsPointsSvg');
    if (!svg || !data || data.length !== 2) return;
    svg.innerHTML = '';
    const width = svg.clientWidth || 500;
    const height = 200;
    const margin = { top: 30, right: 60, bottom: 30, left: 110 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barHeight = chartHeight / 4;
    const barSpacing = barHeight * 1.5;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    function formatNumber(n) {
        return n.toLocaleString();
    }
    data.forEach((d, i) => {
        const barLength = (d.value / maxValue) * chartWidth;
        const y = i * (barHeight + barSpacing);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', 0);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barLength);
        rect.setAttribute('height', barHeight);
        rect.setAttribute('fill', d.color);
        g.appendChild(rect);
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        let valueX = barLength + 10;
        let valueFill = '#111';
        if (barLength > 60) {
            valueX = barLength - 10;
            valueFill = '#fff';
            valueText.setAttribute('text-anchor', 'end');
        } else {
            valueText.setAttribute('text-anchor', 'start');
        }
        valueText.setAttribute('x', valueX);
        valueText.setAttribute('y', y + barHeight / 2 + 6);
        valueText.setAttribute('font-size', '16');
        valueText.setAttribute('font-weight', 'bold');
        valueText.setAttribute('fill', valueFill);
        valueText.textContent = formatNumber(d.value);
        g.appendChild(valueText);
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', -15);
        labelText.setAttribute('y', y + barHeight / 2 + 6);
        labelText.setAttribute('text-anchor', 'end');
        labelText.setAttribute('font-size', '16');
        labelText.textContent = d.label;
        g.appendChild(labelText);
    });
    addChartTitle(svg, 'Audits Points');
} 