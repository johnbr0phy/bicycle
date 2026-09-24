'use strict';
// S19: The turn. Rain has stopped. Wet stone reflects the lanterns. The shiba springs ahead through a small vermilion
// gate; the robot follows with the bell. Along the fences the cats turn their heads one by one as the pair passes.
const L = require('./lib'); const { C, R, S, K } = L; const Lane = require('../sets/lane'); const { cached } = require('../engine/cache'); const P = require('../props');
module.exports = {
  smooth: false, look: 'night',
  async setup() { const cam = Lane.makeCam({ x: 0.1, y: 0.9, z: 22.5, yaw: 0.0, pitch: 0.06 }); let set = null; const plate = await cached('lane_night_S19_v2', () => (set = Lane.build({ tod: 'night', cam, fg: false, wet: true, torii: 36 })).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam;
    const zoom = L.kf(t, [[0, 1.0], [9, 1.14]], (x) => x); const v = L.view(W, H, zoom, W / 2, H * 0.55);
    ctx.save(); v.apply(ctx); ctx.drawImage(s.plate, 0, 0); ctx.restore();
    const light = { ambient: '#4a4f88', ambientAmt: 0.45, rim: '#ffcf80', rimDir: [0, -3], rimAlpha: 0.85 };
    const rz = L.lerp(24.6, 34.5, C.ease.inOut(dt / 9)); const sz = L.lerp(27, 40, C.ease.in(Math.min(1, dt / 7)));
    // cats on the fences: grey on the left, black on the right, bobtail on the left further up
    const cats = [['boss', -1.78, 27.2, 0.46], ['kuro', 1.78, 29.6, 0.46], ['bobtail', -1.8, 32.2, 0.46]];
    const list = [];
    // folding benches (battari shogi) against the house fronts for the cats to sit on
    const Kit = require('../sets/kit');
    for (const [c, x, z, y] of cats) { const sd = Math.sign(x), xi = sd * 1.42, xo = sd * 2.12, z0 = z - 0.62, z1 = z + 0.62, h = y, th = 0.06;
      list.push({ depth: z + 0.02, draw: () => { ctx.save(); v.apply(ctx); const ln = { line: '#1a1622', lw: 1.3 };
        for (const [lx, lz] of [[xi + sd * 0.06, z0 + 0.06], [xi + sd * 0.06, z1 - 0.06]]) Kit.quad(ctx, cam, [[lx, 0, lz], [lx + sd * 0.05, 0, lz], [lx + sd * 0.05, h, lz], [lx, h, lz]], '#2a2230', ln);
        Kit.quad(ctx, cam, [[xo, h - th, z0], [xi, h - th, z0], [xi, h, z0], [xo, h, z0]], '#3b3040', ln);
        Kit.quad(ctx, cam, [[xi, h - th, z0], [xi, h - th, z1], [xi, h, z1], [xi, h, z0]], '#4a3c4c', ln);
        Kit.quad(ctx, cam, [[xo, h, z0], [xi, h, z0], [xi, h, z1], [xo, h, z1]], '#6e5d6c', ln);
        for (const k of [0.25, 0.5, 0.75]) Kit.seg3(ctx, cam, [xi + (xo - xi) * k, h, z0], [xi + (xo - xi) * k, h, z1], '#3a2f3e', 0.9, { seed: 3 + k * 10 });
        Kit.seg3(ctx, cam, [xi, h, z0], [xi, h, z1], '#ffcf80', 1.4, { alpha: 0.5, seed: 8 }); ctx.restore(); } }); }
    for (const [c, x, z, y] of cats) { const p = L.at(cam, x, z, y); if (!p) continue; const passed = L.clamp((rz - z + 1.5) / 2.5, 0, 1); const q = v.pt([p.x, p.y]);
      list.push({ depth: z, draw: () => L.drawChar(ctx, W, H, (cx, st) => K.draw(cx, { cat: c, pose: 'sit', headYaw: L.lerp(1.2, 0.15, C.ease.inOut(passed)), headTilt: 0.1 * passed, pupil: 0.95, lookX: 0.4 * passed, t: dt + z, tailAmp: 0.7, blink: L.blink(dt, [z % 3 + 1]) }, st), { x: q[0], y: q[1], scale: p.scale * zoom, flip: x > 0 ? true : false }, { light: { ambient: '#4a4f88', ambientAmt: 0.4, rim: '#ffcf80', rimDir: [x > 0 ? -2 : 2, -2], rimAlpha: 0.7 }, contact: { rx: 60, ry: 8, alpha: 0.3 } }) }); }
    // shiba bounding ahead toward the gate
    const sp = L.at(cam, 0.2 + 0.25 * Math.sin(dt * 1.3), sz); const sq = v.pt([sp.x, sp.y]);
    list.push({ depth: sz, draw: () => L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'bound', phase: dt * 2.2, stride: 1, t: dt, wet: 0.6, mouth: 'pant' }, st), { x: sq[0], y: sq[1], scale: sp.scale * zoom, flip: Math.sin(dt * 0.6) < 0 }, { light }) });
    // robot following, bell in his gripper
    const rp = L.at(cam, -0.15, rz); const rq = v.pt([rp.x, rp.y]);
    const pose = { yaw: Math.PI + 0.12 * Math.sin(dt * 0.9), t: dt, wheel: -rz * 6, battery: 1, batteryBlink: true, bob: 1.5 * Math.abs(Math.sin(dt * 13)), antenna: -0.2 + 0.1 * Math.sin(dt * 10), wet: 0.6, armR: [0.5, 0.9, 0.4], screen: { mode: 'eyes' } };
    list.push({ depth: rz, draw: () => { const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rq[0], y: rq[1], scale: rp.scale * zoom }, { light, contact: { rx: 120, ry: 20, alpha: 0.45 } }); if (a.gripR) require('./S18').bell(ctx, a.gripR[0], a.gripR[1], 12 * rp.scale * zoom * 3); } });
    list.sort((a, b) => b.depth - a.depth).forEach(i => i.draw());
    // drips from the eaves
    const Rd = new C.Rng(env.drawIdx * 7 + 3); ctx.save(); ctx.strokeStyle = '#d8e0ff'; ctx.lineCap = 'round'; for (let i = 0; i < 18; i++) { const x = Rd.range(0, W), y = Rd.range(0, H * 0.7); ctx.globalAlpha = 0.5; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke(); } ctx.restore();
  },
};
