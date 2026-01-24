#!/usr/bin/env node

/**
 * Test script to move the cursor to the top-right corner of the
 * macOS mic/camera privacy indicator (the orange/green dot in the menu bar).
 *
 * Based on screenshots analysis:
 * - Position 1 (light theme): ~207px from right edge
 * - Position 2 (dark theme): ~340px from right edge
 */

const robot = require('@jitsi/robotjs');

// Get screen size
const screenSize = robot.getScreenSize();
console.log(`Screen size: ${screenSize.width} x ${screenSize.height}`);

// macOS menu bar vertical center (menu bar is ~24-30px tall)
const MENU_BAR_CENTER_Y = 15;

// Privacy indicator dot diameter
const INDICATOR_DIAMETER = 6;
const INDICATOR_RADIUS = INDICATOR_DIAMETER / 2;

// Measured positions from screenshots (distance from RIGHT edge of screen)
const POSITIONS = {
    // From Screenshot 2 (light theme) - indicator closer to clock
    position1: {
        name: 'Position 1 (light theme - near clock)',
        fromRightEdge: 207
    },
    // From Screenshot 1 (dark theme) - indicator further from edge
    position2: {
        name: 'Position 2 (dark theme - more items to right)',
        fromRightEdge: 340
    }
};

// Parse command line args
const args = process.argv.slice(2);
const positionArg = args[0] || '1';

let targetPosition;
if (positionArg === '1') {
    targetPosition = POSITIONS.position1;
} else if (positionArg === '2') {
    targetPosition = POSITIONS.position2;
} else if (!isNaN(parseInt(positionArg))) {
    // Custom offset from right edge provided
    targetPosition = {
        name: `Custom (${positionArg}px from right)`,
        fromRightEdge: parseInt(positionArg)
    };
} else {
    console.log('Usage: node test-cursor-to-privacy-indicator.js [1|2|<pixels_from_right>]');
    console.log('  1 - Position 1 (light theme screenshot)');
    console.log('  2 - Position 2 (dark theme screenshot)');
    console.log('  <number> - Custom pixels from right edge');
    process.exit(1);
}

console.log(`\nUsing: ${targetPosition.name}`);
console.log(`Indicator offset from right edge: ${targetPosition.fromRightEdge}px`);

// Calculate the indicator center position
const indicatorCenterX = screenSize.width - targetPosition.fromRightEdge;
const indicatorCenterY = MENU_BAR_CENTER_Y;

// Calculate top-right corner of the indicator
// Top-right = center + (radius, -radius) in screen coordinates
const targetX = Math.floor(indicatorCenterX + INDICATOR_RADIUS);
const targetY = Math.floor(indicatorCenterY - INDICATOR_RADIUS);

console.log(`\nIndicator center: (${indicatorCenterX}, ${indicatorCenterY})`);
console.log(`Top-right corner: (${targetX}, ${targetY})`);

// Move the cursor
robot.moveMouse(targetX, targetY);

console.log('\n✓ Cursor moved!');
console.log('\nTo test other positions:');
console.log('  node test-cursor-to-privacy-indicator.js 1    # Light theme position');
console.log('  node test-cursor-to-privacy-indicator.js 2    # Dark theme position');
console.log('  node test-cursor-to-privacy-indicator.js 250  # Custom: 250px from right');
