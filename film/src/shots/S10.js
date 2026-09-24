'use strict';
// S10: Standoff at the canal. The robot rolls along the canal path; the shiba has followed him, leash trailing.
// The robot stops and turns; the shiba freezes stiff-legged, ears back, tail tight, growls, backs one step.
const L = require('./lib'); const { C, R, S } = L; const Cn = require('../sets/canal'); const { cached } = require('../engine/cache');
function leash(ctx, a, groundY, t, len = 160) { if (!a) return; const pts = [a, [a[0] + len * 0.4, a[1] + 60 + 8 * Math.sin(t * 5)], [a[0] + len, groundY]]; C.ink(ctx, C.qbez(pts[0], pts[1], pts[2], 14), { width: 3, color: '#3f6fb2', taper: 0, wobble: 0.5 }); }
module.exports = {
  smooth: false, look: 'morning', leash,
  async setup() { const cam = Cn.makeCam(); const plate = await cached('canal_S10_v1', () => Cn.build({ cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // robot
    const rr = L.seg(dt, 0, 2.7, L.ease.out); const rx = L.lerp(2.5, 0.75, rr), rz = L.lerp(2.2, 4.9, rr); const rp = L.at(cam, rx, rz);
    const turned = L.seg(dt, 2.9, 3.4); const ryaw = L.lerp(L.faceYaw(cam, -1.6, 3.2), L.cheat(L.faceYaw(cam, 1, 0.1), 0.85), turned);
    const startle = L.seg(dt, 3.7, 3.9) * (1 - L.seg(dt, 5.5, 6.2));
    const rpose = { yaw: ryaw, t: dt, wheel: -rz * 6, battery: 3, bob: rr < 1 ? 1.4 * Math.abs(Math.sin(dt * 13)) : 0, lean: -0.06 * startle, antenna: rr < 1 ? -0.15 : 0.35 * startle, headYaw: 0.1 * turned, screen: { mode: startle > 0.5 ? 'wide' : 'eyes', blink: L.blink(dt, [1.3, 6.4]) } };
    // shiba trots in from the right, freezes
    const sr = L.seg(dt, 1.6, 3.3, L.ease.out); const back = L.seg(dt, 5.0, 5.5); const sx = L.lerp(3.4, 2.05, sr) + 0.2 * back, sz = L.lerp(3.8, 4.6, sr) + 0.05 * back; const sp = L.at(cam, sx, sz);
    const frozen = dt > 3.3; const growl = dt > 3.8 && dt < 6.4;
    const spose = frozen ? { crouch: 0.35 + 0.1 * growl, eyes: 'narrow', ears: 'back', mouth: growl ? 'growl' : 'closed', tail: 1.15, headYaw: 0.5, t: dt, legsOverride: back > 0 && back < 1 ? { FL: [70, 0], FR: [78, -6 * Math.sin(back * Math.PI)], BL: [-60, 0], BR: [-52, 0] } : null, shake: growl ? 0.08 : 0 }
      : { gait: 'trot', phase: dt * 2.4, stride: 0.8, mouth: 'pant', tail: 1, t: dt, headYaw: 0.3 };
    // draw far-to-near
    const items = [[rz, () => L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light: { ambient: '#eeeaf8', ambientAmt: 0.1, rim: '#fff2d0', rimDir: [-2, -2], rimAlpha: 0.5 }, emissive: (c, st) => R.drawEmissive(c, rpose, st) })],
      [sz, () => { const a = L.drawChar(ctx, W, H, (c, st) => S.draw(c, spose, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: true }, { light: { ambient: '#eeeaf8', ambientAmt: 0.1, rim: '#fff2d0', rimDir: [-2, -2], rimAlpha: 0.5 } }); leash(ctx, a.collar, sp.y + 4, dt, 150 * sp.scale); }]];
    items.sort((a, b) => b[0] - a[0]).forEach(i => i[1]());
    // a willow in the near foreground sways across the top of frame
    Cn.willow(ctx, cam, -0.25, 2.6, 5.0, 91, Math.sin(t * 0.8) * 0.8, undefined, undefined, true);
  },
};
