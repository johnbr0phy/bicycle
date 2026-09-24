'use strict';
// The Kamo river in late-afternoon gold. Wide view across the river (S14) and the turtle stepping stones (S15).
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const PAL = { sky1: '#a9bfd6', sky2: '#f3d9b0', sun: '#ffe2a8', mtn1: '#8d8aa8', mtn2: '#a49ab0', mtn3: '#b8a8b0', city: '#b69c8e', cityDark: '#8a7478', trees: '#7d8a58', treesDark: '#5d6a48', bank: '#a8a070', bankTop: '#c2b88a', path: '#d6c29a', path2: '#c9b48c', wall: '#b8a890', water: '#8fa8b0', waterGold: '#f2d49a', waterDark: '#6a8290', grass: '#a6a060', grass2: '#8a8a50', stone: '#9a9088', stone2: '#b0a698', line: '#5a4a40', people: ['#4a4a60', '#8a4a44', '#e8e0d0', '#5a6a8a', '#3a3a44', '#c9a070', '#6a7a5a'] };
// Camera looks north-east across the river; river runs from left (far, upstream) to right.
function makeCam(o = {}) { return new Cam(Object.assign({ x: 0, y: 2.0, z: 0, yaw: 0, pitch: -0.2, f: 1300, W: 1920, H: 1080 }, o)); }
// Geometry (world): near path at z 1..4, near bank slope 4..6 down to water (y -1.2), river z 6..40, far bank 40..44 up, far path 44..48, embankment wall, city beyond.
const WY = -1.3;
function seated(ctx, cam, x, z, col, col2, R, pair) {
  const p = cam.p(x, 0, z); if (!p) return; const k = cam.f / p[2];
  const one = (dx, c1, lean) => { const bx = p[0] + dx * k; C.cel(ctx, [[bx - 0.2 * k, p[1]], [bx + 0.2 * k, p[1]], [bx + 0.16 * k, p[1] - 0.55 * k], [bx - 0.14 * k, p[1] - 0.6 * k]], c1); C.celCircle(ctx, bx + lean * k, p[1] - 0.72 * k, 0.11 * k, '#3a302e'); C.cel(ctx, [[bx - 0.2 * k, p[1]], [bx + 0.35 * k, p[1]], [bx + 0.35 * k, p[1] - 0.12 * k], [bx - 0.2 * k, p[1] - 0.14 * k]], C.mix(c1, '#2a2436', 0.4)); };
  if (pair) { one(-0.22, col, 0.03); one(0.22, col2, -0.03); } else one(0, col, 0);
}
function buildWide(o = {}) {
  const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d'); const R = new C.Rng(14);
  const hy = cam.horizonY(); const g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, PAL.sky1); g.addColorStop(1, PAL.sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) { const cx = R.range(0, W), cy = R.range(30, hy - 200), w = R.range(200, 500), h = R.range(20, 50); const pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; pts.push([cx + Math.cos(a) * w, cy + Math.sin(a) * h * (a > Math.PI ? 1 : 0.5)]); } C.wash(ctx, pts, '#fbead0', { alpha: 0.6, bleed: 8, seed: i, smooth: true, edge: 0.1 }); }
  // Higashiyama hills: rounded layered silhouettes
  K.hills(ctx, W, hy + 30, [{ h: 330, scale: 700, color: PAL.mtn1 }, { h: 230, scale: 420, color: PAL.mtn2 }, { h: 130, scale: 260, color: PAL.mtn3 }], 31);
  // city beyond the far bank: low blocks with windows, a few trees
  for (let i = 0; i < 60; i++) { const x = -70 + i * 2.4 + R.range(-0.5, 0.5), z = 58 + R.range(0, 30), h = R.range(4, 8), w = R.range(3, 6); K.quad(ctx, cam, [[x, 0, z], [x + w, 0, z], [x + w, h, z], [x, h, z]], R.next() > 0.5 ? '#d8c8b4' : '#c8b4a0'); K.quad(ctx, cam, [[x - 0.4, h, z], [x + w + 0.4, h, z], [x + w, h + 1.6, z + 1], [x, h + 1.6, z + 1]], R.pick(['#6a6878', '#7a7080', '#5e5a6a'])); }
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#f6dcb8'; ctx.fillRect(0, 0, W, H); ctx.restore();
  // far embankment: trees in a row, a wall, the far path with people evenly spaced
  for (let i = 0; i < 40; i++) { const x = -50 + i * 2.6, z = 52 + R.range(0, 3); const p = cam.p(x, 0, z); if (!p) continue; const k = cam.f / p[2]; for (let j = 0; j < 10; j++) C.celEllipse(ctx, p[0] + R.range(-1.5, 1.5) * k, p[1] - R.range(3, 7) * k, R.range(0.8, 1.6) * k, R.range(0.6, 1.1) * k, j % 3 ? PAL.trees : PAL.treesDark, 0.95); }
  K.quad(ctx, cam, [[-80, 0, 48], [80, 0, 48], [80, 1.6, 48], [-80, 1.6, 48]], PAL.wall);
  K.quad(ctx, cam, [[-80, 0, 44], [80, 0, 44], [80, 0, 48], [-80, 0, 48]], PAL.path);
  K.quad(ctx, cam, [[-80, 0, 40], [80, 0, 40], [80, 0, 44], [-80, 0, 44]], PAL.bankTop);
  K.quad(ctx, cam, [[-80, WY, 38], [80, WY, 38], [80, 0, 40], [-80, 0, 40]], PAL.bank);
  // the famous even spacing: couples sitting along the far bank edge, ~3.5 m apart
  for (let x = -40, i = 0; x < 40; x += 3.4 + R.range(-0.15, 0.15), i++) seated(ctx, cam, x, 40.6, R.pick(PAL.people), R.pick(PAL.people), R, R.next() < 0.7);
  // the river: shallow, broad, with gold glints and a weir line
  K.quad(ctx, cam, [[-80, WY, 7], [80, WY, 7], [80, WY, 38], [-80, WY, 38]], PAL.water);
  for (let i = 0; i < 900; i++) { const x = R.range(-40, 40), z = R.range(8, 37); const p = cam.p(x, WY, z); if (!p) continue; const k = cam.f / p[2]; const l = R.range(0.3, 1.4) * k; C.ink(ctx, [[p[0] - l, p[1]], [p[0] + l, p[1]]], { width: Math.max(0.8, R.range(0.02, 0.05) * k), color: R.next() > 0.4 ? PAL.waterGold : PAL.waterDark, alpha: R.range(0.4, 0.9), taper: 'both', wobble: 0.3 }); }
  // weir: a white foam line diagonally across
  for (let i = 0; i < 120; i++) { const u = i / 120; const x = -40 + 80 * u, z = 26 - 6 * u + R.range(-0.2, 0.2); const p = cam.p(x, WY + 0.02, z); if (p) { const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.3, 0.8) * k, 0.06 * k, '#f6f2e6', 0.8); } }
  // shallow gravel bars and reeds
  for (let i = 0; i < 6; i++) { const x = R.range(-30, 30), z = R.range(10, 20); const P2 = [[x - 3, WY + 0.01, z], [x + 3, WY + 0.01, z], [x + 2, WY + 0.01, z + 1.2], [x - 2, WY + 0.01, z + 1]]; K.quad(ctx, cam, P2, PAL.stone2, { alpha: 0.9 }); }
  // near bank slope with grass, down to the water, and the near gravel path (we stand on it)
  K.quad(ctx, cam, [[-80, WY, 7], [80, WY, 7], [80, 0, 4.2], [-80, 0, 4.2]], PAL.grass);
  for (let i = 0; i < 500; i++) { const x = R.range(-12, 12), z = R.range(4.3, 7); const y = WY * (z - 4.2) / 2.8; const p = cam.p(x, y, z); if (!p) continue; const k = cam.f / p[2]; C.ink(ctx, [[p[0], p[1]], [p[0] + R.range(-0.05, 0.05) * k, p[1] - R.range(0.1, 0.3) * k]], { width: Math.max(0.8, 0.012 * k), color: R.next() > 0.5 ? PAL.grass2 : '#c2b870', taper: 'end' }); }
  K.quad(ctx, cam, [[-80, 0, 1.0], [80, 0, 1.0], [80, 0, 4.2], [-80, 0, 4.2]], PAL.path);
  for (let i = 0; i < 300; i++) { const x = R.range(-8, 8), z = R.range(1.6, 4.2); const p = cam.p(x, 0, z); if (!p) continue; const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.02, 0.06) * k, R.range(0.01, 0.02) * k, R.next() > 0.5 ? PAL.path2 : '#e2d2ae', 0.8); }
  // low sun glow from the left (west) and long warm light
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const sg = ctx.createRadialGradient(-200, hy - 100, 0, -200, hy - 100, 1400); sg.addColorStop(0, 'rgba(255,214,150,0.55)'); sg.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 71, tremor: 2.6, edge: 1.0, turb: 0.3, gran: 0.2 });
  return { cam, plate, WY };
}
// The turtle stepping stones: camera low near the water's edge, stones leading across; the far bank people beyond.
function buildStones(o = {}) {
  const cam = o.cam || makeCam({ y: 0.55, pitch: 0.0, yaw: -0.18, f: 1300 }); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d'); const R = new C.Rng(15);
  // reuse the wide plate painting logic for the background, but from this camera with water at y = -0.1 (we are at the edge)
  const hy = cam.horizonY(); const g = ctx.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, PAL.sky1); g.addColorStop(1, PAL.sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  K.hills(ctx, W, hy + 20, [{ h: 300, scale: 700, color: PAL.mtn1 }, { h: 200, scale: 420, color: PAL.mtn2 }, { h: 110, scale: 260, color: PAL.mtn3 }], 32);
  ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#f6dcb8'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const wy = -0.15;
  for (let i = 0; i < 40; i++) { const x = -50 + i * 2.6, z = 40 + R.range(0, 3); const p = cam.p(x, 1.2, z); if (!p) continue; const k = cam.f / p[2]; for (let j = 0; j < 10; j++) C.celEllipse(ctx, p[0] + R.range(-1.5, 1.5) * k, p[1] - R.range(2, 6) * k, R.range(0.8, 1.6) * k, R.range(0.6, 1.1) * k, j % 3 ? PAL.trees : PAL.treesDark, 0.95); }
  K.quad(ctx, cam, [[-80, wy, 30], [80, wy, 30], [80, 1.2, 33], [-80, 1.2, 33]], PAL.bank);
  for (let x = -40; x < 40; x += 3.4) seated(ctx, cam, x, 33.3, R.pick(PAL.people), R.pick(PAL.people), R, R.next() < 0.7);
  K.quad(ctx, cam, [[-80, wy, 0.5], [80, wy, 0.5], [80, wy, 30], [-80, wy, 30]], PAL.water);
  for (let i = 0; i < 1000; i++) { const x = R.range(-25, 25), z = R.range(1, 29); const p = cam.p(x, wy, z); if (!p) continue; const k = cam.f / p[2]; const l = R.range(0.15, 0.8) * k; C.ink(ctx, [[p[0] - l, p[1]], [p[0] + l, p[1]]], { width: Math.max(0.8, R.range(0.012, 0.03) * k), color: R.next() > 0.4 ? PAL.waterGold : PAL.waterDark, alpha: R.range(0.4, 0.9), taper: 'both', wobble: 0.3 }); }
  // the stepping stones: a path of square stones and two turtle-shaped ones, leading across
  const stones = []; for (let i = 0; i < 16; i++) { const z = 3.7 + i * 0.95, x = 0.25 + 0.15 * Math.sin(i * 0.9); stones.push({ x, z, turtle: i === 0 || i === 5 }); }
  for (const s of stones.slice().reverse()) {
    const hs = 0.3; const top = [[s.x - hs, 0.08, s.z - hs], [s.x + hs, 0.08, s.z - hs], [s.x + hs, 0.08, s.z + hs], [s.x - hs, 0.08, s.z + hs]];
    const front = [[s.x - hs, wy, s.z - hs], [s.x + hs, wy, s.z - hs], [s.x + hs, 0.08, s.z - hs], [s.x - hs, 0.08, s.z - hs]];
    K.quad(ctx, cam, front, PAL.stone, { line: PAL.line, lw: K.lwAt(s.z, 1.2) });
    if (s.turtle) { // a turtle carved in stone: domed shell with hex plates, four flippers, head toward the camera
      const c = cam.p(s.x, 0.1, s.z); const k = cam.f / c[2];
      for (const [fx, fz] of [[-0.3, -0.18], [0.3, -0.18], [-0.28, 0.2], [0.28, 0.2]]) { const q = cam.p(s.x + fx, 0.06, s.z + fz); C.celEllipse(ctx, q[0], q[1], 0.1 * k, 0.035 * k, PAL.stone); C.inkEllipse(ctx, q[0], q[1], 0.1 * k, 0.035 * k, { width: Math.max(1, 0.006 * k), color: PAL.line }); }
      const hd = cam.p(s.x, 0.09, s.z - 0.42); C.celEllipse(ctx, hd[0], hd[1], 0.1 * k, 0.07 * k, PAL.stone2); C.inkEllipse(ctx, hd[0], hd[1], 0.1 * k, 0.07 * k, { width: Math.max(1, 0.007 * k), color: PAL.line }); C.celCircle(ctx, hd[0] - 0.045 * k, hd[1] - 0.015 * k, 0.012 * k, PAL.line); C.celCircle(ctx, hd[0] + 0.045 * k, hd[1] - 0.015 * k, 0.012 * k, PAL.line);
      const sh = []; for (let j = 0; j < 30; j++) { const a2 = j / 30 * Math.PI * 2; sh.push([c[0] + Math.cos(a2) * 0.34 * k, c[1] + Math.sin(a2) * (Math.sin(a2) < 0 ? 0.16 : 0.07) * k]); }
      C.celShade(ctx, sh, PAL.stone2, PAL.stone, [-0.5, -0.8], 0.03 * k); C.ink(ctx, sh, { closed: true, width: Math.max(1, 0.008 * k), color: PAL.line });
      for (const [dx, dy] of [[0, -0.07], [-0.14, -0.04], [0.14, -0.04], [-0.07, 0.0], [0.07, 0.0]]) { const hx = []; for (let j = 0; j < 6; j++) { const a2 = j / 6 * Math.PI * 2; hx.push([c[0] + dx * k + Math.cos(a2) * 0.055 * k, c[1] + dy * k + Math.sin(a2) * 0.022 * k]); } C.ink(ctx, hx, { closed: true, width: Math.max(0.8, 0.004 * k), color: PAL.line, alpha: 0.7 }); }
    } else K.quad(ctx, cam, top, PAL.stone2, { line: PAL.line, lw: K.lwAt(s.z, 1.2) });
    // ripples around each stone
    const rp = cam.p(s.x, wy, s.z - 0.4); if (rp) { const k = cam.f / rp[2]; C.inkEllipse(ctx, rp[0], rp[1], 0.6 * k, 0.05 * k, { width: Math.max(0.8, 0.006 * k), color: '#e8f0f0', alpha: 0.6 }); }
  }
  // near bank: grass and pebbles at the bottom of frame
  K.quad(ctx, cam, [[-80, 0, 0.2], [80, 0, 0.2], [80, 0, 2.9], [-80, 0, 2.9]], PAL.path); K.quad(ctx, cam, [[-80, 0, 2.9], [80, 0, 2.9], [80, wy, 3.2], [-80, wy, 3.2]], PAL.stone);
  for (let i = 0; i < 400; i++) { const x = R.range(-4, 4), z = R.range(0.5, 2.9); const p = cam.p(x, 0, z); if (!p) continue; const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.02, 0.06) * k, R.range(0.01, 0.025) * k, R.next() > 0.5 ? PAL.stone : PAL.stone2, 0.9); }
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const sg = ctx.createRadialGradient(-100, hy - 60, 0, -100, hy - 60, 1300); sg.addColorStop(0, 'rgba(255,214,150,0.5)'); sg.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H); ctx.restore();
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 73, tremor: 2.6, edge: 1.0, turb: 0.3, gran: 0.2 });
  return { cam, plate, stones, wy };
}
module.exports = { buildWide, buildStones, makeCam, PAL, WY };
