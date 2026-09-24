const C = require('../src/engine/core'); const R = require('../src/chars/robot');
const W = 1200, H = 900; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d');
ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, W, H);
ctx.save(); ctx.translate(380, 860); ctx.scale(2.6, 2.6); R.draw(ctx, { yaw: 0.45, headTilt: -0.08, screen: { mode: 'eyes', lookX: 0.3 }, armR: [0.3, 0.9, 0.8] }, { lw: 1 }); ctx.restore();
ctx.save(); ctx.translate(950, 860); ctx.scale(1.6, 1.6); R.draw(ctx, { yaw: -0.9, headNod: 10, headTilt: 0.2, screen: { mode: 'tired' }, battery: 1, armL: [0.05, 0.05, 0.2], armR: [0.05, 0.05, 0.2], antenna: 0.9 }, { lw: 1 }); ctx.restore();
require('fs').writeFileSync('out/tests/robot_close.png', cv.toBuffer('image/png'));
