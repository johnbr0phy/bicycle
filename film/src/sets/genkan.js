'use strict';
// The genkan (entrance hall) of the machiya, before dawn. Earthen floor, a raised wooden step to the left,
// the lattice front door straight ahead, the framed photograph on the wall. Painted at 2x for camera zooms.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const PAL = { floor: '#4a4250', floor2: '#433b4a', wood: '#4d3c42', woodDark: '#32262e', woodLight: '#6a5558', plaster: '#5e5a72', tatami: '#6a6a58', shoji: '#8a8aa4', paper: '#b9bbd6', line: '#241c26', ext: '#fbe8cc', photo: '#c9b89a', frame: '#3a2a26', beam: '#3a2c32' };
const MARGIN = 0.18;
function makeCam(res = 1, margin = 0) { return new Cam({ x: 0.35, y: 0.78, z: 0, yaw: 0.02, pitch: 0.06, f: 1300 * res, W: Math.round(1920 * res * (1 + 2 * margin)), H: Math.round(1080 * res * (1 + 2 * margin)) }); }
const DOOR = { x0: -0.15, x1: 1.25, z: 3.2, h: 1.95 };
function build(res = 2) {
  const cam = makeCam(res, MARGIN); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d'); const lw = (b) => b * res;
  ctx.fillStyle = PAL.woodDark; ctx.fillRect(0, 0, W, H);
  const Q = (pts, col, o) => K.quad(ctx, cam, pts, col, o);
  // back wall (z=3.2): wood below, plaster above, ceiling beam
  Q([[-3, 0, 3.2], [3, 0, 3.2], [3, 2.6, 3.2], [-3, 2.6, 3.2]], PAL.plaster);
  Q([[-3, 0, 3.2], [3, 0, 3.2], [3, 0.9, 3.2], [-3, 0.9, 3.2]], PAL.wood);
  // door frame and the opening (exterior glow shows through; the sliding panel is a separate sprite)
  Q([[DOOR.x0 - 0.12, 0, 3.2], [DOOR.x1 + 0.12, 0, 3.2], [DOOR.x1 + 0.12, DOOR.h + 0.15, 3.2], [DOOR.x0 - 0.12, DOOR.h + 0.15, 3.2]], PAL.woodDark);
  Q([[DOOR.x0, 0.02, 3.21], [DOOR.x1, 0.02, 3.21], [DOOR.x1, DOOR.h, 3.21], [DOOR.x0, DOOR.h, 3.21]], PAL.ext);
  // the view outside: pale lane, a hint of the opposite facade in morning haze
  Q([[DOOR.x0, 0.9, 3.22], [DOOR.x1, 0.9, 3.22], [DOOR.x1, DOOR.h, 3.22], [DOOR.x0, DOOR.h, 3.22]], '#efd6c4', { alpha: 0.7 });
  for (let i = 0; i < 14; i++) { const x = DOOR.x0 + 0.05 + i * 0.1; K.seg3(ctx, cam, [x, 0.95, 3.22], [x, 1.9, 3.22], '#cdb4b0', lw(1.2), { alpha: 0.6 }); }
  // fixed left door panel (lattice + paper) beside the opening
  Q([[DOOR.x0 - 0.75, 0.05, 3.19], [DOOR.x0, 0.05, 3.19], [DOOR.x0, DOOR.h, 3.19], [DOOR.x0 - 0.75, DOOR.h, 3.19]], PAL.paper);
  for (let i = 0; i <= 8; i++) { const x = DOOR.x0 - 0.75 + i * 0.75 / 8; K.seg3(ctx, cam, [x, 0.05, 3.18], [x, DOOR.h, 3.18], PAL.woodDark, lw(2.2)); }
  for (let k = 0; k < 5; k++) K.seg3(ctx, cam, [DOOR.x0 - 0.75, 0.3 + k * 0.4, 3.18], [DOOR.x0, 0.3 + k * 0.4, 3.18], PAL.woodDark, lw(1.6));
  // ceiling beam and lintel
  Q([[-3, 2.05, 3.15], [3, 2.05, 3.15], [3, 2.25, 3.15], [-3, 2.25, 3.15]], PAL.beam);
  Q([[-3, 2.6, 0.5], [3, 2.6, 0.5], [3, 2.6, 3.2], [-3, 2.6, 3.2]], '#2a2028');
  // right wall with shoe cabinet and umbrella stand
  Q([[1.8, 0, 0.3], [1.8, 0, 3.2], [1.8, 2.6, 3.2], [1.8, 2.6, 0.3]], C.mix(PAL.plaster, PAL.woodDark, 0.35));
  Q([[1.8, 0, 1.0], [1.8, 0, 2.6], [1.8, 1.0, 2.6], [1.8, 1.0, 1.0]], PAL.woodLight);
  Q([[1.35, 0, 1.0], [1.35, 0, 2.6], [1.35, 1.0, 2.6], [1.35, 1.0, 1.0]], PAL.wood);
  Q([[1.35, 1.0, 1.0], [1.35, 1.0, 2.6], [1.8, 1.0, 2.6], [1.8, 1.0, 1.0]], PAL.woodLight);
  for (const z of [1.53, 2.07]) K.seg3(ctx, cam, [1.35, 0.05, z], [1.35, 0.95, z], PAL.line, lw(1.6));
  for (const z of [1.3, 1.85, 2.35]) { const p = cam.p(1.35, 0.55, z); if (p) C.celCircle(ctx, p[0], p[1], 4 * res, '#8a7a60'); }
  // a small vase with a spray of bush clover (hagi, late September) on the cabinet
  { const p = cam.p(1.55, 1.0, 2.2); if (p) { const k = cam.f / p[2]; C.cel(ctx, [[p[0] - 0.06 * k, p[1]], [p[0] + 0.06 * k, p[1]], [p[0] + 0.045 * k, p[1] - 0.2 * k], [p[0] - 0.045 * k, p[1] - 0.2 * k]], '#5a6a8a'); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.28; const tip = [p[0] + Math.cos(a) * 0.4 * k, p[1] - 0.2 * k + Math.sin(a) * 0.36 * k]; C.ink(ctx, C.qbez([p[0], p[1] - 0.2 * k], [p[0] + Math.cos(a) * 0.15 * k, p[1] - 0.4 * k], tip, 8), { width: 1.4 * res, color: '#4a5a44', taper: 'end' }); for (let j = 0; j < 4; j++) C.celCircle(ctx, C.lerp(p[0], tip[0], 0.6 + j * 0.1), C.lerp(p[1] - 0.2 * k, tip[1], 0.6 + j * 0.1), 3 * res, '#b07aa0'); } } }
  // umbrella stand with two umbrellas
  { const p = cam.p(1.45, 0, 2.85); if (p) { const k = cam.f / p[2]; C.cel(ctx, [[p[0] - 0.1 * k, p[1]], [p[0] + 0.1 * k, p[1]], [p[0] + 0.1 * k, p[1] - 0.45 * k], [p[0] - 0.1 * k, p[1] - 0.45 * k]], '#4a4a3e'); C.ink(ctx, [[p[0] - 0.03 * k, p[1] - 0.4 * k], [p[0] - 0.08 * k, p[1] - 0.95 * k]], { width: 0.05 * k, color: '#6a3a3a', taper: 'end' }); C.ink(ctx, [[p[0] + 0.03 * k, p[1] - 0.4 * k], [p[0] + 0.05 * k, p[1] - 0.9 * k]], { width: 0.045 * k, color: '#3a4a6a', taper: 'end' }); } }
  // the raised floor on the left: step beam, tatami room with shoji beyond
  const stepX = -0.55, stepH = 0.36;
  Q([[-3, stepH, 0.2], [stepX, stepH, 0.2], [stepX, stepH, 3.2], [-3, stepH, 3.2]], C.mix(PAL.woodLight, PAL.woodDark, 0.3));
  Q([[stepX, 0, 0.2], [stepX, 0, 3.2], [stepX, stepH, 3.2], [stepX, stepH, 0.2]], PAL.woodLight);
  K.seg3(ctx, cam, [stepX, stepH, 0.3], [stepX, stepH, 3.2], '#8a7060', lw(2.4));
  // floorboards
  for (let i = 1; i < 8; i++) { const x = stepX - i * 0.16; K.seg3(ctx, cam, [x, stepH + 0.001, 0.3], [x, stepH + 0.001, 3.2], PAL.woodDark, lw(1.1), { alpha: 0.6 }); }
  // shoji at the back of the raised room
  Q([[-3, stepH, 3.15], [stepX - 0.05, stepH, 3.15], [stepX - 0.05, 2.05, 3.15], [-3, 2.05, 3.15]], PAL.shoji);
  for (let i = 0; i < 12; i++) { const x = stepX - 0.05 - i * 0.2; K.seg3(ctx, cam, [x, stepH, 3.14], [x, 2.05, 3.14], PAL.woodDark, lw(1.2)); }
  for (let k = 0; k < 6; k++) K.seg3(ctx, cam, [-3, stepH + 0.28 * (k + 1), 3.14], [stepX - 0.05, stepH + 0.28 * (k + 1), 3.14], PAL.woodDark, lw(1.0));
  // a pillar at the corner, with the framed photograph hanging on it
  Q([[stepX - 0.14, 0, 3.12], [stepX + 0.02, 0, 3.12], [stepX + 0.02, 2.6, 3.12], [stepX - 0.14, 2.6, 3.12]], PAL.wood);
  const ph = [[-0.44, 1.2, 3.18], [-0.2, 1.2, 3.18], [-0.2, 1.52, 3.18], [-0.44, 1.52, 3.18]];
  Q(ph.map(([x, y, z]) => [x - 0.03, y - 0.03, z - 0.005]), PAL.frame); Q(ph, '#a09080'); Q([[-0.41, 1.23, 3.175], [-0.23, 1.23, 3.175], [-0.23, 1.49, 3.175], [-0.41, 1.49, 3.175]], '#b8a88a');
  // the photograph's content at this size: a blur of green and two small figures (legible only at the end)
  { const p = cam.p(-0.32, 1.3, 3.17); if (p) { const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], 0.05 * k, 0.03 * k, '#6a7a5a', 0.7); C.celEllipse(ctx, p[0] - 0.03 * k, p[1] - 0.05 * k, 0.015 * k, 0.04 * k, '#8a5a50', 0.8); C.celEllipse(ctx, p[0] + 0.02 * k, p[1] - 0.03 * k, 0.01 * k, 0.025 * k, '#c9a040', 0.8); } }
  // earthen floor (doma) with texture
  Q([[stepX, 0, 0.1], [1.8, 0, 0.1], [1.8, 0, 3.2], [stepX, 0, 3.2]], PAL.floor);
  const R = new C.Rng(4); for (let i = 0; i < 70; i++) { const x = R.range(stepX, 1.8), z = R.range(0.3, 3.1); const p = cam.p(x, 0, z); if (p) C.celEllipse(ctx, p[0], p[1], R.range(8, 40) * res / p[2] * 2, R.range(2, 6) * res / p[2] * 2, R.next() > 0.5 ? PAL.floor2 : '#554c5c', 0.6); }
  // stepping stone (kutsunugi-ishi) in front of the step and a pair of her sandals
  { const p = cam.p(-0.3, 0, 1.9); if (p) { const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1] - 0.02 * k, 0.3 * k, 0.075 * k, '#3e3848'); C.celEllipse(ctx, p[0], p[1] - 0.04 * k, 0.28 * k, 0.065 * k, '#524a5c');
    for (const dx of [-0.08, 0.08]) { const q = [p[0] + dx * k, p[1] - 0.05 * k]; C.cel(ctx, [[q[0] - 0.035 * k, q[1] + 0.02 * k], [q[0] + 0.035 * k, q[1] + 0.02 * k], [q[0] + 0.03 * k, q[1] - 0.025 * k], [q[0] - 0.03 * k, q[1] - 0.025 * k]], '#4a3a3e'); C.ink(ctx, [[q[0] - 0.025 * k, q[1] - 0.015 * k], [q[0], q[1] - 0.005 * k], [q[0] + 0.025 * k, q[1] - 0.015 * k]], { width: Math.max(1, 0.008 * k), color: '#8a3a3a', taper: 0 }); } } }
  // the robot's charging dock by the wall (a plain box with a cable)
  { const p = cam.p(0.2, 0, 2.2); }
  const plate = FX.watercolor(cv, { seed: 21, tremor: 3.2 * res, tremorScale: 44 * res, edge: 1.1, turb: 0.3, turbScale: 130 * res, gran: 0.22 });
  // sliding door panel sprite (covers the opening when closed)
  const pw = DOOR.x1 - DOOR.x0; const pcv = FX.newCanvas(W, H), px = pcv.getContext('2d');
  K.quad(px, cam, [[DOOR.x0, 0.03, 3.205], [DOOR.x1, 0.03, 3.205], [DOOR.x1, DOOR.h, 3.205], [DOOR.x0, DOOR.h, 3.205]], PAL.paper);
  K.quad(px, cam, [[DOOR.x0, 0.03, 3.205], [DOOR.x1, 0.03, 3.205], [DOOR.x1, 0.35, 3.205], [DOOR.x0, 0.35, 3.205]], PAL.wood);
  for (let i = 0; i <= 12; i++) { const x = DOOR.x0 + i * pw / 12; K.seg3(px, cam, [x, 0.03, 3.2], [x, DOOR.h, 3.2], PAL.woodDark, lw(2.2)); }
  for (let k = 0; k < 5; k++) K.seg3(px, cam, [DOOR.x0, 0.35 + k * 0.4, 3.2], [DOOR.x1, 0.35 + k * 0.4, 3.2], PAL.woodDark, lw(1.6));
  K.seg3(px, cam, [DOOR.x0 + 0.02, 0.03, 3.2], [DOOR.x0 + 0.02, DOOR.h, 3.2], PAL.woodDark, lw(5));
  const panel = FX.watercolor(pcv, { seed: 23, tremor: 2.5 * res, tremorScale: 44 * res, edge: 0.9, turb: 0.25, gran: 0.2 });
  return { cam, plate, panel, res, W, H, DOOR };
}
module.exports = { build, makeCam, DOOR, PAL, MARGIN };
