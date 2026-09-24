'use strict';
// S14: Kamo river. Very wide, long hold. Afternoon gold, people evenly spaced on the far bank, a heron in the
// shallows, a black kite circling. The robot and the shiba are small figures on the near path. He slows.
const L = require('./lib'); const { C, R, S } = L; const Rv = require('../sets/river'); const { cached } = require('../engine/cache'); const Bd = require('../chars/birds');
module.exports = {
  smooth: false, look: 'afternoon',
  async setup() { const cam = Rv.makeCam({ z: -5.5, y: 2.3, pitch: -0.12 }); const plate = await cached('river_wide_v3', () => Rv.buildWide({ cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // heron
    const hp = cam.p(3.2, Rv.WY, 13); const hk = cam.f / hp[2]; const step = L.seg(dt, 5.2, 5.6) * (1 - L.seg(dt, 5.6, 6.0)); Bd.heron(ctx, hp[0] + 0.25 * hk * L.seg(dt, 5.2, 6.0), hp[1], hk, dt, { step, neck: 1 - 0.5 * L.seg(dt, 2.5, 3.2) * (1 - L.seg(dt, 3.8, 4.4)) });
    // kite
    const ka = dt * 0.35; Bd.kite(ctx, W * 0.62 + Math.cos(ka) * 260, 150 + Math.sin(ka) * 60, 26, dt);
    // the pair on the path, walking left to right; he slows toward the end
    const u = L.kf(dt, [[0, 0], [5.5, 0.72], [8, 0.82]], (x) => x); const rx = L.lerp(-5.8, 2.2, u), rz = 2.6; const rp = L.at(cam, rx, rz);
    const slow = L.seg(dt, 4.5, 7);
    const rpose = { yaw: 1.15, t: dt, wheel: -rx * 6, battery: 2, bob: (1 - slow) * 1.4 * Math.abs(Math.sin(dt * 12)), antenna: L.lerp(-0.15, 0.4, slow), headNod: 6 * slow, screen: { mode: slow > 0.6 ? 'tired' : 'eyes' } };
    const light = { ambient: '#ffe8c8', ambientAmt: 0.25, rim: '#ffd890', rimDir: [-2, -1], rimAlpha: 0.9 };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, shadow: { dir: [0.9, 0.3], len: 1.1, alpha: 0.3 } });
    const sx = rx + 1.1 + 0.2 * Math.sin(dt * 0.7); const sp = L.at(cam, sx, rz - 0.15);
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'trot', phase: dt * 2.2, stride: 0.7, mouth: 'pant', t: dt, headYaw: 0.1 }, st), { x: sp.x, y: sp.y, scale: sp.scale }, { light, shadow: { dir: [0.9, 0.3], len: 0.9, alpha: 0.3 } });
  },
};
