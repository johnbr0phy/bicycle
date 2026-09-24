'use strict';
// S27 — Morning again. The same framing as S02. Dawn. The spot is not empty: the bicycle stands in it, the robot
// charges beside it (a cable runs in through the lattice, one bar and rising), the shiba sleeps against his wheel,
// and the grey tabby is curled on the saddle. The noren moves. Fade to paper.
const L = require('./lib'); const { C, R, S, K, B } = L; const P = require('../props');
module.exports = {
  smooth: false, look: 'dawn',
  async setup() { const s = await L.lanePlate('lane_dawn_A_v3', 'dawn', {}, {}); s.noren = [{ side: -1, hw: 2.25, z0: 6.85, z1: 8.95 }, { side: 1, hw: 2.25, z0: 12.5, z1: 14.9 }]; return s; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    for (const n of s.noren) P.noren(ctx, cam, n, dt, { wind: 0.8, color: '#66687e' });
    const light = { ambient: '#b8b0e0', ambientAmt: 0.3, rim: '#ffe2b0', rimDir: [0, -3], rimAlpha: 0.9 };
    // the bicycle in its spot, seen from behind at an angle
    const bp = L.at(cam, 1.88, 6.3); const bA = L.drawChar(ctx, W, H, (c, st) => B.draw(c, { yaw: 1.18, stand: true, t: dt }, st), { x: bp.x, y: bp.y, scale: bp.scale, flip: false }, { light, contact: { rx: 120, ry: 20, alpha: 0.4 }, shadow: { dir: [0.25, 1], len: 0.7, alpha: 0.25 } });
    // the grey cat curled on the saddle
    if (bA.saddle) L.drawChar(ctx, W, H, (c, st) => K.draw(c, { cat: 'boss', pose: 'loaf', headYaw: 1.3, eyes: 'closed', t: dt, breathe: 0.5, tailAmp: 0.2 }, st), { x: bA.saddle[0] + 4, y: bA.saddle[1] + 4, scale: bp.scale * 0.95, flip: true }, { light, contact: false });
    // the robot charging beside it, the cable to the house, bars filling
    const rp = L.at(cam, 1.2, 6.7); const charge = 1 + (Math.floor(dt * 1.2) % 3 === 2 ? 1 : 0); const wake = L.seg(dt, 5.2, 5.8);
    const pose = { yaw: L.faceToward(cam, [1.2, 6.7], [0.4, 3.0]) * 0.6, t: dt, battery: dt > 6.5 ? 2 : charge, headNod: 10 * (1 - wake), antenna: 0.4 * (1 - wake), cloth: true, screen: { mode: wake > 0.5 ? 'eyes' : 'tired', bright: 0.25 + 0.75 * wake, blink: L.blink(dt, [6.6]) } };
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    const plug = cam.p(2.24, 0.45, 7.3); if (plug && ra.chest) C.ink(ctx, C.qbez([ra.chest[0] + 14 * rp.scale, ra.chest[1] + 40 * rp.scale], [(plug[0] + ra.chest[0]) / 2, Math.max(plug[1], ra.chest[1]) + 60 * rp.scale], [plug[0], plug[1]], 14), { width: Math.max(1.5, 5 * rp.scale), color: '#3a3438', taper: 0, wobble: 0.4 });
    // the shiba asleep against his wheel
    const sp = L.at(cam, 0.8, 6.55); L.drawChar(ctx, W, H, (c, st) => S.draw(c, { lie: 1, headDown: 1, eyes: 'closed', tail: 1, t: dt, bob: 1.2 * Math.sin(dt * 2) }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: true }, { light });
    ctx.drawImage(s.fg, 0, 0);
  },
  after(ctx, t, s, env) { const a = L.seg(t, 6.2, 8.0); if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#f2e8d5'; ctx.fillRect(0, 0, env.W, env.H); ctx.restore(); C.post(ctx, env.W, env.H, { paper: 0.3 * a, vignette: 0 }); } },
};
