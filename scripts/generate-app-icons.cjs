const sharp = require('sharp');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.resolve(root, '../enjoyWebApp/public/logo.png');
const assets = path.resolve(root, 'assets');

async function resizeSquare(size, out) {
  await sharp(src)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(out);
}

async function main() {
  await resizeSquare(1024, path.join(assets, 'icon.png'));

  const adaptiveSize = Math.round(1024 * 0.66);
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(src).resize(adaptiveSize, adaptiveSize).png().toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(assets, 'adaptive-icon.png'));

  await resizeSquare(192, path.join(assets, 'favicon.png'));

  for (const f of ['icon.png', 'adaptive-icon.png', 'favicon.png']) {
    const meta = await sharp(path.join(assets, f)).metadata();
    console.log(`${f}: ${meta.width}x${meta.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
