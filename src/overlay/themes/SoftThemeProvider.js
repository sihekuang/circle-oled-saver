// src/overlay/themes/SoftThemeProvider.js

class SoftThemeProvider extends window.ThemeProvider {
  constructor(config = {}) {
    super(config);
    this.colorIndex = 0;
    this.colorTransition = 0;
    // Pastel palette
    this.palette = [
      { h: 270, s: 40, l: 75 }, // Lavender
      { h: 15, s: 45, l: 80 },  // Soft coral
      { h: 150, s: 35, l: 75 }, // Mint
      { h: 45, s: 40, l: 80 },  // Pale gold
      { h: 200, s: 40, l: 78 }, // Sky blue
    ];
    // Blob morph points (angles for bezier control)
    this.morphPhase = Math.random() * Math.PI * 2;
    this.squish = 1;
    this.squishTarget = 1;
  }

  getColor(hue, time) {
    // Smooth transition between pastel colors
    this.colorTransition += 0.0002; // ~5s per color
    if (this.colorTransition >= 1) {
      this.colorTransition = 0;
      this.colorIndex = (this.colorIndex + 1) % this.palette.length;
    }

    const current = this.palette[this.colorIndex];
    const next = this.palette[(this.colorIndex + 1) % this.palette.length];

    const t = this.colorTransition;
    const h = current.h + (next.h - current.h) * t;
    const s = current.s + (next.s - current.s) * t;
    const l = current.l + (next.l - current.l) * t;

    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue, speedMultiplier = 1 } = state;
    const baseSpeed = 3;
    const speed = baseSpeed * speedMultiplier;

    // Elastic ease motion
    let newVx = vx;
    let newVy = vy;

    // Add slight momentum variation
    newVx += (Math.random() - 0.5) * 0.1;
    newVy += (Math.random() - 0.5) * 0.1;

    // Limit speed
    const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
    if (currentSpeed > speed) {
      newVx = (newVx / currentSpeed) * speed;
      newVy = (newVy / currentSpeed) * speed;
    }
    if (currentSpeed < speed * 0.5) {
      newVx = (newVx / currentSpeed) * speed * 0.5;
      newVy = (newVy / currentSpeed) * speed * 0.5;
    }

    let newX = x + newVx;
    let newY = y + newVy;
    let newHue = hue;

    // Bounce from center point (circle goes partially off-screen)
    const margin = 0;

    if (newX < margin || newX > bounds.width - margin) {
      newVx = -newVx; // Full energy preservation
      newVy += (Math.random() - 0.5) * 0.5; // Slight angle variation
      this.squishTarget = 0.7; // Trigger squish
      newX = Math.max(margin, Math.min(bounds.width - margin, newX));
      newHue = (hue + 20) % 360;
    }

    if (newY < margin || newY > bounds.height - margin) {
      newVy = -newVy;
      newVx += (Math.random() - 0.5) * 0.5;
      this.squishTarget = 0.7;
      newY = Math.max(margin, Math.min(bounds.height - margin, newY));
      newHue = (hue + 20) % 360;
    }

    // Recover from squish
    this.squish += (this.squishTarget - this.squish) * 0.1;
    this.squishTarget += (1 - this.squishTarget) * 0.05;

    return { x: newX, y: newY, vx: newVx, vy: newVy, hue: newHue };
  }

  draw(ctx, state, time, content) {
    const { x, y, radius, hue, opacity } = state;
    const color = this.getColor(hue, time);

    // Update morph phase
    this.morphPhase += 0.02;

    ctx.save();

    // Draw blob shape
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      // Morph the radius slightly
      const morphAmount = Math.sin(this.morphPhase + angle * 2) * 0.08;
      const squishX = i % 2 === 0 ? this.squish : 1;
      const squishY = i % 2 === 0 ? 1 : this.squish;
      const r = radius * (1 + morphAmount) * ((squishX + squishY) / 2);

      const px = x + Math.cos(angle) * r * squishX;
      const py = y + Math.sin(angle) * r * squishY;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        // Smooth bezier curves between points
        const prevAngle = ((i - 1) / points) * Math.PI * 2;
        const cpRadius = r * 0.55;
        const cp1x = x + Math.cos(prevAngle + Math.PI / points) * cpRadius;
        const cp1y = y + Math.sin(prevAngle + Math.PI / points) * cpRadius;
        const cp2x = x + Math.cos(angle - Math.PI / points) * cpRadius;
        const cp2y = y + Math.sin(angle - Math.PI / points) * cpRadius;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, px, py);
      }
    }
    ctx.closePath();

    // Soft gradient fill
    const gradient = ctx.createRadialGradient(
      x - radius * 0.2, y - radius * 0.2, 0,
      x, y, radius * 1.1
    );
    gradient.addColorStop(0, this.addOpacity(color, opacity));
    gradient.addColorStop(0.7, this.addOpacity(color, opacity * 0.9));
    gradient.addColorStop(1, this.addOpacity(color, opacity * 0.4));

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();

    // Draw content
    this.drawContent(ctx, state, content);
  }

  addOpacity(hslColor, opacity) {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${opacity})`);
  }

  static get themeName() { return 'Soft'; }
  static get themeId() { return 'soft'; }
}

if (typeof window !== 'undefined') {
  window.SoftThemeProvider = SoftThemeProvider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoftThemeProvider;
}
