// Build step: convert og.svg → og.png + favicon-32.png + apple-touch-icon.png.
// Runs automatically on Vercel (via `npm run build`). Also works locally.

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const ogSvgPath = resolve(publicDir, 'og.svg');
  const faviconPath = resolve(publicDir, 'favicon.svg');

  if (!(await exists(ogSvgPath))) {
    console.error('public/og.svg not found, skipping PNG generation');
    return;
  }

  const ogSvg = await readFile(ogSvgPath);
  await sharp(ogSvg, { density: 300 })
    .resize(1200, 630, { fit: 'cover' })
    .png({ quality: 92, compressionLevel: 9 })
    .toFile(resolve(publicDir, 'og.png'));
  console.log('✓ public/og.png (1200×630)');

  if (await exists(faviconPath)) {
    const faviconSvg = await readFile(faviconPath);
    await sharp(faviconSvg, { density: 300 })
      .resize(32, 32)
      .png()
      .toFile(resolve(publicDir, 'favicon-32.png'));
    console.log('✓ public/favicon-32.png (32×32)');

    await sharp(faviconSvg, { density: 300 })
      .resize(180, 180)
      .png()
      .toFile(resolve(publicDir, 'apple-touch-icon.png'));
    console.log('✓ public/apple-touch-icon.png (180×180)');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
