// Level Distribution Chart
function createLevelDistributionChart(eventData, currentUserId, colors) {
    const svg = document.getElementById('columnChartSvg');
    if (!svg || !eventData || eventData.length === 0) return;
    svg.innerHTML = '';
    const width = svg.clientWidth || 500;
    const height = 300;
    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const cohortMap = {
        20: { name: 'Cohort 1', color: '#6366f1' },
        72: { name: 'Cohort 2', color: '#a78bfa' },
        250: { name: 'Cohort 3', color: '#fbbf24' }
    };
    const cohortOrder = ['Cohort 1', 'Cohort 2', 'Cohort 3'];
    const levelCohortCounts = {};
    eventData.forEach(({ level, eventId }) => {
        const cohort = cohortMap[eventId]?.name || 'Unknown';
        if (!levelCohortCounts[level]) {
            levelCohortCounts[level] = { 'Cohort 1': 0, 'Cohort 2': 0, 'Cohort 3': 0 };
        }
        if (cohortOrder.includes(cohort)) {
            levelCohortCounts[level][cohort]++;
        }
    });
    const levels = Object.keys(levelCohortCounts).map(Number).sort((a, b) => a - b);
    if (levels.length === 0) {
        createNoDataMessage(svg, 'No level distribution data available');
        return;
    }
    const stackedData = levels.map(level => ({
        level,
        ...levelCohortCounts[level]
    }));
    const maxCount = Math.max(...stackedData.map(d => cohortOrder.reduce((sum, c) => sum + d[c], 0)));
    const userEvent = eventData.find(e => e.userId === currentUserId);
    const userLevel = userEvent ? userEvent.level : null;
    let userBarX = null;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(g);
    const barWidth = Math.min(chartWidth / levels.length * 0.7, 28);
    const barGap = barWidth * 0.3;
    levels.forEach((level, i) => {
        let y = chartHeight;
        const x = (i * (barWidth + barGap)) + (chartWidth - (levels.length * (barWidth + barGap))) / 2;
        let isUserLevel = (userLevel !== null && level === userLevel);
        if (isUserLevel) userBarX = x + barWidth / 2;
        cohortOrder.forEach(cohort => {
            const count = levelCohortCounts[level][cohort];
            if (count > 0) {
                const barHeight = (count / maxCount) * chartHeight;
                y -= barHeight;
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x);
                rect.setAttribute('y', y);
                rect.setAttribute('width', barWidth);
                rect.setAttribute('height', barHeight);
                rect.setAttribute('fill', cohortMap[Object.keys(cohortMap).find(key => cohortMap[key].name === cohort)]?.color || '#ccc');
                rect.setAttribute('rx', 3);
                if (isUserLevel) rect.setAttribute('stroke', '#667eea');
                if (isUserLevel) rect.setAttribute('stroke-width', '2');
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `Level ${level} (${cohort}): ${count} users`;
                rect.appendChild(title);
                g.appendChild(rect);
                if (cohort === 'Cohort 3') {
                    const countLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    countLabel.setAttribute('x', x + barWidth / 2);
                    countLabel.setAttribute('y', y - 4);
                    countLabel.setAttribute('text-anchor', 'middle');
                    countLabel.setAttribute('font-size', '11');
                    countLabel.setAttribute('fill', '#666');
                    countLabel.textContent = cohortOrder.reduce((sum, c) => sum + levelCohortCounts[level][c], 0);
                    g.appendChild(countLabel);
                }
            }
        });
        const levelLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        levelLabel.setAttribute('x', x + barWidth / 2);
        levelLabel.setAttribute('y', chartHeight + 16);
        levelLabel.setAttribute('text-anchor', 'middle');
        levelLabel.setAttribute('font-size', '10');
        levelLabel.setAttribute('fill', '#666');
        levelLabel.textContent = level;
        g.appendChild(levelLabel);
    });
    if (userBarX !== null) {
        const annotationLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        annotationLine.setAttribute('x1', userBarX);
        annotationLine.setAttribute('x2', userBarX);
        annotationLine.setAttribute('y1', 0);
        annotationLine.setAttribute('y2', chartHeight + 10);
        annotationLine.setAttribute('stroke', '#838ccd');
        annotationLine.setAttribute('stroke-width', '3');
        annotationLine.setAttribute('stroke-dasharray', '6,3');
        annotationLine.setAttribute('opacity', '0.85');
        g.appendChild(annotationLine);
        const labelWidth = 60;
        const labelHeight = 18;
        const labelX = userBarX - labelWidth / 2;
        const labelY = -labelHeight - 6;
        const annotationLabel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        annotationLabel.setAttribute('x', labelX);
        annotationLabel.setAttribute('y', labelY);
        annotationLabel.setAttribute('width', labelWidth);
        annotationLabel.setAttribute('height', labelHeight);
        annotationLabel.setAttribute('rx', 8);
        annotationLabel.setAttribute('fill', '#838ccd');
        annotationLabel.setAttribute('stroke', '#fff');
        annotationLabel.setAttribute('stroke-width', '1');
        g.appendChild(annotationLabel);
        const annotationText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        annotationText.setAttribute('x', userBarX);
        annotationText.setAttribute('y', -labelHeight / 2 - 2);
        annotationText.setAttribute('text-anchor', 'middle');
        annotationText.setAttribute('font-size', '11');
        annotationText.setAttribute('fill', '#fff');
        annotationText.setAttribute('font-weight', 'bold');
        annotationText.textContent = 'Your Level';
        g.appendChild(annotationText);
    }
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
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#666');
        label.textContent = Math.round((maxCount - (i / yAxisSteps) * maxCount));
        g.appendChild(label);
    }
    const legendG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendG.setAttribute('transform', `translate(0, -24)`);
    let legendX = 0;
    cohortOrder.forEach(cohort => {
        const color = cohortMap[Object.keys(cohortMap).find(key => cohortMap[key].name === cohort)]?.color || '#ccc';
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', legendX);
        rect.setAttribute('y', 0);
        rect.setAttribute('width', 18);
        rect.setAttribute('height', 18);
        rect.setAttribute('fill', color);
        rect.setAttribute('rx', 4);
        legendG.appendChild(rect);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', legendX + 24);
        text.setAttribute('y', 13);
        text.setAttribute('font-size', '13');
        text.setAttribute('fill', '#444');
        text.textContent = cohort;
        legendG.appendChild(text);
        legendX += 100;
    });
    g.appendChild(legendG);
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', chartWidth / 2);
    xLabel.setAttribute('y', chartHeight + 36);
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '15');
    xLabel.setAttribute('font-family', 'Inter, Segoe UI, Arial, sans-serif');
    xLabel.setAttribute('font-weight', '600');
    xLabel.setAttribute('fill', '#888');
    xLabel.textContent = 'Levels';
    g.appendChild(xLabel);
    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', -38);
    yLabel.setAttribute('y', chartHeight / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '15');
    yLabel.setAttribute('font-family', 'Inter, Segoe UI, Arial, sans-serif');
    yLabel.setAttribute('font-weight', '600');
    yLabel.setAttribute('transform', `rotate(-90 -38 ${chartHeight / 2})`);
    yLabel.textContent = 'Number of users';
    g.appendChild(yLabel);
} 