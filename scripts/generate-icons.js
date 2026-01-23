const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputSvg = path.join(__dirname, '../assets/icon.svg');
const assetsDir = path.join(__dirname, '../assets');
const iconsetDir = path.join(assetsDir, 'icon.iconset');

// Sizes needed for macOS .icns
const iconSizes = [16, 32, 64, 128, 256, 512, 1024];

async function generateIcons() {
  // Create directories
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }

  console.log('Generating app icons...');

  // Generate icons for iconset
  for (const size of iconSizes) {
    // Standard resolution
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsetDir, `icon_${size}x${size}.png`));

    // Retina resolution (2x) - only for sizes up to 512
    if (size <= 512) {
      await sharp(inputSvg)
        .resize(size * 2, size * 2)
        .png()
        .toFile(path.join(iconsetDir, `icon_${size}x${size}@2x.png`));
    }

    console.log(`  Generated ${size}x${size}`);
  }

  // Create .icns using iconutil (macOS only)
  if (process.platform === 'darwin') {
    console.log('Creating .icns file...');
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(assetsDir, 'icon.icns')}"`);
    console.log('  Created icon.icns');
  }

  // Create standard icon.png for electron-builder (512x512)
  await sharp(inputSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('  Created icon.png (512x512)');

  // Create tray icon (Template image for macOS - should be black with transparency)
  // macOS tray icons should be named with "Template" suffix for auto dark/light mode
  console.log('Generating tray icons...');

  // Tray icon at different sizes for different displays
  const traySizes = [16, 18, 20, 22, 24, 32, 48];

  for (const size of traySizes) {
    // Standard
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(assetsDir, `trayTemplate@${size}.png`));

    // Retina (2x)
    await sharp(inputSvg)
      .resize(size * 2, size * 2)
      .png()
      .toFile(path.join(assetsDir, `trayTemplate@${size}@2x.png`));
  }

  // Main tray icon (22px is standard macOS menu bar size)
  await sharp(inputSvg)
    .resize(22, 22)
    .png()
    .toFile(path.join(assetsDir, 'trayTemplate.png'));

  await sharp(inputSvg)
    .resize(44, 44)
    .png()
    .toFile(path.join(assetsDir, 'trayTemplate@2x.png'));

  console.log('  Created tray icons');

  console.log('\nDone! Icons generated in ./assets/');
}

generateIcons().catch(console.error);
