/**
 * SVG Loader Utility
 * Handles loading and displaying SVG files in the project
 */

class SVGLoader {
    constructor() {
        this.svgCache = new Map();
    }

    // Load SVG file and cache it
    async loadSVG(filename) {
        if (this.svgCache.has(filename)) {
            return this.svgCache.get(filename);
        }

        try {
            const response = await fetch(`svg/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load SVG: ${response.statusText}`);
            }
            
            const svgContent = await response.text();
            this.svgCache.set(filename, svgContent);
            return svgContent;
        } catch (error) {
            console.error(`Error loading SVG ${filename}:`, error);
            return null;
        }
    }

    // Insert SVG into an element
    async insertSVG(elementId, filename, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id '${elementId}' not found`);
            return false;
        }

        const svgContent = await this.loadSVG(filename);
        if (!svgContent) {
            return false;
        }

        // Apply custom options
        let modifiedSvg = svgContent;
        if (options.width) {
            modifiedSvg = modifiedSvg.replace(/width="[^"]*"/, `width="${options.width}"`);
        }
        if (options.height) {
            modifiedSvg = modifiedSvg.replace(/height="[^"]*"/, `height="${options.height}"`);
        }
        if (options.class) {
            modifiedSvg = modifiedSvg.replace(/<svg/, `<svg class="${options.class}"`);
        }

        element.innerHTML = modifiedSvg;
        return true;
    }

    // Create SVG element with custom attributes
    async createSVGElement(filename, options = {}) {
        const svgContent = await this.loadSVG(filename);
        if (!svgContent) {
            return null;
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgContent;
        const svgElement = tempDiv.firstElementChild;

        // Apply custom attributes
        if (options.class) {
            svgElement.classList.add(options.class);
        }
        if (options.width) {
            svgElement.setAttribute('width', options.width);
        }
        if (options.height) {
            svgElement.setAttribute('height', options.height);
        }
        if (options.color) {
            svgElement.style.color = options.color;
        }

        return svgElement;
    }

    // Get all available SVG files
    getAvailableSVGs() {
        return [
            'xp-icon.svg',
            'user-profile.svg', 
            'chart-icon.svg',
            'level-badge.svg'
        ];
    }

    // Preload all SVGs
    async preloadAll() {
        const svgFiles = this.getAvailableSVGs();
        const promises = svgFiles.map(filename => this.loadSVG(filename));
        
        try {
            await Promise.all(promises);
            console.log('✅ All SVGs preloaded successfully');
        } catch (error) {
            console.error('❌ Error preloading SVGs:', error);
        }
    }
}

// Export for use in other modules
window.SVGLoader = SVGLoader; 