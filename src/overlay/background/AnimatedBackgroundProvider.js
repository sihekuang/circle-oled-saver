// src/overlay/background/AnimatedBackgroundProvider.js

class AnimatedBackgroundProvider extends window.BackgroundProvider {
  constructor(config = {}) {
    super(config);
  }

  /**
   * Get animated background color based on current hue
   * Hue changes on every bounce to prevent OLED burn-in
   * Uses RGB with bright, saturated colors
   */
  getColor(hue) {
    // Convert hue (0-360) to RGB with maximum saturation and brightness
    const h = hue % 360;
    const s = 1.0; // Full saturation
    const l = 0.5; // Medium lightness for vibrant colors

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    // Convert to RGB 0-255 range
    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    return `rgb(${red}, ${green}, ${blue})`;
  }
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.AnimatedBackgroundProvider = AnimatedBackgroundProvider;
}
// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimatedBackgroundProvider;
}
