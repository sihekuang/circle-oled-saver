// src/overlay/themes/GlassyThemeProvider.js

class GlassyThemeProvider extends window.ThemeProvider {
  constructor(config = {}) {
    super(config);
    this.hueShift = 0;
    this.velocity = { x: 1, y: 0.8 };
    this.inertia = 0.98;
  }

  getColor(hue, time) {
    // Use actual hue (changes on bounces) for full spectrum coverage
    // Add slow continuous shift for burn-in prevention
    const continuousShift = (time / 50) % 360; // Slow continuous rotation
    const h = (hue + continuousShift * 0.1) % 360;
    return `hsl(${h}, 25%, 50%)`; // Slightly more saturation for visibility
  }

  getOpacityMultiplier(time) {
    // Pulse opacity between 0.3 and 1.0 (full opaque) for burn-in prevention
    return 0.65 + Math.sin(time / 4000) * 0.35;
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue, speedMultiplier = 1 } = state;
    const baseSpeed = 3;

    // Apply inertia - feels weighted
    let newVx = vx * this.inertia;
    let newVy = vy * this.inertia;

    // Maintain minimum speed (uniform with other themes)
    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    const minSpeed = baseSpeed * 0.5 * speedMultiplier;
    const maxSpeed = baseSpeed * 1.5 * speedMultiplier;

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
    // Continuous slow hue shift for burn-in prevention
    let newHue = (hue + 0.15) % 360;

    // Bounce from center point (circle goes partially off-screen)
    const margin = 0;

    if (newX < margin) {
      newVx = Math.abs(newVx); // Bounce right
      newVy += (Math.random() - 0.5) * 0.3; // Slight angle variation
      newX = margin;
      newHue = (hue + 15) % 360;
    } else if (newX > bounds.width - margin) {
      newVx = -Math.abs(newVx); // Bounce left
      newVy += (Math.random() - 0.5) * 0.3;
      newX = bounds.width - margin;
      newHue = (hue + 15) % 360;
    }

    if (newY < margin) {
      newVy = Math.abs(newVy); // Bounce down
      newVx += (Math.random() - 0.5) * 0.3;
      newY = margin;
      newHue = (hue + 15) % 360;
    } else if (newY > bounds.height - margin) {
      newVy = -Math.abs(newVy); // Bounce up
      newVx += (Math.random() - 0.5) * 0.3;
      newY = bounds.height - margin;
      newHue = (hue + 15) % 360;
    }

    return { x: newX, y: newY, vx: newVx, vy: newVy, hue: newHue };
  }

  draw(ctx, state, time, content) {
    const { x, y, radius, hue, opacity: baseOpacity } = state;
    const opacity = baseOpacity * this.getOpacityMultiplier(time);
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

    // Frosted glass gradient - can reach full opacity
    const glassGradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    glassGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`);
    glassGradient.addColorStop(0.5, this.addOpacity(baseColor, opacity));
    glassGradient.addColorStop(1, this.addOpacity(baseColor, opacity * 0.85));

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
