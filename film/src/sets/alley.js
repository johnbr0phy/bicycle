'use strict';
// The alley: a dead-end behind a shuttered shop. Plaster and corrugated walls, pipes, an AC unit, a bare bulb on a
// bracket, pots, a concrete step. Night, the rain just stopped. Where the bicycle is found.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const HW = 0.95, END = 7.5;
const PAL = { wallL: '#3a3a56', wallR: '#46425c', plaster: '#565270', tin: '#3e4862', ground: '#2e3048', ground2: '#383a52', pipe: '#6a6a7e', line: '#1e1a28', step: '#6a6878', ac: '#8a8ea0', pot: '#7a5a54', plant: '#3e5048', bulb: '#fff2c8' };
function makeCam(o = {}) { return new Cam(Object.assign({ x: 0.05, y: 0.95, z: -1.6, yaw: 0.0, pitch: 0.02, f: 1250, W: 1920, H: 1080 }, o)); }
function build(o = {}) {
  const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d'); const R = new C.Rng(31);
  ctx.fillStyle = '#1a1c30'; ctx.fillRect(0, 0, W, H);
  // strip of night sky and tangled wires overhead
  K.quad(ctx, cam, [[-HW, 6, 0.5], [HW, 6, 0.5], [HW, 6, END], [-HW, 6, END]], '#262a4a');
  for (let i = 0; i < 6; i++) K.wire(ctx, cam, [-HW, R.range(4, 5.5), R.range(1, 6)], [HW, R.range(4, 5.5), R.range(1, 6)], R.range(0.1, 0.4), '#111018', 1.5);
  // end wall with a small frosted window glowing faintly
  K.quad(ctx, cam, [[-HW, 0, END], [HW, 0, END], [HW, 6, END], [-HW, 6, END]], PAL.plaster);
  K.quad(ctx, cam, [[-0.35, 1.5, END - 0.01], [0.25, 1.5, END - 0.01], [0.25, 2.1, END - 0.01], [-0.35, 2.1, END - 0.01]], '#8a8098');
  // ground: cracked concrete with a drain and puddles
  K.quad(ctx, cam, [[-HW, 0, 0.3], [HW, 0, 0.3], [HW, 0, END], [-HW, 0, END]], PAL.ground);
  for (let i = 0; i < 40; i++) { const x = R.range(-HW, HW), z = R.range(0.8, END); const p = cam.p(x, 0, z); if (!p) continue; const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], R.range(0.05, 0.2) * k, R.range(0.01, 0.03) * k, PAL.ground2, 0.8); }
  for (let i = 0; i < 12; i++) { const z = R.range(1, END), x = R.range(-HW, HW); K.poly3(ctx, cam, [[x, 0.002, z], [x + R.range(-0.2, 0.2), 0.002, z + 0.2], [x + R.range(-0.2, 0.2), 0.002, z + 0.4]], PAL.line, 1, { alpha: 0.5 }); }
  K.quad(ctx, cam, [[-0.1, 0.002, 0.5], [0.1, 0.002, 0.5], [0.1, 0.002, END], [-0.1, 0.002, END]], '#34364c');
  // left wall: plaster with a door to the back of the shop and a concrete step
  K.quad(ctx, cam, [[-HW, 0, 0.3], [-HW, 0, END], [-HW, 6, END], [-HW, 6, 0.3]], PAL.wallL);
  K.quad(ctx, cam, [[-HW + 0.01, 0.2, 3.0], [-HW + 0.01, 0.2, 3.9], [-HW + 0.01, 2.1, 3.9], [-HW + 0.01, 2.1, 3.0]], '#3a3448', { line: PAL.line, lw: 2 });
  const step = [[-HW, 0.22, 2.8], [-HW + 0.45, 0.22, 2.8], [-HW + 0.45, 0.22, 4.1], [-HW, 0.22, 4.1]];
  K.quad(ctx, cam, [[-HW + 0.45, 0, 2.8], [-HW + 0.45, 0, 4.1], [-HW + 0.45, 0.22, 4.1], [-HW + 0.45, 0.22, 2.8]], C.mix(PAL.step, '#000', 0.2)); K.quad(ctx, cam, [[-HW, 0, 2.8], [-HW + 0.45, 0, 2.8], [-HW + 0.45, 0.22, 2.8], [-HW, 0.22, 2.8]], C.mix(PAL.step, '#000', 0.1)); K.quad(ctx, cam, step, PAL.step, { line: PAL.line, lw: 1.5 });
  // right wall: corrugated tin with an AC unit, pipes, a water meter
  K.quad(ctx, cam, [[HW, 0, 0.3], [HW, 0, END], [HW, 6, END], [HW, 6, 0.3]], PAL.tin);
  for (let z = 0.4; z < END; z += 0.12) K.seg3(ctx, cam, [HW, 0.3, z], [HW, 6, z], C.mix(PAL.tin, '#000', 0.25), K.lwAt(z, 0.9), { alpha: 0.7 });
  K.quad(ctx, cam, [[HW - 0.3, 0.9, 5.4], [HW - 0.3, 0.9, 6.3], [HW - 0.3, 1.5, 6.3], [HW - 0.3, 1.5, 5.4]], PAL.ac, { line: PAL.line, lw: 1.8 });
  const acc = cam.p(HW - 0.3, 1.2, 5.85); if (acc) { const k = cam.f / acc[2]; C.inkCircle(ctx, acc[0], acc[1], 0.2 * k, { width: 2, color: PAL.line }); for (let i = 0; i < 4; i++) C.ink(ctx, [[acc[0] - 0.18 * k, acc[1] - 0.12 * k + i * 0.08 * k], [acc[0] + 0.18 * k, acc[1] - 0.12 * k + i * 0.08 * k]], { width: 1.2, color: PAL.line, taper: 0 }); }
  K.poly3(ctx, cam, [[HW - 0.05, 5.5, 0.5], [HW - 0.05, 5.5, 5.4], [HW - 0.05, 1.5, 5.4]], PAL.pipe, 5); K.poly3(ctx, cam, [[-HW + 0.06, 0, 6.5], [-HW + 0.06, 5.5, 6.5]], PAL.pipe, 6);
  // pots along the left wall beyond the step and a stack of crates at the end
  K.pots(ctx, cam, -1, HW - 0.1, 4.4, 6.8, Object.assign({}, PAL, { pots: ['#6a5058', '#5a5a70', '#7a6060'], plant: '#3e5048', plantDark: '#2e3c38', plantLight: '#4e6058', line: PAL.line, maple: '#6a4a44', flower: '#8a5a66' }), 55, 1.4);
  for (let i = 0; i < 3; i++) K.quad(ctx, cam, [[0.1, i * 0.32, END - 0.6], [0.8, i * 0.32, END - 0.6], [0.8, i * 0.32 + 0.3, END - 0.6], [0.1, i * 0.32 + 0.3, END - 0.6]], '#6a5a4a', { line: PAL.line, lw: 1.4 });
  // the bulb bracket (the bulb itself is lit per-frame)
  K.poly3(ctx, cam, [[-HW, 2.9, 4.8], [-HW + 0.4, 2.9, 4.8], [-HW + 0.4, 2.75, 4.8]], '#2a2a36', 3);
  // the bulb's pool of light, baked warm onto walls and ground
  const bulb = cam.p(-HW + 0.4, 2.65, 4.8); const gp = cam.p(-0.2, 0, 4.6);
  const Lc = FX.newCanvas(W, H), lx = Lc.getContext('2d'); const rg = lx.createRadialGradient(bulb[0], bulb[1], 0, bulb[0], bulb[1], 700); rg.addColorStop(0, 'rgba(255,214,150,0.75)'); rg.addColorStop(0.5, 'rgba(255,200,130,0.25)'); rg.addColorStop(1, 'rgba(255,200,130,0)'); lx.fillStyle = rg; lx.fillRect(0, 0, W, H);
  lx.save(); lx.translate(gp[0], gp[1]); lx.scale(1, 0.28); const g2 = lx.createRadialGradient(0, 0, 0, 0, 0, 600); g2.addColorStop(0, 'rgba(255,214,150,0.7)'); g2.addColorStop(1, 'rgba(255,214,150,0)'); lx.fillStyle = g2; lx.beginPath(); lx.arc(0, 0, 600, 0, Math.PI * 2); lx.fill(); lx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(Lc, 0, 0); ctx.restore();
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 95, tremor: 2.4, edge: 1.1, turb: 0.22, gran: 0.18 });
  return { cam, plate, bulb, HW, END };
}
module.exports = { build, makeCam, PAL, HW, END };
