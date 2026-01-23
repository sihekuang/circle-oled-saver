# Visual Themes System Design

## Overview

Replace the current "tacky" bouncing circle with a theme system offering four distinct visual styles. Each theme is a complete package controlling visuals, motion, and color behavior while maintaining OLED burn-in prevention.

## Goals

- Improve visual aesthetics with modern, tasteful designs
- Provide user choice through selectable themes
- Maintain burn-in prevention (continuous movement + color variation)
- Integrate cleanly with existing Provider pattern and ContentRotator

## Themes

### 1. Minimal/Geometric

**Visual:** Clean circle with subtle outer glow. No gradient fill—single color with depth from a soft luminous halo. Simple ring or filled circle with gentle shadow/bloom.

**Motion:** Smooth drift at 1-2px per frame. No abrupt bounces. When approaching edges, curves away gently rather than bouncing. Very gradual direction changes.

**Colors:** Monochromatic. Picks one base hue, stays within ±10° range. Color shifts imperceptibly over 30-60 seconds. Palette options: cool white, warm amber, soft blue.

### 2. Soft/Organic

**Visual:** Blob-like shape using smooth bezier curves. Shape subtly morphs and "breathes"—edges undulate gently. Soft inner gradient with pastel tones, slightly translucent edges that fade out.

**Motion:** Elastic ease. Floats with gentle momentum. At edges, squishes slightly and bounces back with easing curves (ease-out approach, ease-in departure). Shape morphing adds organic movement.

**Colors:** Pastel palette—muted, low-saturation (lavender, soft coral, mint, pale gold). Colors blend smoothly over 5-10 seconds. Gradients shift position within the blob, not just hue.

### 3. Glassy/Modern

**Visual:** Frosted glass circle with subtle blur simulation. Soft white border, layered gradients and noise texture for depth. Faint highlight arc on top edge for glass reflection. Subtle inner shadow.

**Motion:** Smooth drift with inertia—moves slowly but feels weighted. Gradual curved direction changes. Near edges: decelerates, pauses briefly, drifts away. No hard bounces.

**Colors:** Muted, sophisticated—soft grays, blues, subtle accents. Glass tint shifts slowly over 20-30 seconds. Border has subtle prismatic shimmer cycling very slowly through spectrum.

### 4. Abstract/Artistic

**Visual:** Generative art-inspired. Cluster of overlapping circles, rotating geometric pattern, or particle trails. Internal movement—elements rotate, pulse, or orbit the center. Visually interesting but not chaotic.

**Motion:** Gravity-aware with gentle parabolic arcs. Bounces off edges with subtle particle burst or ripple effect. More dynamic than other themes but still smooth and intentional.

**Colors:** Full vibrant palette with color theory harmony (complementary, triadic, analogous). Colors blend and layer within shape. Medium transitions (3-5 seconds). Internal elements use contrasting colors for depth.

## Architecture

### New Files

```
src/overlay/themes/
├── ThemeProvider.js           # Base class
├── MinimalThemeProvider.js
├── SoftThemeProvider.js
├── GlassyThemeProvider.js
├── AbstractThemeProvider.js
└── index.js                   # Exports all themes

src/settings/
└── theme-previews/            # Preview images for settings UI
    ├── minimal.png
    ├── soft.png
    ├── glassy.png
    └── abstract.png
```

### ThemeProvider Base Class

```javascript
// src/overlay/themes/ThemeProvider.js

class ThemeProvider {
  constructor(config = {}) {
    this.config = config;
    this.time = 0;  // Internal time for animations
  }

  /**
   * Get current color for the shape
   * @param {number} hue - Base hue (0-360), theme may use or ignore
   * @param {number} time - Animation time in ms
   * @returns {string} CSS color string
   */
  getColor(hue, time) {
    throw new Error('getColor() must be implemented by subclass');
  }

  /**
   * Update motion and return new position/velocity
   * @param {Object} state - {x, y, vx, vy, radius}
   * @param {Object} bounds - {width, height}
   * @returns {Object} - {x, y, vx, vy, hue} with updated values
   */
  updateMotion(state, bounds) {
    throw new Error('updateMotion() must be implemented by subclass');
  }

  /**
   * Draw the shape
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} state - {x, y, radius, hue, opacity}
   * @param {number} time - Animation time in ms
   * @param {Object|null} content - Content from ContentRotator, if any
   */
  draw(ctx, state, time, content) {
    throw new Error('draw() must be implemented by subclass');
  }

  /**
   * Called each frame to update internal state
   * @param {number} deltaTime - Time since last frame in ms
   */
  tick(deltaTime) {
    this.time += deltaTime;
  }

  // Static metadata for settings UI
  static get themeName() { return 'Base'; }
  static get themeId() { return 'base'; }
  static get previewPath() { return null; }
}
```

### Integration with BouncingBall

Modify `overlay.js` to delegate to `window.themeProvider`:

```javascript
// In BouncingBall class

update() {
  if (window.themeProvider) {
    const result = window.themeProvider.updateMotion(
      { x: this.x, y: this.y, vx: this.speedX, vy: this.speedY, radius: this.radius, hue: this.hue },
      { width: canvas.width, height: canvas.height }
    );
    this.x = result.x;
    this.y = result.y;
    this.speedX = result.vx;
    this.speedY = result.vy;
    if (result.hue !== undefined) this.hue = result.hue;
  } else {
    // Fallback to current behavior
    this.legacyUpdate();
  }
}

draw() {
  const content = window.contentRotator?.getCurrentProvider()?.getData();

  if (window.themeProvider) {
    window.themeProvider.draw(
      ctx,
      { x: this.x, y: this.y, radius: this.radius, hue: this.hue, opacity: ballOpacityPercentage / 100 },
      performance.now(),
      content
    );
  } else {
    // Fallback to current behavior
    content ? this.drawWithContent(content) : this.drawGradient();
  }
}
```

### Settings Integration

Add theme selection to settings:

```javascript
// In store.js or equivalent
const schema = {
  // ... existing settings
  theme: {
    type: 'string',
    default: 'minimal',
    enum: ['minimal', 'soft', 'glassy', 'abstract']
  }
};
```

Settings UI shows visual preview cards. Each card displays:
- Theme preview image (static or animated GIF)
- Theme name
- Brief description

### Initialization

```javascript
// In overlay.js init()

const themeId = await window.oledSaver.getTheme();
const ThemeClass = {
  'minimal': MinimalThemeProvider,
  'soft': SoftThemeProvider,
  'glassy': GlassyThemeProvider,
  'abstract': AbstractThemeProvider
}[themeId] || MinimalThemeProvider;

window.themeProvider = new ThemeClass({
  // Pass any theme-specific config
});
```

## Implementation Notes

### Content Integration

All themes must support rendering content (clock, stocks, etc.) when provided. The `draw()` method receives content and should:
1. Draw the themed background shape
2. Overlay content text/icons with appropriate contrast

### Performance

- Use `requestAnimationFrame` timing for smooth animations
- Soft theme blob morphing: use 4-6 control points, not complex paths
- Abstract theme particles: limit to 10-20 elements
- Cache gradients where possible

### Fallback

If theme loading fails, fall back to current gradient ball behavior. The legacy code remains in `BouncingBall` as `legacyUpdate()` and `drawGradient()`.

## Settings UI Preview Cards

Each theme card in settings should be ~120x80px showing:
- A representative frame of the theme in action
- Could be static PNG or short looping GIF/WebP
- Clicking selects the theme with visual highlight

Layout: 2x2 grid of cards, or horizontal scroll on narrow screens.

## Testing

- Each theme renders without errors
- Motion stays within bounds
- Color changes occur (burn-in prevention)
- Content renders legibly on all themes
- Theme persists across app restart
- Graceful fallback if theme fails to load
