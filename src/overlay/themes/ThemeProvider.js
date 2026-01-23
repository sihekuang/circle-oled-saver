// src/overlay/themes/ThemeProvider.js

class ThemeProvider {
  constructor(config = {}) {
    this.config = config;
    this.time = 0;
  }

  /**
   * Get current color
   * @param {number} hue - Base hue (0-360)
   * @param {number} time - Animation time in ms
   * @returns {string} CSS color string
   */
  getColor(hue, time) {
    throw new Error('getColor() must be implemented by subclass');
  }

  /**
   * Update motion and return new state
   * @param {Object} state - {x, y, vx, vy, radius, hue}
   * @param {Object} bounds - {width, height}
   * @returns {Object} - {x, y, vx, vy, hue}
   */
  updateMotion(state, bounds) {
    throw new Error('updateMotion() must be implemented by subclass');
  }

  /**
   * Draw the shape
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} state - {x, y, radius, hue, opacity}
   * @param {number} time - Animation time in ms
   * @param {Object|null} content - Content from ContentRotator
   */
  draw(ctx, state, time, content) {
    throw new Error('draw() must be implemented by subclass');
  }

  /**
   * Update internal time
   * @param {number} deltaTime - ms since last frame
   */
  tick(deltaTime) {
    this.time += deltaTime;
  }

  /**
   * Draw content (icon + text) - shared by all themes
   */
  drawContent(ctx, state, content) {
    if (!content) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { x, y, radius, opacity } = state;

    // Icon
    const iconSize = radius * 0.25;
    ctx.font = `${iconSize}px Arial`;
    const iconY = y - radius * 0.3;

    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.lineWidth = Math.max(2, iconSize * 0.1);
    ctx.strokeText(content.icon, x, iconY);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(content.icon, x, iconY);

    // Text
    const textSize = radius * 0.15;
    ctx.font = `bold ${textSize}px Arial`;

    const lines = content.text.split('\n');
    const lineHeight = textSize * 1.2;
    const textStartY = y + radius * 0.1;

    lines.forEach((line, index) => {
      const lineY = textStartY + (index * lineHeight);
      ctx.lineWidth = Math.max(2, textSize * 0.1);
      ctx.strokeText(line, x, lineY);
      ctx.fillText(line, x, lineY);
    });

    ctx.restore();
  }

  // Static metadata
  static get themeName() { return 'Base'; }
  static get themeId() { return 'base'; }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ThemeProvider = ThemeProvider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeProvider;
}
