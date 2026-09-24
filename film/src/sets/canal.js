'use strict';
// Shirakawa canal, Gion, morning. Stone path on the right, the shallow canal on the left below stone embankments,
// teahouses with bamboo blinds across the water, willows leaning over, a little stone bridge in the distance.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const PAL = Object.assign({}, require('./palettes').morning, {
  water: '#7fa6ad', waterDeep: '#5d8590', waterLight: '#cfe3e0', embank: '#9d978e', embank2: '#8a847c', embank3: '#b2ab9f', path: '#c9c0b0', path2: '#bbb2a2', willow: '#8ab06a', willowDark: '#5f8a4e', rail: '#6a5a4a', skyTop: '#9cc2e0', skyLow: '#e8f0ee',
});
const WATER_Y = -0.42, EDGE = -0.2, FAR = -5.4, FAR_TOP = 0.05;
function makeCam(o = {}) { return new Cam(Object.assign({ x: 0.6, y: 0.9, z: 0, yaw: -0.3, pitch: 0.02, f: 1250, W: 1920, H: 1080 }, o)); }
function willow(ctx, cam, x, z, h, seed, sway = 0, col = PAL.willow, colD = PAL.willowDark, strandsOnly = false) {
  const b = cam.p(x, 0, z), top = cam.p(x - 0.9, h, z + 0.2); if (!b || !top) return; const k0 = cam.f / b[2]; const k = strandsOnly ? Math.min(k0, 420) : k0;
  if (!strandsOnly) { const trunk = C.bez([b[0], b[1]], [b[0] - 0.1 * k, b[1] - h * 0.3 * k], [top[0] + 0.3 * k, top[1] + h * 0.3 * k], [top[0], top[1]], 14);
  C.ink(ctx, trunk, { width: 0.2 * k, color: '#5a4a3c', taper: 'end', wobble: 1 }); }
  const R = new C.Rng(seed);
  for (let i = 0; i < 90; i++) {
    const a = R.range(-Math.PI * 0.95, -0.05); const rr = R.range(0.1, 1.0); const st = [top[0] + Math.cos(a) * rr * 2.2 * k, top[1] + Math.sin(a) * rr * 0.9 * k];
    const len = R.range(0.35, 0.8) * (st[1] - cam.p(x, 0.1, z)[1] < 0 ? Math.abs(cam.p(x, 0.3, z)[1] - st[1]) : 1); const sw = (sway * Math.sin(i * 1.7) * 0.2 + R.range(-0.15, 0.15)) * k;
    const pts = C.bez(st, [st[0] + Math.cos(a) * 0.4 * k, st[1] - 0.15 * k], [st[0] + sw * 0.6, st[1] + len * 0.5], [st[0] + sw, st[1] + len], 14);
    const c0 = i % 3 === 0 ? colD : i % 3 === 1 ? col : C.mix(col, '#e8f0c8', 0.25);
    C.ink(ctx, pts, { width: Math.max(0.8, 0.018 * k), color: c0, taper: 'end', wobble: 0.3, seed: i });
    for (let j = 3; j < pts.length; j++) { const q = pts[j]; C.celEllipse(ctx, q[0] + (j % 2 ? 2.5 : -2.5) * k / 400, q[1], Math.max(1.2, 0.05 * k), Math.max(0.6, 0.014 * k), c0, 0.95, j % 2 ? 1.1 : -1.1); }
  }
}
function build(o = {}) {
  const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, PAL.skyTop); g.addColorStop(1, PAL.skyLow); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // far hills
  K.hills(ctx, W, cam.horizonY() + 10, [{ h: 170, scale: 380, color: '#a9bcc2' }, { h: 110, scale: 240, color: '#b9c7c4' }], 21);
  // teahouses across the canal (facade plane x = FAR - 0.3, facing +x toward the camera side)
  const tea = [ { z: [2, 9], bays: [[2.2, 8.8, 'lattice']], upper: [[2.4, 8.6, 'sudare']], posts: [2, 5.5, 9], seed: 71 }, { z: [9, 16], bays: [[9.2, 15.8, 'lattice']], upper: [[9.4, 15.6, 'sudare']], posts: [9, 12.5, 16], seed: 72 }, { z: [16, 26], bays: [[16.2, 25.8, 'lattice']], upper: [[16.4, 25.6, 'window']], posts: [16, 21, 26], seed: 73 }, { z: [26, 40], bays: [[26.2, 39.8, 'lattice']], upper: [[26.4, 39.6, 'sudare']], posts: [26, 33, 40], seed: 74 } ];
  const X0 = FAR - 0.3;
  // raise teahouses to sit on the far embankment top (FAR_TOP): draw with a translated camera
  const camT = new Cam(Object.assign({}, cam, { y: cam.y - FAR_TOP })); camT.update();
  for (const sp of tea.slice().reverse()) { K.machiya(ctx, camT, -1, -X0, sp.z[0], sp.z[1], sp, PAL); }
  // balconies (kawadoko-like platforms) with rails over the water
  for (const sp of tea) { K.quad(ctx, cam, [[X0, FAR_TOP + 0.9, sp.z[0] + 0.3], [X0, FAR_TOP + 0.9, sp.z[1] - 0.3], [X0 + 0.9, FAR_TOP + 0.9, sp.z[1] - 0.3], [X0 + 0.9, FAR_TOP + 0.9, sp.z[0] + 0.3]], PAL.woodDark); for (let z = sp.z[0] + 0.3; z < sp.z[1] - 0.3; z += 0.5) K.seg3(ctx, cam, [X0 + 0.9, FAR_TOP + 0.9, z], [X0 + 0.9, FAR_TOP + 1.5, z], PAL.woodDark, K.lwAt(z, 1.2)); K.seg3(ctx, cam, [X0 + 0.9, FAR_TOP + 1.5, sp.z[0] + 0.3], [X0 + 0.9, FAR_TOP + 1.5, sp.z[1] - 0.3], PAL.woodDark, K.lwAt(sp.z[0], 1.6)); }
  // far embankment wall down to the water
  K.quad(ctx, cam, [[FAR, FAR_TOP, 0.5], [FAR, FAR_TOP, 60], [FAR, WATER_Y, 60], [FAR, WATER_Y, 0.5]], PAL.embank2);
  // water surface with reflections of the far bank (mirrored, darker) and ripple streaks
  K.quad(ctx, cam, [[FAR, WATER_Y, 0.5], [EDGE, WATER_Y, 0.5], [EDGE, WATER_Y, 60], [FAR, WATER_Y, 60]], PAL.water);
  const R = new C.Rng(3); for (let i = 0; i < 160; i++) { const x = R.range(FAR + 0.2, EDGE - 0.1), z = R.range(1, 40); const p = cam.p(x, WATER_Y, z); if (!p) continue; const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.08, 0.3) * k, R.range(0.006, 0.014) * k, R.next() > 0.6 ? PAL.waterLight : PAL.waterDeep, 0.6); }
  // reflections of the far bank: dark wood and pale plaster streaks near the far wall
  for (let zz = 1; zz < 40; zz += 0.35) { const a = cam.p(FAR + 0.05, WATER_Y, zz), b2 = cam.p(FAR + 1.6, WATER_Y, zz + 0.4); if (!a || !b2) continue; C.ink(ctx, [[a[0], a[1]], [b2[0], b2[1]]], { width: Math.max(1, 0.06 * cam.f / a[2]), color: (Math.floor(zz * 3) % 3) ? '#5a4a44' : '#d9ccb0', alpha: 0.18, taper: 'end', wobble: 1.5 }); }
  // stones in the shallow water
  for (let i = 0; i < 40; i++) { const x = R.range(FAR + 0.3, EDGE - 0.3), z = R.range(1.5, 20); const p = cam.p(x, WATER_Y, z); if (!p) continue; const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.05, 0.14) * k, R.range(0.015, 0.04) * k, '#6d8a8a', 0.7); }
  // near embankment (path edge wall, seen at a grazing angle) and the stone path
  K.quad(ctx, cam, [[EDGE, 0, 0.3], [EDGE, 0, 60], [EDGE, WATER_Y, 60], [EDGE, WATER_Y, 0.3]], PAL.embank);
  K.quad(ctx, cam, [[EDGE, 0, 0.3], [3.2, 0, 0.3], [3.2, 0, 60], [EDGE, 0, 60]], PAL.path);
  let z = 0.4; while (z < 50) { const d = R.range(0.5, 0.8); K.seg3(ctx, cam, [EDGE, 0.001, z], [3.2, 0.001, z], '#9a9080', K.lwAt(z, 1.1), { alpha: 0.6 }); if (R.next() < 0.5) K.quad(ctx, cam, [[EDGE + R.range(0, 2), 0.001, z + 0.05], [EDGE + R.range(1.5, 3.3), 0.001, z + 0.05], [EDGE + R.range(1.5, 3.3), 0.001, z + d - 0.05], [EDGE + R.range(0, 2), 0.001, z + d - 0.05]], PAL.path2, { alpha: 0.6 }); z += d; }
  // low stone kerb along the canal edge with a simple rail
  K.quad(ctx, cam, [[EDGE, 0, 0.3], [EDGE, 0, 60], [EDGE, 0.18, 60], [EDGE, 0.18, 0.3]], PAL.embank3);
  // right side: a hedge and a low tiled wall
  K.quad(ctx, cam, [[3.2, 0, 0.3], [3.2, 0, 60], [3.2, 1.35, 60], [3.2, 1.35, 0.3]], '#e2d6c0');
  K.quad(ctx, cam, [[3.2, 0, 0.3], [3.2, 0, 60], [3.2, 0.4, 60], [3.2, 0.4, 0.3]], '#b3a996');
  K.roofStrip(ctx, cam, 1, 3.2, 0.3, 60, 1.6, 1.35, 0.25, PAL, 9);
  for (let i = 0; i < 700; i++) { const zz = R.range(0.5, 40), yy = R.range(1.5, 2.2 + 0.6 * Math.sin(zz * 0.7) ** 2); const p = cam.p(3.4 + R.range(0, 0.6), yy, zz); if (!p) continue; const k = cam.f / p[2]; const up = (yy - 1.5) / 1.3; C.celEllipse(ctx, p[0], p[1], 0.07 * k, 0.045 * k, up > 0.6 ? '#9dbd72' : R.next() > 0.5 ? PAL.willowDark : '#7d9a64', 0.95, R.range(-0.8, 0.8)); }
  // stone bridge in the distance (arched)
  { const zb = 24; const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; const x = FAR - 0.5 + (EDGE + 0.6 - FAR + 0.5) * u; pts.push([x, 0.3 + 0.35 * Math.sin(Math.PI * u), zb]); } const top = pts.map(p => cam.pc(...p)); const bot = pts.slice().reverse().map(([x, y, zz]) => cam.pc(x, y - 0.35 - 0.6 * Math.sin(Math.PI * ((x - FAR + 0.5) / (EDGE + 0.6 - FAR + 0.5))), zz));
    C.cel(ctx, top.concat(bot).map(p => [p[0], p[1]]), '#aaa296'); C.ink(ctx, top.map(p => [p[0], p[1]]), { width: 1.4, color: PAL.line, taper: 0 }); }
  // willows along the canal edge
  willow(ctx, cam, EDGE - 0.1, 16, 5.5, 31); willow(ctx, cam, EDGE - 0.05, 9.5, 5.2, 32);
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 51, tremor: 2.8, edge: 1.0, turb: 0.3, gran: 0.2 });
  return { cam, plate };
}
module.exports = { build, makeCam, willow, PAL, WATER_Y, EDGE };
