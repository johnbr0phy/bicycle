'use strict';
// Core drawing engine: seeded noise, hand-drawn ink strokes, watercolour washes, paper.
const { createCanvas: rawCreateCanvas, registerFont } = require('canvas');
// node-canvas 3.2.3 never frees a canvas that has received drawImage() from another canvas. Every canvas created while
// a frame is being drawn is registered and shrunk to 1x1 when the frame ends (releases its surface); keep() opts out.
let TEMPS = null;
function createCanvas(w, h) { const c = rawCreateCanvas(w, h); if (TEMPS) TEMPS.push(c); return c; }
function frameBegin() { TEMPS = []; }
function frameEnd() { if (TEMPS) for (const c of TEMPS) if (!c.__keep) { c.width = 1; c.height = 1; } TEMPS = null; }
function keep(c) { if (c) c.__keep = true; return c; }
const path = require('path');

const FONTS = path.join(__dirname, '..', '..', 'fonts');
try {
  registerFont(path.join(FONTS, 'KleeOne-Regular.ttf'), { family: 'Klee' });
  registerFont(path.join(FONTS, 'KleeOne-SemiBold.ttf'), { family: 'Klee', weight: 'bold' });
  registerFont(path.join(FONTS, 'ShipporiMincho-Regular.ttf'), { family: 'Shippori' });
  registerFont(path.join(FONTS, 'ShipporiMincho-Bold.ttf'), { family: 'Shippori', weight: 'bold' });
  registerFont(path.join(FONTS, 'YujiSyuku-Regular.ttf'), { family: 'Yuji' });
  try { registerFont(path.join(FONTS, 'YujiMai-Regular.ttf'), { family: 'YujiMai' }); registerFont(path.join(FONTS, 'YujiBoku-Regular.ttf'), { family: 'YujiBoku' }); } catch (e) {}
  registerFont(path.join(FONTS, 'ZenKurenaido-Regular.ttf'), { family: 'Zen' });
} catch (e) { console.error('font registration failed', e.message); }

// ---------- deterministic randomness ----------
function hash(n) { // integer hash -> [0,1)
  n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}
function rnd(seed, i, j = 0, k = 0) { return hash((seed * 73856093) ^ (i * 19349663) ^ (j * 83492791) ^ (k * 2971215073)); }
function srnd(seed, i, j = 0, k = 0) { return rnd(seed, i, j, k) * 2 - 1; }
// smooth 1D value noise
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return srnd(seed, i) * (1 - u) + srnd(seed, i + 1) * u;
}
function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = srnd(seed, xi, yi), b = srnd(seed, xi + 1, yi), c = srnd(seed, xi, yi + 1), d = srnd(seed, xi + 1, yi + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}
function fbm2(x, y, seed = 0, oct = 4) { let s = 0, a = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise2(x, y, seed + o * 17); n += a; x *= 2.03; y *= 1.97; a *= 0.5; } return s / n; }
class Rng { constructor(seed) { this.s = seed >>> 0 || 1; } next() { this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0; return this.s / 4294967296; } range(a, b) { return a + (b - a) * this.next(); } pick(arr) { return arr[Math.floor(this.next() * arr.length)]; } }

// ---------- colour ----------
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgb2hex(r, g, b) { const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); return '#' + c(r) + c(g) + c(b); }
function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function shade(c, k) { return mix(c, '#2a1f2e', k); } // cool shadow
function tint(c, k) { return mix(c, '#fff6e0', k); }
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

// ---------- easing ----------
const ease = {
  inOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  out: t => 1 - (1 - t) * (1 - t),
  in: t => t * t,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  smooth: t => t * t * (3 - 2 * t),
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// map t in [a,b] to [0,1] clamped, eased
function seg(t, a, b, e = ease.inOut) { return e(clamp((t - a) / (b - a), 0, 1)); }
// piecewise linear keyframes: [[t,v],[t,v]...]
function kf(t, keys, e = ease.inOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return lerp(v0, v1, e((t - t0) / (t1 - t0))); }
  return keys[keys.length - 1][1];
}

// ---------- ink strokes ----------
// A "boil" value changes every second drawing so lines shimmer like hand-traced cels.
let BOIL = 0; function setBoil(b) { BOIL = b; } function getBoil() { return BOIL; }
function resample(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const d = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return out;
}
// Catmull-Rom to polyline
function smoothPts(pts, closed = false, div = 6) {
  const n = pts.length; if (n < 3) return pts.slice();
  const out = [];
  const P = i => pts[closed ? ((i % n) + n) % n : clamp(i, 0, n - 1)];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < div; k++) {
      const t = k / div, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  if (!closed) out.push(pts[n - 1]); else out.push(out[0]);
  return out;
}
// Current transform scale, so wobble and widths stay in screen pixels regardless of character scale.
function ctxScale(ctx) { const m = ctx.getTransform(); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; }
// Brush line drawn as a filled polygon with a width profile (pressure) and a hand wobble.
// o: width (screen px), color, seed, closed, smooth, wobble (screen px), taper ('both'|'end'|'start'|0), alpha
function ink(ctx, pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const sc = ctxScale(ctx);
  const width = (o.width || 3) / sc, color = o.color || '#3a2c28', seed = (o.seed || 1) + BOIL * 101;
  const wob = (o.wobble == null ? 0.9 : o.wobble) / sc; const step = (o.step || 5) / sc;
  let P = o.smooth ? smoothPts(pts, !!o.closed) : pts.slice();
  if (o.closed && !o.smooth) P.push(P[0]);
  P = resample(P, step);
  const n = P.length; if (n < 2) return;
  let total = 0; const acc = [0];
  for (let i = 1; i < n; i++) { total += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc.push(total); }
  const taper = o.taper == null ? (o.closed ? 0 : 'both') : o.taper;
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = P[i];
    const ax = P[Math.min(n - 1, i + 1)][0] - P[Math.max(0, i - 1)][0], ay = P[Math.min(n - 1, i + 1)][1] - P[Math.max(0, i - 1)][1];
    const len = Math.hypot(ax, ay) || 1; const px = -ay / len, py = ax / len;
    const u = total > 0 ? acc[i] / total : 0; const sPx = acc[i] * sc; // arc length in screen px
    const w0 = wob * (noise1(sPx * 0.045, seed) + 0.45 * noise1(sPx * 0.13, seed + 3));
    let prof = 1;
    if (taper === 'both') prof = Math.min(1, Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.45) * 1.08 + 0.12);
    else if (taper === 'end') prof = Math.min(1, Math.pow(1 - u, 0.5) + 0.1);
    else if (taper === 'start') prof = Math.min(1, Math.pow(u, 0.5) + 0.1);
    const hw = 0.5 * width * prof * (1 + 0.22 * noise1(sPx * 0.02, seed + 7));
    const cx = x + px * w0, cy = y + py * w0;
    L.push([cx + px * hw, cy + py * hw]); R.push([cx - px * hw, cy - py * hw]);
  }
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
  ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath(); ctx.fill();
  if (!o.closed && !taper) { // round caps
    for (const [a, b] of [[L[0], R[0]], [L[n - 1], R[n - 1]]]) { ctx.beginPath(); ctx.arc((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(a[0] - b[0], a[1] - b[1]) / 2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function circlePts(cx, cy, rx, ry = rx, n = 32, a0 = 0, a1 = Math.PI * 2) { const pts = []; const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6; const m = closed ? n : n + 1; for (let i = 0; i < m; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return pts; }
function inkCircle(ctx, cx, cy, r, o = {}) { ink(ctx, circlePts(cx, cy, r, r, Math.max(16, Math.min(48, Math.floor(r)))), Object.assign({ closed: true }, o)); }
function inkEllipse(ctx, cx, cy, rx, ry, o = {}) { ink(ctx, circlePts(cx, cy, rx, ry, 36), Object.assign({ closed: true }, o)); }
// bezier helpers -> polyline
function bez(p0, p1, p2, p3, n = 16) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return out; }
function qbez(p0, p1, p2, n = 12) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return out; }
// transform points
function tf(pts, { x = 0, y = 0, r = 0, sx = 1, sy = 1 } = {}) { const c = Math.cos(r), s = Math.sin(r); return pts.map(([a, b]) => [x + (a * sx) * c - (b * sy) * s, y + (a * sx) * s + (b * sy) * c]); }

// ---------- fills ----------
function pathFrom(ctx, pts, closed = true, smooth = false) {
  const P = smooth ? smoothPts(pts, closed) : pts; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); if (closed) ctx.closePath();
}
function addPath(ctx, pts, smooth = false) { const P = smooth ? smoothPts(pts, true) : pts; ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }
// flat cel fill (characters)
function cel(ctx, pts, color, o = {}) { ctx.save(); pathFrom(ctx, pts, true, o.smooth); ctx.fillStyle = color; ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.fill(); ctx.restore(); }
// Cel fill with a crescent shadow on the side away from the light.
// light: unit vector pointing TOWARD the light (e.g. [-0.6,-0.8] = light at upper-left). k: shadow depth in local units.
function celShade(ctx, pts, base, shadowCol, light, k, o = {}) {
  const P = o.smooth ? smoothPts(pts, true) : pts;
  ctx.save(); ctx.fillStyle = base; ctx.beginPath(); addPath(ctx, P); ctx.fill();
  if (k > 0 && shadowCol) {
    ctx.clip();
    ctx.beginPath(); ctx.rect(-1e4, -1e4, 2e4, 2e4);
    const dx = light[0] * k, dy = light[1] * k; const sgrow = o.grow || 1.0;
    // centroid for optional scaling of the lit shape
    let cx = 0, cy = 0; for (const p of P) { cx += p[0]; cy += p[1]; } cx /= P.length; cy /= P.length;
    const Q = P.map(([x, y]) => [cx + (x - cx) * sgrow + dx, cy + (y - cy) * sgrow + dy]);
    addPath(ctx, Q);
    ctx.fillStyle = shadowCol; ctx.fill('evenodd');
  }
  ctx.restore();
}
function celCircle(ctx, cx, cy, r, color, alpha = 1) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fill(); ctx.restore(); }
function celEllipse(ctx, cx, cy, rx, ry, color, alpha = 1, rot = 0) { ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.fill(); ctx.restore(); }
// jitter a polygon's vertices for watercolour bleed
function jitterPts(pts, amt, seed) { return pts.map((p, i) => [p[0] + srnd(seed, i, 1) * amt, p[1] + srnd(seed, i, 2) * amt]); }
// watercolour wash: base + bleeds + edge darkening (backgrounds)
function wash(ctx, pts, color, o = {}) {
  const seed = o.seed || 5, alpha = o.alpha == null ? 1 : o.alpha, bleed = o.bleed == null ? 6 : o.bleed, smooth = !!o.smooth;
  ctx.save(); ctx.globalAlpha = alpha;
  pathFrom(ctx, pts, true, smooth); ctx.fillStyle = color; ctx.fill();
  if (bleed > 0) {
    ctx.globalAlpha = alpha * 0.22; ctx.fillStyle = shade(color, 0.18);
    pathFrom(ctx, jitterPts(pts, bleed, seed + 1), true, smooth); ctx.fill();
    ctx.globalAlpha = alpha * 0.16; ctx.fillStyle = tint(color, 0.25);
    pathFrom(ctx, jitterPts(pts, bleed * 0.7, seed + 2), true, smooth); ctx.fill();
    // edge darkening
    ctx.globalAlpha = alpha * (o.edge == null ? 0.28 : o.edge); ctx.strokeStyle = shade(color, 0.35); ctx.lineWidth = o.edgeW || 2.5; ctx.lineJoin = 'round';
    pathFrom(ctx, jitterPts(pts, bleed * 0.4, seed + 3), true, smooth); ctx.stroke();
  }
  ctx.restore();
}
function washRect(ctx, x, y, w, h, color, o = {}) { wash(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color, o); }
// vertical gradient sky (subtle; skies are the one place a gradient is allowed)
function sky(ctx, w, h, top, bottom, horizon = 0.7) {
  const g = ctx.createLinearGradient(0, 0, 0, h * horizon); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// ---------- paper ----------
let paperCache = null, paperDim = null;
function paper(w, h) {
  if (paperCache && paperDim === w + 'x' + h) return paperCache;
  const c = createCanvas(w, h), x = c.getContext('2d'); const img = x.createImageData(w, h); const d = img.data;
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const i = (y * w + xx) * 4;
    let v = 0.5 + 0.28 * fbm2(xx / 9, y / 9, 11, 3) + 0.14 * noise2(xx / 2.1, y / 2.1, 21) + 0.1 * noise2(xx / 60, y / 41, 33);
    // fibres
    const f = noise2(xx / 3, y / 90, 44); if (f > 0.55) v -= 0.12;
    v = clamp(v, 0, 1); const g = Math.round(150 + v * 105);
    d[i] = g; d[i + 1] = g - 4; d[i + 2] = g - 12; d[i + 3] = 255;
  }
  x.putImageData(img, 0, 0); paperCache = keep(c); paperDim = w + 'x' + h; return c;
}
// final post: paper multiply, grade tint, vignette
function post(ctx, w, h, o = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.paper == null ? 0.42 : o.paper; ctx.drawImage(paper(w, h), 0, 0);
  if (o.grade) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = o.gradeAlpha || 0.35; ctx.fillStyle = o.grade; ctx.fillRect(0, 0, w, h); }
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.vignette == null ? 0.35 : o.vignette;
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a7a70');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ---------- palettes by time of day ----------
const PAL = {
  dawn: { skyTop: '#b9c2d8', skyBot: '#f2d9c6', sun: '#f6c9a2', light: '#fbe3c8', shadow: '#8c93b8', ink: '#3b2f33', ground: '#cfc4b6', groundShade: '#a9a3a6', wood: '#8e6a4c', woodDark: '#5e4432', plaster: '#ece2d2', stone: '#b8b1a6', foliage: '#7f9a6c', foliageDark: '#5a7550', water: '#9db1bd', lantern: '#f0c98a', grade: '#f4d7c4', paperA: 0.42, vig: 0.3 },
  morning: { skyTop: '#9fc3de', skyBot: '#e8e9d9', sun: '#fff1c9', light: '#fff3d6', shadow: '#8a9bc0', ink: '#3a2c28', ground: '#d6cab8', groundShade: '#b4aba3', wood: '#96704e', woodDark: '#5f4531', plaster: '#f1e9da', stone: '#bdb6aa', foliage: '#86a86c', foliageDark: '#5c7d4f', water: '#a2bcc2', lantern: '#f0c98a', grade: '#fff0cf', paperA: 0.4, vig: 0.28 },
  noon: { skyTop: '#8fbbe0', skyBot: '#e6ecea', sun: '#ffffff', light: '#fff9ea', shadow: '#8792b8', ink: '#3a2c28', ground: '#d9d0c0', groundShade: '#b7aea4', wood: '#9a744f', woodDark: '#614733', plaster: '#f3ece0', stone: '#c1bab0', foliage: '#8db26f', foliageDark: '#5f8352', water: '#a6c0c4', lantern: '#f0c98a', grade: '#fff8e8', paperA: 0.38, vig: 0.25 },
  afternoon: { skyTop: '#a9c3d6', skyBot: '#f3dcb4', sun: '#ffd58a', light: '#ffe3ad', shadow: '#8c8ab4', ink: '#3b2d2a', ground: '#d8c6ad', groundShade: '#b09f92', wood: '#9c7148', woodDark: '#5f4330', plaster: '#f2e4cc', stone: '#c0b4a2', foliage: '#93a865', foliageDark: '#627a48', water: '#b6c4b8', lantern: '#f2c987', grade: '#ffd9a0', paperA: 0.4, vig: 0.3 },
  dusk: { skyTop: '#5d5a8e', skyBot: '#f0a577', sun: '#ffb46a', light: '#ffc98e', shadow: '#5d5b93', ink: '#352a36', ground: '#a996a2', groundShade: '#7f7188', wood: '#6f4e44', woodDark: '#3f2e30', plaster: '#d8c2bd', stone: '#9d918f', foliage: '#6b7a5f', foliageDark: '#47543f', water: '#8d8aa6', lantern: '#ffcb7a', grade: '#f0a06a', paperA: 0.42, vig: 0.38 },
  night: { skyTop: '#1f2440', skyBot: '#3a3f66', sun: '#ffd9a0', light: '#ffd18a', shadow: '#2a2b4d', ink: '#241f2e', ground: '#5f6280', groundShade: '#454866', wood: '#4c3a44', woodDark: '#2c2330', plaster: '#8e8aa0', stone: '#66667f', foliage: '#3f4f4a', foliageDark: '#2c3833', water: '#3f4a6b', lantern: '#ffcd7c', grade: '#3f4a90', paperA: 0.46, vig: 0.5 },
  paper: { skyTop: '#f3ead8', skyBot: '#f3ead8', ink: '#3a2c28', light: '#fff', shadow: '#c9bfae', grade: null, paperA: 0.5, vig: 0.15 },
};

module.exports = { createCanvas, frameBegin, frameEnd, keep, hash, rnd, srnd, noise1, noise2, fbm2, Rng, hex2rgb, rgb2hex, mix, shade, tint, rgba, ease, clamp, lerp, seg, kf, setBoil, getBoil, ink, inkCircle, inkEllipse, circlePts, bez, qbez, tf, smoothPts, resample, pathFrom, addPath, cel, celShade, celCircle, celEllipse, wash, washRect, sky, paper, post, PAL, ctxScale };
