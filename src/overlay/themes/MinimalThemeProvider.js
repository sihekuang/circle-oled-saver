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
    // Use the actual hue (which shifts over time) for burn-in prevention
    // Add subtle oscillation for extra variation while keeping minimal aesthetic
    const shift = Math.sin(time / 10000) * 5; // ±5° gentle oscillation
    const h = (hue + shift + 360) % 360;
    return `hsl(${h}, 30%, 60%)`;
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue, speedMultiplier = 1 } = state;
    const baseSpeed = 3;
    const speed = baseSpeed * speedMultiplier;

    // Smooth drift - gradual angle changes
    this.angle += (Math.random() - 0.5) * 0.02;

    let newVx = Math.cos(this.angle) * speed;
    let newVy = Math.sin(this.angle) * speed;

    let newX = x + newVx;
    let newY = y + newVy;

    // Continuous slow hue shift for burn-in prevention
    let newHue = (hue + 0.1) % 360;

    // Bounce when center hits edge (circle goes partially off-screen)
    const margin = 0;

    if (newX < margin) {
      this.angle = Math.PI - this.angle; // Reflect horizontally
      this.angle += (Math.random() - 0.5) * 0.5; // Add slight randomness
      newX = margin;
      newHue = (hue + 20) % 360;
    } else if (newX > bounds.width - margin) {
      this.angle = Math.PI - this.angle;
      this.angle += (Math.random() - 0.5) * 0.5;
      newX = bounds.width - margin;
      newHue = (hue + 20) % 360;
    }

    if (newY < margin) {
      this.angle = -this.angle; // Reflect vertically
      this.angle += (Math.random() - 0.5) * 0.5;
      newY = margin;
      newHue = (hue + 20) % 360;
    } else if (newY > bounds.height - margin) {
      this.angle = -this.angle;
      this.angle += (Math.random() - 0.5) * 0.5;
      newY = bounds.height - margin;
      newHue = (hue + 20) % 360;
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
