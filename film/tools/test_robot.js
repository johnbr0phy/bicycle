const C = require('../src/engine/core'); const FX = require('../src/engine/fx'); const R = require('../src/chars/robot');
const W = 1920, H = 1080; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d');
ctx.fillStyle = '#f3ead8'; ctx.fillRect(0, 0, W, H);
const yaws = [0, 0.6, Math.PI / 2, 2.3, Math.PI, -0.6];
yaws.forEach((y, i) => { ctx.save(); ctx.translate(180 + i * 310, 470); ctx.scale(1.2, 1.2); R.draw(ctx, { yaw: y, battery: 4 - (i % 4) }, {}); ctx.restore(); });
const modes = ['eyes', 'happy', 'tired', 'sad', 'question', 'bike', 'bikeKid', 'wide', 'heart', 'off'];
modes.forEach((m, i) => { ctx.save(); ctx.translate(110 + i * 190, 1010); ctx.scale(0.62, 0.62); R.draw(ctx, { yaw: 0.25, screen: { mode: m }, headTilt: m === 'tired' ? 0.15 : m === 'question' ? -0.2 : 0, headNod: m === 'tired' ? 8 : 0, armL: m === 'happy' ? [1.6, 0.6, 0.8] : [0.18, 0.25, 0.4] }, {}); ctx.restore(); });
C.post(ctx, W, H, { paper: 0.35, vignette: 0.1 });
require('fs').writeFileSync(process.argv[2] || 'out/tests/robot.png', cv.toBuffer('image/png'));
