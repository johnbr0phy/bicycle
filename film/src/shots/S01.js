'use strict';
// S01: The hook. The grey tabby with the torn ear stares straight into the lens at dawn. Only the pupils narrow
// and an ear twitches. At the end it blinks once and looks off frame right.
const L = require('./lib'); const { C, FX } = L; const CF = require('../chars/catface'); const { cached } = require('../engine/cache'); const Lane = require('../sets/lane');
module.exports = {
  smooth: false, look: 'dawn', lookOver: { vignette: 0.28 },
  async setup({ W, H }) {
    // background: the lane at dawn, thrown far out of focus
    const bg = await cached('S01_bg_v1', () => { const cam = Lane.makeCam({ x: 0.2, y: 3.0, z: -4, yaw: 0.02, pitch: -0.02 }); const set = Lane.build({ tod: 'dawn', cam, fg: false }); return FX.blurCanvas(set.plate, 38, 4); });
    return { bg };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt;
    ctx.drawImage(s.bg, -60, -40, W + 120, H + 80);
    // soft bokeh discs
    if (!s.bokeh) { const bk = C.createCanvas(W, H), bx = bk.getContext('2d'); const R = new C.Rng(5); for (let i = 0; i < 11; i++) { const x = R.range(0, W), y = R.range(0, H * 0.6), r = R.range(30, 80); bx.globalAlpha = R.range(0.25, 0.55); C.celCircle(bx, x, y, r, '#ffe6c0'); } s.bokeh = C.keep(FX.blurCanvas(bk, 6, 1)); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.45; ctx.drawImage(s.bokeh, 4 * Math.sin(t * 0.3), 0); ctx.restore();
    // cat body shoulders at the bottom of frame
    const cx = W * 0.5, cy = H * 0.56, sc = 470;
    const shoulders = [[cx - sc * 1.9, H + 40], [cx - sc * 1.25, H * 0.82], [cx - sc * 0.6, H * 0.74], [cx + sc * 0.6, H * 0.74], [cx + sc * 1.25, H * 0.82], [cx + sc * 1.9, H + 40]];
    C.celShade(ctx, shoulders, CF.COL.fur, CF.COL.furSh, [0.85, -0.35], 90, { smooth: true }); C.ink(ctx, C.smoothPts(shoulders, false), { width: 6, color: CF.COL.ink, taper: 'both', wobble: 1.2 });
    const breathe = 1 + 0.004 * Math.sin(t * 2.1);
    const pupil = L.kf(dt, [[0, 0.62], [2.8, 0.22]], L.ease.inOut);
    const look = L.seg(dt, 4.15, 4.55); const turn = L.seg(dt, 4.3, 4.9, L.ease.inOut);
    const tw = L.kf(dt, [[2.0, 0], [2.08, 1], [2.25, 0.2], [2.33, 0.9], [2.5, 0]]);
    CF.draw(ctx, { cx: cx + turn * 20, cy: cy - (breathe - 1) * 400, s: sc * breathe, t: dt, pupil, blink: L.blink(dt, [3.5], 0.22), earTwitch: tw, lookX: 0.95 * look, lookY: -0.05 * look, headTurn: 0.35 * turn });
    // dawn rim light on the right edge of the face and shoulders
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(cx + sc * 0.6, 0, cx + sc * 1.35, 0); g.addColorStop(0, 'rgba(255,217,164,0)'); g.addColorStop(1, 'rgba(255,217,164,0.35)'); ctx.fillStyle = g; ctx.fillRect(cx + sc * 0.6, 0, W, H); ctx.restore();
  },
};
