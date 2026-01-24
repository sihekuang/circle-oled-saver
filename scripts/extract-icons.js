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
