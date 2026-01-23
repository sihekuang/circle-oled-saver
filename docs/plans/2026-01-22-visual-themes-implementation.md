# Visual Themes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add four selectable visual themes (Minimal, Soft, Glassy, Abstract) to replace the current bouncing circle, each with unique visuals, motion, and color behavior.

**Architecture:** Create a ThemeProvider base class following the existing Provider pattern. Each theme extends ThemeProvider and controls its own draw(), updateMotion(), and getColor() methods. The BouncingBall class delegates to the active theme.

**Tech Stack:** Canvas 2D API, electron-store for settings persistence, existing Provider pattern.

---

## Task 1: Add Theme Setting to Config

**Files:**
- Modify: `src/main/config.js:1-67` (add theme to schema)

**Step 1: Add theme to schema**

In `src/main/config.js`, add the theme setting to the schema object after `ballSpeed`:

```javascript
theme: {
  type: 'string',
  enum: ['minimal', 'soft', 'glassy', 'abstract'],
  default: 'minimal'
}
```

**Step 2: Add getter/setter functions**

Add after `setBallSpeed` function:

```javascript
getTheme() {
  return store.get('theme');
},

setTheme(themeId) {
  store.set('theme', themeId);
}
```

**Step 3: Verify config loads**

Run: `npm start`
Expected: App launches without errors

**Step 4: Commit**

```bash
git add src/main/config.js
git commit -m "feat: add theme setting to config schema"
```

---

## Task 2: Expose Theme Setting via IPC

**Files:**
- Modify: `src/main/windowManager.js` (add IPC handlers)

**Step 1: Find existing IPC handlers in windowManager.js**

Look for `ipcMain.handle` calls and add theme handlers nearby.

**Step 2: Add theme IPC handlers**

```javascript
ipcMain.handle('get-theme', () => {
  return config.getTheme();
});

ipcMain.handle('save-theme', (event, themeId) => {
  config.setTheme(themeId);
});
```

**Step 3: Add theme to getSettings response**

Find the `get-settings` handler and add `theme: config.getTheme()` to the returned object.

**Step 4: Add theme to saveSettings handler**

Find the `save-settings` handler and add:
```javascript
if (settings.theme !== undefined) {
  config.setTheme(settings.theme);
}
```

**Step 5: Verify IPC works**

Run: `npm start`
Expected: App launches without errors

**Step 6: Commit**

```bash
git add src/main/windowManager.js
git commit -m "feat: expose theme setting via IPC"
```

---

## Task 3: Add Theme to Preload Script

**Files:**
- Modify: `src/preload.js` or equivalent preload file

**Step 1: Find the preload file**

Look for existing `contextBridge.exposeInMainWorld` calls.

**Step 2: Add theme methods to exposed API**

```javascript
getTheme: () => ipcRenderer.invoke('get-theme'),
saveTheme: (themeId) => ipcRenderer.invoke('save-theme', themeId)
```

**Step 3: Commit**

```bash
git add src/preload.js
git commit -m "feat: expose theme methods in preload"
```

---

## Task 4: Create ThemeProvider Base Class

**Files:**
- Create: `src/overlay/themes/ThemeProvider.js`

**Step 1: Create themes directory**

```bash
mkdir -p src/overlay/themes
```

**Step 2: Write ThemeProvider.js**

```javascript
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
```

**Step 3: Commit**

```bash
git add src/overlay/themes/ThemeProvider.js
git commit -m "feat: add ThemeProvider base class"
```

---

## Task 5: Create MinimalThemeProvider

**Files:**
- Create: `src/overlay/themes/MinimalThemeProvider.js`

**Step 1: Write MinimalThemeProvider.js**

```javascript
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
```

**Step 2: Commit**

```bash
git add src/overlay/themes/MinimalThemeProvider.js
git commit -m "feat: add MinimalThemeProvider with soft glow and smooth drift"
```

---

## Task 6: Create SoftThemeProvider

**Files:**
- Create: `src/overlay/themes/SoftThemeProvider.js`

**Step 1: Write SoftThemeProvider.js**

```javascript
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
    const { x, y, vx, vy, radius, hue } = state;
    const speed = 2;

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

    // Elastic bounce with squish
    const margin = radius;

    if (newX < margin || newX > bounds.width - margin) {
      newVx = -newVx * 0.9; // Elastic damping
      this.squishTarget = 0.7; // Trigger squish
      newX = Math.max(margin, Math.min(bounds.width - margin, newX));
      newHue = (hue + 20) % 360;
    }

    if (newY < margin || newY > bounds.height - margin) {
      newVy = -newVy * 0.9;
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
```

**Step 2: Commit**

```bash
git add src/overlay/themes/SoftThemeProvider.js
git commit -m "feat: add SoftThemeProvider with morphing blob and pastels"
```

---

## Task 7: Create GlassyThemeProvider

**Files:**
- Create: `src/overlay/themes/GlassyThemeProvider.js`

**Step 1: Write GlassyThemeProvider.js**

```javascript
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
```

**Step 2: Commit**

```bash
git add src/overlay/themes/GlassyThemeProvider.js
git commit -m "feat: add GlassyThemeProvider with frosted glass effect"
```

---

## Task 8: Create AbstractThemeProvider

**Files:**
- Create: `src/overlay/themes/AbstractThemeProvider.js`

**Step 1: Write AbstractThemeProvider.js**

```javascript
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

    // Gravity-aware parabolic arcs
    let newVx = vx;
    let newVy = vy + this.gravity; // Add gravity

    // Limit speed
    const maxSpeed = 4;
    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    if (speed > maxSpeed) {
      newVx = (newVx / speed) * maxSpeed;
      newVy = (newVy / speed) * maxSpeed;
    }

    let newX = x + newVx;
    let newY = y + newVy;
    let newHue = hue;

    // Bounce with energy preservation
    const margin = radius;

    if (newX < margin || newX > bounds.width - margin) {
      newVx = -newVx * 0.95;
      newX = Math.max(margin, Math.min(bounds.width - margin, newX));
      newHue = (hue + 30) % 360;
      // Trigger particle burst effect
      this.triggerBurst();
    }

    if (newY < margin || newY > bounds.height - margin) {
      newVy = -newVy * 0.9;
      // Add slight horizontal variance on ground bounce
      if (newY > bounds.height - margin) {
        newVx += (Math.random() - 0.5) * 2;
      }
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
```

**Step 2: Commit**

```bash
git add src/overlay/themes/AbstractThemeProvider.js
git commit -m "feat: add AbstractThemeProvider with orbiting particles and gravity"
```

---

## Task 9: Load Theme Scripts in Overlay HTML

**Files:**
- Modify: `src/overlay/overlay.html`

**Step 1: Add theme script tags**

Add after the background provider scripts and before `overlay.js`:

```html
<script src="themes/ThemeProvider.js"></script>
<script src="themes/MinimalThemeProvider.js"></script>
<script src="themes/SoftThemeProvider.js"></script>
<script src="themes/GlassyThemeProvider.js"></script>
<script src="themes/AbstractThemeProvider.js"></script>
```

**Step 2: Commit**

```bash
git add src/overlay/overlay.html
git commit -m "feat: load theme provider scripts in overlay"
```

---

## Task 10: Integrate Themes into BouncingBall

**Files:**
- Modify: `src/overlay/overlay.js`

**Step 1: Add theme initialization in init()**

After loading ball settings, add:

```javascript
// Initialize theme provider
const themeId = await window.oledSaver.getTheme();
const ThemeClass = {
  'minimal': window.MinimalThemeProvider,
  'soft': window.SoftThemeProvider,
  'glassy': window.GlassyThemeProvider,
  'abstract': window.AbstractThemeProvider
}[themeId] || window.MinimalThemeProvider;

window.themeProvider = new ThemeClass();
console.log('[Overlay] Theme provider initialized:', themeId);
```

**Step 2: Add lastFrameTime variable at top of file**

```javascript
let lastFrameTime = performance.now();
```

**Step 3: Modify the animate() function**

Replace the existing `animate()` function with:

```javascript
function animate() {
  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (window.themeProvider) {
    window.themeProvider.tick(deltaTime);
  }

  if (ball) {
    ball.update();
    ball.draw();
  }

  animationId = requestAnimationFrame(animate);
}
```

**Step 4: Modify BouncingBall.update() to delegate to theme**

Replace the `update()` method with:

```javascript
update() {
  if (window.themeProvider) {
    const result = window.themeProvider.updateMotion(
      {
        x: this.x,
        y: this.y,
        vx: this.speedX,
        vy: this.speedY,
        radius: this.radius,
        hue: this.hue
      },
      { width: canvas.width, height: canvas.height }
    );
    this.x = result.x;
    this.y = result.y;
    this.speedX = result.vx;
    this.speedY = result.vy;
    if (result.hue !== undefined) {
      this.hue = result.hue;
    }
  } else {
    this.legacyUpdate();
  }
}
```

**Step 5: Rename old update() to legacyUpdate()**

Rename the existing `update()` method to `legacyUpdate()` (keep all the old bounce logic as fallback).

**Step 6: Modify BouncingBall.draw() to delegate to theme**

Replace the `draw()` method with:

```javascript
draw() {
  const content = window.contentRotator ?
    window.contentRotator.getCurrentProvider()?.getData() :
    null;

  if (window.themeProvider) {
    window.themeProvider.draw(
      ctx,
      {
        x: this.x,
        y: this.y,
        radius: this.radius,
        hue: this.hue,
        opacity: ballOpacityPercentage / 100
      },
      performance.now(),
      content
    );
  } else {
    // Fallback to legacy drawing
    if (content) {
      this.drawWithContent(content);
    } else {
      this.drawGradient();
    }
  }
}
```

**Step 7: Verify themes work**

Run: `npm start`
Trigger the overlay and verify the Minimal theme renders.

**Step 8: Commit**

```bash
git add src/overlay/overlay.js
git commit -m "feat: integrate theme providers into BouncingBall"
```

---

## Task 11: Add Theme Selection UI to Settings

**Files:**
- Modify: `src/settings/settings.html`

**Step 1: Add theme section after Circle speed section**

Add this new setting-group after the ball-speed section in the general tab:

```html
<section class="setting-group">
  <label>Visual theme</label>
  <div class="theme-grid">
    <div class="theme-card" data-theme="minimal">
      <div class="theme-preview theme-preview-minimal"></div>
      <span>Minimal</span>
    </div>
    <div class="theme-card" data-theme="soft">
      <div class="theme-preview theme-preview-soft"></div>
      <span>Soft</span>
    </div>
    <div class="theme-card" data-theme="glassy">
      <div class="theme-preview theme-preview-glassy"></div>
      <span>Glassy</span>
    </div>
    <div class="theme-card" data-theme="abstract">
      <div class="theme-preview theme-preview-abstract"></div>
      <span>Abstract</span>
    </div>
  </div>
</section>
```

**Step 2: Commit**

```bash
git add src/settings/settings.html
git commit -m "feat: add theme selection cards to settings HTML"
```

---

## Task 12: Add Theme Card Styles

**Files:**
- Modify: `src/settings/settings.css`

**Step 1: Add theme card styles at end of file**

```css
/* Theme selection grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.theme-card {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.theme-card:hover {
  border-color: #666;
}

.theme-card.active {
  border-color: #4CAF50;
  background: #2d3a2d;
}

.theme-card span {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  color: #ccc;
}

.theme-preview {
  width: 100%;
  height: 60px;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

/* Minimal theme preview - clean circle with glow */
.theme-preview-minimal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
.theme-preview-minimal::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: radial-gradient(circle, #7c9cb8 0%, #5a7a9a 70%, transparent 100%);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(124, 156, 184, 0.5);
}

/* Soft theme preview - blob shape with pastel */
.theme-preview-soft {
  background: linear-gradient(135deg, #2d2d3a 0%, #3a2d3a 100%);
}
.theme-preview-soft::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 35px;
  height: 30px;
  background: linear-gradient(135deg, #d4a5c9 0%, #a5c9d4 100%);
  border-radius: 60% 40% 50% 50% / 50% 60% 40% 50%;
}

/* Glassy theme preview - frosted glass effect */
.theme-preview-glassy {
  background: linear-gradient(135deg, #1e2a3a 0%, #2a3a4a 100%);
}
.theme-preview-glassy::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(150,180,200,0.4) 100%);
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.3);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Abstract theme preview - multiple circles */
.theme-preview-abstract {
  background: linear-gradient(135deg, #1a1a2e 0%, #2e1a2e 100%);
}
.theme-preview-abstract::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 40%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #ff6b6b 0%, transparent 70%);
  border-radius: 50%;
}
.theme-preview-abstract::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  width: 25px;
  height: 25px;
  background: radial-gradient(circle, #4ecdc4 0%, #45b7aa 50%, transparent 70%);
  border-radius: 50%;
}
```

**Step 2: Commit**

```bash
git add src/settings/settings.css
git commit -m "feat: add theme card styles with visual previews"
```

---

## Task 13: Add Theme Selection JavaScript

**Files:**
- Modify: `src/settings/settings.js`

**Step 1: Add theme card selection logic**

Add at the end of the file, before the final `loadSettings()` call:

```javascript
// Theme selection
const themeCards = document.querySelectorAll('.theme-card');

themeCards.forEach(card => {
  card.addEventListener('click', async () => {
    const themeId = card.dataset.theme;

    // Update UI
    themeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    // Save setting
    await window.oledSaver.saveSettings({ theme: themeId });
  });
});
```

**Step 2: Load theme setting in loadSettings()**

Add inside the `loadSettings()` function after loading other settings:

```javascript
// Theme setting
const currentTheme = settings.theme || 'minimal';
themeCards.forEach(card => {
  card.classList.toggle('active', card.dataset.theme === currentTheme);
});
```

**Step 3: Commit**

```bash
git add src/settings/settings.js
git commit -m "feat: add theme selection event handlers"
```

---

## Task 14: Final Testing

**Step 1: Start the app**

Run: `npm start`

**Step 2: Test each theme**

1. Open settings
2. Select each theme (Minimal, Soft, Glassy, Abstract)
3. Trigger the overlay (wait for idle or use Test Overlay)
4. Verify each theme renders correctly with unique visuals, motion, and colors

**Step 3: Test content rendering**

1. Enable clock/stocks/system content
2. Verify content displays properly on each theme

**Step 4: Test persistence**

1. Select a theme
2. Quit and restart the app
3. Verify the theme persists

**Step 5: Commit any final fixes**

If any issues found, fix and commit.

---

## Summary

After completing all tasks, the app will have:
- Four selectable visual themes in settings
- Visual preview cards for each theme
- Each theme with unique visuals, motion behavior, and color handling
- Full backward compatibility (legacy code as fallback)
- Content integration on all themes
- Theme persists across app restarts
