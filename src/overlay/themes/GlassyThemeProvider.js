// src/overlay/themes/GlassyThemeProvider.js

class GlassyThemeProvider extends window.ThemeProvider {
  constructor(config = {}) {
    super(config);
    this.hueShift = 0;
    this.velocity = { x: 1, y: 0.8 };
    this.inertia = 0.98;
  }

  getColor(hue, time) {
    // Muted, sophisticated tones - slow shift
    this.hueShift = (time / 25000) % 360; // Full cycle over 25s
    const h = (200 + this.hueShift * 0.3) % 360; // Stay in blue-gray range
    return `hsl(${h}, 15%, 45%)`; // Low saturation, medium lightness
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue } = state;

    // Apply inertia - feels weighted
    let newVx = vx * this.inertia;
    let newVy = vy * this.inertia;

    // Maintain minimum speed
    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    const minSpeed = 0.8;
    const maxSpeed = 2;

    if (speed < minSpeed) {
      const factor = minSpeed / speed;
      newVx *= factor;
      newVy *= factor;
    } else if (speed > maxSpeed) {
      const factor = maxSpeed / speed;
      newVx *= factor;
      newVy *= factor;
    }

    // Add tiny random drift
    newVx += (Math.random() - 0.5) * 0.02;
    newVy += (Math.random() - 0.5) * 0.02;

    let newX = x + newVx;
    let newY = y + newVy;
    let newHue = hue;

    // Soft edge behavior - decelerate, pause, drift away
    const margin = radius * 1.5;

    if (newX < margin) {
      newVx = Math.abs(newVx) * 0.5; // Gentle push back
      newX = margin;
      newHue = (hue + 10) % 360;
    } else if (newX > bounds.width - margin) {
      newVx = -Math.abs(newVx) * 0.5;
      newX = bounds.width - margin;
      newHue = (hue + 10) % 360;
    }

    if (newY < margin) {
      newVy = Math.abs(newVy) * 0.5;
      newY = margin;
      newHue = (hue + 10) % 360;
    } else if (newY > bounds.height - margin) {
      newVy = -Math.abs(newVy) * 0.5;
      newY = bounds.height - margin;
      newHue = (hue + 10) % 360;
    }

    return { x: newX, y: newY, vx: newVx, vy: newVy, hue: newHue };
  }

  draw(ctx, state, time, content) {
    const { x, y, radius, hue, opacity } = state;
    const baseColor = this.getColor(hue, time);

    ctx.save();

    // Outer soft shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = radius * 0.3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = radius * 0.1;

    // Main glass circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    // Frosted glass gradient
    const glassGradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    glassGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.25})`);
    glassGradient.addColorStop(0.5, this.addOpacity(baseColor, opacity * 0.6));
    glassGradient.addColorStop(1, this.addOpacity(baseColor, opacity * 0.4));

    ctx.fillStyle = glassGradient;
    ctx.fill();

    // Reset shadow for other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Glass highlight arc (top)
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.92, -Math.PI * 0.8, -Math.PI * 0.2);
    const highlightGradient = ctx.createLinearGradient(
      x - radius, y - radius,
      x + radius * 0.3, y - radius * 0.3
    );
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.4})`);
    highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    ctx.strokeStyle = highlightGradient;
    ctx.lineWidth = radius * 0.08;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Subtle border with prismatic shimmer
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    const shimmerHue = (time / 100) % 360;
    const borderGradient = ctx.createLinearGradient(
      x - radius, y, x + radius, y
    );
    borderGradient.addColorStop(0, `hsla(${shimmerHue}, 30%, 70%, ${opacity * 0.3})`);
    borderGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.5})`);
    borderGradient.addColorStop(1, `hsla(${(shimmerHue + 60) % 360}, 30%, 70%, ${opacity * 0.3})`);
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner shadow for depth
    const innerShadow = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius);
    innerShadow.addColorStop(0, 'transparent');
    innerShadow.addColorStop(1, `rgba(0, 0, 0, ${opacity * 0.1})`);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = innerShadow;
    ctx.fill();

    ctx.restore();

    // Draw content
    this.drawContent(ctx, state, content);
  }

  addOpacity(hslColor, opacity) {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
  }

  static get themeName() { return 'Glassy'; }
  static get themeId() { return 'glassy'; }
}

if (typeof window !== 'undefined') {
  window.GlassyThemeProvider = GlassyThemeProvider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlassyThemeProvider;
}
