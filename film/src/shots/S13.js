'use strict';
// S13: The cap. Close and low by a fish crate. The white bobtail sits on something yellow: a child's school hat.
// The robot notices; the cat will not move. The shiba barks; the cat hisses and hops off. The robot lifts the hat
// and turns it over: a name written inside in a child's hand.
const L = require('./lib'); const { C, FX, R, S, K } = L; const M = require('../sets/market'); const { cached } = require('../engine/cache'); const P = require('../props'); const { Cam } = require('../engine/persp');
function crate(ctx, cam, x, z, w, d, h) { const q = (pts, col) => { const P2 = pts.map(p => cam.pc(...p)).map(p => [p[0], p[1]]); C.cel(ctx, P2, col); C.ink(ctx, P2, { closed: true, width: 2.6, color: '#3a2c28', taper: 0, wobble: 0.6 }); return P2; };
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  q([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]], '#d9c49a'); const f = q([[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], '#c4a878'); q([[x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]], '#a88c60');
  for (let i = 1; i < 3; i++) { const y = h * i / 3; const a = cam.pc(x0, y, z0), b = cam.pc(x1, y, z0); C.ink(ctx, [[a[0], a[1]], [b[0], b[1]]], { width: 1.6, color: '#7a6040', taper: 0 }); }
  const lab = cam.pc(x, h * 0.5, z0); ctx.save(); ctx.fillStyle = '#3a4a8a'; ctx.font = `${Math.round(0.07 * cam.f / lab[2])}px Yuji`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('舞鶴港', lab[0], lab[1]); ctx.restore(); }
module.exports = {
  smooth: false, look: 'noon',
  async setup({ W, H }) {
    const bcam = M.makeCam({ x: -0.4, y: 0.55, z: -0.5, yaw: 0.35, pitch: 0.04 });
    const bg = await cached('S13_bg_v1', () => FX.blurCanvas(M.build({ cam: bcam }).plate, 9, 1));
    return { bg, cam: new Cam({ x: 0, y: 0.5, z: 0, yaw: 0, pitch: -0.08, f: 1500, W, H }) };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.bg, 0, 0);
    // floor tint under the foreground
    ctx.save(); const g = ctx.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(201,194,184,0)'); g.addColorStop(1, 'rgba(201,194,184,0.9)'); ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H); ctx.restore();
    const light = { ambient: '#f8f4ff', ambientAmt: 0.06, rim: '#fff6e0', rimDir: [0, -2.5], rimAlpha: 0.45 };
    const cz = 2.2, cx = 0.28, ch = 0.36; { const b = cam.p(cx, 0, cz - 0.21); L.CP.contactShadow(ctx, b[0], b[1] + 4, 230, 28, '#2a2240', 0.5); } crate(ctx, cam, cx, cz, 0.62, 0.42, ch);
    // hat on the crate (visible until lifted)
    const hop = L.seg(dt, 3.9, 4.35); const lifted = L.seg(dt, 5.0, 5.6);
    const hatTop = cam.p(cx - 0.02, ch, cz - 0.05); const hk = cam.f / hatTop[2];
    if (lifted <= 0) P.schoolHat(ctx, hatTop[0], hatTop[1] - 0.01 * hk, 0.13 * hk, -0.06);
    // bobtail sitting on the hat, then hopping off to the right
    const cpos = cam.p(cx - 0.02 + hop * 0.9, ch * (1 - hop) + 0.35 * Math.sin(Math.PI * hop), cz - 0.02 - hop * 0.3);
    if (dt < 4.6) { const hiss = dt > 3.55 && dt < 4.0; const cp = { cat: 'bobtail', pose: hop > 0 ? 'crouch' : 'sit', poseTo: hop > 0 ? 'walk' : null, blend: hop * 1.6, phase: 0.1, headYaw: hiss ? 0.9 : L.kf(dt, [[0, 1.3], [1.8, 1.3], [2.2, 0.6], [3.0, 1.2]]), eyes: hiss ? 'narrow' : dt < 1.8 ? 'half' : 'open', ears: hiss ? 'flat' : 'up', mouth: hiss ? 'hiss' : 'closed', pupil: 0.3, t: dt, tailAmp: 0.5, headDY: hiss ? 6 : 0, blink: L.blink(dt, [1.0]) };
      L.drawChar(ctx, W, H, (c, st) => K.draw(c, cp, st), { x: cpos[0], y: cpos[1], scale: (cam.f / cpos[2]) / L.UNITS, flip: hop > 0 ? false : true }, { light, contact: hop > 0 ? false : { rx: 60, ry: 10, alpha: 0.3 } }); }
    // robot at left, facing the crate; reaches and lifts the hat, turns it over
    const rp = L.at(cam, -0.42, 2.45); const reach = L.seg(dt, 4.7, 5.1) * (1 - L.seg(dt, 7.4, 8)); const look = dt > 1.2;
    const rpose = { yaw: 0.95, headNod: look ? L.kf(dt, [[1.2, 0], [1.6, 12]]) : 0, headTilt: L.kf(dt, [[1.5, 0], [1.8, -0.15], [2.5, -0.15], [2.8, 0]]), t: dt, battery: 3, screen: { mode: dt > 1.6 && dt < 2.6 ? 'question' : dt > 5.9 ? 'wide' : 'eyes', lookX: 0.6, lookY: 0.6 },
      armL: [L.lerp(0.15, 1.35, reach) + 0.25 * L.seg(dt, 5.3, 5.8), L.lerp(0.25, 0.5, reach), L.lerp(0.4, 0.9, L.seg(dt, 4.7, 4.9)) * (1 - L.seg(dt, 5.0, 5.2) * 0.6)], antenna: L.kf(dt, [[3.4, 0], [3.55, 0.4], [3.75, -0.2], [3.95, 0]]) };
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, rpose, st) });
    // shiba enters from the left behind the robot and barks
    const sIn = L.seg(dt, 2.6, 3.3, L.ease.out); if (sIn > 0) { const sp = L.at(cam, L.lerp(-1.9, -1.02, sIn), 1.95); const bark = dt > 3.35 && dt < 3.7;
      L.drawChar(ctx, W, H, (c, st) => S.draw(c, sIn < 1 ? { gait: 'trot', phase: dt * 2.4, stride: 0.8, t: dt, mouth: 'pant' } : { mouth: bark ? 'bark' : dt > 3.7 && dt < 4.6 ? 'pant' : 'closed', headLift: bark ? 1 : 0, headYaw: 0.4, eyes: dt > 3.9 ? 'happy' : 'open', tail: 1, wag: dt > 3.9 ? 1 : 0, t: dt }, st), { x: sp.x, y: sp.y, scale: sp.scale }, { light }); }
    if (lifted > 0 && ra.gripL) { const flip = L.seg(dt, 5.8, 6.4); P.schoolHat(ctx, ra.gripL[0] + 10, ra.gripL[1] + 6, 0.13 * hk, L.lerp(-0.2, 0.1, flip), { upside: flip > 0.5 }); }
  },
};
