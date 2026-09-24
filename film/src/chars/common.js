'use strict';
// Shared character drawing context: light direction, line weight, ink colour, shadow tint.
const C = require('../engine/core');
const INK = '#3a2c28';
// A drawing "style" passed to every character: { light:[lx,ly] pointing from light, lw: line scale, ink, shadowMix, boilSeed }
function style(o = {}) { return Object.assign({ light: [-0.6, -0.8], lw: 1, ink: INK, shadowK: 1, shadowTint: '#5b5680', shadowAmt: 0.32, noLines: false }, o); }
function sh(col, st) { return C.mix(col, st.shadowTint, st.shadowAmt); }
function hi(col, amt = 0.35) { return C.mix(col, '#fffaf0', amt); }
// light vector in character-local space (flip handled by caller)
function lv(st) { const [x, y] = st.light; const L = Math.hypot(x, y) || 1; return [x / L, y / L]; }
// Outline helper: fill + shade + ink in one call.
function part(ctx, pts, base, st, o = {}) {
  const L = lv(st); const k = (o.shadeK == null ? 10 : o.shadeK) * st.shadowK;
  if (base) C.celShade(ctx, pts, base, o.shadow || sh(base, st), L, k, { smooth: o.smooth, grow: o.grow });
  if (!st.noLines && o.line !== false) C.ink(ctx, pts, { closed: true, smooth: o.smooth, width: (o.lw || 3.6) * st.lw, color: o.ink || st.ink, seed: o.seed || 3, wobble: o.wobble == null ? 0.8 : o.wobble });
}
function line(ctx, pts, st, o = {}) { if (st.noLines) return; C.ink(ctx, pts, { smooth: o.smooth, width: (o.lw || 2.4) * st.lw, color: o.color || st.ink, seed: o.seed || 5, taper: o.taper == null ? 'both' : o.taper, wobble: o.wobble == null ? 0.7 : o.wobble, alpha: o.alpha }); }
function rrect(x, y, w, h, r, n = 5) { // rounded rect points (x,y top-left)
  const pts = []; r = Math.min(r, w / 2, h / 2);
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  return pts;
}
module.exports = { style, sh, hi, lv, part, line, rrect, INK };
