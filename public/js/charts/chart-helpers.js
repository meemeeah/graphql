// Chart helper functions
function addChartTitle(svg, title) {
    const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleElement.setAttribute('x', (svg.clientWidth || 500) / 2);
    titleElement.setAttribute('y', 15);
    titleElement.setAttribute('text-anchor', 'middle');
    titleElement.setAttribute('font-size', '16');
    titleElement.setAttribute('font-weight', 'bold');
    titleElement.textContent = title;
    svg.appendChild(titleElement);
}

function createNoDataMessage(svg, message) {
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