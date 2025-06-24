// Skill Column Chart (Radar/Polygonal Chart)
function createSkillColumnChart(data, colors) {
    const svg = document.getElementById('skillColumnChartSvg');
    if (!svg || !data || data.length === 0) return;
    svg.innerHTML = '';
    const width = svg.clientWidth || 500;
    const height = 350;
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const cx = margin.left + chartWidth / 2;
    const cy = margin.top + chartHeight / 2 + 10;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 30;
    const N = data.length;
    if (N < 1) return;
    const gridSteps = 5;
    for (let step = 1; step <= gridSteps; step++) {
        const r = (radius * step) / gridSteps;
        let points = [];
        for (let i = 0; i < N; i++) {
            const angle = (Math.PI / 2) - (2 * Math.PI * i / N);
            const x = cx + r * Math.cos(angle);
            const y = cy - r * Math.sin(angle);
            points.push(`${x},${y}`);
        }
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points.join(' '));
        polygon.setAttribute('fill', 'none');
        polygon.setAttribute('stroke', '#e0e0e0');
        polygon.setAttribute('stroke-width', '1');
        svg.appendChild(polygon);
    }
    for (let i = 0; i < N; i++) {
        const angle = (Math.PI / 2) - (2 * Math.PI * i / N);
        const x = cx + radius * Math.cos(angle);
        const y = cy - radius * Math.sin(angle);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx);
        line.setAttribute('y1', cy);
        line.setAttribute('x2', x);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e0e0e0');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }
    let dataPoints = [];
    for (let i = 0; i < N; i++) {
        const d = data[i];
        const angle = (Math.PI / 2) - (2 * Math.PI * i / N);
        const r = (d.value / 100) * radius;
        const x = cx + r * Math.cos(angle);
        const y = cy - r * Math.sin(angle);
        dataPoints.push({x, y});
    }
    const fillPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    fillPolygon.setAttribute('points', dataPoints.map(p => `${p.x},${p.y}`).join(' '));
    fillPolygon.setAttribute('fill', '#133E82');
    fillPolygon.setAttribute('opacity', '0.3');
    fillPolygon.setAttribute('stroke', 'none');
    svg.appendChild(fillPolygon);
    const borderPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    borderPolygon.setAttribute('points', dataPoints.map(p => `${p.x},${p.y}`).join(' '));
    borderPolygon.setAttribute('fill', 'none');
    borderPolygon.setAttribute('stroke', '#133E82');
    borderPolygon.setAttribute('stroke-width', '2');
    svg.appendChild(borderPolygon);
    for (let i = 0; i < N; i++) {
        const {x, y} = dataPoints[i];
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', y);
        marker.setAttribute('r', 5);
        marker.setAttribute('fill', '#133E82');
        marker.setAttribute('stroke', '#133E82');
        marker.setAttribute('stroke-width', '2');
        marker.setAttribute('class', 'bar-marker');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${data[i].name}: ${data[i].value}%`;
        marker.appendChild(title);
        svg.appendChild(marker);
    }
    const labelDist = radius + 28;
    for (let i = 0; i < N; i++) {
        const angle = (Math.PI / 2) - (2 * Math.PI * i / N);
        const lx = cx + labelDist * Math.cos(angle);
        const ly = cy - labelDist * Math.sin(angle);
        const skillLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        skillLabel.setAttribute('x', lx);
        skillLabel.setAttribute('y', ly + 6);
        skillLabel.setAttribute('text-anchor', 'middle');
        skillLabel.setAttribute('class', 'x-axis-label');
        skillLabel.setAttribute('font-size', '15');
        skillLabel.setAttribute('font-family', 'Inter, Segoe UI, Arial, sans-serif');
        skillLabel.textContent = data[i].name.toLowerCase();
        if (i === 0) {
            skillLabel.setAttribute('fill', '#000');
            skillLabel.setAttribute('font-weight', 'bold');
        } else {
            skillLabel.setAttribute('fill', '#888');
            skillLabel.setAttribute('font-weight', '500');
        }
        svg.appendChild(skillLabel);
    }
    addChartTitle(svg, 'Top 6 Skills (Best Score)');
} 