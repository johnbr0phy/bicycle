const C = require('../src/engine/core'); const TW = require('../src/sets/templewall'); const LK = require('../src/engine/look'); const L = require('../src/shots/lib');
const set = TW.build({ raw: process.argv[2] === 'raw' }); const cam = set.cam; const cv = C.createCanvas(1920, 1080), ctx = cv.getContext('2d'); ctx.drawImage(set.plate, 0, 0);
const cats = [['boss', 5.2, 'sit'], ['kuro', 6.6, 'loaf'], ['bobtail', 8.0, 'sit'], ['extra1', 9.6, 'lie'], ['elder', 11.2, 'loaf']];
for (const [c, z, pose] of cats) { const p = L.at(cam, TW.WX - 0.12, z, TW.CAP - 0.08); L.drawChar(ctx, 1920, 1080, (cx, st) => L.K.draw(cx, { cat: c, pose, headYaw: 1.1, lookY: 0.6, t: z }, st), { x: p.x, y: p.y, scale: p.scale, flip: true }, { contact: { rx: 80, ry: 10, alpha: 0.3 } }); }
const rp = L.at(cam, 0.95, 5.0); L.drawChar(ctx, 1920, 1080, (cx, st) => L.R.draw(cx, { yaw: 1.2, headNod: -18, screen: { mode: 'bike', lookY: -1 } }, st), { x: rp.x, y: rp.y, scale: rp.scale }, {});
LK.finish(ctx, 1920, 1080, 'morning', 0); require('fs').writeFileSync('out/tests/wall.png', cv.toBuffer('image/png'));
