// src/overlay/themes/AbstractThemeProvider.js

class AbstractThemeProvider extends window.ThemeProvider {
  constructor(config = {}) {
    super(config);
    // Orbiting particles
    this.particles = [];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        angle: (i / 8) * Math.PI * 2,
        distance: 0.6 + Math.random() * 0.3,
        speed: 0.02 + Math.random() * 0.01,
        size: 0.1 + Math.random() * 0.1,
        hueOffset: i * 45
      });
    }
    this.gravity = 0.05;
    this.baseHue = Math.random() * 360;
  }

  getColor(hue, time) {
    // Vibrant with color harmony (triadic)
    this.baseHue = (this.baseHue + 0.02) % 360;
    return `hsl(${this.baseHue}, 70%, 55%)`;
  }

  updateMotion(state, bounds) {
    const { x, y, vx, vy, radius, hue } = state;

    // Very subtle gravity for slight arc effect, but not enough to settle
    let newVx = vx;
    let newVy = vy + this.gravity * 0.3;

    // Ensure minimum speed so it keeps moving around the screen
    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    const minSpeed = 2;
    const maxSpeed = 4;

    if (speed < minSpeed) {
      // Re-energize if too slow
      const factor = minSpeed / speed;
      newVx *= factor;
      newVy *= factor;
    } else if (speed > maxSpeed) {
      const factor = maxSpeed / speed;
      newVx *= factor;
      newVy *= factor;
    }

    let newX = x + newVx;
    let newY = y + newVy;
    let newHue = hue;

    // Bounce from center point (circle goes partially off-screen)
    const margin = 0;

    if (newX < margin || newX > bounds.width - margin) {
      newVx = -newVx;
      // Add angle variation to prevent repetitive patterns
      newVy += (Math.random() - 0.5) * 1.5;
      newX = Math.max(margin, Math.min(bounds.width - margin, newX));
      newHue = (hue + 30) % 360;
      this.triggerBurst();
    }

    if (newY < margin || newY > bounds.height - margin) {
      newVy = -newVy;
      // Add angle variation
      newVx += (Math.random() - 0.5) * 1.5;
      newY = Math.max(margin, Math.min(bounds.height - margin, newY));
      newHue = (hue + 30) % 360;
      this.triggerBurst();
    }

    return { x: newX, y: newY, vx: newVx, vy: newVy, hue: newHue };
  }

  triggerBurst() {
    // Temporarily increase particle speed
    this.particles.forEach(p => {
      p.speed = 0.08;
    });
    setTimeout(() => {
      this.particles.forEach(p => {
        p.speed = 0.02 + Math.random() * 0.01;
      });
    }, 300);
  }

  draw(ctx, state, time, content) {
    const { x, y, radius, hue, opacity } = state;

    ctx.save();

    // Update and draw orbiting particles
    this.particles.forEach((p, i) => {
      p.angle += p.speed;

      const px = x + Math.cos(p.angle) * radius * p.distance;
      const py = y + Math.sin(p.angle) * radius * p.distance;
      const pRadius = radius * p.size;

      // Triadic color harmony
      const particleHue = (this.baseHue + p.hueOffset) % 360;

      // Particle glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, pRadius * 2);
      glow.addColorStop(0, `hsla(${particleHue}, 80%, 60%, ${opacity * 0.6})`);
      glow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(px, py, pRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Particle core
      ctx.beginPath();
      ctx.arc(px, py, pRadius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${particleHue}, 80%, 70%, ${opacity})`;
      ctx.fill();
    });

    // Main center shape - layered circles
    const layers = 3;
    for (let i = layers - 1; i >= 0; i--) {
      const layerRadius = radius * (0.5 + i * 0.2);
      const layerHue = (this.baseHue + i * 120) % 360; // Triadic

      ctx.beginPath();
      ctx.arc(x, y, layerRadius, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(
        x - layerRadius * 0.2, y - layerRadius * 0.2, 0,
        x, y, layerRadius
      );
      gradient.addColorStop(0, `hsla(${layerHue}, 70%, 65%, ${opacity * 0.8})`);
      gradient.addColorStop(1, `hsla(${layerHue}, 70%, 45%, ${opacity * 0.6})`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Central bright core
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.fill();

    ctx.restore();

    // Draw content
    this.drawContent(ctx, state, content);
  }

  static get themeName() { return 'Abstract'; }
  static get themeId() { return 'abstract'; }
}

if (typeof window !== 'undefined') {
  window.AbstractThemeProvider = AbstractThemeProvider;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AbstractThemeProvider;
}
