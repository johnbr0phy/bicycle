const C = require('../src/engine/core'); const S = require('../src/chars/shiba');
const W = 1800, H = 900; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H);
const poses = [{}, { gait: 'trot', phase: 0.1 }, { gait: 'trot', phase: 0.4, mouth: 'pant' }, { sit: 1, headYaw: 0.9, mouth: 'pant' }, { crouch: 0.6, eyes: 'narrow', ears: 'back', mouth: 'growl' }, { gait: 'bound', phase: 0.25, mouth: 'bark' }, { headYaw: 1.3, eyes: 'happy', mouth: 'pant', sit: 1 }];
poses.forEach((p, i) => { ctx.save(); const x = 180 + (i % 4) * 430, y = 380 + Math.floor(i / 4) * 440; ctx.translate(x, y); ctx.scale(1.25, 1.25); S.draw(ctx, p, {}); ctx.restore(); });
ctx.save(); ctx.translate(1600, 800); ctx.scale(-1.25, 1.25); S.draw(ctx, { gait: 'trot', phase: 0.3 }, { flipped: true }); ctx.restore();
require('fs').writeFileSync('out/tests/shiba.png', cv.toBuffer('image/png'));
