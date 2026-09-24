'use strict';
// Disk cache for painted plates (expensive watercolour passes). Key must encode everything that affects the paint.
const fs = require('fs'); const path = require('path'); const { createCanvas, loadImage } = require('canvas');
const DIR = path.join(__dirname, '../../out/cache');
async function cached(key, build) {
  const f = path.join(DIR, key + '.png');
  if (fs.existsSync(f) && !process.env.NOCACHE) { const img = await loadImage(f); const c = createCanvas(img.width, img.height); c.getContext('2d').drawImage(img, 0, 0); return c; }
  const c = await build(); fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(f, c.toBuffer('image/png', { compressionLevel: 3 })); return c;
}
module.exports = { cached };
