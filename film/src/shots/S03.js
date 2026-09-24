'use strict';
// S03: The robot wakes. Pre-dawn genkan. Close on his chest: battery bars light one by one, eyes blink on.
// Pull back as he turns and rolls to the lattice door; he slides it open and dawn floods in.
const L = require('./lib'); const { C, FX, R } = L; const Gk = require('../sets/genkan'); const { cached } = require('../engine/cache');
module.exports = {
  smooth: true, look: 'dawn', lookOver: { vignette: 0.3 },
  async setup({ W, H }) {
    let set = null; const get = () => (set = set || Gk.build(2));
    const plate = await cached('genkan_plate_v4', () => get().plate); const panel = await cached('genkan_panel_v4', () => get().panel);
    return { cam: Gk.makeCam(2), cam1: Gk.makeCam(1), plate, panel, W, H };
  },
  frame(ctx, t, s, env) {
    const { W, H } = s; const dt = env.dt; const cam = s.cam1;
    // robot path
    const z = L.kf(dt, [[0, 2.15], [3.5, 2.15], [4.7, 2.78]]), x = L.kf(dt, [[0, 0.3], [3.5, 0.3], [4.7, 0.52]]);
    const yaw = L.kf(dt, [[0, 0.12], [2.9, 0.12], [3.55, Math.PI]], L.ease.inOut);
    const pos = L.at(cam, x, z);
    // view: start close on the chest, pull back to the full room
    const zoom = L.kf(t, [[0, 1.75], [2.6, 1.75], [4.2, 1.0]], L.ease.inOut);
    const chestY = pos.y - 106 * pos.scale;
    const fx = L.kf(t, [[0, pos.x], [2.6, pos.x], [4.2, W / 2]], L.ease.inOut), fy = L.kf(t, [[0, chestY], [2.6, chestY], [4.2, H / 2]], L.ease.inOut);
    const v = L.view(W, H, zoom, fx, fy, true);
    // background
    const M = Gk.MARGIN; const PW = W * (1 + 2 * M), PH = H * (1 + 2 * M);
    ctx.save(); v.apply(ctx); ctx.drawImage(s.plate, -M * W, -M * H, PW, PH);
    // door panel slides right into the wall pocket, clipped to the opening
    const open = L.seg(dt, 4.85, 5.65, L.ease.inOut); const D = Gk.DOOR;
    const oc = [cam.p(D.x0, 0.02, 3.2), cam.p(D.x1, 0.02, 3.2), cam.p(D.x1, D.h, 3.2), cam.p(D.x0, D.h, 3.2)];
    const shift = (oc[1][0] - oc[0][0]) * open;
    ctx.save(); ctx.beginPath(); ctx.moveTo(oc[0][0], oc[0][1]); for (const p of oc) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.clip(); ctx.drawImage(s.panel, shift - M * W, -M * H, PW, PH); ctx.restore();
    // dawn light: floor patch through the opening + a faint beam
    if (open > 0) {
      const xL = D.x0, xR = D.x0 + (D.x1 - D.x0) * open;
      const Lc = FX.newCanvas(W, H), lx = Lc.getContext('2d');
      const poly = (pts, a) => { const P = pts.map(p => cam.pc(...p)); lx.save(); lx.globalAlpha = a; lx.fillStyle = '#ffdcae'; lx.beginPath(); lx.moveTo(P[0][0], P[0][1]); for (const p of P) lx.lineTo(p[0], p[1]); lx.closePath(); lx.fill(); lx.restore(); };
      poly([[xL, 0.002, 3.2], [xR, 0.002, 3.2], [xR - 0.25, 0.002, 0.9], [xL - 0.35, 0.002, 0.9]], 0.75);
      poly([[xL, D.h, 3.2], [xR, D.h, 3.2], [xR - 0.25, 0.002, 0.9], [xL - 0.35, 0.002, 0.9]], 0.12);
      const Lb = FX.blurCanvas(Lc, 14, 2);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(Lb, 0, 0); ctx.restore();
      // the whole room warms
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.22 * open; ctx.fillStyle = '#c9a8a0'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    ctx.restore();
    // robot
    const battery = dt < 0.6 ? 0 : dt < 1.0 ? 1 : dt < 1.4 ? 2 : dt < 1.8 ? 3 : 4;
    const scrOn = L.seg(dt, 2.05, 2.25); const bl = dt < 2.05 ? 1 : L.blink(dt, [2.6, 4.0]);
    const moving = dt > 3.5 && dt < 4.7;
    const pose = {
      yaw, headYaw: L.kf(dt, [[2.2, 0], [2.5, -0.35], [2.8, 0.3], [3.0, 0]]), headNod: L.kf(dt, [[0, 10], [2.1, 10], [2.4, 0]]), headTilt: L.kf(dt, [[2.4, 0], [2.6, -0.1], [2.9, 0]]),
      battery, t: dt, wheel: -z * 6, antenna: moving ? -0.25 + 0.1 * Math.sin(dt * 12) : L.kf(dt, [[2.1, 0.5], [2.4, -0.2], [2.7, 0]]),
      armL: open > 0 || dt > 4.7 ? [L.kf(dt, [[4.7, 0.2], [4.9, 1.1]]), 0.6, 0.8] : [0.12, 0.2, 0.3], armR: [0.12, 0.2, 0.3],
      screen: { mode: dt < 2.05 ? 'off' : 'eyes', bright: scrOn, blink: bl, lookX: L.kf(dt, [[2.3, 0], [2.5, -0.5], [2.8, 0.4], [3.0, 0]]) },
      bob: moving ? 1.5 * Math.abs(Math.sin(dt * 14)) : 0, lean: moving ? -0.04 : 0,
    };
    const light = open > 0 ? { ambient: '#6a6590', ambientAmt: 0.5 * (1 - open * 0.4), rim: '#ffe0b0', rimDir: [0, -3.5 * v.z], rimAlpha: 0.95 * open } : { ambient: '#4a4a78', ambientAmt: 0.58 };
    const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: pos.x, y: pos.y, scale: pos.scale }, { v, light, contact: { rx: 120, ry: 20, alpha: 0.5 }, shadow: open > 0 ? { dir: [-0.15, 1], len: 0.9 * open, alpha: 0.4 } : null, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    // screen and battery glows
    if (scrOn > 0 && yaw < 1.6) L.screenGlow(ctx, a, pos.scale * v.z, '#9fe8ff', 0.4 * scrOn);
    if (battery > 0 && a.chest && yaw < 1.3) L.glowAt(ctx, a.chest[0], a.chest[1], 60 * pos.scale * v.z, '#9ff0a0', 0.25 + 0.1 * battery);
    // dust motes in the beam
    if (open > 0) { const Rr = new C.Rng(3); ctx.save(); v.apply(ctx); for (let i = 0; i < 40; i++) { const bx = Rr.range(0.0, 1.2), bz = Rr.range(1.2, 3.1), by = Rr.range(0.2, 1.6) + 0.05 * Math.sin(t * 0.8 + i); const p = cam.p(bx + 0.03 * Math.sin(t * 0.5 + i * 2), by, bz); if (!p) continue; ctx.globalAlpha = 0.5 * open * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i))); C.celCircle(ctx, p[0], p[1], 1.6, '#fff0d0'); } ctx.restore(); }
  },
};
