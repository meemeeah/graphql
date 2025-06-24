// Success Rate Chart (Pie Chart)
function createSuccessRateChart(data, colors) {
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
        createNoDataMessage(svg, 'No success data available');
        return;
    }
    let currentAngle = -Math.PI / 2;
    const legendItems = [];
    if (data.filter(d => d.value > 0).length === 1) {
        const d = data.find(d => d.value > 0);
        const color = d.color || (d.label === 'Passed' ? colors.success : colors.error);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        path.setAttribute('cx', centerX);
        path.setAttribute('cy', centerY);
        path.setAttribute('r', radius);
        path.setAttribute('fill', color);
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '4');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${d.label}: ${d.value} (100%)`;
        path.appendChild(title);
        svg.appendChild(path);
        const passed = data.find(x => x.label === 'Passed')?.value || 0;
        const failed = data.find(x => x.label === 'Failed')?.value || 0;
        const total = passed + failed;
        const passedPercent = total > 0 ? Math.round((passed / total) * 100) : 0;
        const failedPercent = total > 0 ? Math.round((failed / total) * 100) : 0;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '18');
        text.setAttribute('fill', '#222');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `Passed: ${passed} (${passedPercent}%)`;
        svg.appendChild(text);
        const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text2.setAttribute('x', centerX);
        text2.setAttribute('y', centerY + 18);
        text2.setAttribute('text-anchor', 'middle');
        text2.setAttribute('font-size', '18');
        text2.setAttribute('fill', '#222');
        text2.setAttribute('font-weight', 'bold');
        text2.textContent = `Failed: ${failed} (${failedPercent}%)`;
        svg.appendChild(text2);
        legendItems.push({ label: 'Passed', color: colors.success });
        legendItems.push({ label: 'Failed', color: colors.error });
    } else {
        data.forEach((d, i) => {
            const color = d.color || (d.label === 'Passed' ? colors.success : colors.error);
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
            legendItems.push({ label: d.label, color });
            currentAngle = endAngle;
        });
    }
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
} 