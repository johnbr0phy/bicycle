'use strict';
// The shiba's memory: a picture-book vignette bubble (paper, pencil edge) showing the green bicycle being pushed
// away down the lane at dawn by a small figure. Rendered once, then popped in over the dog's head.
const C = require('./engine/core'); const FX = require('./engine/fx'); const B = require('./chars/bicycle');
function render(w = 560, h = 400) {
  const cv = FX.newCanvas(w, h), ctx = cv.getContext('2d'); const cx = w / 2, cy = h / 2;
  const shape = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; const r = 1 + 0.07 * Math.sin(a * 6) + 0.03 * Math.sin(a * 11); shape.push([cx + Math.cos(a) * (w * 0.44) * r, cy + Math.sin(a) * (h * 0.4) * r]); }
  ctx.save(); C.pathFrom(ctx, shape, true, true); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f6dcc4'); g.addColorStop(0.55, '#f3e2cc'); g.addColorStop(1, '#d9ccd8'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // simplified lane: two facades converging, a pale sun, the pagoda
  const vp = [cx + 20, cy - 10];
  C.cel(ctx, [[0, 0], [vp[0] - 40, vp[1] - 60], [vp[0] - 40, vp[1] + 30], [0, h]], '#b9a6b4'); C.cel(ctx, [[w, 0], [vp[0] + 40, vp[1] - 60], [vp[0] + 40, vp[1] + 30], [w, h]], '#a894a8');
  for (let i = 0; i < 9; i++) { const u = i / 9; C.ink(ctx, [[u * (vp[0] - 40), (1 - u) * 0 + u * (vp[1] - 60) + 20 * (1 - u)], [u * (vp[0] - 40), h * (1 - u) + u * (vp[1] + 30)]], { width: 1.2, color: '#7a6878', taper: 0, alpha: 0.6 }); }
  C.celCircle(ctx, vp[0], vp[1] - 20, 22, '#fff4dc', 0.9); C.cel(ctx, [[vp[0] - 6, vp[1] - 70], [vp[0] + 6, vp[1] - 70], [vp[0] + 8, vp[1] + 20], [vp[0] - 8, vp[1] + 20]], '#9a88a6', { alpha: 0.7 });
  // ground
  C.cel(ctx, [[0, h], [vp[0] - 40, vp[1] + 30], [vp[0] + 40, vp[1] + 30], [w, h]], '#d8ccd2');
  // the bicycle being pushed away (seen from behind at three-quarter) by a small figure: silhouette in soft ink
  ctx.save(); ctx.translate(cx + 30, h * 0.8); ctx.scale(-0.3, 0.3); B.draw(ctx, { yaw: 0.9, stand: false, wheel: 0.4 }, { lw: 1.4 }); ctx.restore();
  const fx = cx - 20, fy = h * 0.8; ctx.save(); ctx.globalAlpha = 0.95; C.celEllipse(ctx, fx, fy - 118, 17, 18, '#4a3e4a'); C.cel(ctx, [[fx - 18, fy - 104], [fx + 18, fy - 104], [fx + 16, fy - 50], [fx - 16, fy - 50]], '#4a3e4a'); C.ink(ctx, [[fx - 8, fy - 52], [fx - 12, fy]], { width: 9, color: '#4a3e4a', taper: 0 }); C.ink(ctx, [[fx + 8, fy - 52], [fx + 14, fy - 4]], { width: 9, color: '#4a3e4a', taper: 0 }); C.ink(ctx, [[fx + 12, fy - 96], [fx + 50, fy - 84]], { width: 7, color: '#4a3e4a', taper: 0 }); ctx.restore();
  ctx.restore();
  // paper edge: pencil outline, a few sketchy repeat strokes
  C.ink(ctx, shape, { closed: true, smooth: true, width: 3, color: '#6a5a58', wobble: 1.4, seed: 5 }); C.ink(ctx, shape.map(([x, y]) => [x + 2, y + 1]), { closed: true, smooth: true, width: 1.2, color: '#6a5a58', wobble: 2, seed: 9, alpha: 0.5 });
  return FX.watercolor(cv, { seed: 77, tremor: 2, edge: 0.8, turb: 0.25, gran: 0.15 });
}
// small trailing bubbles from the dog's head to the vignette
function draw(ctx, img, x, y, dogHead, a, t) {
  if (a <= 0) return; const s = C.ease.outBack(C.clamp(a, 0, 1));
  ctx.save(); ctx.globalAlpha = C.clamp(a * 1.5, 0, 1);
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4; const bx = C.lerp(dogHead[0], x, u), by = C.lerp(dogHead[1], y + img.height * 0.3, u); C.celCircle(ctx, bx, by, 6 + i * 5, '#f6ece0'); C.inkCircle(ctx, bx, by, 6 + i * 5, { width: 1.6, color: '#6a5a58' }); }
  ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.02 * Math.sin(t * 1.5)); ctx.drawImage(img, -img.width / 2, -img.height / 2); ctx.restore();
}
module.exports = { render, draw };
