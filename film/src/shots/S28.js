'use strict';
// S28: Credits on paper. Hand-lettered, with small ink drawings of the cast in the margins.
const L = require('./lib'); const { C, R, S, K, B } = L; const T = require('../title');
const LINES = [
  [0.4, '自転車', { size: 120, font: 'YujiMai', color: '#2c2230' }, 250],
  [0.9, 'THE  BICYCLE', { size: 30, font: 'Shippori', spacing: 0.32, color: '#3a2c34' }, 365],
  [2.6, 'written, drawn, animated and scored by Claude', { size: 34, font: 'Klee', color: '#3a2c34' }, 480],
  [4.4, 'instrument samples  Versilian Community Sample Library  ·  VSCO 2 Community Edition', { size: 22, font: 'Klee', color: '#5a4a44' }, 560],
  [5.2, 'field recordings  ESC-50 (Freesound contributors, CC BY-NC)', { size: 22, font: 'Klee', color: '#5a4a44' }, 598],
  [6.0, 'type  Klee One · Shippori Mincho · Yuji Mai (SIL Open Font License)', { size: 22, font: 'Klee', color: '#5a4a44' }, 636],
  [8.2, 'for everyone who ever held the back of a saddle, and let go', { size: 34, font: 'Klee', color: '#2c2230' }, 740],
];
module.exports = {
  smooth: false, look: 'paper',
  async setup() { return {}; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; ctx.fillStyle = '#f2e8d5'; ctx.fillRect(0, 0, W, H);
    const out = 1 - L.seg(t, 12.6, 14);
    for (const [t0, text, o, y] of LINES) { const a = L.seg(t, t0, t0 + 0.9) * out; T.inkText(ctx, text, W / 2, y, Object.assign({ alpha: a }, o)); }
    T.seal(ctx, W / 2 + 185, 222, 30, L.seg(t, 1.2, 1.8) * out);
    // margin sketches: ink-only versions of the cast (no fill, the paper shows through)
    const sk = (fn, x, y, sc, t0, flip = false) => { const a = L.seg(t, t0, t0 + 1.0) * out; if (a <= 0) return; const cv = C.createCanvas(W, H), cx = cv.getContext('2d'); cx.translate(x, y); cx.scale(sc * (flip ? -1 : 1), sc); fn(cx);
      const img = cx.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255; const v = 0.35 + 0.65 * l; d[i] = 70 + 185 * v; d[i + 1] = 55 + 170 * v; d[i + 2] = 50 + 150 * v; } cx.putImageData(img, 0, 0);
      ctx.save(); ctx.globalAlpha = a * 0.8; ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(cv, 0, 0); ctx.restore(); };
    const inkOnly = { ink: '#4a3a3a', shadowAmt: 0, noLines: false };
    sk((c) => R.draw(c, { yaw: 0.5, screen: { mode: 'happy' }, cloth: true, t: dt }, inkOnly), 330, 1040, 0.55, 3.0);
    sk((c) => S.draw(c, { sit: 1, headYaw: 1.0, mouth: 'pant', tail: 1, wag: 1, t: dt }, inkOnly), 1640, 1040, 0.55, 3.6, true);
    sk((c) => K.draw(c, { cat: 'boss', pose: 'loaf', headYaw: 1.3, eyes: 'closed', t: dt }, inkOnly), 1440, 1040, 0.5, 4.2);
    sk((c) => B.draw(c, { t: dt }, inkOnly), 560, 1040, 0.34, 4.8);
  },
};
