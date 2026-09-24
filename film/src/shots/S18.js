'use strict';
// S18: The low point. Night. Close on the robot under the awning, the vending machine the only warm light.
// His bicycle glyph flickers and goes out. Hold: only the rain moves. Then the soaked shiba trots in, drops a small
// object at his wheel and stands panting. His eyes come back on. He picks it up: a bicycle bell. He presses the
// lever. Clack.
const L = require('./lib'); const { C, R, S } = L; const Sf = require('../sets/shopfront'); const { cached } = require('../engine/cache'); const P = require('../props');
function bell(ctx, x, y, s, shake = 0) { ctx.save(); ctx.translate(x + shake, y); C.celEllipse(ctx, 0, 0, s, s * 0.8, '#c9c3b2'); C.celEllipse(ctx, 0, s * 0.25, s, s * 0.4, '#8a8478'); C.celEllipse(ctx, -s * 0.3, -s * 0.3, s * 0.35, s * 0.2, '#fffdf0', 0.8); C.inkEllipse(ctx, 0, 0, s, s * 0.8, { width: 2, color: '#3a2c28' }); C.celCircle(ctx, 0, -s * 0.85, s * 0.2, '#3a2c28'); C.ink(ctx, [[s * 0.6, s * 0.2], [s * 1.3, s * 0.5]], { width: Math.max(1.5, s * 0.18), color: '#8a857a', taper: 0 }); ctx.restore(); }
module.exports = {
  smooth: false, look: 'night', lookOver: { vignette: 0.45 }, bell,
  async setup() { const cam = Sf.makeCam({ x: -0.8, y: 0.95, z: 1.2, yaw: 1.6, f: 1450, pitch: -0.02 }); const plate = await cached('shop_night_S18_v3', () => Sf.build({ tod: 'night', cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // vending machine light: a pool on the ground and a glow
    if (!s.glowLayer) { const G = L.FX.newCanvas(W, H), gx = G.getContext('2d'); const X = Sf.FX0 - 0.75; const win = [[X, 1.05, 1.83], [X, 1.05, 2.67], [X, 1.72, 2.67], [X, 1.72, 1.83]].map(q => cam.pc(...q)); gx.fillStyle = '#fff6d8'; gx.beginPath(); win.forEach((q, i) => i ? gx.lineTo(q[0], q[1]) : gx.moveTo(q[0], q[1])); gx.closePath(); gx.fill();
      const pool = cam.p(X - 0.8, 0, 2.2); gx.save(); gx.translate(pool[0], pool[1]); gx.scale(1, 0.16); const rg = gx.createRadialGradient(0, 0, 0, 0, 0, 700); rg.addColorStop(0, 'rgba(255,244,210,0.8)'); rg.addColorStop(1, 'rgba(255,244,210,0)'); gx.fillStyle = rg; gx.beginPath(); gx.arc(0, 0, 700, 0, Math.PI * 2); gx.fill(); gx.restore();
      s.glowLayer = C.keep(L.FX.blurCanvas(G, 26, 2)); s.winLayer = C.keep(G); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.3; ctx.drawImage(s.winLayer, 0, 0); ctx.globalAlpha = 0.9; ctx.drawImage(s.glowLayer, 0, 0); ctx.restore();
    const rp = L.at(cam, 2.15, 0.9);
    const off = L.seg(dt, 1.2, 1.3) > 0 && dt < 5.8; const flick = dt > 0.6 && dt < 1.3 ? ((env.drawIdx % 3) === 0 ? 0.2 : 1) : 1;
    const back = L.seg(dt, 5.9, 6.4); const pick = L.seg(dt, 6.5, 7.1); const press = dt > 7.9 && dt < 8.2;
    const pose = { yaw: L.faceYaw(cam, -1, 0.35), t: dt, battery: 1, batteryBlink: true, wet: 1, squash: 0.03 * (1 - back),
      antenna: L.lerp(0.75, 0.1, back), headNod: L.lerp(18, 6, back) + 10 * pick * (1 - L.seg(dt, 7.2, 7.6)), headTilt: L.lerp(0.18, 0, back),
      armR: [L.lerp(0.02, 0.9, pick), L.lerp(0.05, 1.2, pick), 0.4], armL: [0.02, 0.05, 0.2],
      screen: { mode: dt < 1.3 ? 'bike' : off ? 'off' : dt < 7.6 ? 'eyes' : 'eyes', bright: dt < 1.3 ? flick : back, lookY: pick > 0 && pick < 1 ? 0.8 : 0.3, blink: L.blink(dt, [6.9]) } };
    const light = { ambient: '#3a3f78', ambientAmt: 0.5, rim: '#fff0c8', rimDir: [-3, -1], rimAlpha: 0.9 };
    const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, contact: { rx: 130, ry: 22, alpha: 0.5 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    if (!off) L.screenGlow(ctx, a, rp.scale, '#9fe8ff', 0.3 * (dt < 1.3 ? flick : back));
    // the soaked shiba comes in from screen left, drops the bell, pants
    const sIn = L.seg(dt, 3.6, 5.0, L.ease.out); const sz = L.lerp(4.5, 1.9, sIn); const sp = L.at(cam, 2.05, sz);
    const drop = dt > 5.2; const bellG = cam.p(2.1, 0.03, 1.45);
    if (sIn > 0) { const spose = sIn < 1 ? { gait: 'trot', phase: dt * 2.2, stride: 0.7, t: dt, wet: 1, mouth: 'closed', tail: 0.75 } : { t: dt, wet: 1, mouth: drop ? 'pant' : 'closed', headDown: 0, headLift: drop ? 0 : -0.5, headYaw: 0.6, tail: 0.8, wag: drop ? 0.6 : 0, eyes: 'open', shake: dt > 8.4 ? 0.5 : 0 };
      const sa = L.drawChar(ctx, W, H, (c, st) => S.draw(c, spose, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: false }, { light: { ambient: '#3a3f78', ambientAmt: 0.45, rim: '#fff0c8', rimDir: [-3, -1], rimAlpha: 0.9 } });
      if (!drop && sa.mouth) bell(ctx, sa.mouth[0], sa.mouth[1] + 4, 12 * sp.scale * 3); s.mouth = sa.mouth; }
    // the bell on the ground, then in his gripper
    if (drop && pick < 0.95 && bellG) { const bounce = L.seg(dt, 5.2, 5.5); bell(ctx, bellG[0], bellG[1] - 30 * Math.sin(Math.PI * bounce) * (1 - bounce) - 10, 13 * rp.scale * 3); }
    if (pick >= 0.95 && a.gripR) bell(ctx, a.gripR[0] + 4, a.gripR[1], 13 * rp.scale * 3, press ? 3 * Math.sin(dt * 90) : 0);
    // rain: thinning after he wakes
    P.rain(ctx, W, H, env.drawIdx, { count: Math.round(L.lerp(700, 260, L.seg(dt, 6, 9))), alpha: 0.5, color: '#c8d0f0', len: 50, slant: 0.1 });
  },
};
