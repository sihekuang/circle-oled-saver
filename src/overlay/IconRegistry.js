// src/overlay/IconRegistry.js
// Loads PNG icons and draws them with optional color tinting

class IconRegistry {
  constructor() {
    this.images = new Map();      // iconName -> Image
    this.loadingPromises = new Map(); // iconName -> Promise
    this.tintCache = new Map();   // `${iconName}-${color}` -> canvas
  }

  /**
   * Preload an icon image
   * @param {string} iconName - Name of the icon (without extension)
   * @returns {Promise<Image>}
   */
  loadIcon(iconName) {
    // Return cached image if already loaded
    if (this.images.has(iconName)) {
      return Promise.resolve(this.images.get(iconName));
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(iconName)) {
      return this.loadingPromises.get(iconName);
    }

    // Start loading
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(iconName, img);
        this.loadingPromises.delete(iconName);
        resolve(img);
      };
      img.onerror = (err) => {
        this.loadingPromises.delete(iconName);
        console.error(`IconRegistry: Failed to load icon "${iconName}"`);
        reject(err);
      };
      img.src = `icons/${iconName}.png`;
    });

    this.loadingPromises.set(iconName, promise);
    return promise;
  }

  /**
   * Preload multiple icons
   * @param {string[]} iconNames - Array of icon names to preload
   * @returns {Promise<void>}
   */
  async preloadIcons(iconNames) {
    await Promise.all(iconNames.map(name => this.loadIcon(name)));
  }

  /**
   * Check if an icon is loaded and ready
   * @param {string} iconName - Name of the icon
   * @returns {boolean}
   */
  hasIcon(iconName) {
    return this.images.has(iconName);
  }

  /**
   * Get a tinted version of an icon (cached)
   * @param {Image} img - Source image
   * @param {string} iconName - Icon name for cache key
   * @param {string} color - CSS color string
   * @returns {HTMLCanvasElement}
   */
  getTintedIcon(img, iconName, color) {
    const cacheKey = `${iconName}-${color}`;

    if (this.tintCache.has(cacheKey)) {
      return this.tintCache.get(cacheKey);
    }

    // Create offscreen canvas for tinting
    const offscreen = document.createElement('canvas');
    offscreen.width = img.width;
    offscreen.height = img.height;
    const offCtx = offscreen.getContext('2d');

    // Draw the white icon
    offCtx.drawImage(img, 0, 0);

    // Apply tint: source-in composites the fill color only where pixels exist
    offCtx.globalCompositeOperation = 'source-in';
    offCtx.fillStyle = color;
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Cache the tinted canvas
    this.tintCache.set(cacheKey, offscreen);
    return offscreen;
  }

  /**
   * Clear the tint cache (call when theme changes)
   */
  clearTintCache() {
    this.tintCache.clear();
  }

  /**
   * Draw an icon on the canvas with optional color tinting
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} iconName - Name of the icon to draw
   * @param {number} x - X position (center of icon)
   * @param {number} y - Y position (center of icon)
   * @param {number} size - Size to draw the icon (width/height)
   * @param {string} color - Color to tint the icon (CSS color string)
   * @returns {boolean} - True if icon was drawn, false if not loaded
   */
  draw(ctx, iconName, x, y, size, color) {
    const img = this.images.get(iconName);
    if (!img) {
      // Try to load it for next time
      this.loadIcon(iconName);
      return false;
    }

    // Get tinted version
    const tinted = this.getTintedIcon(img, iconName, color);

    // Draw centered at x, y
    const halfSize = size / 2;
    ctx.drawImage(tinted, x - halfSize, y - halfSize, size, size);
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
