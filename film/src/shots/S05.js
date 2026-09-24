'use strict';
// S05 — She looks at it. From the robot's height near the spot, the open doorway. She comes out humming with the
// kettle, sees the empty stone, stops humming mid-phrase, looks for three full seconds, turns and goes in.
// The door slides shut on the robot, whose head is a silhouette at frame left.
const L = require('./lib'); const { C, R, Hm, FX } = L; const K = require('../sets/kit');
module.exports = {
  smooth: false, look: 'dawn',
  async setup() { return await L.lanePlate('lane_dawn_S05c', 'dawn', { x: 0.55, y: 0.85, z: 6.9, yaw: 2.45, pitch: 0.13 }, { fg: false, homeDoor: 'open' }); },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // her path: from inside the house to the threshold and back
    const wx = L.kf(dt, [[0, 3.3], [1.3, 2.35], [5.7, 2.35], [6.6, 3.4]]); const wz = 4.5;
    const walking = (dt < 1.3) || (dt > 5.6 && dt < 6.6);
    const toward = dt < 5.6 ? L.faceYaw(cam, -1, 0.35) : L.faceYaw(cam, 1, 0.1);
    const turn = L.seg(dt, 5.45, 5.9); const yaw = dt < 5.45 ? L.faceYaw(cam, -1, 0.35) : L.lerp(L.faceYaw(cam, -1, 0.35), L.faceYaw(cam, 1, -0.3) - (L.faceYaw(cam, 1, -0.3) > 0 ? 0 : 0), turn);
    const pos = L.at(cam, wx, wz);
    const seeing = dt > 2.5 && dt < 5.7;
    const humming = dt < 2.6;
    const face = { eyes: seeing ? 'down' : dt < 2.5 ? 'smile' : 'open', mouth: humming ? 'hum' : 'closed', brows: seeing ? L.kf(dt, [[2.6, 0], [3.4, 0.5]]) : 0, blink: L.blink(dt, [4.3]) };
    const pose = { who: 'woman', yaw, headYaw: seeing ? L.kf(dt, [[2.5, 0], [2.9, -0.35]]) : humming ? 0.08 * Math.sin(dt * 3.4) : 0, headNod: seeing ? L.kf(dt, [[2.5, 0], [3.0, 16], [5.3, 18]]) : 0, headTilt: humming ? 0.05 * Math.sin(dt * 3.4) : seeing ? 0.06 : 0,
      walk: walking ? { phase: dt * 1.1, stride: 0.55 } : null, prop: 'kettle', arms: { R: [0.25, seeing ? L.kf(dt, [[2.6, 1.15], [4.5, 0.85]]) : 1.15], L: [0.05, 0.3] }, face, t: dt };
    // interior shadow: she is dimmer while inside the house
    const inside = L.clamp((wx - 2.3) / 0.9, 0, 1);
    const clip = [cam.pc(2.25, 0.2, 3.85), cam.pc(2.25, 0.2, 5.25), cam.pc(2.25, 2.2, 5.25), cam.pc(2.25, 2.2, 3.85)];
    ctx.save();
    if (inside > 0.02) { ctx.beginPath(); ctx.moveTo(clip[0][0], clip[0][1] + 400); ctx.lineTo(clip[1][0], clip[1][1] + 400); ctx.lineTo(clip[2][0], clip[2][1]); ctx.lineTo(clip[3][0], clip[3][1]); ctx.closePath(); ctx.clip(); }
    L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, pose, st), { x: pos.x, y: pos.y, scale: pos.scale }, { light: { ambient: '#8a86b8', ambientAmt: 0.3 + 0.45 * inside, rim: '#ffe2b0', rimDir: [-2, -2], rimAlpha: 0.6 * (1 - inside) }, contact: { rx: 110, ry: 22, alpha: 0.35 * (1 - inside) } });
    ctx.restore();
    // the door slides shut (lattice panel travels along the facade from z=5.25 toward 3.85)
    const shut = L.seg(dt, 6.55, 7.25, L.ease.inOut);
    if (shut > 0) {
      const zb = 5.25, za = zb - 1.4 * shut; const X = 2.25 - 0.02;
      const P = (z, y) => { const p = cam.pc(X, y, z); return [p[0], p[1]]; };
      C.cel(ctx, [P(za, 0.2), P(zb, 0.2), P(zb, 2.2), P(za, 2.2)], '#d9ccd0');
      ctx.save(); ctx.globalAlpha = 0.9; for (let i = 0; i <= 10; i++) { const z = za + (zb - za) * i / 10; C.ink(ctx, [P(z, 0.2), P(z, 2.2)], { width: 2.2, color: '#4a3a44', taper: 0, wobble: 0.3 }); } for (let k = 0; k < 4; k++) C.ink(ctx, [P(za, 0.6 + k * 0.5), P(zb, 0.6 + k * 0.5)], { width: 1.5, color: '#4a3a44', taper: 0 }); C.cel(ctx, [P(za, 0.2), P(zb, 0.2), P(zb, 0.5), P(za, 0.5)], '#5a4550'); ctx.restore();
      C.ink(ctx, [P(za, 0.2), P(za, 2.2)], { width: 5, color: '#3a2c34', taper: 0 });
    }
    // foreground: the robot's head and shoulder, soft silhouette at frame left (over the shoulder)
    const fw = [Math.sin(cam.yaw), Math.cos(cam.yaw)], rt = [Math.cos(cam.yaw), -Math.sin(cam.yaw)]; const rp = L.at(cam, cam.x + fw[0] * 1.05 - rt[0] * 0.62, cam.z + fw[1] * 1.05 - rt[1] * 0.62); const droop = L.seg(dt, 7.2, 7.8);
    const rpose = { yaw: Math.PI - 0.35, headNod: 4 + 6 * droop, antenna: 0.5 * droop, screen: { mode: 'off' }, t: dt };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light: { ambient: '#5a5488', ambientAmt: 0.55 }, contact: false, blur: 0 });
  },
};
