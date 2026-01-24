// src/overlay/IconRegistry.js

// Icon path data (will be inlined from icons.json at build, or loaded)
// For browser use, we'll inline the JSON or load it
class IconRegistry {
  constructor() {
    this.icons = {};
    this.pathCache = new Map();
  }

  /**
   * Load icons from the icons.json data
   * @param {Object} iconData - Object mapping icon names to path strings
   */
  loadIcons(iconData) {
    this.icons = iconData;
    this.pathCache.clear();
  }

  /**
   * Check if an icon exists
   * @param {string} iconName - Name of the icon
   * @returns {boolean}
   */
  hasIcon(iconName) {
    return iconName in this.icons;
  }

  /**
   * Draw an icon on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} iconName - Name of the icon to draw
   * @param {number} x - X position (center of icon)
   * @param {number} y - Y position (center of icon)
   * @param {number} size - Size to draw the icon (width/height)
   * @param {string} color - Stroke color
   * @returns {boolean} - True if icon was drawn, false if not found
   */
  draw(ctx, iconName, x, y, size, color) {
    const pathData = this.icons[iconName];
    if (!pathData) {
      console.warn(`IconRegistry: Icon "${iconName}" not found`);
      return false;
    }

    // Get or create cached Path2D
    let path = this.pathCache.get(iconName);
    if (!path) {
      path = new Path2D(pathData);
      this.pathCache.set(iconName, path);
    }

    const scale = size / 24; // Lucide icons use 24x24 viewBox

    ctx.save();

    // Position at x, y (icon will be drawn centered around origin after translate)
    // Lucide icons are drawn in 0-24 range, so offset by -12 to center
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 icon

    // Lucide icons are stroke-based
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    ctx.restore();
    return true;
  }
}

// Create singleton instance
const iconRegistry = new IconRegistry();

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.IconRegistry = IconRegistry;
  window.iconRegistry = iconRegistry;
}

// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IconRegistry, iconRegistry };
}
