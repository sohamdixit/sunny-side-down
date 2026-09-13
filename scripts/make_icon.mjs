/**
 * Builds the app icon from assets/icon-source.svg.
 *
 * Android adaptive icons are two layers, and the launcher may mask them to a
 * circle/squircle - only roughly the central 66% is guaranteed visible. So the
 * foreground is the artwork WITHOUT its own background plate, scaled to sit
 * inside that safe zone, and the background is the flat plate colour.
 *
 * Run: node scripts/make_icon.mjs   (then: npx @capacitor/assets generate --android)
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const SIZE = 1024;
const SRC = 'assets/icon-source.svg';
const PLATE = '#0F172A'; // must match the <rect id="app-bg"> fill in the source

const svg = readFileSync(SRC, 'utf8');

// Full icon: exactly as designed, plate included.
await sharp(Buffer.from(svg), { density: 384 })
  .resize(SIZE, SIZE, { fit: 'contain', background: PLATE })
  .png()
  .toFile('assets/icon.png');

// Foreground: drop the plate, shrink the art into the safe zone.
// The artwork sits roughly x 25-175, y 25-180 in the 200-unit viewBox, so it
// is scaled about its own centre rather than the canvas centre.
const bare = svg
  .replace(/<rect id="app-bg"[^>]*\/>/, '')
  .replace(
    /(<path id="egg-white")/,
    '<g transform="translate(100,100) scale(0.66) translate(-100,-102.5)">$1',
  )
  .replace('</svg>', '</g></svg>');
writeFileSync('assets/icon-foreground.svg', bare);

await sharp(Buffer.from(bare), { density: 384 })
  .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('assets/icon-foreground.png');

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: PLATE },
})
  .png()
  .toFile('assets/icon-background.png');

// A 48px render is the real test - launcher icons live at about this size.
await sharp('assets/icon.png').resize(48, 48).png().toFile('assets/icon-48px-check.png');

console.log('wrote assets/icon.png, icon-foreground.png, icon-background.png, icon-48px-check.png');
