# SVG Usage Examples

This project now includes SVG support with a dedicated SVG loader utility. Here's how to use SVG files in your project:

## 📁 SVG Files Available

- `svg/xp-icon.svg` - XP/Experience icon
- `svg/user-profile.svg` - User profile icon  
- `svg/chart-icon.svg` - Chart/analytics icon
- `svg/level-badge.svg` - Level badge icon

## 🚀 How to Use SVG Files

### 1. Basic Usage - Insert SVG into an element

```javascript
// Load SVG into an element by ID
await window.app.svgLoader.insertSVG('myElementId', 'xp-icon.svg');

// With custom options
await window.app.svgLoader.insertSVG('myElementId', 'user-profile.svg', {
    width: '32',
    height: '32',
    class: 'svg-primary'
});
```

### 2. Create SVG Element Programmatically

```javascript
// Create SVG element with custom attributes
const svgElement = await window.app.svgLoader.createSVGElement('level-badge.svg', {
    width: '48',
    height: '48',
    class: 'svg-animated',
    color: '#667eea'
});

// Append to any element
document.getElementById('container').appendChild(svgElement);
```

### 3. Load SVG Content Directly

```javascript
// Get SVG content as string
const svgContent = await window.app.svgLoader.loadSVG('chart-icon.svg');
console.log(svgContent);
```

## 🎨 CSS Classes for Styling

The project includes CSS classes for styling SVGs:

- `.svg-primary` - Primary color
- `.svg-secondary` - Secondary color  
- `.svg-success` - Success color
- `.svg-warning` - Warning color
- `.svg-error` - Error color
- `.svg-animated` - Pulsing animation

## 📝 Example: Adding SVG to XP Display

```javascript
// In your UI display function
async displayXPInfo(transactions, totalXP) {
    const xpInfoElement = document.getElementById('xpInfo');
    
    // Add XP icon
    await window.app.svgLoader.insertSVG('xpIcon', 'xp-icon.svg', {
        class: 'svg-success',
        width: '24',
        height: '24'
    });
    
    const xpInfo = `
        <div class="info-item">
            <div id="xpIcon" class="xp-icon"></div>
            <span class="info-label">Total KB</span>
            <span class="info-value">${this.dataFormatters.formatXP(totalXP)}</span>
        </div>
    `;
    
    xpInfoElement.innerHTML = xpInfo;
}
```

## 🔧 Adding New SVG Files

1. Add your SVG file to the `svg/` directory
2. Update the `getAvailableSVGs()` method in `js/svg-loader.js`
3. Use the file in your code

## ⚡ Performance Features

- **Caching**: SVGs are cached after first load
- **Preloading**: All SVGs are preloaded on app start
- **Error Handling**: Graceful fallback if SVG fails to load

## 🎯 Best Practices

1. Use semantic filenames (e.g., `user-profile.svg`, `xp-icon.svg`)
2. Keep SVGs optimized and small
3. Use CSS classes for styling instead of inline attributes
4. Test SVG loading in different network conditions 