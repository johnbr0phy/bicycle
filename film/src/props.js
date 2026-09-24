'use strict';
// Animated set props drawn per frame in cel style: noren curtains, paper lanterns, falling leaves, rain, splashes.
const C = require('./engine/core'); const K = require('./sets/kit');

// Noren hanging in a doorway on facade side*hw between z0..z1, from y top to bottom. Sways outward into the lane.
function noren(ctx, cam, n, t, o = {}) {
  const { side, hw, z0, z1 } = n; const top = o.top || 2.25, bot = o.bot || 1.35; const panels = o.panels || 3; const col = o.color || '#3f5186'; const crest = o.crest || '#efe8da';
  const wind = o.wind == null ? 1 : o.wind; const X = side * hw - side * 0.05;
  const k = cam.scaleAt(X, top, (z0 + z1) / 2); const lw = C.clamp(k / 260, 0.6, 2.4);
  // rod
  K.seg3(ctx, cam, [X, top + 0.03, z0 - 0.05], [X, top + 0.03, z1 + 0.05], '#4a3a30', lw * 2.2);
  for (let i = 0; i < panels; i++) {
    const za = z0 + (z1 - z0) * i / panels + 0.02, zb = z0 + (z1 - z0) * (i + 1) / panels - 0.02;
    const sw = wind * (0.07 * Math.sin(t * 1.3 + i * 0.9) + 0.035 * Math.sin(t * 2.9 + i * 1.7)); // metres outward at the hem
    const hemX = X - side * Math.max(0, sw + 0.03), dz = 0.03 * Math.sin(t * 1.1 + i);
    const P = [cam.pc(X, top, za), cam.pc(X, top, zb), cam.pc(hemX, bot, zb + dz), cam.pc(hemX, bot, za + dz)].map(p => [p[0], p[1]]);
    C.cel(ctx, P, col); C.cel(ctx, [P[0], P[1], [C.lerp(P[1][0], P[2][0], 0.2), C.lerp(P[1][1], P[2][1], 0.2)], [C.lerp(P[0][0], P[3][0], 0.2), C.lerp(P[0][1], P[3][1], 0.2)]], C.mix(col, '#000', 0.2), { alpha: 0.5 });
    C.ink(ctx, P, { closed: true, width: lw, color: '#231c2a', taper: 0, wobble: 0.4, seed: 11 + i });
    // crest: a white circle spanning the split between panels 1 and 2 (drawn on each panel half)
    if (o.crestOn !== false && i === Math.floor(panels / 2)) { const c = [(P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4 - (P[3][1] - P[0][1]) * 0.08]; const r = Math.abs(P[1][0] - P[0][0]) * 0.28 + 2; ctx.save(); ctx.strokeStyle = crest; ctx.lineWidth = Math.max(1, r * 0.22); ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }
}
// Rain drawn as individual hand-drawn lines. Deterministic per drawing index.
function rain(ctx, W, H, drawIdx, o = {}) {
  const n = o.count || 420, len = o.len || 46, slant = o.slant || 0.18, col = o.color || '#dfe6ff', a = o.alpha || 0.55; const R = new C.Rng(1000 + drawIdx * 7919);
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = R.range(-100, W + 100), y = R.range(-60, H), l = len * R.range(0.5, 1.3), depth = R.next(); ctx.globalAlpha = a * (0.35 + 0.65 * depth); ctx.lineWidth = 0.8 + 1.6 * depth; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - slant * l, y + l); ctx.stroke(); }
  ctx.restore();
}
// Rain splashes on the ground: little crowns at random ground points (screen-space region).
function splashes(ctx, pts, drawIdx, o = {}) { const R = new C.Rng(77 + drawIdx * 131); ctx.save(); ctx.strokeStyle = o.color || '#e8eeff'; ctx.lineCap = 'round'; for (const [x, y, k] of pts) { if (R.next() > (o.p || 0.35)) continue; const s = k * R.range(0.6, 1.2); ctx.globalAlpha = 0.6; ctx.lineWidth = Math.max(0.6, s * 0.08); for (const a of [-2.2, -1.57, -0.9]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.8); ctx.stroke(); } ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.ellipse(x, y + 1, s * 0.9, s * 0.25, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); }
// Falling leaf (ginkgo / persimmon / cherry-less autumn): position along a fluttering path.
function leaf(ctx, x, y, s, t, col = '#d9893f', seed = 1) { const a = Math.sin(t * 3 + seed) * 0.9; const sq = Math.cos(t * 5 + seed); ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(1, 0.3 + 0.7 * Math.abs(sq)); C.celEllipse(ctx, 0, 0, s, s * 0.55, sq > 0 ? col : C.mix(col, '#5b3a2a', 0.3)); C.ink(ctx, [[-s, 0], [s * 1.2, 0]], { width: Math.max(0.6, s * 0.08), color: '#6a3a22', taper: 0 }); ctx.restore(); }
// Paper lantern with a flicker (screen space). lit 0..1
function lantern(ctx, x, y, s, lit, t, seed = 1, o = {}) { const fl = lit > 0 ? 0.88 + 0.08 * Math.sin(t * 17 + seed * 3) + 0.05 * Math.sin(t * 29 + seed) : 0; K.chochin(ctx, x, y, s, o.body || '#f1e6cc', o.band || '#2a2226', lit > 0 ? C.mix('#ffcf80', '#ffe6b0', fl - 0.8) : null, o.text); if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, s * 3.5 * lit); g.addColorStop(0, C.rgba('#ffcf7a', 0.5 * fl * lit)); g.addColorStop(1, C.rgba('#ffcf7a', 0)); ctx.fillStyle = g; ctx.fillRect(x - s * 4, y - s * 4, s * 8, s * 8); ctx.restore(); } }
module.exports = { noren, rain, splashes, leaf, lantern };
// The boy's yellow school hat as a loose prop (screen space, s = hat radius in px). flip: upside down (showing the lining).
function schoolHat(ctx, x, y, s, rot = 0, o = {}) {
  const C2 = require('./engine/core'); ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const cap = '#f2c632', capDark = '#d09c1c', ink = '#3a2c28';
  if (o.upside) { C2.celEllipse(ctx, 0, 0, s * 1.3, s * 0.36, capDark); C2.celEllipse(ctx, 0, 2, s * 0.95, s * 0.26, '#f6f0e0'); ctx.save(); ctx.fillStyle = '#3a2c28'; ctx.font = `${Math.round(s * 0.26)}px Klee`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.name || 'かける', 0, 2); ctx.restore(); C2.inkEllipse(ctx, 0, 0, s * 1.3, s * 0.36, { width: 2.4, color: ink }); ctx.restore(); return; }
  C2.celEllipse(ctx, 0, 0, s * 1.3, s * 0.3, capDark); C2.inkEllipse(ctx, 0, 0, s * 1.3, s * 0.3, { width: 2.2, color: ink });
  const crown = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; crown.push([Math.cos(a) * s, Math.sin(a) * s * 0.9]); }
  C2.celShade(ctx, crown, cap, '#c9a24a', [-0.6, -0.8], s * 0.12); C2.ink(ctx, crown, { width: 2.6, color: ink, taper: 0 });
  C2.ink(ctx, [[-s * 0.97, -s * 0.12], [s * 0.97, -s * 0.12]], { width: Math.max(2, s * 0.1), color: capDark, taper: 0 }); C2.celCircle(ctx, 0, -s * 0.9, s * 0.08, capDark);
  C2.cel(ctx, [[-s * 0.18, -s * 0.62], [s * 0.18, -s * 0.62], [s * 0.18, -s * 0.4], [-s * 0.18, -s * 0.4]], '#f7f3e4');
  ctx.restore();
}
module.exports.schoolHat = schoolHat;
// Chapter card in the corner: kanji + small English, ink-bleed in and out.
// Puddle splash puff at a ground point (screen), progress u 0..1, size s px
function splash(ctx, x, y, s, u, col = '#dfe6ff') { if (u <= 0 || u >= 1) return; const C2 = require('./engine/core'); ctx.save(); ctx.globalAlpha = 1 - u; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, s * 0.06);
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 6); const r0 = s * 0.2 * u, r1 = s * (0.35 + 0.6 * u); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.7 - s * 0.4 * u * (1 - u)); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.7 - s * 0.6 * u * (1 - u)); ctx.stroke(); }
  for (let i = 0; i < 5; i++) { const a = -Math.PI * (0.2 + 0.6 * i / 4); const r = s * (0.6 + 0.8 * u); C2.celCircle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6 - s * 1.2 * u * (1 - u) * 2, Math.max(1, s * 0.05), col); }
  ctx.beginPath(); ctx.ellipse(x, y, s * (0.3 + 0.9 * u), s * (0.08 + 0.2 * u), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
module.exports.splash = splash;
// Puddle on the ground (screen ellipse) with a sheen
function puddle(ctx, x, y, rx, ry, col = '#7a7e9e', sheen = '#c8cce8') { const C2 = require('./engine/core'); C2.celEllipse(ctx, x, y, rx, ry, col, 0.75); C2.celEllipse(ctx, x - rx * 0.2, y - ry * 0.15, rx * 0.5, ry * 0.3, sheen, 0.35); }
module.exports.puddle = puddle;
