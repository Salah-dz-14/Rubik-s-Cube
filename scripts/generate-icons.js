import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const colors = [
  ['#FF5700', '#FFFFFF', '#FFDE00'], // Row 0: Orange, White, Yellow
  ['#FFDE00', '#EE0000', '#0015D5'], // Row 1: Yellow, Red, Blue
  ['#009E0B', '#0015D5', '#009E0B'], // Row 2: Green, Blue, Green
];

// Pure edge-to-edge 3x3 Rubik's face with the iconic Rubik's CUBE logo on the white square
function createPureSvg(size = 512) {
  const cellSize = size / 3;
  let rects = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = (col * cellSize).toFixed(2);
      const y = (row * cellSize).toFixed(2);
      const w = Math.ceil(cellSize).toFixed(2);
      const h = Math.ceil(cellSize).toFixed(2);
      const color = colors[row][col];
      rects += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" />\n`;
    }
  }

  // Exact Rubik's CUBE logo lockup on the white square (row 0, col 1)
  const whiteCenterX = 1.5 * cellSize;
  const whiteCenterY = 0.5 * cellSize;
  const scale = (cellSize / 260).toFixed(3);

  const whiteLogo = `
  <g transform="translate(${whiteCenterX.toFixed(2)}, ${whiteCenterY.toFixed(2)}) rotate(-14) scale(${scale})">
    <!-- "Rubik's" script -->
    <text x="0" y="-12" font-family="'Brush Script MT', 'Caveat', 'Segoe Script', 'Dancing Script', cursive, sans-serif" font-size="52" font-weight="900" font-style="italic" text-anchor="middle" fill="#000000">Rubik&apos;s</text>
    <path d="M42,-7 Q58,-4 76,-9" stroke="#000000" stroke-width="4" stroke-linecap="round" fill="none" />

    <!-- "CUBE" geometric block font -->
    <path d="M-84,6 L-44,6 L-44,20 L-68,20 L-68,32 L-44,32 L-44,46 L-84,46 Z" fill="#000000" />
    <path d="M-36,6 L-18,6 L-18,32 L-4,32 L-4,6 L14,6 L14,46 L-36,46 Z" fill="#000000" />
    <path d="M22,6 L58,6 C63,6 66,9 66,15 C66,19 63,23 58,24 C64,25 67,29 67,36 C67,43 63,46 56,46 L22,46 Z M38,17 L48,17 C50,17 51,18 51,20 C51,22 50,23 48,23 L38,23 Z M38,29 L49,29 C51,29 52,30 52,33 C52,35 51,36 49,36 L38,36 Z" fill="#000000" />
    <path d="M74,6 L112,6 L112,19 L91,19 L91,22 L108,22 L108,30 L91,30 L91,33 L112,33 L112,46 L74,46 Z" fill="#000000" />
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
${rects}${whiteLogo}
</svg>`;
}

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pureSvg = createPureSvg(512);

  // 1. Icon SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), pureSvg, 'utf8');
  console.log('Saved public/icon.svg (with Rubik logo on white square)');

  // 2. 192x192 PNG (PWA)
  await sharp(Buffer.from(pureSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // 3. 512x512 PNG (PWA High-Res)
  await sharp(Buffer.from(pureSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // 4. Apple Touch Icon (180x180 PNG)
  await sharp(Buffer.from(pureSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');

  // 5. Maskable Icon (512x512 PNG)
  await sharp(Buffer.from(pureSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved public/pwa-maskable-512x512.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
