const C = require('../src/engine/core'); const K = require('../src/chars/cats');
const W = 1900, H = 1000; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H);
const cats = ['boss', 'kuro', 'bobtail', 'elder'];
cats.forEach((c, i) => {
  const x = 170 + i * 470;
  ctx.save(); ctx.translate(x, 300); ctx.scale(1.5, 1.5); K.draw(ctx, { cat: c, pose: 'sit', headYaw: 0.9, t: i }, {}); ctx.restore();
  ctx.save(); ctx.translate(x + 180, 300); ctx.scale(1.3, 1.3); K.draw(ctx, { cat: c, pose: 'sit', headYaw: 0.0, t: i }, {}); ctx.restore();
  ctx.save(); ctx.translate(x + 60, 560); ctx.scale(1.3, 1.3); K.draw(ctx, { cat: c, pose: 'walk', phase: 0.3, headYaw: 0.2, t: i }, {}); ctx.restore();
  ctx.save(); ctx.translate(x + 80, 800); ctx.scale(1.3, 1.3); K.draw(ctx, { cat: c, pose: 'loaf', headYaw: 1.2, eyes: c === 'elder' ? 'closed' : 'open', t: i }, {}); ctx.restore();
});
ctx.save(); ctx.translate(1700, 900); ctx.scale(0.3, 0.3); K.drawFace(ctx, 'boss', { pupil: 0.3 }); ctx.restore();
require('fs').writeFileSync('out/tests/cats.png', cv.toBuffer('image/png'));
