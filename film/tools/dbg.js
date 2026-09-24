const L = require('/home/user/bicycle/film/src/shots/lib'); const { C } = L; const Gk = require('/home/user/bicycle/film/src/sets/genkan'); const { loadImage, createCanvas } = require('/home/user/bicycle/film/node_modules/canvas');
(async () => { const img = await loadImage('/home/user/bicycle/film/out/cache/genkan_plate_v1.png'); const W = 1920, H = 1080; const cv = createCanvas(W, H), ctx = cv.getContext('2d');
const cam = Gk.makeCam(1); const pos = L.at(cam, 0.3, 1.75); console.log('pos', pos); const v = L.view(W, H, 1.75, pos.x, pos.y - 106 * pos.scale);
ctx.save(); v.apply(ctx); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); require('fs').writeFileSync('/home/user/bicycle/film/out/tests/dbg.png', cv.toBuffer()); })();
