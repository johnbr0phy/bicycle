'use strict';
// The street cats of Kyoto. One morphing rig, four very different cats. Cats are liquid: every pose is the
// same set of body control points, so moving between poses is a morph, and the tail is always a travelling wave.
// Units: robot units (353/m). Facing screen right. Ground y=0.
const C = require('../engine/core'); const { style, sh, part, line } = require('./common');

const CATS = {
  boss: { name: 'Grey tabby (the wall boss)', body: '#a09ea8', dark: '#6c6a78', belly: '#d9d6d8', eye: '#e2b443', nose: '#c98a8a', inner: '#d9a3a3', pattern: 'tabby', scale: [1.22, 1.12], head: 1.18, ear: 0.9, tail: 'long', fur: 0, torn: true, cheeks: 1.3 },
  kuro: { name: 'Black cat (the unreliable one)', body: '#34303c', dark: '#211e28', belly: '#34303c', eye: '#d6db52', nose: '#5a4a52', inner: '#6a4a58', pattern: 'none', scale: [1.12, 0.84], head: 0.9, ear: 1.3, tail: 'long', tailLen: 1.35, fur: 0, cheeks: 0.8, rim: '#7a74a0' },
  bobtail: { name: 'White bobtail with a black cap', body: '#f4efe6', dark: '#2f2b33', belly: '#f4efe6', eye: '#8cc46a', nose: '#e59a9e', inner: '#f0b4b4', pattern: 'cap', scale: [0.94, 0.96], head: 1.02, ear: 1.0, tail: 'pom', fur: 0, cheeks: 1.0 },
  elder: { name: 'Cream long-haired elder', body: '#ecdcbc', dark: '#c9b28c', belly: '#f6ecd8', eye: '#c9b86a', nose: '#d4a090', inner: '#e6b8a8', pattern: 'none', scale: [1.2, 1.05], head: 1.08, ear: 0.75, tail: 'fluffy', fur: 1, cheeks: 1.4, sleepy: true },
  extra1: { name: 'Calico', body: '#f1e9dc', dark: '#3a3036', belly: '#f6f0e6', eye: '#d9b24a', nose: '#e0a0a0', inner: '#eeb0b0', pattern: 'calico', scale: [1.0, 1.0], head: 1.0, ear: 1.0, tail: 'long', fur: 0, cheeks: 1.0 },
  extra2: { name: 'Orange tabby', body: '#e0a060', dark: '#b8703a', belly: '#f3dcc0', eye: '#9ac060', nose: '#d48a80', inner: '#eaa898', pattern: 'tabby', scale: [1.05, 1.0], head: 1.0, ear: 1.0, tail: 'long', fur: 0, cheeks: 1.1 },
};

const POSES = {
  sit: { body: [[-40, -4], [-50, -26], [-44, -54], [-26, -74], [-6, -92], [12, -104], [26, -100], [30, -80], [26, -50], [22, -22], [14, -4], [-12, 0]], head: [20, -112], tail: [[-44, -8], [-40, 4], [-10, 8], [22, 6], [42, 2], [50, -6]] },
  loaf: { body: [[-52, -6], [-60, -24], [-50, -44], [-26, -54], [0, -58], [22, -56], [38, -50], [46, -32], [42, -10], [26, -2], [0, 0], [-30, 0]], head: [44, -56], tail: [[-52, -10], [-50, 2], [-20, 6], [10, 6], [30, 4], [42, -2]] },
  walk: { body: [[-62, -52], [-62, -70], [-44, -82], [-12, -80], [20, -82], [44, -86], [60, -74], [58, -54], [40, -46], [0, -44], [-30, -46], [-54, -44]], head: [72, -94], tail: [[-60, -68], [-78, -88], [-84, -114], [-78, -136], [-64, -146], [-54, -140]] },
  lie: { body: [[-70, -6], [-74, -22], [-52, -34], [-12, -36], [28, -38], [54, -34], [66, -22], [62, -8], [30, -2], [0, 0], [-30, 0], [-58, -2]], head: [74, -38], tail: [[-70, -10], [-90, -6], [-106, 0], [-122, 2], [-136, 0], [-144, -6]] },
  crouch: { body: [[-58, -14], [-62, -34], [-44, -50], [-14, -52], [16, -50], [40, -48], [56, -38], [54, -20], [38, -12], [0, -10], [-30, -10], [-52, -10]], head: [66, -48], tail: [[-58, -24], [-80, -22], [-100, -18], [-118, -12], [-132, -8], [-140, -12]] },
};
function lerpPts(a, b, t) { return a.map((p, i) => [C.lerp(p[0], b[i][0], t), C.lerp(p[1], b[i][1], t)]); }
function defaults() { return { cat: 'boss', pose: 'sit', poseTo: null, blend: 0, phase: 0, headYaw: 0, headTilt: 0, headDX: 0, headDY: 0, eyes: 'open', pupil: 0.5, blink: 0, ears: 'up', mouth: 'closed', tailAmp: 1, tailSpeed: 1, t: 0, whisker: 0, lookX: 0, lookY: 0, breathe: 0 }; }

// ---------------------------------------------------------------- head (sphere-mapped, profile -> front)
function drawHead(ctx, cfg, p, st) {
  const yaw = C.clamp(p.headYaw, 0, Math.PI / 2); const R = 28; const cw = cfg.cheeks;
  const P = (a, el, r) => [Math.cos(a) * Math.cos(el) * r, -Math.sin(el) * r, -Math.sin(a) * Math.cos(el) * r];
  const fAz = -yaw; const body = cfg.body, dark = cfg.dark;
  // ears
  const ears = [{ a: fAz + 1.15, near: false }, { a: fAz - 1.15, near: true }].map(e => ({ ...e, v: P(e.a, 0.72, R) }));
  const earFlat = p.ears === 'back' ? 1 : p.ears === 'flat' ? 1.4 : 0;
  const drawEar = (e) => {
    const s = cfg.ear; const bx = e.v[0], by = e.v[1] + 4; const lean = (e.near ? 0.2 : -0.1) - earFlat * 0.8;
    const tip = [bx + Math.sin(lean) * 30 * s, by - Math.cos(lean) * 30 * s * (1 - earFlat * 0.35)];
    let pts = [[bx - 14 * s, by + 4], tip, [bx + 14 * s, by + 6]];
    const col = e.v[2] < -3 ? sh(cfg.pattern === 'cap' ? dark : body, st) : (cfg.pattern === 'cap' ? dark : body);
    if (cfg.torn && e.near) { // notch torn out of the near ear
      const m = [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2]; pts = [pts[0], pts[1], [m[0] + 2, m[1] - 4], [m[0] - 5, m[1] + 1], [m[0] + 3, m[1] + 5], pts[2]];
    }
    part(ctx, pts, col, st, { shadeK: 3, lw: 2.8, seed: e.near ? 5 : 6 });
    if (e.v[2] > -6 && earFlat < 1) C.cel(ctx, [[bx - 7 * s, by + 2], [tip[0] * 0.8 + bx * 0.2, tip[1] * 0.8 + by * 0.2 + 3], [bx + 7 * s, by + 3]], cfg.inner, { alpha: 0.9 });
    if (cfg.fur && e.v[2] > -6) line(ctx, [[bx, by], [bx + 2, by - 12 * s]], st, { lw: 1.2, color: '#fff8ea' });
  };
  ears.filter(e => !e.near).forEach(drawEar);
  // skull with cheek puffs, wider in front view
  const sk = []; for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); const wide = 1 + 0.18 * Math.sin(yaw) * cw; const cheek = s > 0 ? 1 + 0.14 * cw * Math.pow(Math.abs(c), 0.8) : 1; let r = R * cheek; if (cfg.fur && s > -0.2) r += 3.5 * ((i % 2) ? 1 : -0.4); sk.push([c * r * wide, s * R * (s > 0 ? 0.95 : 0.9)]); }
  // profile: small muzzle bump
  const mz = Math.cos(yaw); if (mz > 0.2) { const i0 = 1; sk.splice(i0, 0, [R * wide1(yaw) + 6 * mz, 4], [R * wide1(yaw) + 4 * mz, 10]); }
  part(ctx, sk, cfg.pattern === 'none' || cfg.pattern === 'tabby' || cfg.pattern === 'calico' ? body : body, st, { shadeK: 6, lw: 3.2, seed: 11, smooth: true });
  // patterns on the head
  ctx.save(); C.pathFrom(ctx, sk, true, true); ctx.clip();
  if (cfg.pattern === 'cap') C.cel(ctx, [[-R * 1.4, -R * 1.4], [R * 1.4, -R * 1.4], [R * 1.4, -R * 0.35 + 6 * Math.sin(yaw)], [R * 0.3 * Math.cos(yaw) + 10, -R * 0.15], [-R * 0.2, -R * 0.42], [-R * 1.4, -R * 0.2]], dark, { smooth: false });
  if (cfg.pattern === 'tabby') { const fx = -Math.sin(-yaw) * 0; for (let i = -1; i <= 1; i++) { const x = R * 0.5 * Math.cos(yaw) * 0.6 + i * 7 - 4 + (1 - Math.cos(yaw)) * 0; line(ctx, [[x, -R * 0.95], [x + 1, -R * 0.62]], st, { lw: 3.4, color: dark, taper: 'end' }); } line(ctx, [[-R * 0.9, -2], [-R * 0.45, 2]], st, { lw: 2.6, color: dark }); line(ctx, [[-R * 0.9, 8], [-R * 0.5, 9]], st, { lw: 2.2, color: dark }); }
  if (cfg.pattern === 'calico') { C.cel(ctx, [[-R, -R], [0, -R], [-4, -8], [-R, 0]], '#d9864a'); C.cel(ctx, [[4, -R], [R, -R], [R, -6], [8, -10]], '#3a3036'); }
  // muzzle whites
  if (cfg.belly !== body) C.celEllipse(ctx, R * 0.62 * Math.cos(yaw) + 0, 12, 13 + 8 * Math.sin(yaw), 9, cfg.belly);
  ctx.restore();
  // face features
  const eyeAt = (a) => P(a, 0.12, R);
  let eyes = [eyeAt(fAz + 0.55), eyeAt(fAz - 0.55)].filter(v => v[2] > -10);
  if (yaw < 0.25) eyes = [[R * 0.55, -3, 1]];
  const pupil = C.clamp(p.pupil, 0.08, 1); const closed = p.eyes === 'closed' || p.blink > 0.8;
  for (const [ex0, ey0, ez] of eyes) {
    const f = C.clamp(0.5 + ez / R * 0.6, 0.35, 1); const ex = ex0 + 2 * Math.cos(yaw), ey = ey0 - 1; const w = 8.5 * f * (cfg.sleepy ? 1.05 : 1), h = 8.5;
    if (closed) { line(ctx, [[ex - w, ey], [ex, ey + 3], [ex + w, ey]], st, { lw: 2.6 }); continue; }
    const half = p.eyes === 'half' || (cfg.sleepy && p.eyes === 'open');
    const eyeShape = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; eyeShape.push([ex + Math.cos(a) * w, ey + Math.sin(a) * h * (Math.sin(a) < 0 ? 0.95 : 0.85)]); }
    ctx.save(); C.pathFrom(ctx, eyeShape, true, true); ctx.clip();
    C.cel(ctx, eyeShape, cfg.eye, { smooth: true }); C.cel(ctx, eyeShape.map(([x, y]) => [x, y + h * 0.55]), C.mix(cfg.eye, '#4a3020', 0.25), { smooth: true });
    const px = ex + p.lookX * w * 0.4, py = ey + p.lookY * h * 0.3; C.celEllipse(ctx, px, py, Math.max(1.2, w * 0.55 * pupil), h * 0.82, '#1d1418');
    C.celCircle(ctx, px + w * 0.25, ey - h * 0.35, 2.3, '#ffffff', 0.95);
    if (half || p.eyes === 'narrow' || p.blink > 0) { const k = p.eyes === 'narrow' ? 0.55 : half ? 0.48 : p.blink; C.cel(ctx, [[ex - w - 2, ey - h - 2], [ex + w + 2, ey - h - 2], [ex + w + 2, ey - h + 2 * h * k], [ex - w - 2, ey - h + 2 * h * k + (cfg.sleepy ? 2 : 0)]], cfg.pattern === 'cap' && ey < -4 ? cfg.dark : cfg.body); }
    ctx.restore();
    line(ctx, eyeShape.slice(9, 16).concat([eyeShape[0]]), st, { lw: 2.6, taper: 'both' });
    if (half || p.eyes === 'narrow') line(ctx, [[ex - w, ey - h + 2 * h * (p.eyes === 'narrow' ? 0.55 : 0.48)], [ex + w, ey - h + 2 * h * (p.eyes === 'narrow' ? 0.55 : 0.48)]], st, { lw: 2.2 });
  }
  // nose + mouth
  const nx = (R - 2) * Math.cos(yaw) + (yaw < 0.25 ? 6 : 0), ny = 7;
  C.cel(ctx, [[nx - 4, ny - 2], [nx + 4, ny - 2], [nx, ny + 3]], cfg.nose);
  if (p.mouth === 'open' || p.mouth === 'hiss' || p.mouth === 'yawn') {
    const o = p.mouth === 'yawn' ? 16 : p.mouth === 'hiss' ? 11 : 7; C.celEllipse(ctx, nx - 1, ny + 7 + o * 0.4, 6 + o * 0.3, o * 0.55, '#6a2f38'); C.celEllipse(ctx, nx - 1, ny + 9 + o * 0.6, 4, o * 0.25, '#e3848a');
    if (p.mouth === 'hiss') for (const s of [-1, 1]) C.cel(ctx, [[nx - 1 + s * 4, ny + 5], [nx - 1 + s * 5.5, ny + 5], [nx - 1 + s * 4.5, ny + 9]], '#fffaf0');
  } else line(ctx, [[nx - 6, ny + 6], [nx - 2, ny + 8], [nx, ny + 4], [nx + 2, ny + 8], [nx + 6, ny + 6]], st, { lw: 1.6, taper: 'both' });
  // whiskers
  const wt = p.whisker; ctx.save(); ctx.globalAlpha = 0.85;
  for (const s of (yaw < 0.25 ? [1] : [-1, 1])) for (let i = 0; i < 3; i++) {
    const bx = nx + s * 7, by = ny + 3 + i * 3; const ang = (s > 0 ? 0 : Math.PI) + (i - 1) * 0.18 * s + wt * 0.2 * s; const L = 34 + i * 2;
    C.ink(ctx, [[bx, by], [bx + Math.cos(ang) * L * 0.5, by + Math.sin(ang) * L * 0.5 - 2], [bx + Math.cos(ang) * L, by + Math.sin(ang) * L + 1]], { width: 1.1 * st.lw, color: cfg.pattern === 'none' && cfg.body < '#5' ? '#b8b0c0' : '#f6f2ea', taper: 'end', wobble: 0.3, seed: 70 + i + s });
    C.ink(ctx, [[bx, by], [bx + Math.cos(ang) * L * 0.5, by + Math.sin(ang) * L * 0.5 - 2], [bx + Math.cos(ang) * L, by + Math.sin(ang) * L + 1]], { width: 0.8 * st.lw, color: st.ink, taper: 'end', wobble: 0.3, seed: 70 + i + s, alpha: 0.45 });
  }
  ctx.restore();
  ears.filter(e => e.near).forEach(drawEar);
}
function wide1(yaw) { return 1 + 0.18 * Math.sin(yaw); }

// ---------------------------------------------------------------- body
function draw(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); const st = style(stIn); const cfg = typeof p.cat === 'string' ? CATS[p.cat] : p.cat;
  const A = POSES[p.pose], Bp = p.poseTo ? POSES[p.poseTo] : null, bl = Bp ? C.ease.inOut(C.clamp(p.blend, 0, 1)) : 0;
  let bodyPts = Bp ? lerpPts(A.body, Bp.body, bl) : A.body.map(q => q.slice());
  let head = Bp ? [C.lerp(A.head[0], Bp.head[0], bl), C.lerp(A.head[1], Bp.head[1], bl)] : A.head.slice();
  let tailC = Bp ? lerpPts(A.tail, Bp.tail, bl) : A.tail.map(q => q.slice());
  const dom = bl < 0.5 ? p.pose : p.poseTo; const anchors = {};
  const [sx, sy] = cfg.scale;
  ctx.save(); ctx.scale(sx, sy);
  // breathing
  const br = 1 + 0.015 * Math.sin(p.t * 2.2) + p.breathe * 0.03;
  bodyPts = bodyPts.map(([x, y]) => [x * (1 + (br - 1) * 0.5), y * br]);
  // walk gait: legs
  const legs = [];
  if (dom === 'walk' || dom === 'stand') {
    const rest = { FL: [40, 0], FR: [48, 0], BL: [-44, 0], BR: [-36, 0] }; const offs = { BL: 0, FL: 0.25, BR: 0.5, FR: 0.75 }; const L = dom === 'walk' ? 34 : 0;
    for (const k of ['BL', 'FR', 'BR', 'FL']) { const ph = ((p.phase + offs[k]) % 1 + 1) % 1; let x, y; if (ph < 0.6) { x = L / 2 - L * ph / 0.6; y = 0; } else { const u = (ph - 0.6) / 0.4; x = -L / 2 + L * C.ease.inOut(u); y = -12 * Math.sin(Math.PI * u); } legs.push({ k, far: k === 'BL' || k === 'FR', root: k[0] === 'F' ? [44, -58] : [-44, -56], paw: [rest[k][0] + x, y] }); }
  }
  const bodyCol = cfg.body; const sway = (u, i) => Math.sin(p.t * 3.1 * p.tailSpeed - u * 4.2 + i) * 9 * p.tailAmp * u;
  const drawTail = () => {
    if (cfg.tail === 'pom') { const b = tailC[0]; C.celCircle(ctx, b[0] - 6, b[1] - 8, 13, cfg.dark); if (!st.noLines) C.inkCircle(ctx, b[0] - 6, b[1] - 8, 13, { width: 2.6 * st.lw, seed: 81 }); return; }
    const k = cfg.tailLen || 1; const base = tailC[0];
    const pts = tailC.map(([x, y], i) => { const u = i / (tailC.length - 1); return [base[0] + (x - base[0]) * k, base[1] + (y - base[1]) * k + sway(u, 0)]; });
    const Q = C.smoothPts(pts, false, 6); const w = cfg.tail === 'fluffy' ? 24 : 13;
    if (!st.noLines) C.ink(ctx, Q, { width: (w + 5) * st.lw, taper: 'end', wobble: cfg.fur ? 2 : 0.4, seed: 82 });
    C.ink(ctx, Q, { width: w * st.lw, color: bodyCol, taper: 'end', wobble: cfg.fur ? 1.5 : 0.2, seed: 83 });
    if (cfg.pattern === 'tabby') for (let i = 3; i < Q.length - 3; i += 5) { const a = Q[i], b = Q[i + 1]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1; line(ctx, [[a[0] - nx / L * 6, a[1] - ny / L * 6], [a[0] + nx / L * 6, a[1] + ny / L * 6]], st, { lw: 3, color: cfg.dark }); }
    if (cfg.pattern === 'calico') C.ink(ctx, Q.slice(Math.floor(Q.length * 0.6)), { width: w * 0.8 * st.lw, color: '#3a3036', taper: 'end', seed: 84 });
    anchors.tailTip = Q[Q.length - 1];
  };
  const tailBehind = dom === 'walk' || dom === 'stand' || dom === 'lie' || dom === 'crouch';
  if (tailBehind) drawTail();
  const drawLeg = (L) => { const knee = [(L.root[0] + L.paw[0]) / 2 + (L.k[0] === 'F' ? -4 : 8), (L.root[1] + L.paw[1]) / 2]; const col = L.far ? sh(bodyCol, st) : bodyCol; const pts = [L.root, knee, [L.paw[0], L.paw[1] - 4]]; if (!st.noLines) C.ink(ctx, pts, { width: 17 * st.lw, taper: 0, wobble: 0.4, seed: 91 }); C.ink(ctx, pts, { width: 12 * st.lw, color: col, taper: 0, wobble: 0.2, seed: 92 }); C.celEllipse(ctx, L.paw[0] + 3, L.paw[1] - 4, 8, 5, cfg.pattern === 'cap' || cfg.belly !== bodyCol ? cfg.belly : col); if (!st.noLines) C.inkEllipse(ctx, L.paw[0] + 3, L.paw[1] - 4, 8, 5, { width: 2 * st.lw, seed: 93 }); };
  legs.filter(l => l.far).forEach(drawLeg);
  // body outline with optional long fur
  let outline = C.smoothPts(bodyPts, true, 5);
  if (cfg.fur) { const cen = [0, -44]; const o2 = []; for (let i = 0; i < outline.length; i++) { const [x, y] = outline[i]; const dx = x - cen[0], dy = y - cen[1], L = Math.hypot(dx, dy) || 1; const f = y > -5 ? 0 : 4.5 * Math.pow(Math.abs(Math.sin(i * Math.PI / 4)), 0.6); o2.push([x + dx / L * f, y + dy / L * f]); } outline = o2; }
  part(ctx, outline, bodyCol, st, { shadeK: 9, lw: 3.4, seed: 101, smooth: false, wobble: cfg.fur ? 1.2 : 0.8 });
  ctx.save(); C.pathFrom(ctx, outline); ctx.clip();
  if (cfg.belly !== bodyCol) C.celEllipse(ctx, bodyPts[8][0] - 8, bodyPts[8][1] + 6, 28, 40, cfg.belly);
  if (cfg.pattern === 'tabby') { const bb = bodyPts; for (let i = 0; i < 6; i++) { const u = 0.15 + i * 0.13; const top = [C.lerp(bb[2][0], bb[6][0], u), C.lerp(bb[2][1], bb[6][1], u) - 6]; line(ctx, [top, [top[0] - 6, top[1] + 22], [top[0] - 3, top[1] + 36]], st, { lw: 4.5, color: cfg.dark, taper: 'end' }); } }
  if (cfg.pattern === 'cap') C.celEllipse(ctx, bodyPts[3][0] + 6, bodyPts[3][1] + 12, 16, 10, cfg.dark);
  if (cfg.pattern === 'calico') { C.celEllipse(ctx, bodyPts[3][0], bodyPts[3][1] + 14, 22, 14, '#d9864a'); C.celEllipse(ctx, bodyPts[5][0], bodyPts[5][1] + 18, 14, 10, '#3a3036'); }
  if (cfg.rim) line(ctx, bodyPts.slice(2, 6), st, { lw: 2.5, color: cfg.rim, alpha: 0.8 });
  ctx.restore();
  legs.filter(l => !l.far).forEach(drawLeg);
  // sitting / loaf front paws and haunch line
  if (dom === 'sit') { const f = bodyPts[9], g = bodyPts[10]; for (const dx of [0, 9]) { const pts = [[f[0] - 2 + dx, f[1] - 30], [g[0] + dx, -4]]; line(ctx, pts, st, { lw: 2.2 }); C.celEllipse(ctx, g[0] + 4 + dx, -4, 9, 5, cfg.belly !== bodyCol ? cfg.belly : bodyCol); if (!st.noLines) C.inkEllipse(ctx, g[0] + 4 + dx, -4, 9, 5, { width: 2 * st.lw, seed: 94 + dx }); } line(ctx, [bodyPts[1], [bodyPts[1][0] + 18, bodyPts[1][1] + 12], [bodyPts[11][0] + 6, -3]], st, { lw: 2.2, alpha: 0.8 }); }
  if (dom === 'loaf' || dom === 'lie') { const f = bodyPts[8]; C.celEllipse(ctx, f[0] - 4 + (dom === 'lie' ? 16 : 0), -4, 10, 5, cfg.belly !== bodyCol ? cfg.belly : bodyCol); if (!st.noLines) C.inkEllipse(ctx, f[0] - 4 + (dom === 'lie' ? 16 : 0), -4, 10, 5, { width: 2 * st.lw, seed: 95 }); }
  if (!tailBehind) drawTail();
  ctx.restore();
  // head (not affected by non-uniform body scale except position)
  const hx = head[0] * sx + p.headDX, hy = head[1] * sy + p.headDY;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(p.headTilt); ctx.scale(cfg.head, cfg.head);
  drawHead(ctx, cfg, p, st);
  ctx.restore();
  anchors.head = [hx, hy]; anchors.nose = [hx + 26 * cfg.head * Math.cos(p.headYaw), hy + 7 * cfg.head];
  return anchors;
}

// ---------------------------------------------------------------- extreme close-up face (S01)
// Draws a front-facing cat face filling roughly a 1000-unit circle. p: {pupil, blink, earTwitch, lookX, whisker}
function drawFace(ctx, catKey, p = {}, stIn = {}) {
  const cfg = CATS[catKey]; const st = style(Object.assign({ lw: 2.6 }, stIn)); const K = 12; // scale from head units
  ctx.save(); ctx.scale(K, K);
  drawHead(ctx, cfg, Object.assign(defaults(), { headYaw: Math.PI / 2, eyes: 'open' }, p), Object.assign({}, st, { lw: st.lw / K * 3.2 }));
  ctx.restore();
}
module.exports = { draw, drawFace, defaults, CATS, POSES };
