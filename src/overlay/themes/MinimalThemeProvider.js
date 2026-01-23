// src/overlay/themes/MinimalThemeProvider.js

class MinimalThemeProvider extends window.ThemeProvider {
  constructor(config = {}) {
    super(config);
    this.baseHue = Math.random() * 360;
    this.targetX = 0;
    this.targetY = 0;
    this.angle = Math.random() * Math.PI * 2;
  }

  getColor(hue, time) {
    // Monochromatic - slow shift within narrow range
    const shift = Math.sin(time / 30000) * 10; // ±10° over 30s
    const h = (this.baseHue + shift) % 360;
    return `hsl(${h}, 30%, 60%)`;
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue } = state;
    const speed = 1.5; // Slow drift

    // Smooth drift - gradual angle changes
    this.angle += (Math.random() - 0.5) * 0.02;

    let newVx = Math.cos(this.angle) * speed;
    let newVy = Math.sin(this.angle) * speed;

    let newX = x + newVx;
    let newY = y + newVy;
    let newHue = hue;

    // Soft edge avoidance - curve away from edges
    const margin = radius * 2;

    if (newX < margin) {
      this.angle = this.angle * 0.9; // Curve right
      newX = margin;
      newHue = (hue + 5) % 360;
    } else if (newX > bounds.width - margin) {
      this.angle = Math.PI - this.angle * 0.9; // Curve left
      newX = bounds.width - margin;
      newHue = (hue + 5) % 360;
    }

    if (newY < margin) {
      this.angle = -this.angle * 0.9; // Curve down
      newY = margin;
      newHue = (hue + 5) % 360;
    } else if (newY > bounds.height - margin) {
      this.angle = -this.angle * 0.9; // Curve up
      newY = bounds.height - margin;
      newHue = (hue + 5) % 360;
    }

    return { x: newX, y: newY, vx: newVx, vy: newVy, hue: newHue };
  }

  draw(ctx, state, time, content) {
    const { x, y, radius, hue, opacity } = state;
    const color = this.getColor(hue, time);

    // Outer glow
    const glowRadius = radius * 1.3;
    const glow = ctx.createRadialGradient(x, y, radius * 0.8, x, y, glowRadius);
    glow.addColorStop(0, this.addOpacity(color, opacity * 0.3));
    glow.addColorStop(1, 'transparent');

    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Main circle - clean, simple
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.addOpacity(color, opacity);
    ctx.fill();

    // Subtle inner shadow for depth
    const innerShadow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius);
    innerShadow.addColorStop(0, 'transparent');
    innerShadow.addColorStop(1, `rgba(0, 0, 0, ${opacity * 0.15})`);
    ctx.fillStyle = innerShadow;
    ctx.fill();

    // Draw content if provided
    this.drawContent(ctx, state, content);
  }

  addOpacity(hslColor, opacity) {
    // Convert hsl() to hsla()
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
  }

  static get themeName() { return 'Minimal'; }
  static get themeId() { return 'minimal'; }
}

if (typeof window !== 'undefined') {
  window.MinimalThemeProvider = MinimalThemeProvider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MinimalThemeProvider;
}
