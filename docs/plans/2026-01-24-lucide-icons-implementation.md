# Lucide Icons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace emoji icons with Lucide SVG icons rendered via Canvas Path2D for consistency, quality, and theme color support.

**Architecture:** Create an IconRegistry that caches Path2D objects from Lucide path data. Content providers return icon names instead of emoji. The overlay draws icons using the registry with theme colors.

**Tech Stack:** Lucide-static (dev dependency), Canvas Path2D API, Node.js fs for extraction script.

---

## Task 1: Add lucide-static dev dependency

**Files:**
- Modify: `package.json`

**Step 1: Install lucide-static**

Run:
```bash
npm install --save-dev lucide-static
```

Expected: `lucide-static` added to devDependencies in package.json.

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lucide-static dev dependency"
```

---

## Task 2: Create icon extraction script

**Files:**
- Create: `scripts/extract-icons.js`

**Step 1: Create the extraction script**

```javascript
// scripts/extract-icons.js
const fs = require('fs');
const path = require('path');

// Icons to extract - add new icons here
const ICONS_TO_EXTRACT = [
  'clock',
  'cpu',
  'hard-drive',      // For memory (memory-stick doesn't exist, hard-drive is closer)
  'battery',
  'battery-low',
  'battery-medium',
  'battery-full',
  'battery-charging',
  'trending-up',
  'bar-chart-2',
  'help-circle'
];

const LUCIDE_ICONS_DIR = path.join(__dirname, '../node_modules/lucide-static/icons');
const OUTPUT_FILE = path.join(__dirname, '../src/overlay/icons.json');

// Convert SVG elements to a single path string
function svgToPath(svgContent) {
  const paths = [];

  // Extract path d attributes
  const pathMatches = svgContent.matchAll(/<path[^>]*\sd="([^"]+)"[^>]*>/g);
  for (const match of pathMatches) {
    paths.push(match[1]);
  }

  // Convert circle to path
  const circleMatches = svgContent.matchAll(/<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"[^>]*>/g);
  for (const match of circleMatches) {
    const [, cx, cy, r] = match;
    // Circle as path: M cx-r,cy a r,r 0 1,0 2r,0 a r,r 0 1,0 -2r,0
    paths.push(`M${cx - parseFloat(r)},${cy}a${r},${r} 0 1,0 ${parseFloat(r) * 2},0a${r},${r} 0 1,0 -${parseFloat(r) * 2},0`);
  }

  // Convert line to path
  const lineMatches = svgContent.matchAll(/<line[^>]*x1="([^"]+)"[^>]*y1="([^"]+)"[^>]*x2="([^"]+)"[^>]*y2="([^"]+)"[^>]*>/g);
  for (const match of lineMatches) {
    const [, x1, y1, x2, y2] = match;
    paths.push(`M${x1},${y1}L${x2},${y2}`);
  }

  // Convert polyline to path
  const polylineMatches = svgContent.matchAll(/<polyline[^>]*points="([^"]+)"[^>]*>/g);
  for (const match of polylineMatches) {
    const points = match[1].trim().split(/\s+/);
    if (points.length >= 2) {
      const [first, ...rest] = points;
      paths.push(`M${first}L${rest.join('L')}`);
    }
  }

  // Convert polygon to path
  const polygonMatches = svgContent.matchAll(/<polygon[^>]*points="([^"]+)"[^>]*>/g);
  for (const match of polygonMatches) {
    const points = match[1].trim().split(/\s+/);
    if (points.length >= 2) {
      const [first, ...rest] = points;
      paths.push(`M${first}L${rest.join('L')}Z`);
    }
  }

  // Convert rect to path
  const rectMatches = svgContent.matchAll(/<rect[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"[^>]*(?:rx="([^"]+)")?[^>]*>/g);
  for (const match of rectMatches) {
    const [, x, y, width, height, rx] = match;
    const x1 = parseFloat(x), y1 = parseFloat(y);
    const w = parseFloat(width), h = parseFloat(height);
    const r = parseFloat(rx) || 0;

    if (r > 0) {
      // Rounded rect
      paths.push(`M${x1 + r},${y1}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${h - 2 * r}a${r},${r} 0 0 1 ${r},-${r}z`);
    } else {
      // Simple rect
      paths.push(`M${x1},${y1}h${w}v${h}h-${w}Z`);
    }
  }

  return paths.join(' ');
}

function extractIcons() {
  const icons = {};

  for (const iconName of ICONS_TO_EXTRACT) {
    const svgPath = path.join(LUCIDE_ICONS_DIR, `${iconName}.svg`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`Warning: Icon "${iconName}" not found at ${svgPath}`);
      continue;
    }

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const pathData = svgToPath(svgContent);

    if (pathData) {
      icons[iconName] = pathData;
      console.log(`Extracted: ${iconName}`);
    } else {
      console.warn(`Warning: No path data extracted for "${iconName}"`);
    }
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(icons, null, 2));
  console.log(`\nWrote ${Object.keys(icons).length} icons to ${OUTPUT_FILE}`);
}

extractIcons();
```

**Step 2: Add npm script to package.json**

In `package.json`, add to the `scripts` object:
```json
"extract-icons": "node scripts/extract-icons.js"
```

**Step 3: Commit**

```bash
git add scripts/extract-icons.js package.json
git commit -m "feat: add icon extraction script for Lucide icons"
```

---

## Task 3: Generate icons.json

**Files:**
- Create: `src/overlay/icons.json` (generated)

**Step 1: Run the extraction script**

Run:
```bash
npm run extract-icons
```

Expected: Output showing each icon extracted, file created at `src/overlay/icons.json`.

**Step 2: Verify the output**

Check that `src/overlay/icons.json` exists and contains path data for all icons.

**Step 3: Commit**

```bash
git add src/overlay/icons.json
git commit -m "chore: generate Lucide icon path data"
```

---

## Task 4: Create IconRegistry class

**Files:**
- Create: `src/overlay/IconRegistry.js`

**Step 1: Create the IconRegistry**

```javascript
// src/overlay/IconRegistry.js

// Icon path data (will be inlined from icons.json at build, or loaded)
// For browser use, we'll inline the JSON or load it
class IconRegistry {
  constructor() {
    this.icons = {};
    this.pathCache = new Map();
  }

  /**
   * Load icons from the icons.json data
   * @param {Object} iconData - Object mapping icon names to path strings
   */
  loadIcons(iconData) {
    this.icons = iconData;
    this.pathCache.clear();
  }

  /**
   * Check if an icon exists
   * @param {string} iconName - Name of the icon
   * @returns {boolean}
   */
  hasIcon(iconName) {
    return iconName in this.icons;
  }

  /**
   * Draw an icon on the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} iconName - Name of the icon to draw
   * @param {number} x - X position (top-left of icon)
   * @param {number} y - Y position (top-left of icon)
   * @param {number} size - Size to draw the icon (width/height)
   * @param {string} color - Stroke color
   * @returns {boolean} - True if icon was drawn, false if not found
   */
  draw(ctx, iconName, x, y, size, color) {
    const pathData = this.icons[iconName];
    if (!pathData) {
      console.warn(`IconRegistry: Icon "${iconName}" not found`);
      return false;
    }

    // Get or create cached Path2D
    let path = this.pathCache.get(iconName);
    if (!path) {
      path = new Path2D(pathData);
      this.pathCache.set(iconName, path);
    }

    const scale = size / 24; // Lucide icons use 24x24 viewBox

    ctx.save();

    // Position at x, y (icon will be drawn centered around origin after translate)
    // Lucide icons are drawn in 0-24 range, so offset by -12 to center
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-12, -12); // Center the 24x24 icon

    // Lucide icons are stroke-based
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    ctx.restore();
    return true;
  }
}

// Create singleton instance
const iconRegistry = new IconRegistry();

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.IconRegistry = IconRegistry;
  window.iconRegistry = iconRegistry;
}

// Also support Node.js module.exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IconRegistry, iconRegistry };
}
```

**Step 2: Commit**

```bash
git add src/overlay/IconRegistry.js
git commit -m "feat: add IconRegistry for drawing Lucide icons on canvas"
```

---

## Task 5: Load icons in overlay HTML

**Files:**
- Modify: `src/overlay/overlay.html`

**Step 1: Find overlay.html and add script tags**

Add these script tags before overlay.js is loaded:
```html
<script src="IconRegistry.js"></script>
<script>
  // Load icon data
  fetch('icons.json')
    .then(res => res.json())
    .then(data => window.iconRegistry.loadIcons(data))
    .catch(err => console.error('Failed to load icons:', err));
</script>
```

**Step 2: Commit**

```bash
git add src/overlay/overlay.html
git commit -m "feat: load IconRegistry and icons in overlay"
```

---

## Task 6: Update drawContentText to use IconRegistry

**Files:**
- Modify: `src/overlay/overlay.js:236-273`

**Step 1: Modify drawContentText method**

Replace the current emoji drawing logic with IconRegistry. The new method should:
1. Check if `content.icon` is a Lucide icon name (exists in registry)
2. If yes, use `iconRegistry.draw()` with the theme's text color
3. If no, fall back to drawing as text (for backwards compatibility)

```javascript
drawContentText(content, opacity) {
  ctx.save();

  // Set text properties
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Icon size and position (top of circle)
  const iconSize = this.radius * 0.25;
  const iconY = this.y - this.radius * 0.3;

  // Determine icon color (white with opacity for visibility on dark backgrounds)
  const iconColor = `rgba(255, 255, 255, ${opacity})`;

  // Try to draw as Lucide icon first
  if (window.iconRegistry && window.iconRegistry.hasIcon(content.icon)) {
    // Draw Lucide icon
    window.iconRegistry.draw(ctx, content.icon, this.x, iconY, iconSize, iconColor);
  } else {
    // Fallback: draw as emoji/text
    ctx.font = `${iconSize}px Arial`;
    ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.lineWidth = Math.max(2, iconSize * 0.1);
    ctx.strokeText(content.icon, this.x, iconY);
    ctx.fillStyle = iconColor;
    ctx.fillText(content.icon, this.x, iconY);
  }

  // Text size and position (below icon)
  const textSize = this.radius * 0.15;
  ctx.font = `bold ${textSize}px Arial`;

  // Handle multi-line text
  const lines = content.text.split('\n');
  const lineHeight = textSize * 1.2;
  const textStartY = this.y + this.radius * 0.1;

  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;

  lines.forEach((line, index) => {
    const y = textStartY + (index * lineHeight);
    // Draw text with black stroke for visibility
    ctx.lineWidth = Math.max(2, textSize * 0.1);
    ctx.strokeText(line, this.x, y);
    ctx.fillText(line, this.x, y);
  });

  ctx.restore();
}
```

**Step 2: Commit**

```bash
git add src/overlay/overlay.js
git commit -m "feat: use IconRegistry for drawing icons in overlay"
```

---

## Task 7: Update ClockProvider

**Files:**
- Modify: `src/overlay/providers/ClockProvider.js:26`

**Step 1: Change emoji to icon name**

Change:
```javascript
icon: '🕐',
```

To:
```javascript
icon: 'clock',
```

**Step 2: Commit**

```bash
git add src/overlay/providers/ClockProvider.js
git commit -m "feat: use Lucide clock icon in ClockProvider"
```

---

## Task 8: Update StockProvider

**Files:**
- Modify: `src/overlay/providers/StockProvider.js:22,30,42`

**Step 1: Change emoji to icon name**

Change all occurrences of:
```javascript
icon: '📈',
```

To:
```javascript
icon: 'trending-up',
```

**Step 2: Commit**

```bash
git add src/overlay/providers/StockProvider.js
git commit -m "feat: use Lucide trending-up icon in StockProvider"
```

---

## Task 9: Update SystemInfoProvider

**Files:**
- Modify: `src/overlay/providers/SystemInfoProvider.js`

**Step 1: Update icon and remove inline emojis from text**

The current code embeds emojis in the text string. Remove those and just use plain text labels.

Change the fetchData method:
```javascript
async fetchData() {
  try {
    // Get real system info via IPC
    const systemInfo = await window.oledSaver.getSystemInfo();

    let text = `CPU ${systemInfo.cpuPercent}%  RAM ${systemInfo.memUsedGB}/${systemInfo.memTotalGB} GB`;

    // Battery (if available)
    if (this.config.showBattery && typeof navigator !== 'undefined' && navigator.getBattery) {
      try {
        if (!this._batteryManager) {
          this._batteryManager = await navigator.getBattery();
        }
        const batteryPercent = Math.round(this._batteryManager.level * 100);
        text += `\nBattery ${batteryPercent}%`;
      } catch (e) {
        // Battery API not available
      }
    }

    this.cachedData = {
      icon: 'bar-chart-2',
      text: text
    };

    console.log(`[${this.constructor.name}] Data updated:`, this.cachedData.text.replace('\n', ' '));
  } catch (err) {
    console.error('SystemInfoProvider fetch error:', err);
    this.cachedData = {
      icon: 'bar-chart-2',
      text: 'CPU N/A  RAM N/A'
    };
  }
}
```

**Step 2: Commit**

```bash
git add src/overlay/providers/SystemInfoProvider.js
git commit -m "feat: use Lucide bar-chart-2 icon in SystemInfoProvider, remove inline emojis"
```

---

## Task 10: Update ContentProvider fallback

**Files:**
- Modify: `src/overlay/providers/ContentProvider.js:16`

**Step 1: Change fallback emoji to icon name**

Change:
```javascript
icon: '❓',
```

To:
```javascript
icon: 'help-circle',
```

**Step 2: Commit**

```bash
git add src/overlay/providers/ContentProvider.js
git commit -m "feat: use Lucide help-circle icon in ContentProvider fallback"
```

---

## Task 11: Manual testing

**Step 1: Run the app**

Run:
```bash
npm start
```

**Step 2: Verify icons render correctly**

- Wait for screensaver to activate (or trigger it manually)
- Check that clock shows with the Lucide clock icon
- Rotate through content providers and verify each icon appears
- Confirm icons are the correct color (white/theme color)
- Confirm icons scale appropriately with ball size

**Step 3: Test different themes**

- Open settings and switch between themes (minimal, soft, glassy, abstract)
- Verify icons still render correctly with each theme

---

## Task 12: Final commit and cleanup

**Step 1: If any fixes were needed, commit them**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

**Step 2: Verify git status is clean**

Run:
```bash
git status
```

Expected: Clean working directory (nothing to commit).
