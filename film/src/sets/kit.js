'use strict';
// Kyoto architecture kit, drawn in real-metre perspective. Everything here is background art:
// thin broken lines, flat washes (the watercolour filter is applied to the whole plate afterwards).
const C = require('../engine/core');
const { projPoly } = require('../engine/persp');

function lwAt(z, base = 2.0) { return C.clamp(base * 7 / Math.max(0.5, z), 0.45, 3.2); }
function fillPoly(ctx, P, color, alpha = 1) { if (P.length < 3) return; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); ctx.fill(); ctx.restore(); }
function quad(ctx, cam, pts3, color, o = {}) { const P = projPoly(cam, pts3); fillPoly(ctx, P, color, o.alpha == null ? 1 : o.alpha); if (o.line) outline(ctx, P, o.line, o.lw || 1.2, o.seed); return P; }
function outline(ctx, P, color, w, seed = 3) { if (P.length < 2) return; C.ink(ctx, P, { closed: true, width: w, color, wobble: 0.5, seed, taper: 0, step: 6 }); }
function seg3(ctx, cam, a, b, color, w, o = {}) { const P = projPoly(cam, [a, b, b]); if (P.length < 2) return; const pa = cam.pc(...a), pb = cam.pc(...b); if (!pa || !pb) return; C.ink(ctx, [[pa[0], pa[1]], [pb[0], pb[1]]], { width: w, color, wobble: o.wobble == null ? 0.4 : o.wobble, seed: o.seed || 7, taper: o.taper == null ? 0 : o.taper, alpha: o.alpha, step: 6 }); }
function poly3(ctx, cam, pts3, color, w, o = {}) { const P = pts3.map(p => cam.pc(...p)).filter(Boolean).map(p => [p[0], p[1]]); if (P.length < 2) return; C.ink(ctx, P, { width: w, color, wobble: o.wobble == null ? 0.5 : o.wobble, seed: o.seed || 9, taper: o.taper == null ? 0 : o.taper, alpha: o.alpha, closed: o.closed, step: 6 }); }

// ------------------------------------------------------------------ facade
// A machiya facade on the plane X = side*hw between z0..z1. spec controls variation.
// pal: palette. Returns list of anchor points for props.
function machiya(ctx, cam, side, hw, z0, z1, spec, pal) {
  const X = side * hw; const P = (z, y, dx = 0) => [X - side * dx, y, z];
  const zm = (z0 + z1) / 2; const lw = lwAt(zm, 1.6);
  const H1 = spec.h1 || 2.9, H2 = spec.h2 || 5.6, roofTop = spec.roof || 6.3;
  const wood = spec.wood || pal.wood, woodDark = pal.woodDark, plaster = spec.plaster || pal.plaster;
  // wall body
  quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, roofTop), P(z0, roofTop)], spec.twoStory === false ? wood : plaster);
  // ground floor wood frame
  quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, H1), P(z0, H1)], wood);
  // stone/plaster plinth
  quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, 0.28), P(z0, 0.28)], pal.plinth || C.mix(pal.stone, woodDark, 0.25));
  // posts
  const posts = spec.posts || [z0, z1];
  for (const pz of posts) quad(ctx, cam, [P(pz - 0.07, 0), P(pz + 0.07, 0), P(pz + 0.07, H2), P(pz - 0.07, H2)], woodDark);
  // ground floor bays
  for (const bay of spec.bays || []) {
    const [a, b, kind] = bay;
    if (kind === 'lattice') { // senbon-goshi: dense vertical slats over a dark interior
      quad(ctx, cam, [P(a, 0.35), P(b, 0.35), P(b, 2.35), P(a, 2.35)], pal.interior);
      const n = Math.round((b - a) / 0.075);
      for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; seg3(ctx, cam, P(z, 0.35), P(z, 2.35), pal.lattice, lwAt(z, 1.25), { seed: i * 3 + 1 }); }
      seg3(ctx, cam, P(a, 2.35), P(b, 2.35), woodDark, lwAt(zm, 2.2)); seg3(ctx, cam, P(a, 0.35), P(b, 0.35), woodDark, lwAt(zm, 2.2)); seg3(ctx, cam, P(a, 1.85), P(b, 1.85), pal.lattice, lwAt(zm, 1.4));
    } else if (kind === 'door') { // lattice sliding door with paper/frosted glass behind
      quad(ctx, cam, [P(a, 0.2), P(b, 0.2), P(b, 2.2), P(a, 2.2)], spec.doorGlow || pal.doorPaper);
      const n = Math.round((b - a) / 0.14);
      for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; seg3(ctx, cam, P(z, 0.2), P(z, 2.2), woodDark, lwAt(z, 1.5)); }
      for (let k = 0; k < 4; k++) { const y = 0.6 + k * 0.5; seg3(ctx, cam, P(a, y), P(b, y), woodDark, lwAt(zm, 1.1)); }
      quad(ctx, cam, [P(a, 0.2), P(b, 0.2), P(b, 0.5), P(a, 0.5)], woodDark);
      seg3(ctx, cam, P((a + b) / 2, 0.2), P((a + b) / 2, 2.2), woodDark, lwAt(zm, 2.6));
    } else if (kind === 'dark') { // open doorway, dark interior
      quad(ctx, cam, [P(a, 0.1), P(b, 0.1), P(b, 2.2), P(a, 2.2)], pal.interiorDeep || C.mix(pal.interior, '#1a1420', 0.4));
    } else if (kind === 'shop') { // open shopfront with a counter
      quad(ctx, cam, [P(a, 0.1), P(b, 0.1), P(b, 2.3), P(a, 2.3)], pal.interior);
      quad(ctx, cam, [P(a, 0.1), P(b, 0.1), P(b, 0.9, 0.35), P(a, 0.9, 0.35)], C.mix(wood, '#fff', 0.15));
      for (let i = 0; i < 6; i++) { const z = a + (b - a) * (i + 0.5) / 6; quad(ctx, cam, [P(z - 0.12, 0.9, 0.3), P(z + 0.12, 0.9, 0.3), P(z + 0.1, 1.08, 0.25), P(z - 0.1, 1.08, 0.25)], [pal.accent1, pal.accent2, pal.accent3][i % 3]); }
    } else if (kind === 'plaster') {
      quad(ctx, cam, [P(a, 0.3), P(b, 0.3), P(b, H1), P(a, H1)], C.mix(plaster, wood, 0.25));
    } else if (kind === 'shutter') { // corrugated metal shutter
      quad(ctx, cam, [P(a, 0.05), P(b, 0.05), P(b, 2.3), P(a, 2.3)], pal.shutter || '#9a9aa4');
      for (let k = 0; k < 16; k++) { const y = 0.1 + k * 0.14; seg3(ctx, cam, P(a, y), P(b, y), C.mix(pal.shutter || '#9a9aa4', '#222', 0.35), lwAt(zm, 0.9)); }
    }
  }
  if (spec.twoStory !== false) {
    // upper floor details (drawn before the lower eave so the eave overlaps them)
    for (const w of spec.upper || []) {
      const [a, b, kind] = w;
      if (kind === 'mushiko') { // clay slatted window
        quad(ctx, cam, [P(a, H1 + 0.9), P(b, H1 + 0.9), P(b, H1 + 1.9), P(a, H1 + 1.9)], pal.interior);
        const n = Math.round((b - a) / 0.16);
        for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; quad(ctx, cam, [P(z - 0.04, H1 + 0.9), P(z + 0.04, H1 + 0.9), P(z + 0.04, H1 + 1.9), P(z - 0.04, H1 + 1.9)], plaster); }
        outline(ctx, projPoly(cam, [P(a, H1 + 0.9), P(b, H1 + 0.9), P(b, H1 + 1.9), P(a, H1 + 1.9)]), pal.line, lwAt(zm, 1.0));
      } else if (kind === 'window') { // wooden lattice window with paper behind
        quad(ctx, cam, [P(a, H1 + 0.8), P(b, H1 + 0.8), P(b, H1 + 2.0), P(a, H1 + 2.0)], spec.upperGlow || pal.doorPaper);
        const n = Math.round((b - a) / 0.1);
        for (let i = 0; i <= n; i++) { const z = a + (b - a) * i / n; seg3(ctx, cam, P(z, H1 + 0.8), P(z, H1 + 2.0), woodDark, lwAt(z, 0.9)); }
        quad(ctx, cam, [P(a - 0.05, H1 + 0.72), P(b + 0.05, H1 + 0.72), P(b + 0.05, H1 + 0.82, 0.25), P(a - 0.05, H1 + 0.82, 0.25)], woodDark);
      } else if (kind === 'sudare') { // bamboo blind
        quad(ctx, cam, [P(a, H1 + 0.7), P(b, H1 + 0.7), P(b, H1 + 2.1), P(a, H1 + 2.1)], pal.bamboo || '#b39a6b');
        for (let k = 0; k < 18; k++) { const y = H1 + 0.72 + k * 0.077; seg3(ctx, cam, P(a, y), P(b, y), C.mix(pal.bamboo || '#b39a6b', '#3a2c28', 0.3), lwAt(zm, 0.6), { alpha: 0.7 }); }
      }
    }
    if (spec.lit) quad(ctx, cam, [P(z0, H1 + 0.35), P(z1, H1 + 0.35), P(z1, H2), P(z0, H2)], spec.lit, { alpha: spec.litA || 0.4 });
  }
  weather(ctx, cam, P, z0, z1, H1, H2, roofTop, spec, pal);
  // lintel beam
  quad(ctx, cam, [P(z0, H1 - 0.3), P(z1, H1 - 0.3), P(z1, H1 - 0.05), P(z0, H1 - 0.05)], woodDark);
  // first eave (hisashi): tiles slope from wall at H1+0.35 down to H1 at 0.9m out
  const eOut = spec.eave || 0.9;
  roofStrip(ctx, cam, side, hw, z0 - 0.15, z1 + 0.15, H1 + 0.38, H1 - 0.02, eOut, pal, spec.seed || 1);
  if (spec.twoStory !== false) {
    // upper floor horizontal beam & roof
    quad(ctx, cam, [P(z0, H2 - 0.2), P(z1, H2 - 0.2), P(z1, H2), P(z0, H2)], woodDark);
    roofStrip(ctx, cam, side, hw, z0 - 0.2, z1 + 0.2, roofTop, H2 - 0.05, spec.roofOut || 0.75, pal, (spec.seed || 1) + 7);
  }
  // outlines of main verticals
  seg3(ctx, cam, P(z0, 0), P(z0, roofTop), pal.line, lwAt(z0, 1.5), { alpha: 0.8 });
}

// Tiled roof strip along the facade: from wall (at yWall) out to eave edge (at yEdge, dx out)
// Weathering: rain streaks under eaves, grime at the base, a few stains. Subtle, low alpha.
function weather(ctx, cam, P, z0, z1, H1, H2, roofTop, spec, pal) {
  const R = new C.Rng((spec.seed || 1) * 31 + 7); const dirt = pal.dirt || C.mix(pal.woodDark, '#2a2030', 0.3);
  // grime band at the base
  quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, 0.55), P(z0, 0.55)], dirt, { alpha: 0.18 });
  if (spec.twoStory !== false) {
    const n = Math.round((z1 - z0) * 2.2);
    for (let i = 0; i < n; i++) { const z = z0 + R.range(0.1, z1 - z0 - 0.1); const top = H2 - 0.2, len = R.range(0.3, 1.4); seg3(ctx, cam, P(z, top), P(z + R.range(-0.03, 0.03), top - len), dirt, lwAt(z, R.range(1.2, 3.5)), { alpha: R.range(0.08, 0.2), taper: 'end', seed: i }); }
    for (let i = 0; i < 3; i++) { const z = z0 + R.range(0.3, z1 - z0 - 0.3), y = R.range(H1 + 0.6, H2 - 0.5); const rz = R.range(0.3, 0.8), ry = R.range(0.2, 0.5); quad(ctx, cam, [P(z - rz, y - ry), P(z + rz, y - ry * 0.7), P(z + rz * 0.8, y + ry), P(z - rz * 0.7, y + ry * 0.8)], dirt, { alpha: 0.07 }); }
  }
}

function roofStrip(ctx, cam, side, hw, z0, z1, yWall, yEdge, out, pal, seed) {
  const X = side * hw, Xe = side * (hw - out);
  const P = [[X, yWall, z0], [X, yWall, z1], [Xe, yEdge, z1], [Xe, yEdge, z0]];
  // underside (soffit) visible from below: a thin dark band under the edge
  quad(ctx, cam, [[Xe, yEdge, z0], [Xe, yEdge, z1], [X, yEdge - 0.12, z1], [X, yEdge - 0.12, z0]], pal.soffit || C.mix(pal.woodDark, '#000', 0.2));
  quad(ctx, cam, P, pal.tile);
  // tile ridges running down the slope
  const n = Math.max(2, Math.round((z1 - z0) / 0.28));
  for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; seg3(ctx, cam, [X, yWall, z], [Xe, yEdge, z], pal.tileLine, lwAt(z, 1.0), { alpha: 0.85, seed: seed + i }); }
  // eave edge: row of round tile ends
  seg3(ctx, cam, [Xe, yEdge, z0], [Xe, yEdge, z1], pal.tileDark, lwAt((z0 + z1) / 2, 2.6));
  for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; const p = cam.p(Xe, yEdge - 0.03, z); if (p) { const r = C.clamp(0.06 * cam.f / p[2], 0.6, 9); C.celCircle(ctx, p[0], p[1], r, pal.tileDark); } }
  // ridge at the wall
  seg3(ctx, cam, [X, yWall, z0], [X, yWall, z1], pal.tileDark, lwAt((z0 + z1) / 2, 1.6));
}

// Inuyarai: curved bamboo fence at the base of a facade
function inuyarai(ctx, cam, side, hw, z0, z1, pal) {
  const X = side * hw; const n = Math.round((z1 - z0) / 0.07);
  const col = pal.bamboo || '#a88f5f', colD = C.mix(col, '#3a2c28', 0.35);
  // back silhouette fill
  const back = []; for (let k = 0; k <= 10; k++) { const u = k / 10; const y = 0.95 * u; const out = 0.45 * Math.sin(Math.PI * 0.5 * (1 - u)) * (1 - u * 0.3); back.push([X - side * out, y]); }
  for (let i = 0; i <= n; i++) {
    const z = z0 + (z1 - z0) * i / n; const pts = back.map(([x, y]) => [x, y, z]);
    poly3(ctx, cam, pts, i % 2 ? col : colD, lwAt(z, 2.2), { seed: i, wobble: 0.3 });
  }
  poly3(ctx, cam, [[X - side * 0.02, 0.95, z0], [X - side * 0.02, 0.95, z1]], colD, lwAt((z0 + z1) / 2, 2.4));
  poly3(ctx, cam, [[X - side * 0.3, 0.45, z0], [X - side * 0.3, 0.45, z1]], colD, lwAt((z0 + z1) / 2, 1.8));
}

// Potted plants cluster on the ground against a wall.
function pots(ctx, cam, side, x, z0, z1, pal, seed, density = 1, kinds = null, sizeK = 1) {
  const R = new C.Rng(seed); const items = []; let z = z0;
  while (z < z1) { const s = R.range(0.22, 0.42) * sizeK; items.push({ z: z + s / 2, s, x: side * (x - R.range(0, 0.35)), kind: R.pick(kinds || ['bush', 'bush', 'leaf', 'grass', 'maple', 'flower']), pot: R.pick(pal.pots) }); z += s * R.range(0.55, 1.0) / density; }
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    const base = cam.p(it.x, 0, it.z); if (!base) continue; const k = cam.f / base[2]; const s = it.s * k;
    const potH = s * 0.8, potW = s * 0.9;
    // pot
    const pp = [[base[0] - potW / 2, base[1] - potH], [base[0] + potW / 2, base[1] - potH], [base[0] + potW * 0.38, base[1]], [base[0] - potW * 0.38, base[1]]];
    if (!pal.noPot) { fillPoly(ctx, pp, it.pot); fillPoly(ctx, [[pp[0][0], pp[0][1]], [pp[1][0], pp[1][1]], [pp[1][0], pp[1][1] + potH * 0.15], [pp[0][0], pp[0][1] + potH * 0.15]], C.mix(it.pot, '#fff', 0.2));
    if (k > 40) outline(ctx, pp, pal.line, C.clamp(k / 180, 0.5, 2)); }
    // plant
    const top = [base[0], base[1] - potH]; const pr = new C.Rng(seed + Math.round(it.z * 100));
    if (it.kind === 'bush' || it.kind === 'flower') {
      const cl = []; for (let j = 0; j < 26; j++) { const a = -Math.PI / 2 + pr.range(-1.35, 1.35), r = s * pr.range(0.05, 0.62); cl.push([top[0] + Math.cos(a) * r * 0.85, top[1] + Math.sin(a) * r * 0.75 - s * 0.1, pr.range(0.08, 0.15) * s, pr.next()]); }
      cl.sort((u, v) => u[1] - v[1]);
      for (const [cx, cy, rr, q] of cl) { const up = (top[1] - cy) / s; const col = up > 0.45 ? pal.plantLight : up > 0.15 ? (q > 0.5 ? pal.plant : pal.plantLight) : (q > 0.4 ? pal.plantDark : pal.plant); C.celEllipse(ctx, cx, cy, rr * 1.25, rr, col, 1, pr.range(-0.6, 0.6)); }
      if (it.kind === 'flower') for (let j = 0; j < 5; j++) C.celCircle(ctx, top[0] + pr.range(-s * 0.4, s * 0.4), top[1] - pr.range(s * 0.1, s * 0.6), Math.max(1, s * 0.06), pal.flower || '#e0736a');
    } else if (it.kind === 'leaf') { // aspidistra: long blades
      for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + pr.range(-0.7, 0.7); const L = s * pr.range(0.9, 1.6); const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L]; const mid = [top[0] + Math.cos(a) * L * 0.5 + pr.range(-4, 4), top[1] + Math.sin(a) * L * 0.5];
        C.ink(ctx, C.qbez(top, mid, tip, 8), { width: Math.max(1.5, s * 0.16), color: j % 2 ? pal.plant : pal.plantDark, taper: 'both', wobble: 0.3, seed: j }); }
    } else if (it.kind === 'grass') {
      for (let j = 0; j < 12; j++) { const a = -Math.PI / 2 + pr.range(-0.9, 0.9); const L = s * pr.range(0.4, 0.9); C.ink(ctx, [top, [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L]], { width: Math.max(0.8, s * 0.04), color: j % 2 ? pal.plantLight : pal.plant, taper: 'end', wobble: 0.2, seed: j }); }
    } else if (it.kind === 'maple') {
      C.ink(ctx, [top, [top[0], top[1] - s * 0.9]], { width: Math.max(1, s * 0.05), color: pal.woodDark, taper: 0 });
      for (let j = 0; j < 9; j++) { const cx = top[0] + pr.range(-s * 0.5, s * 0.5), cy = top[1] - s * pr.range(0.5, 1.2); C.celEllipse(ctx, cx, cy, s * 0.2, s * 0.13, j % 3 ? pal.maple || '#c9713f' : pal.plant); }
    }
  }
}

// Stone paving (ishidatami) on the ground plane, between x0..x1, z0..z1
function paving(ctx, cam, x0, x1, z0, z1, pal, seed = 3) {
  quad(ctx, cam, [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]], pal.stone);
  const R = new C.Rng(seed); let z = z0;
  while (z < z1) {
    const d = R.range(0.35, 0.55) * (1 + z * 0.01); let x = x0 + R.range(-0.3, 0);
    while (x < x1) {
      const w = R.range(0.45, 0.85); const tone = R.next();
      const col = tone < 0.3 ? pal.stone2 : tone < 0.55 ? pal.stone3 : pal.stone;
      if (col !== pal.stone) quad(ctx, cam, [[Math.max(x0, x + 0.03), 0, z + 0.03], [Math.min(x1, x + w - 0.03), 0, z + 0.03], [Math.min(x1, x + w - 0.03), 0, z + d - 0.03], [Math.max(x0, x + 0.03), 0, z + d - 0.03]], col, { alpha: 0.8 });
      if (x > x0) seg3(ctx, cam, [x, 0, z], [x, 0, z + d], pal.joint, lwAt(z, 1.2), { alpha: 0.75, seed: Math.round(x * 10 + z) });
      x += w;
    }
    seg3(ctx, cam, [x0, 0, z], [x1, 0, z], pal.joint, lwAt(z, 1.2), { alpha: 0.75, seed: Math.round(z * 7) });
    z += d;
  }
}

// Utility pole with crossarms and a transformer
function pole(ctx, cam, x, z, pal, h = 9.5) {
  const b = cam.p(x, 0, z), t = cam.p(x, h, z); if (!b || !t) return null; const k = cam.f / b[2]; const r = 0.16 * k;
  fillPoly(ctx, [[b[0] - r, b[1]], [b[0] + r, b[1]], [t[0] + r * 0.75, t[1]], [t[0] - r * 0.75, t[1]]], pal.pole);
  fillPoly(ctx, [[b[0] + r * 0.2, b[1]], [b[0] + r, b[1]], [t[0] + r * 0.75, t[1]], [t[0] + r * 0.1, t[1]]], C.mix(pal.pole, '#2a2238', 0.25));
  // crossarms
  const arms = [];
  for (const [y, L] of [[h - 0.4, 1.3], [h - 1.3, 1.0]]) { const a = cam.p(x - L / 2, y, z), c = cam.p(x + L / 2, y, z); if (a && c) { C.ink(ctx, [[a[0], a[1]], [c[0], c[1]]], { width: Math.max(1, 0.1 * k), color: pal.poleDark, taper: 0, wobble: 0.2 }); arms.push([[x - L / 2, y, z], [x + L / 2, y, z], [x, y, z]]); } }
  // transformer can
  const tr = cam.p(x + side2(x) * 0.3, h - 2.6, z); if (tr) { C.celEllipse(ctx, tr[0], tr[1], 0.22 * k, 0.4 * k, pal.poleDark); }
  // step bolts
  for (let i = 0; i < 8; i++) { const y = 2.2 + i * 0.7; const p = cam.p(x + (i % 2 ? 0.18 : -0.18), y, z); if (p) C.ink(ctx, [[p[0] - 0.12 * k * (i % 2 ? -1 : 1), p[1]], [p[0], p[1]]], { width: Math.max(0.6, 0.03 * k), color: pal.poleDark, taper: 0 }); }
  return arms;
}
function side2(x) { return x < 0 ? 1 : -1; }
// Sagging wire between two 3D points
function wire(ctx, cam, a, b, sag, color, w = 1.2) {
  const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - sag * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]); }
  const P = pts.map(p => cam.pc(...p)).map(p => [p[0], p[1]]);
  C.ink(ctx, P, { width: w, color, taper: 0, wobble: 0.15, seed: 5, step: 8 });
}

// Five-storey pagoda silhouette (Yasaka / Hokan-ji), base centre at world x,z
function pagoda(ctx, cam, x, z, H, col, colLight, rim) {
  const b = cam.p(x, 0, z); if (!b) return; const k = cam.f / b[2];
  const w0 = H * 0.26; let y = 0; const tiers = 5; const tierH = H * 0.13;
  for (let i = 0; i < tiers; i++) {
    const w = w0 * (1 - i * 0.09), bodyW = w * 0.62;
    const yb = b[1] - y * k, yt = b[1] - (y + tierH) * k;
    fillPoly(ctx, [[b[0] - bodyW / 2 * k, yb], [b[0] + bodyW / 2 * k, yb], [b[0] + bodyW / 2 * k, yt], [b[0] - bodyW / 2 * k, yt]], col);
    // roof with upturned corners
    const ry = yt + tierH * 0.15 * k; const rw = w / 2 * k;
    const roof = [[b[0] - rw * 1.08, ry - tierH * 0.22 * k], [b[0] - rw * 0.9, ry - tierH * 0.05 * k], [b[0] - rw * 0.4, ry - tierH * 0.3 * k], [b[0] + rw * 0.4, ry - tierH * 0.3 * k], [b[0] + rw * 0.9, ry - tierH * 0.05 * k], [b[0] + rw * 1.08, ry - tierH * 0.22 * k], [b[0] + rw * 0.95, ry + tierH * 0.02 * k], [b[0] - rw * 0.95, ry + tierH * 0.02 * k]];
    fillPoly(ctx, roof, col);
    if (rim) C.ink(ctx, roof.slice(0, 6), { width: Math.max(0.8, k * 0.08), color: rim, taper: 'both', wobble: 0.3, alpha: 0.9 });
    // lit window bands
    if (colLight) fillPoly(ctx, [[b[0] - bodyW * 0.3 * k, yb - tierH * 0.35 * k], [b[0] + bodyW * 0.3 * k, yb - tierH * 0.35 * k], [b[0] + bodyW * 0.3 * k, yb - tierH * 0.55 * k], [b[0] - bodyW * 0.3 * k, yb - tierH * 0.55 * k]], colLight, 0.35);
    y += tierH * (i === 0 ? 1.25 : 1.05);
  }
  // sorin spire
  const st = b[1] - y * k; C.ink(ctx, [[b[0], st], [b[0], st - H * 0.2 * k]], { width: Math.max(1, k * 0.35), color: col, taper: 'end', wobble: 0.2 });
  for (let i = 0; i < 9; i++) { const yy = st - H * (0.03 + i * 0.018) * k; C.ink(ctx, [[b[0] - H * 0.02 * k, yy], [b[0] + H * 0.02 * k, yy]], { width: Math.max(0.6, k * 0.12), color: col, taper: 0 }); }
}

// Distant hills: layered soft silhouettes across the horizon
function hills(ctx, W, hy, layers, seed = 1) {
  layers.forEach((L, i) => {
    const pts = [[0, hy + 40]]; for (let x = 0; x <= W; x += 16) { const h = L.h * (0.55 + 0.45 * C.fbm2(x / L.scale, i * 3.1, seed + i, 3)); pts.push([x, hy - h]); } pts.push([W, hy + 40]);
    C.wash(ctx, pts, L.color, { bleed: 5, seed: seed + i * 11, edge: 0.15 });
  });
}

// Hanging paper lantern (chochin), drawn in screen space at size s
function chochin(ctx, x, y, s, body, band, lit, text) {
  if (lit) { ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4); g.addColorStop(0, C.rgba(lit, 0.55)); g.addColorStop(1, C.rgba(lit, 0)); ctx.fillStyle = g; ctx.fillRect(x - s * 2.4, y - s * 2.4, s * 4.8, s * 4.8); ctx.restore(); }
  C.ink(ctx, [[x, y - s * 0.95], [x, y - s * 1.35]], { width: Math.max(0.8, s * 0.05), color: band, taper: 0 });
  C.celEllipse(ctx, x, y, s * 0.46, s * 0.62, lit ? C.mix(body, '#fff4d0', 0.45) : body);
  for (let i = -2; i <= 2; i++) ctx.save(), ctx.globalAlpha = 0.35, ctx.strokeStyle = band, ctx.lineWidth = Math.max(0.5, s * 0.025), ctx.beginPath(), ctx.ellipse(x, y + i * s * 0.2, s * 0.46 * Math.sqrt(1 - (i * 0.3) ** 2), s * 0.04, 0, 0, Math.PI * 2), ctx.stroke(), ctx.restore();
  C.cel(ctx, [[x - s * 0.3, y - s * 0.62], [x + s * 0.3, y - s * 0.62], [x + s * 0.26, y - s * 0.72], [x - s * 0.26, y - s * 0.72]], band);
  C.cel(ctx, [[x - s * 0.3, y + s * 0.62], [x + s * 0.3, y + s * 0.62], [x + s * 0.26, y + s * 0.72], [x - s * 0.26, y + s * 0.72]], band);
  if (text) { ctx.save(); ctx.fillStyle = C.mix(band, '#000', 0.2); ctx.font = `${Math.round(s * 0.34)}px Yuji`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ch = [...text]; ch.forEach((c, i) => ctx.fillText(c, x, y + (i - (ch.length - 1) / 2) * s * 0.36)); ctx.restore(); }
}

// Vertical hand-lettered sign board (kanban) on a facade, screen space
function kanban(ctx, x, y, w, h, board, ink, text, font = 'Yuji') {
  C.cel(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], board);
  C.ink(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { closed: true, width: Math.max(0.6, w * 0.04), color: C.mix(board, '#000', 0.5), taper: 0, wobble: 0.3 });
  ctx.save(); ctx.fillStyle = ink; ctx.font = `${Math.round(w * 0.62)}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ch = [...text]; const step = (h * 0.86) / ch.length; ch.forEach((c, i) => ctx.fillText(c, x + w / 2, y + h * 0.07 + step * (i + 0.5))); ctx.restore();
}

// Brown Kyoto-style vending machine (historic-district colour scheme), 3D box against a wall
function vending(ctx, cam, side, hw, z0, pal, glow) {
  const X = side * hw; const d = 0.75, w = 1.0, h = 1.83; const z1 = z0 + w; const Xf = X - side * d;
  const front = [[Xf, 0, z0], [Xf, 0, z1], [Xf, h, z1], [Xf, h, z0]];
  const top = [[X, h, z0], [X, h, z1], [Xf, h, z1], [Xf, h, z0]];
  const sideF = [[X, 0, z0], [Xf, 0, z0], [Xf, h, z0], [X, h, z0]];
  quad(ctx, cam, sideF, C.mix(pal.vend || '#6b4a3a', '#000', 0.25)); quad(ctx, cam, front, pal.vend || '#6b4a3a'); quad(ctx, cam, top, C.mix(pal.vend || '#6b4a3a', '#fff', 0.1));
  // display window with drink rows
  const win = [[Xf, 1.05, z0 + 0.08], [Xf, 1.05, z1 - 0.08], [Xf, 1.72, z1 - 0.08], [Xf, 1.72, z0 + 0.08]];
  quad(ctx, cam, win, glow ? '#f4f0dc' : '#cfc8b4');
  const cols = ['#c94b3c', '#3e6fb0', '#e4b93a', '#4c9a5b', '#f2f2f2', '#8b4b8e', '#e07b3a', '#3c3c3c'];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) { const zc = z0 + 0.14 + i * 0.09, yb = 1.1 + row * 0.21; quad(ctx, cam, [[Xf, yb, zc], [Xf, yb, zc + 0.05], [Xf, yb + 0.13, zc + 0.05], [Xf, yb + 0.13, zc]], cols[(i + row * 3) % 8]); }
  // buttons row, coin slot, dispenser
  quad(ctx, cam, [[Xf, 0.12, z0 + 0.12], [Xf, 0.12, z1 - 0.12], [Xf, 0.42, z1 - 0.12], [Xf, 0.42, z0 + 0.12]], '#2b2522');
  outline(ctx, projPoly(cam, front), pal.line, lwAt(z0, 1.4));
  return { center: [Xf, 1.4, (z0 + z1) / 2], window: win };
}

module.exports = { lwAt, fillPoly, quad, outline, seg3, poly3, machiya, roofStrip, inuyarai, pots, paving, pole, wire, pagoda, hills, chochin, kanban, vending };
