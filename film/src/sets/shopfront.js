'use strict';
// A closed shop by a canal: canvas awning, lattice shutters, a brown vending machine, red spider lilies at the
// canal edge. The low point of the film happens here (S17 dusk, S18 night). Camera faces the shopfront.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp'); const Lane = require('./lane');
const FX0 = 3.0; // facade plane x
function makeCam(o = {}) { return new Cam(Object.assign({ x: -3.2, y: 0.8, z: 0.2, yaw: Math.PI / 2 - 0.1, pitch: 0.1, f: 1250, W: 1920, H: 1080 }, o)); }
function lily(ctx, x, y, s, col = '#d8322a', colD = '#9a1e1e') { // higanbana: thin stem, crown of curled petals and long stamens
  C.ink(ctx, [[x, y], [x + s * 0.05, y - s]], { width: Math.max(1, s * 0.04), color: '#4a6a3a', taper: 0 });
  const cx = x + s * 0.05, cy = y - s;
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; const p1 = [cx + Math.cos(a) * s * 0.28, cy + Math.sin(a) * s * 0.22]; C.ink(ctx, C.qbez([cx, cy], [cx + Math.cos(a) * s * 0.2, cy + Math.sin(a) * s * 0.3 - s * 0.05], p1, 6), { width: Math.max(1, s * 0.07), color: i % 2 ? col : colD, taper: 'end' }); C.ink(ctx, C.qbez([cx, cy], [cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.45], [cx + Math.cos(a) * s * 0.42, cy + Math.sin(a) * s * 0.35 - s * 0.15], 6), { width: Math.max(0.6, s * 0.012), color: col, taper: 'end' }); }
}
function build(o = {}) {
  const tod = o.tod || 'dusk'; const pal = Object.assign({}, Lane.PALS[tod]); const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = pal.skyTop; ctx.fillRect(0, 0, W, H);
  const night = tod === 'night';
  // neighbouring facades and the shop
  const specs = [{ z: [-9, -3.2], bays: [[-8.8, -3.4, 'lattice']], upper: [[-8.6, -3.6, 'window']], posts: [-9, -6, -3.2], seed: 401, upperGlow: night ? '#f2b86a' : null }, { z: [-3.2, 1.6], bays: [[-3.0, 1.4, 'shutter']], upper: [[-2.8, 1.2, 'mushiko']], posts: [-3.2, 1.6], seed: 402 }, { z: [1.6, 8], bays: [[1.8, 7.8, 'lattice']], upper: [[2, 7.6, 'sudare']], posts: [1.6, 4.8, 8], seed: 403 }];
  for (const s of specs) K.machiya(ctx, cam, 1, FX0, s.z[0], s.z[1], s, pal);
  // ground: street, stone kerb, the canal edge in the foreground with lilies
  K.quad(ctx, cam, [[-0.5, 0, -12], [FX0, 0, -12], [FX0, 0, 12], [-0.5, 0, 12]], night ? '#4a4c68' : '#8a7c90');
  for (let z = -10; z < 12; z += 0.9) K.seg3(ctx, cam, [-0.5, 0.002, z], [FX0, 0.002, z], pal.line, 1, { alpha: 0.35 });
  K.quad(ctx, cam, [[-0.8, 0, -12], [-0.5, 0, -12], [-0.5, 0, 12], [-0.8, 0, 12]], night ? '#5a5c78' : '#9d918f');
  // canvas awning over the shop, sloping out, with a scalloped edge
  const aw = (y0, y1, dx, zs, ze, col) => { K.quad(ctx, cam, [[FX0, y0, zs], [FX0, y0, ze], [FX0 - dx, y1, ze], [FX0 - dx, y1, zs]], col); for (let z = zs; z < ze; z += 0.35) { const a = cam.p(FX0 - dx, y1, z), b = cam.p(FX0 - dx, y1 - 0.12, z + 0.175), c2 = cam.p(FX0 - dx, y1, z + 0.35); if (a && b && c2) C.cel(ctx, [[a[0], a[1]], [b[0], b[1]], [c2[0], c2[1]]], col); } for (let z = zs; z < ze; z += 0.7) K.quad(ctx, cam, [[FX0, y0, z], [FX0, y0, z + 0.35], [FX0 - dx, y1, z + 0.35], [FX0 - dx, y1, z]], C.mix(col, '#ffffff', 0.25), { alpha: 0.5 }); };
  aw(2.55, 2.2, 1.3, -3.4, 1.8, night ? '#6a3a44' : '#9a4a50');
  // shop sign on the awning front
  const sp = cam.p(FX0 - 1.3, 2.35, -0.8); if (sp) { const k = cam.f / sp[2]; ctx.save(); ctx.fillStyle = '#f2e6d6'; ctx.font = `${Math.round(0.2 * k)}px Yuji`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('中村青果店', sp[0], sp[1]); ctx.restore(); }
  // the vending machine beside the shop
  const vm = K.vending(ctx, cam, 1, FX0, 1.75, Object.assign({}, pal, { vend: '#6a4a3e' }), night);
  // a bench and an umbrella stand
  K.quad(ctx, cam, [[FX0 - 0.45, 0.42, -2.8], [FX0 - 0.45, 0.42, -1.4], [FX0 - 0.05, 0.42, -1.4], [FX0 - 0.05, 0.42, -2.8]], '#7a5a44');
  for (const z of [-2.7, -1.5]) K.quad(ctx, cam, [[FX0 - 0.42, 0, z], [FX0 - 0.42, 0, z + 0.06], [FX0 - 0.42, 0.42, z + 0.06], [FX0 - 0.42, 0.42, z]], '#5a4030');
  // the canal: dark water in the very foreground, the stone edge, lilies on the grassy verge
  K.quad(ctx, cam, [[-3, -0.5, -12], [-1.3, -0.5, -12], [-1.3, -0.5, 12], [-3, -0.5, 12]], night ? '#2a2e48' : '#5a5a78');
  K.quad(ctx, cam, [[-1.3, -0.5, -12], [-1.3, -0.5, 12], [-1.3, 0, 12], [-1.3, 0, -12]], night ? '#3a3c56' : '#7a7088');
  K.quad(ctx, cam, [[-1.3, 0, -12], [-0.8, 0, -12], [-0.8, 0, 12], [-1.3, 0, 12]], night ? '#34403a' : '#5a6a50');
  // spider lilies along the canal edge (foreground strip)
  const R = new C.Rng(7); for (let i = 0; i < 70; i++) { const z = R.range(-6, 6), x = R.range(-1.25, -0.85); const p = cam.p(x, 0, z); if (!p) continue; const k = cam.f / p[2]; lily(ctx, p[0], p[1], R.range(0.35, 0.5) * k, night ? '#a02a30' : '#d8322a', night ? '#6a1a20' : '#9a1e1e'); }
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 91, tremor: 2.6, edge: 1.05, turb: 0.3, gran: 0.2 });
  return { cam, plate, vending: vm, FX0 };
}
module.exports = { build, makeCam, lily, FX0 };
