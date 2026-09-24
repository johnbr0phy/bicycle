const C = require('../src/engine/core'); const B = require('../src/chars/bicycle');
const W = 1600, H = 700; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H);
ctx.save(); ctx.translate(420, 600); ctx.scale(1.1, 1.1); B.draw(ctx, { wheel: 0.3 }, {}); ctx.restore();
ctx.save(); ctx.translate(1100, 600); ctx.scale(-0.8, 0.8); B.draw(ctx, { wheel: 1.1, stand: false, bellRing: 0.5, yaw: 0.5 }, {}); ctx.restore();
ctx.save(); ctx.translate(1400, 640); ctx.scale(0.3, 0.3); ctx.fillStyle = '#223'; B.draw(ctx, {}, { noLines: false }); ctx.restore();
require('fs').writeFileSync('out/tests/bike.png', cv.toBuffer('image/png'));
