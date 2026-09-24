'use strict';
// The hook: an extreme close-up of the grey tabby, drawn directly at frame scale with extra detail.
// Still cel-painted (flat tones, one shadow, hand line), but with the richness a full-frame face needs.
const C = require('../engine/core');
const COL = { fur: '#a3a1ac', furSh: '#6f6c86', furLt: '#c9c6cf', stripe: '#575468', white: '#efece6', whiteSh: '#c0bccc', nose: '#d9959a', noseDk: '#a86470', inner: '#e3a8aa', irisOut: '#b8862a', iris: '#e0b441', irisLt: '#f4d77a', pupil: '#1a1216', ink: '#35282c', rim: '#ffd9a4' };
// p: { t, pupil 0..1, blink 0..1, earTwitch 0..1, lookX -1..1, lookY, headTurn -1..1, cx, cy, s (scale: face half-width in px) }
function draw(ctx, p) {
  const cx = p.cx, cy = p.cy, s = p.s; const turn = p.headTurn || 0; const R = new C.Rng(11);
  const X = (u) => cx + (u + turn * 0.08) * s, Y = (v) => cy + v * s; const P = (u, v) => [X(u), Y(v)];
  const lw = Math.max(2, s / 160);
  const inkL = (pts, w, o = {}) => C.ink(ctx, pts, Object.assign({ width: w * lw, color: COL.ink, wobble: 1.2, seed: o.seed || 3, taper: o.taper == null ? 'both' : o.taper, smooth: o.smooth }, o));
  // ---- ears (behind the head)
  const ear = (side) => { const tw = side > 0 ? (p.earTwitch || 0) : 0; const base0 = P(side * 0.32, -0.62), base1 = P(side * 0.98, -0.28); let tip = P(side * 0.84 + side * tw * 0.12, -1.26 + tw * 0.14);
    let pts = [base0, tip, base1]; if (side > 0) { const m = [(tip[0] + base1[0]) / 2, (tip[1] + base1[1]) / 2]; pts = [base0, tip, [m[0] - 0.04 * s, m[1] - 0.05 * s], [m[0] - 0.12 * s, m[1] + 0.04 * s], [m[0] + 0.02 * s, m[1] + 0.1 * s], base1]; }
    C.celShade(ctx, pts, COL.fur, COL.furSh, [0.8, -0.5], 0.08 * s); C.cel(ctx, [P(side * 0.4, -0.6), [tip[0] - side * 0.06 * s, tip[1] + 0.16 * s], P(side * 0.86, -0.34)], COL.inner);
    for (let i = 0; i < 7; i++) { const a = [C.lerp(base0[0], base1[0], 0.3 + i * 0.06), C.lerp(base0[1], base1[1], 0.3 + i * 0.06)]; inkL([a, [C.lerp(a[0], tip[0], 0.45 + R.next() * 0.2), C.lerp(a[1], tip[1], 0.45 + R.next() * 0.2)]], 0.9, { color: '#f4ecea', alpha: 0.9, seed: 20 + i }); }
    inkL(pts, 3.2, { taper: 0, seed: 10 + side, closed: false }); };
  ear(-1); ear(1);
  // ---- head silhouette with jowl fur tufts
  const head = []; const n = 110; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const c = Math.cos(a), sn = Math.sin(a); let rx = 1.12, ry = 0.9; if (sn > 0) { rx = 1.18 + 0.1 * Math.pow(Math.abs(c), 3); ry = 0.86; } let r = 1; if (sn > -0.25 && Math.abs(c) > 0.5) r += 0.028 * Math.pow(Math.abs(Math.sin(i * Math.PI / 3.5)), 2) * Math.min(1, (Math.abs(c) - 0.5) * 5); head.push([X(c * rx * r), Y(sn * ry * r + (sn > 0 ? 0.04 : 0))]); }
  C.celShade(ctx, head, COL.fur, COL.furSh, [0.85, -0.35], 0.16 * s);
  // tabby markings: the "M" on the forehead, cheek lines, crown stripes
  ctx.save(); C.pathFrom(ctx, head); ctx.clip();
  for (const [u, h] of [[-0.14, 0.36], [0.0, 0.42], [0.14, 0.36]]) inkL([P(u, -0.82), P(u * 1.1, -0.82 + h)], 9, { color: COL.stripe, taper: 'end', seed: 30 + u * 10 });
  inkL([P(-0.34, -0.55), P(-0.2, -0.36), P(0, -0.5), P(0.2, -0.36), P(0.34, -0.55)], 7, { color: COL.stripe, taper: 'both', seed: 33 });
  for (const side of [-1, 1]) { inkL([P(side * 0.62, -0.02), P(side * 0.95, 0.06)], 7, { color: COL.stripe, seed: 34 + side }); inkL([P(side * 0.6, 0.14), P(side * 1.0, 0.26)], 6, { color: COL.stripe, seed: 36 + side }); inkL([P(side * 0.7, -0.4), P(side * 1.0, -0.3)], 6, { color: COL.stripe, seed: 38 + side }); }
  // white muzzle and chin
  C.celShade(ctx, [P(-0.52, 0.22), P(-0.3, 0.02), P(0, 0.06), P(0.3, 0.02), P(0.52, 0.22), P(0.5, 0.55), P(0.25, 0.8), P(-0.25, 0.8), P(-0.5, 0.55)], COL.white, COL.whiteSh, [0.8, -0.4], 0.07 * s, { smooth: true });
  // fur texture strokes (short, boiling)
  for (let i = 0; i < 90; i++) { const a = R.range(0, Math.PI * 2), d = Math.sqrt(R.next()) * 0.98; const u = Math.cos(a) * d * 1.1, v = Math.sin(a) * d * 0.85; if (v > 0.1 && Math.abs(u) < 0.5) continue; const pt = P(u, v); const ang = Math.atan2(v, u) + R.range(-0.3, 0.3); inkL([pt, [pt[0] + Math.cos(ang) * 0.06 * s, pt[1] + Math.sin(ang) * 0.06 * s]], 1.3, { color: R.next() > 0.5 ? COL.stripe : COL.furLt, alpha: 0.55, seed: 100 + i }); }
  ctx.restore();
  inkL(head, 3.6, { closed: true, taper: 0, seed: 40 });
  // ---- eyes
  const eye = (side) => {
    const ex = X(side * 0.42) , ey = Y(-0.12); const w = 0.25 * s, h = 0.2 * s; const blink = C.clamp(p.blink || 0, 0, 1);
    const shape = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const c = Math.cos(a), sn = Math.sin(a); shape.push([ex + c * w * (1 - 0.12 * Math.abs(sn)), ey + sn * h * (sn < 0 ? 1.0 : 0.92) + side * c * 0.02 * s]); }
    C.cel(ctx, shape.map(([x, y]) => [ex + (x - ex) * 1.12, ey + (y - ey) * 1.14]), COL.ink); // dark rim ("eyeliner")
    ctx.save(); C.pathFrom(ctx, shape); ctx.clip();
    const lx = (p.lookX || 0) * w * 0.35, ly = (p.lookY || 0) * h * 0.3;
    C.cel(ctx, shape, COL.irisOut); C.celEllipse(ctx, ex + lx, ey + ly, w * 0.92, h * 0.94, COL.iris); C.celEllipse(ctx, ex + lx - w * 0.05, ey + ly + h * 0.25, w * 0.62, h * 0.55, COL.irisLt, 0.75);
    for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const r0 = 0.25, r1 = 0.85 + 0.1 * Math.sin(i * 2.7); ctx.save(); ctx.globalAlpha = 0.35; C.ink(ctx, [[ex + lx + Math.cos(a) * w * r0, ey + ly + Math.sin(a) * h * r0], [ex + lx + Math.cos(a) * w * r1, ey + ly + Math.sin(a) * h * r1]], { width: 1.1 * lw, color: i % 2 ? COL.irisOut : '#fff0b0', taper: 'both', wobble: 0.5, seed: 200 + i }); ctx.restore(); }
    // slit pupil
    const pw = w * (0.08 + 0.5 * C.clamp(p.pupil == null ? 0.4 : p.pupil, 0, 1)); C.celEllipse(ctx, ex + lx, ey + ly, pw, h * 0.9, COL.pupil);
    // upper-lid shadow band
    C.cel(ctx, [[ex - w * 1.2, ey - h * 1.3], [ex + w * 1.2, ey - h * 1.3], [ex + w * 1.2, ey - h * 0.55], [ex - w * 1.2, ey - h * 0.62]], '#5a3a20', { alpha: 0.35 });
    // highlights
    C.celEllipse(ctx, ex + lx + w * 0.3, ey + ly - h * 0.38, w * 0.2, h * 0.17, '#ffffff', 0.95); C.celCircle(ctx, ex + lx - w * 0.28, ey + ly + h * 0.35, w * 0.07, '#ffffff', 0.8);
    // eyelid closing
    if (blink > 0) C.cel(ctx, [[ex - w * 1.3, ey - h * 1.4], [ex + w * 1.3, ey - h * 1.4], [ex + w * 1.3, ey - h + 2 * h * blink], [ex - w * 1.3, ey - h + 2 * h * blink]], COL.fur);
    ctx.restore();
    inkL(shape.slice(20).concat([shape[0]]), 3.4, { taper: 'both', seed: 50 + side });
    if (blink > 0.3) inkL([[ex - w, ey - h + 2 * h * blink], [ex + w, ey - h + 2 * h * blink]], 2.6, { seed: 52 + side });
    // tear-duct notch toward the nose
    inkL([[ex - side * w * 0.95, ey + h * 0.2], [ex - side * w * 1.18, ey + h * 0.42]], 2.4, { taper: 'end', seed: 54 + side });
  };
  eye(-1); eye(1);
  // ---- nose, mouth, whisker pads
  const nose = [P(-0.12, 0.2), P(0.12, 0.2), P(0.02, 0.33), P(-0.02, 0.33)]; C.celShade(ctx, nose, COL.nose, COL.noseDk, [0.6, -0.8], 0.03 * s, { smooth: true }); inkL(nose, 2.2, { closed: true, taper: 0, seed: 60, smooth: true }); C.celEllipse(ctx, X(-0.04), Y(0.235), 0.035 * s, 0.018 * s, '#f6d0d0', 0.9);
  inkL([P(0, 0.33), P(0, 0.42)], 2.2, { seed: 61 }); inkL([P(-0.2, 0.46), P(-0.08, 0.5), P(0, 0.42), P(0.08, 0.5), P(0.2, 0.46)], 2.4, { smooth: true, seed: 62 });
  for (const side of [-1, 1]) for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 4; c2++) C.celCircle(ctx, X(side * (0.14 + c2 * 0.06)), Y(0.36 + r * 0.05 + c2 * 0.01), 0.008 * s, '#7a7280', 0.8);
  // whiskers: long white strokes with a faint dark underline, gently moving
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const bx = X(side * 0.22), by = Y(0.38 + i * 0.035); const a = (side > 0 ? 0 : Math.PI) + side * (-0.18 + i * 0.1) + side * 0.03 * Math.sin((p.t || 0) * 2 + i); const L = (0.9 + i * 0.05) * s;
    const pts = [[bx, by], [bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5 - 0.02 * s], [bx + Math.cos(a) * L, by + Math.sin(a) * L + 0.05 * s]];
    C.ink(ctx, pts, { width: 1.6 * lw, color: COL.ink, alpha: 0.35, taper: 'end', smooth: true, wobble: 0.6, seed: 70 + i + side * 10 }); C.ink(ctx, pts, { width: 1.1 * lw, color: '#fbf8f2', taper: 'end', smooth: true, wobble: 0.6, seed: 70 + i + side * 10 }); }
  // brow whiskers
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) { const b = P(side * (0.36 + i * 0.1), -0.4); C.ink(ctx, [b, [b[0] + side * 0.28 * s, b[1] - 0.3 * s]], { width: 0.9 * lw, color: '#fbf8f2', taper: 'end', wobble: 0.6, seed: 80 + i + side }); }
}
module.exports = { draw, COL };
