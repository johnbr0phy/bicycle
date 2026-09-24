const C = require('../src/engine/core'); const L = require('../src/shots/lib');
const W = 1900, H = 800; const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#efe4cf'; ctx.fillRect(0, 0, W, H);
L.riding(ctx, W, H, { x: 300, y: 720, scale: 1.1 }, { view: 'side', stand: false, crank: 0.5, wheel: 0.3 }, { who: 'boy', yaw: 1.4, face: { eyes: 'open', mouth: 'open' } }, {});
L.riding(ctx, W, H, { x: 900, y: 720, scale: 1.1, flip: true }, { view: 'side', stand: false, crank: 1.5, wheel: 0.3 }, { who: 'boy', yaw: -1.4, face: { eyes: 'open' } }, {});
L.riding(ctx, W, H, { x: 1350, y: 720, scale: 1.1 }, { view: 'rear', crank: 0.8, lean: 0.06 }, { who: 'boy', yaw: Math.PI }, {});
L.riding(ctx, W, H, { x: 1700, y: 720, scale: 1.1 }, { view: 'front', crank: 0.3, bellRing: 0.5 }, { who: 'boy', yaw: 0, face: { eyes: 'open', mouth: 'smile' } }, {});
require('fs').writeFileSync('out/tests/ride.png', cv.toBuffer('image/png'));
