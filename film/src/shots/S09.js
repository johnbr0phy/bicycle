'use strict';
// S09: East. Looking up past the robot's head at the grey tabby on the wall. It studies the glyph, then slowly
// turns its head to screen right and holds. The robot follows its gaze. The cat closes its eyes.
const L = require('./lib'); const { C, R, K } = L; const TW = require('../sets/templewall'); const { cached } = require('../engine/cache');
module.exports = {
  smooth: false, look: 'morning',
  async setup() { const cam = TW.makeCam({ x: -2.5, y: 0.9, z: 4.1, yaw: 1.2, pitch: 0.47, f: 3500 }); const plate = await cached('wall_S09_v3', () => TW.build({ cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    const p = L.at(cam, TW.WX - 0.14, 5.6, TW.CAP - 0.1);
    const turn = L.seg(dt, 2.2, 3.6, L.ease.inOut); const close = L.seg(dt, 5.4, 5.9);
    const cp = { cat: 'boss', pose: 'sit', headYaw: L.lerp(1.2, 0.15, turn), headTilt: L.lerp(0.1, -0.05, turn), lookY: 0.6 * (1 - turn), lookX: L.lerp(-0.2, 0.6, turn), pupil: 0.28, t: dt, tailAmp: 0.6, blink: L.blink(dt, [1.4]), eyes: close > 0.5 ? 'closed' : 'open', whisker: 0.3 * Math.sin(dt * 2) };
    L.drawChar(ctx, W, H, (cx, st) => K.draw(cx, cp, st), { x: p.x, y: p.y, scale: p.scale, flip: false }, { contact: { rx: 70, ry: 8, alpha: 0.3 }, light: { rim: '#fff6dc', rimDir: [-2, -2], rimAlpha: 0.6 } });
  },
};
