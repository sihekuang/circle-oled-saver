# Lucide Icons for Canvas Overlay

Replace emoji icons with Lucide SVG icons for consistency, visual quality, and theme color customization.

## Goals

- **Consistency** - Unified icon style across the app
- **Visual quality** - Platform-independent rendering (no emoji font variations)
- **Customization** - Icons match theme colors dynamically

## Approach: Canvas Path2D

Draw Lucide's SVG paths directly on Canvas using the Path2D API. Stroke color is set per-draw, making theming trivial.

## Components

### 1. Icon Registry (`src/overlay/IconRegistry.js`)

Centralized registry that stores path data and provides a drawing API.

```javascript
import icons from './icons.json';

class IconRegistry {
  constructor() {
    this.pathCache = new Map();
  }

  draw(ctx, iconName, x, y, size, color) {
    const pathData = icons[iconName];
    if (!pathData) return false;

    let path = this.pathCache.get(iconName);
    if (!path) {
      path = new Path2D(pathData);
      this.pathCache.set(iconName, path);
    }

    const scale = size / 24; // Lucide uses 24x24 viewBox

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);

    ctx.restore();
    return true;
  }
}

export default new IconRegistry();
```

### 2. Icon Data (`src/overlay/icons.json`)

Generated file containing path data for each icon.

```json
{
  "clock": "...",
  "cpu": "...",
  "memory-stick": "...",
  "battery": "...",
  "trending-up": "...",
  "bar-chart-2": "...",
  "help-circle": "..."
}
```

### 3. Extraction Script (`scripts/extract-icons.js`)

Extracts path data from `lucide-static` package.

```javascript
// Icon list - add new icons here
const icons = [
  'clock',
  'cpu',
  'memory-stick',
  'battery',
  'trending-up',
  'bar-chart-2',
  'help-circle'
];

// For each icon:
// 1. Load SVG from node_modules/lucide-static/icons/{name}.svg
// 2. Parse SVG, extract path/circle/line/polyline elements
// 3. Convert to single path string
// 4. Write to src/overlay/icons.json
```

Run with `npm run extract-icons`.

## Icon Mapping

| Current Emoji | Lucide Icon | Provider |
|---------------|-------------|----------|
| 🕐 | `clock` | ClockProvider |
| ⚙️ | `cpu` | SystemInfoProvider |
| 💾 | `memory-stick` | SystemInfoProvider |
| 🔋 | `battery` | SystemInfoProvider |
| 📊 | `bar-chart-2` | SystemInfoProvider |
| 📈 | `trending-up` | StockProvider |
| ❓ | `help-circle` | ContentProvider |

## Integration

### overlay.js Changes

Modify `drawContentText()` to use IconRegistry instead of drawing emoji as text:

1. Check if icon name is provided
2. Call `iconRegistry.draw()` with theme's text color
3. Position icon where emoji would have been

### Content Provider Changes

Each provider returns icon name instead of emoji:

```javascript
// Before
return { icon: '🕐', text: timeString };

// After
return { icon: 'clock', text: timeString };
```

## Dependencies

**Dev dependency (not bundled):**
```json
{
  "devDependencies": {
    "lucide-static": "^0.460.0"
  }
}
```

**NPM script:**
```json
{
  "scripts": {
    "extract-icons": "node scripts/extract-icons.js"
  }
}
```

## Files to Create/Modify

**Create:**
- `scripts/extract-icons.js` - Icon extraction script
- `src/overlay/icons.json` - Generated icon path data
- `src/overlay/IconRegistry.js` - Icon drawing API

**Modify:**
- `package.json` - Add dev dependency and script
- `src/overlay/overlay.js` - Use IconRegistry in drawContentText()
- `src/overlay/providers/ClockProvider.js` - Use icon name
- `src/overlay/providers/SystemInfoProvider.js` - Use icon names
- `src/overlay/providers/StockProvider.js` - Use icon name
- `src/overlay/providers/ContentProvider.js` - Use icon name
