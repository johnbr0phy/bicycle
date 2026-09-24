'use strict';
// S17: One bar. Dusk rain by the canal. The robot rolls in and stops under a closed shop's awning, beside a
// vending machine. His chest: one bar, blinking. He sets the hat down on the bench beside him. His eyes dim.
const L = require('./lib'); const { C, R } = L; const Sf = require('../sets/shopfront'); const { cached } = require('../engine/cache'); const P = require('../props');
module.exports = {
  smooth: false, look: 'dusk', lookOver: { vignette: 0.32 },
  async setup() { const cam = Sf.makeCam(); const plate = await cached('shop_dusk_v2', () => Sf.build({ tod: 'dusk', cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // puddles and ground wetness under the awning edge
    const light = { ambient: '#a890b8', ambientAmt: 0.4, rim: '#ffb880', rimDir: [2, -2], rimAlpha: 0.5 };
    const arrive = L.seg(dt, 0, 3.2, L.ease.out); const rz = L.lerp(-5.2, -0.9, arrive), rx = 2.1; const rp = L.at(cam, rx, rz);
    const set = L.seg(dt, 4.0, 5.0); const dim = L.seg(dt, 5.6, 7.2);
    const pose = { yaw: arrive < 1 ? L.faceYaw(cam, 0, 1) : L.lerp(L.faceYaw(cam, 0, 1), L.faceYaw(cam, -1, 0.15), L.seg(dt, 3.2, 3.8)), t: dt, wheel: -rz * 6, battery: 1, batteryBlink: true, bob: arrive < 1 ? 1.2 * Math.abs(Math.sin(dt * 10)) : 0, wet: 0.9,
      antenna: arrive < 1 ? 0.1 : 0.2 + 0.5 * dim, headNod: 10 * dim + 4 * set, headTilt: 0.1 * dim, armR: [0.15 + 1.0 * set * (1 - L.seg(dt, 5.0, 5.6)), 0.6 * set, 0.3], armL: [0.05, 0.1, 0.2], screen: { mode: dim > 0.5 ? 'tired' : 'eyes', bright: 1 - 0.55 * dim, blink: L.blink(dt, [2.0]) }, squash: 0.02 * dim };
    const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    L.screenGlow(ctx, a, rp.scale, '#9fe8ff', 0.25 * (1 - dim * 0.6));
    // the hat: in his gripper, then set on the bench
    const hk = rp.scale * 353;
    if (set < 0.9 && a.gripR) P.schoolHat(ctx, a.gripR[0], a.gripR[1] - 4, 0.12 * hk, 0.1);
    else { const b = cam.p(2.75, 0.44, -1.7); P.schoolHat(ctx, b[0], b[1], 0.12 * hk * 1.05, -0.05); }
    // rain: heavier, with splashes on the street
    P.rain(ctx, W, H, env.drawIdx, { count: 650, alpha: 0.5, color: '#e8d8f0', len: 46, slant: 0.12 });
    const pts = []; const Rg = new C.Rng(3); for (let i = 0; i < 60; i++) { const q = cam.p(Rg.range(-0.6, 1.6), 0, Rg.range(-6, 6)); if (q) pts.push([q[0], q[1], 16 * cam.f / q[2] / 300]); } P.splashes(ctx, pts, env.drawIdx, { p: 0.4, color: '#f0e0f0' });
  },
};
