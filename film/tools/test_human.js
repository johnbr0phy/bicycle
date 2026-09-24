const C = require('../src/engine/core'); const Hm = require('../src/chars/human');
const W = 1900, H = 1000; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H);
const ws = [{ yaw: 0 }, { yaw: 0.7, face: { mouth: 'hum', eyes: 'smile' } }, { yaw: 1.57, prop: 'kettle', arms: { R: [0.3, 1.2] } }, { yaw: Math.PI }, { yaw: 0.6, face: { eyes: 'down' }, headNod: 10 }, { yaw: 1.4, walk: { phase: 0.2, stride: 1.2, run: 1 }, bend: 0.35, hands: { L: [120, -330], R: [140, -320] } }];
ws.forEach((p, i) => { ctx.save(); ctx.translate(140 + i * 300, 560); ctx.scale(0.95, 0.95); Hm.draw(ctx, Object.assign({ who: 'woman' }, p), {}); ctx.restore(); });
const bs = [{ yaw: 0.3, face: { eyes: 'open' } }, { yaw: 0.8, face: { eyes: 'open', mouth: 'wobble', tears: 1, brows: 1 }, knee: 1 }, { yaw: 1.57, walk: { phase: 0.3 } }, { yaw: 1.4, bend: 1.2, face: { eyes: 'closed' } }];
bs.forEach((p, i) => { ctx.save(); ctx.translate(200 + i * 330, 990); ctx.scale(0.9, 0.9); Hm.draw(ctx, Object.assign({ who: 'boy' }, p), {}); ctx.restore(); });
require('fs').writeFileSync('out/tests/human.png', cv.toBuffer('image/png'));
