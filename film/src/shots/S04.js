'use strict';
// S04 — He sees it. Reverse angle down the lane: the empty spot in the foreground, the open door behind.
// He rolls out, notices the pale rectangle, a question mark, rolls up to it, looks left, looks right.
const L = require('./lib'); const { C, R } = L;
module.exports = {
  smooth: false, look: 'dawn',
  async setup() { return await L.lanePlate('lane_dawn_S04b', 'dawn', { x: 0.8, y: 0.8, z: 8.6, yaw: 2.87, pitch: 0.05 }, { fg: false, homeDoor: 'open' }); },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    const x = L.kf(dt, [[0, 2.45], [1.2, 1.7], [3.0, 1.7], [4.1, 1.5]]), z = L.kf(dt, [[0, 4.55], [1.2, 4.95], [3.0, 4.95], [4.1, 5.95]]);
    const pos = L.at(cam, x, z);
    const moving = (dt < 1.2) || (dt > 3.0 && dt < 4.1);
    const bodyDir = dt < 1.2 ? [-1, 0.3] : dt < 3.0 ? [-0.2, 1] : [-0.1, 1];
    const yaw = L.faceYaw(cam, ...bodyDir);
    const look = dt < 1.4 ? 0 : dt < 4.3 ? L.kf(dt, [[1.4, 0], [1.8, 0.45]]) : L.kf(dt, [[4.3, 0.2], [4.7, -0.9], [5.1, -0.9], [5.4, 0.8], [5.8, 0.8], [6.0, 0.3]]);
    const nod = L.kf(dt, [[1.5, 0], [1.9, 12], [2.9, 12], [3.2, 2], [4.2, 8], [4.5, 0]]);
    const q = dt > 2.4 && dt < 4.4;
    const pose = { yaw, headYaw: look, headNod: nod, headTilt: q ? -0.15 : 0, t: dt, wheel: -(x + z) * 5, battery: 4, antenna: moving ? -0.2 + 0.08 * Math.sin(dt * 10) : L.kf(dt, [[2.4, 0.4], [2.7, -0.15], [3.0, 0]]), bob: moving ? 1.5 * Math.abs(Math.sin(dt * 13)) : 0,
      screen: { mode: q ? 'question' : 'eyes', lookY: nod > 6 ? 0.8 : 0, lookX: look * 0.4, blink: L.blink(dt, [1.3, 5.3]) } };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: pos.x, y: pos.y, scale: pos.scale }, { light: { ambient: '#b8b0e0', ambientAmt: 0.3, rim: '#ffe2b0', rimDir: [-2, -2], rimAlpha: 0.7 }, shadow: { dir: [0.3, 1], len: 0.6, alpha: 0.25 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
  },
};
