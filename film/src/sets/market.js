'use strict';
// Nishiki market at noon: a covered arcade with coloured glass roof panels, stalls on both sides, hand-lettered signs.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const PAL = { floor: '#c9c2b8', floor2: '#bab3a9', tileLine: '#9a9288', stallWood: '#8a6a4e', stallDark: '#4a3a30', interior: '#5a4a42', interiorDeep: '#3a2e2a', roofFrame: '#6a6a72', roofR: '#e2826a', roofY: '#f2d27a', roofG: '#9ac48a', roofW: '#f2efe4', sign: '#f2ecde', signRed: '#c9483a', signInk: '#2e2426', light: '#fff4dc', line: '#4a3a34', ice: '#e8f2f4', fish: '#9aa6b2', pickle1: '#c9b440', pickle2: '#9a3a4a', pickle3: '#7a9a4a', barrel: '#a67c52', sweet1: '#f2c2c8', sweet2: '#e8e0c8', sweet3: '#a8c890', dried: '#b8905a', lantern: '#f1e6cc' };
const HW = 1.75;
function makeCam(o = {}) { return new Cam(Object.assign({ x: 0.1, y: 0.95, z: 0, yaw: 0.02, pitch: 0.1, f: 1150, W: 1920, H: 1080 }, o)); }
const SIGNS = ['漬物', '鮮魚', '乾物', '甘味', '豆腐', '茶', '湯葉', '佃煮', '菓子', '青果'];
function stall(ctx, cam, side, z0, z1, kind, i) {
  const X = side * HW; const P = (z, y, dx = 0) => [X - side * dx, y, z]; const zm = (z0 + z1) / 2;
  // back wall + interior
  K.quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, 3.2), P(z0, 3.2)], PAL.interior);
  for (let k = 0; k < 3; k++) K.quad(ctx, cam, [P(z0 + 0.1, 1.2 + k * 0.5), P(z1 - 0.1, 1.2 + k * 0.5), P(z1 - 0.1, 1.24 + k * 0.5, 0.25), P(z0 + 0.1, 1.24 + k * 0.5, 0.25)], PAL.stallWood);
  const R = new C.Rng(i * 17 + 3);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 8; j++) { const z = z0 + 0.2 + (z1 - z0 - 0.4) * (j + 0.5) / 8; const p = cam.p(X - side * 0.15, 1.3 + k * 0.5, z); if (!p) continue; const kk = cam.f / p[2]; C.cel(ctx, [[p[0] - 0.05 * kk, p[1]], [p[0] + 0.05 * kk, p[1]], [p[0] + 0.05 * kk, p[1] - R.range(0.12, 0.3) * kk], [p[0] - 0.05 * kk, p[1] - R.range(0.12, 0.3) * kk]], R.pick(['#c9a060', '#7a8aa8', '#b85a4a', '#e8dcc0', '#6a8a5a'])); }
  // counter projecting into the aisle with a sloped display
  const d = 0.55, h = 0.78;
  K.quad(ctx, cam, [P(z0, 0), P(z1, 0), P(z1, h, d), P(z0, h, d)], PAL.stallWood);
  K.quad(ctx, cam, [P(z0, 0, d), P(z1, 0, d), P(z1, h, d), P(z0, h, d)], C.mix(PAL.stallWood, '#ffffff', 0.1), { line: PAL.line, lw: K.lwAt(zm, 1.2) });
  K.quad(ctx, cam, [P(z0, h, d), P(z1, h, d), P(z1, h + 0.25, 0.05), P(z0, h + 0.25, 0.05)], kind === 'fish' ? PAL.ice : '#d8ccb4');
  // goods on the display
  const n = Math.round((z1 - z0) / 0.18);
  for (let j = 0; j < n; j++) { const z = z0 + 0.1 + (z1 - z0 - 0.2) * (j + 0.5) / n; for (let r = 0; r < 3; r++) { const dx = d - 0.08 - r * 0.16, y = h + 0.03 + r * 0.08; const p = cam.p(X - side * dx, y, z); if (!p) continue; const kk = cam.f / p[2];
    if (kind === 'fish') { C.celEllipse(ctx, p[0], p[1], 0.07 * kk, 0.022 * kk, R.pick([PAL.fish, '#c0a0a0', '#a8b8c0']), 1, 0.3 * side); C.celCircle(ctx, p[0] + 0.05 * kk * side, p[1] - 0.004 * kk, 0.008 * kk, '#2a2a2a'); }
    else if (kind === 'pickles') { C.celEllipse(ctx, p[0], p[1], 0.07 * kk, 0.035 * kk, R.pick([PAL.pickle1, PAL.pickle2, PAL.pickle3])); }
    else if (kind === 'sweets') { C.celCircle(ctx, p[0], p[1], 0.035 * kk, R.pick([PAL.sweet1, PAL.sweet2, PAL.sweet3])); }
    else { C.celEllipse(ctx, p[0], p[1], 0.06 * kk, 0.03 * kk, R.pick([PAL.dried, '#8a6a4a', '#d8b870'])); } } }
  // wooden barrels in front for the pickle shops
  if (kind === 'pickles') for (let j = 0; j < 2; j++) { const z = z0 + 0.4 + j * 0.6; const b = cam.p(X - side * (d + 0.3), 0, z), t = cam.p(X - side * (d + 0.3), 0.55, z); if (!b || !t) continue; const kk = cam.f / b[2]; C.cel(ctx, [[b[0] - 0.22 * kk, b[1]], [b[0] + 0.22 * kk, b[1]], [t[0] + 0.24 * kk, t[1]], [t[0] - 0.24 * kk, t[1]]], PAL.barrel); C.celEllipse(ctx, t[0], t[1], 0.24 * kk, 0.07 * kk, R.pick([PAL.pickle1, PAL.pickle2, PAL.pickle3])); for (const yy of [0.12, 0.42]) { const q = cam.p(X - side * (d + 0.3), yy, z); C.ink(ctx, [[q[0] - 0.23 * kk, q[1]], [q[0] + 0.23 * kk, q[1]]], { width: Math.max(1, 0.015 * kk), color: '#5a4030', taper: 0 }); } }
  // signboard above the stall front and a short noren
  K.quad(ctx, cam, [P(z0 + 0.05, 2.35, 0.35), P(z1 - 0.05, 2.35, 0.35), P(z1 - 0.05, 2.85, 0.35), P(z0 + 0.05, 2.85, 0.35)], i % 3 === 0 ? PAL.signRed : PAL.sign, { line: PAL.line, lw: K.lwAt(zm, 1.4) });
  const sp = cam.p(X - side * 0.35, 2.6, zm); if (sp) { const kk = cam.f / sp[2]; ctx.save(); ctx.fillStyle = i % 3 === 0 ? '#f6efe0' : PAL.signInk; ctx.font = `${Math.round(0.34 * kk)}px Yuji`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(sp[0], sp[1]); ctx.scale(Math.max(0.25, Math.abs(Math.cos(cam.yaw - side * Math.PI / 2)) * 0.6), 1); ctx.fillText(SIGNS[i % SIGNS.length], 0, 0); ctx.restore(); }
  K.quad(ctx, cam, [P(z0, 2.35, 0.3), P(z1, 2.35, 0.3), P(z1, 2.05, 0.3), P(z0, 2.05, 0.3)], ['#3f5186', '#7e4a44', '#4a6a5a', '#8a7a4a'][i % 4]);
  // stall divider post
  K.quad(ctx, cam, [P(z0 - 0.05, 0, 0.1), P(z0 + 0.05, 0, 0.1), P(z0 + 0.05, 3.2, 0.1), P(z0 - 0.05, 3.2, 0.1)], PAL.stallDark);
}
function build(o = {}) {
  const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#f0e8d8'; ctx.fillRect(0, 0, W, H);
  // the far end: bright street opening
  K.quad(ctx, cam, [[-HW, 0, 70], [HW, 0, 70], [HW, 4.5, 70], [-HW, 4.5, 70]], '#f6f0e2');
  // roof: coloured translucent panels in bands across the arcade, with a steel frame
  const roofY = 5.2; const cols = [PAL.roofR, PAL.roofY, PAL.roofG, PAL.roofW, PAL.roofY, PAL.roofR, PAL.roofW, PAL.roofG];
  for (let z = 0.3, i = 0; z < 70; z += 1.6, i++) { K.quad(ctx, cam, [[-HW - 0.3, roofY, z], [HW + 0.3, roofY, z], [HW + 0.3, roofY, z + 1.6], [-HW - 0.3, roofY, z + 1.6]], cols[i % cols.length]); K.seg3(ctx, cam, [-HW - 0.3, roofY - 0.02, z], [HW + 0.3, roofY - 0.02, z], PAL.roofFrame, K.lwAt(z, 2.2)); }
  for (const x of [-HW - 0.3, -0.6, 0.6, HW + 0.3]) K.seg3(ctx, cam, [x, roofY - 0.02, 0.3], [x, roofY - 0.02, 70], PAL.roofFrame, 2);
  // upper walls between shop fronts and roof
  for (const side of [-1, 1]) K.quad(ctx, cam, [[side * HW, 3.2, 0.3], [side * HW, 3.2, 70], [side * HW, roofY, 70], [side * HW, roofY, 0.3]], '#d8cbb8');
  // floor tiles
  K.quad(ctx, cam, [[-HW, 0, 0.3], [HW, 0, 0.3], [HW, 0, 70], [-HW, 0, 70]], PAL.floor);
  for (let z = 0.5; z < 70; z += 0.5) K.seg3(ctx, cam, [-HW, 0.001, z], [HW, 0.001, z], PAL.tileLine, K.lwAt(z, 1.0), { alpha: 0.6 });
  for (let x = -HW; x <= HW; x += 0.5) K.seg3(ctx, cam, [x, 0.001, 0.4], [x, 0.001, 70], PAL.tileLine, 1.0, { alpha: 0.5 });
  // stalls both sides, far to near
  const kinds = ['pickles', 'fish', 'dried', 'sweets', 'fish', 'pickles', 'sweets', 'dried'];
  const stalls = []; for (const side of [-1, 1]) { let z = side > 0 ? 1.7 : 2.0, i = side > 0 ? 1 : 0; while (z < 60) { const w = 2.2 + (i % 3) * 0.6; stalls.push([side, z, z + w, kinds[i % kinds.length], i]); z += w; i += 2; } }
  stalls.sort((a, b) => b[1] - a[1]); for (const s of stalls) stall(ctx, cam, ...s);
  // hanging paper lanterns along the arcade
  for (let z = 3; z < 50; z += 4.5) for (const side of [-1, 1]) { const p = cam.p(side * (HW - 0.6), 3.3, z); if (p) { const kk = cam.f / p[2]; K.chochin(ctx, p[0], p[1], 0.28 * kk, PAL.lantern, '#3a2c28', null, z % 9 < 4.5 ? '錦' : '市場'); } }
  // coloured light from the roof falling on the floor (soft)
  const L = FX.newCanvas(W, H), lx = L.getContext('2d');
  for (let z = 0.3, i = 0; z < 40; z += 1.6, i++) K.quad(lx, cam, [[-HW, 0.002, z], [HW, 0.002, z], [HW, 0.002, z + 1.6], [-HW, 0.002, z + 1.6]], cols[i % cols.length], { alpha: 0.35 });
  ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.drawImage(FX.blurCanvas(L, 12, 2), 0, 0); ctx.restore();
  // haze toward the bright far end
  const vp = cam.p(0, 1.5, 60); if (vp) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(vp[0], vp[1], 0, vp[0], vp[1], 600); g.addColorStop(0, 'rgba(255,248,230,0.8)'); g.addColorStop(1, 'rgba(255,248,230,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 61, tremor: 2.6, edge: 1.0, turb: 0.28, gran: 0.2 });
  return { cam, plate };
}
module.exports = { build, makeCam, PAL, HW };
