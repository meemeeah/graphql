// Audit Chart (Donut Chart)
function createAuditChart(data, colors) {
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
        createNoDataMessage(svg, 'No audit data available');
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
    const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerText.setAttribute('x', centerX);
    centerText.setAttribute('y', centerY);
    centerText.setAttribute('text-anchor', 'middle');
    centerText.setAttribute('font-size', '16');
    centerText.setAttribute('font-weight', 'bold');
    centerText.textContent = 'Audits';
    svg.appendChild(centerText);
    addChartTitle(svg, 'Audit Distribution');
} 