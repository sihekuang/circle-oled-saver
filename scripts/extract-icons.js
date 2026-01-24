// scripts/extract-icons.js
// Generates white PNG icons from Lucide SVGs for use in the overlay
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icons to extract - add new icons here
const ICONS_TO_EXTRACT = [
  'clock',
  'cpu',
  'hard-drive',
  'battery',
  'battery-low',
  'battery-medium',
  'battery-full',
  'battery-charging',
  'trending-up',
  'bar-chart-2',
  'help-circle'
];

// Output size in pixels (will be scaled when drawn on canvas)
const ICON_SIZE = 64;

const LUCIDE_ICONS_DIR = path.join(__dirname, '../node_modules/lucide-static/icons');
const OUTPUT_DIR = path.join(__dirname, '../src/overlay/icons');

async function extractIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let successCount = 0;

  for (const iconName of ICONS_TO_EXTRACT) {
    const svgPath = path.join(LUCIDE_ICONS_DIR, `${iconName}.svg`);

    if (!fs.existsSync(svgPath)) {
      console.warn(`Warning: Icon "${iconName}" not found at ${svgPath}`);
      continue;
    }

    try {
      // Read SVG content
      let svgContent = fs.readFileSync(svgPath, 'utf8');

      // Replace currentColor with white for the stroke
      svgContent = svgContent.replace(/stroke="currentColor"/g, 'stroke="#FFFFFF"');

      // Update width/height to our target size
      svgContent = svgContent.replace(/width="24"/g, `width="${ICON_SIZE}"`);
      svgContent = svgContent.replace(/height="24"/g, `height="${ICON_SIZE}"`);

      // Scale stroke-width proportionally
      const scaleFactor = ICON_SIZE / 24;
      svgContent = svgContent.replace(/stroke-width="2"/g, `stroke-width="${2 * scaleFactor}"`);

      // Convert SVG to PNG using sharp
      const outputPath = path.join(OUTPUT_DIR, `${iconName}.png`);
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(outputPath);

      console.log(`Generated: ${iconName}.png`);
      successCount++;
    } catch (err) {
      console.error(`Error processing ${iconName}:`, err.message);
    }
  }

  console.log(`\nGenerated ${successCount} icons in ${OUTPUT_DIR}`);
}

extractIcons().catch(console.error);
