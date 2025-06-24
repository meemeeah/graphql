// Cumulative XP Line Chart
function createCumulativeXPChart(transactions, colors) {
    const svg = document.getElementById('cumulativeXPChartSvg');
    if (!svg || !transactions || transactions.length === 0) return;
    svg.innerHTML = '';
    const width = 900;
    const height = 480;
    const margin = { top: 50, right: 40, bottom: 120, left: 110 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    const filtered = transactions
        .filter(tx => tx.type === 'xp' && tx.path && tx.path.split('/').length < 5)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const seenProjects = new Set();
    let cumulativeXP = 0;
    const projects = [];
    const xpData = [];
    filtered.forEach(({ amount, path }) => {
        const mina = path.split('/');
        const projectName = mina[mina.length - 1];
        if (seenProjects.has(projectName)) return;
        seenProjects.add(projectName);
        cumulativeXP += amount;
        cumulativeXP = Math.round(cumulativeXP);
        projects.push(projectName);
        xpData.push(cumulativeXP);
    });
    if (projects.length === 0) return;
    const maxXP = Math.max(...xpData);
    const minXP = Math.min(...xpData);
    const xStep = chartWidth / (projects.length - 1 || 1);
    const yScale = v => chartHeight - ((v - minXP) / (maxXP - minXP || 1)) * chartHeight;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    const yAxisSteps = 5;
    for (let i = 0; i <= yAxisSteps; i++) {
        const y = (i / yAxisSteps) * chartHeight;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('x2', chartWidth);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e5e7eb');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', -10);
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#888');
        label.textContent = Math.round(maxXP - (i / yAxisSteps) * (maxXP - minXP));
        g.appendChild(label);
    }
    for (let i = 0; i < projects.length; i++) {
        const x = i * xStep;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('x2', x);
        line.setAttribute('y1', 0);
        line.setAttribute('y2', chartHeight);
        line.setAttribute('stroke', '#f3f3f3');
        line.setAttribute('stroke-width', '1');
        g.appendChild(line);
    }
    let pathData = '';
    for (let i = 0; i < xpData.length; i++) {
        const x = i * xStep;
        const y = yScale(xpData[i]);
        if (i === 0) {
            pathData += `M${x},${y}`;
        } else {
            const prevX = (i - 1) * xStep;
            const prevY = yScale(xpData[i - 1]);
            const cpx = (prevX + x) / 2;
            pathData += ` Q${cpx},${prevY} ${x},${y}`;
        }
    }
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', '#d18fbb');
    path.setAttribute('stroke-width', '4');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    g.appendChild(path);
    for (let i = 0; i < xpData.length; i++) {
        const x = i * xStep;
        const y = yScale(xpData[i]);
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', y);
        marker.setAttribute('r', 5);
        marker.setAttribute('fill', '#d18fbb');
        marker.setAttribute('stroke', '#fff');
        marker.setAttribute('stroke-width', '2');
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${projects[i]}: ${xpData[i]}`;
        marker.appendChild(title);
        g.appendChild(marker);
    }
    for (let i = 0; i < projects.length; i++) {
        const x = i * xStep;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', chartHeight + 35 + (i % 2 === 0 ? 0 : 15));
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', '#888');
        label.setAttribute('transform', `rotate(-60 ${x} ${chartHeight + 35 + (i % 2 === 0 ? 0 : 15)})`);
        label.textContent = projects[i];
        g.appendChild(label);
    }
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', margin.left + chartWidth / 2);
    xLabel.setAttribute('y', height);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '16');
    xLabel.setAttribute('fill', '#888');
    xLabel.setAttribute('font-family', 'Inter, Segoe UI, Arial, sans-serif');
    xLabel.setAttribute('font-weight', '600');
    xLabel.textContent = 'Projects';
    svg.appendChild(xLabel);
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', 25);
    yLabel.setAttribute('y', margin.top + chartHeight / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '16');
    yLabel.setAttribute('fill', '#888');
    yLabel.setAttribute('font-family', 'Inter, Segoe UI, Arial, sans-serif');
    yLabel.setAttribute('font-weight', '600');
    yLabel.setAttribute('transform', `rotate(-90 25 ${margin.top + chartHeight / 2})`);
    yLabel.textContent = 'Cumulative XP';
    svg.appendChild(yLabel);
} 