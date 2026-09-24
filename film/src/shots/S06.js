'use strict';
// S06: The decision. The wide lane from S02. He looks at the closed door, then at the spot. His screen shows a
// bicycle. He straightens his bent antenna, turns, and rolls away up the lane toward the light.
const L = require('./lib'); const { C, R } = L; const P = require('../props');
module.exports = {
  smooth: false, look: 'dawn',
  async setup() { const s = await L.lanePlate('lane_dawn_A_v3', 'dawn', {}, {}); s.noren = [{ side: -1, hw: 2.25, z0: 6.85, z1: 8.95 }, { side: 1, hw: 2.25, z0: 12.5, z1: 14.9 }]; return s; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    for (const n of s.noren) P.noren(ctx, cam, n, dt, { wind: 0.8, color: '#66687e' });
    const roll = L.seg(dt, 4.3, 7.0, L.ease.in);
    const x = L.lerp(1.45, 0.25, roll), z = L.lerp(7.7, 13.2, roll);
    const pos = L.at(cam, x, z);
    const yawBody = dt < 3.9 ? L.faceToward(cam, [1.45, 7.7], [2.25, 4.55]) : L.lerp(L.faceToward(cam, [1.45, 7.7], [2.25, 4.55]), L.faceYaw(cam, -0.15, 1), L.seg(dt, 3.9, 4.4));
    const lookSpot = L.faceToward(cam, [1.45, 7.7], [1.9, 6.3]) - yawBody;
    const headYaw = dt < 1.5 ? 0 : dt < 3.9 ? L.kf(dt, [[1.5, 0], [1.9, lookSpot]]) : L.kf(dt, [[3.9, lookSpot], [4.3, 0]]);
    const nod = L.kf(dt, [[1.5, 0], [1.9, 10], [2.8, 10], [3.0, 0]]);
    const glyph = dt > 2.6 && dt < 4.6 ? 'bike' : 'eyes';
    const ant = dt < 3.1 ? 0.45 : L.kf(dt, [[3.1, 0.45], [3.4, -0.25], [3.55, 0.12], [3.7, -0.05], [3.85, 0]]);
    const grip = dt > 2.9 && dt < 3.6;
    const moving = roll > 0 && roll < 1;
    const pose = { yaw: yawBody, headYaw, headNod: nod, t: dt, battery: 4, antenna: moving ? -0.18 + 0.08 * Math.sin(dt * 11) : ant, wheel: -z * 6, bob: moving ? 1.5 * Math.abs(Math.sin(dt * 14)) : 0,
      armL: grip ? [L.kf(dt, [[2.9, 0.2], [3.1, 2.6]]), 1.4, 0.7] : [0.12, 0.2, 0.3], armR: [0.12, 0.2, 0.3], screen: { mode: glyph, blink: L.blink(dt, [0.9, 5.2]) } };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: pos.x, y: pos.y, scale: pos.scale }, { light: { ambient: '#b8b0e0', ambientAmt: 0.32, rim: '#ffe2b0', rimDir: [0, -3], rimAlpha: 0.9 }, shadow: { dir: [0.25, 1], len: 0.9, alpha: 0.3 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    ctx.drawImage(s.fg, 0, 0);
  },
};
