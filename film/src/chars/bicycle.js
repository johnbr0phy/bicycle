'use strict';
// The bicycle: a faded green step-through mamachari with a bent wire basket and a bell that does not ring.
// Geometry in metres, facing screen right; drawn at 353 units per metre (robot scale). Origin: ground under the bottom bracket.
const C = require('../engine/core'); const { style, sh, part, line } = require('./common');
const U = 353;
const COL = { frame: '#58786a', frameHi: '#7a9a88', fender: '#b9b6ab', tire: '#2f2a2c', rim: '#aaa69c', spoke: '#8f8a80', saddle: '#5b3f35', basket: '#8b918c', rust: '#9c5a38', chain: '#3f5a50', grip: '#3d3432', lamp: '#d8d0b8', bell: '#c9c3b2', stand: '#6f6a64' };
function defaults() { return { wheel: 0, crank: 0, steer: 0, stand: true, bell: true, bellShake: 0, bellRing: 0, yaw: 0, t: 0, wet: 0 }; }

function draw(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); const st = style(stIn);
  const cx = Math.cos(p.yaw); // x compression for three-quarter views
  const M = (x, y) => [x * U * cx, -y * U];
  const lw = st.lw; const anchors = {};
  const R = 0.33, rear = [-0.56, R], front = [0.55, R], bb = [-0.05, 0.27];
  const tube = (pts, w, col, o = {}) => { const P = pts.map(q => M(q[0], q[1])); const Q = o.smooth ? C.smoothPts(P, false) : P; if (!st.noLines) C.ink(ctx, Q, { width: (w + 3.4) * lw, color: st.ink, taper: 0, wobble: 0.35, seed: o.seed || 3 }); C.ink(ctx, Q, { width: w * lw, color: col, taper: 0, wobble: 0.15, seed: (o.seed || 3) + 1 }); if (o.hi) C.ink(ctx, Q, { width: Math.max(1, w * 0.3) * lw, color: COL.frameHi, taper: 'both', wobble: 0.2, seed: (o.seed || 3) + 2, alpha: 0.7 }); };
  const wheel = (c, rot, near) => {
    const [x, y] = M(c[0], c[1]); const rx = R * U * Math.max(0.12, Math.abs(cx)), ry = R * U;
    C.celEllipse(ctx, x, y, rx, ry, COL.tire); C.celEllipse(ctx, x, y, rx * 0.9, ry * 0.9, near ? COL.rim : sh(COL.rim, st)); C.celEllipse(ctx, x, y, rx * 0.84, ry * 0.84, 'rgba(0,0,0,0)');
    // clear inside (spokes over background): punch out the centre
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.84, ry * 0.84, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = COL.spoke; ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(0.6, 1.1 * lw);
    for (let i = 0; i < 18; i++) { const a = rot + i * Math.PI * 2 / 18; ctx.beginPath(); ctx.moveTo(x + Math.cos(a + 0.35) * rx * 0.08, y + Math.sin(a + 0.35) * ry * 0.08); ctx.lineTo(x + Math.cos(a) * rx * 0.84, y + Math.sin(a) * ry * 0.84); ctx.stroke(); }
    ctx.restore();
    C.celEllipse(ctx, x, y, rx * 0.11, ry * 0.11, COL.rim); C.celEllipse(ctx, x, y, rx * 0.05, ry * 0.05, st.ink);
    if (!st.noLines) { C.inkEllipse(ctx, x, y, rx, ry, { width: 2.8 * lw, seed: 11 }); C.inkEllipse(ctx, x, y, rx * 0.84, ry * 0.84, { width: 1.4 * lw, seed: 12 }); }
    // valve and a little rust on the rim
    C.celCircle(ctx, x + Math.cos(rot) * rx * 0.87, y + Math.sin(rot) * ry * 0.87, 2.2 * lw, COL.rust);
  };
  const fender = (c, a0, a1) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = a0 + (a1 - a0) * i / 14; pts.push([c[0] + Math.cos(a) * (R + 0.04), c[1] + Math.sin(a) * (R + 0.04)]); } tube(pts, 6.5, COL.fender, { seed: 21 }); };
  // rear stand (down when parked)
  if (p.stand) { tube([[rear[0] + 0.02, R], [rear[0] + 0.1, 0.0]], 4, COL.stand, { seed: 31 }); tube([[rear[0] - 0.02, R], [rear[0] - 0.12, 0.0]], 4, sh(COL.stand, st), { seed: 32 }); }
  // wheels
  wheel(rear, p.wheel, true); wheel(front, p.wheel, true);
  fender(rear, Math.PI * 0.15, Math.PI * 0.95 + Math.PI * 0.05); // over the top of rear wheel (screen coords: y up means angle flips)
  fender(front, Math.PI * 0.08, Math.PI * 0.85);
  // chain case
  const cc = [[bb[0] + 0.1, bb[1] + 0.03], [bb[0] + 0.02, bb[1] + 0.075], [rear[0] + 0.06, rear[1] + 0.04], [rear[0] + 0.0, rear[1] + 0.0], [rear[0] + 0.06, rear[1] - 0.04], [bb[0] + 0.02, bb[1] - 0.075], [bb[0] + 0.1, bb[1] - 0.03]].map(q => M(q[0], q[1]));
  part(ctx, cc, COL.chain, st, { shadeK: 3, lw: 2.4, seed: 41, smooth: true });
  C.ink(ctx, [M(bb[0] + 0.02, bb[1] + 0.03), M(rear[0] + 0.08, rear[1] + 0.015)], { width: 1.4 * lw, color: C.mix(COL.chain, '#fff', 0.25), taper: 'both', seed: 42, alpha: 0.7 });
  // frame: chainstay under the case, seatstays, step-through down tube, seat tube, head tube, fork
  const seatTop = [-0.29, 0.80], head0 = [0.40, 0.64], head1 = [0.44, 0.80];
  tube([[rear[0], rear[1]], [-0.25, 0.66]], 5.5, COL.frame, { seed: 51 }); // seatstay
  tube([bb, [-0.26, 0.74], seatTop], 9, COL.frame, { seed: 52, hi: true }); // seat tube
  tube([bb, [0.12, 0.33], [0.3, 0.46], head0], 10, COL.frame, { seed: 53, smooth: true, hi: true }); // swooping down tube
  tube([[0.02, 0.32], [0.18, 0.5], [0.36, 0.72]], 6, COL.frame, { seed: 54, smooth: true }); // twin lateral tube
  tube([head0, head1], 11, COL.frame, { seed: 55 });
  tube([head0, [0.5, 0.5], front], 6.5, sh(COL.frame, st), { seed: 56, smooth: true }); // fork
  // rust flecks on the frame
  for (const [x, y, r] of [[0.1, 0.34, 3], [0.25, 0.43, 2], [-0.2, 0.62, 2.5], [0.41, 0.7, 2]]) { const q = M(x, y); C.celCircle(ctx, q[0], q[1], r * lw, COL.rust, 0.8); }
  // rear rack
  tube([[rear[0] - 0.2, 0.72], [-0.28, 0.72]], 4, COL.fender, { seed: 61 }); tube([[rear[0] - 0.12, 0.72], [rear[0], R + 0.02]], 3.5, COL.fender, { seed: 62 }); tube([[-0.34, 0.72], [-0.3, 0.64]], 3, COL.fender, { seed: 63 });
  // seat post and saddle
  tube([seatTop, [-0.31, 0.88]], 5, COL.fender, { seed: 71 });
  const sad = [[-0.46, 0.9], [-0.18, 0.92], [-0.14, 0.9], [-0.2, 0.87], [-0.44, 0.86]].map(q => M(q[0], q[1]));
  part(ctx, sad, COL.saddle, st, { shadeK: 4, lw: 3, seed: 72, smooth: true }); anchors.saddle = M(-0.3, 0.92);
  C.celCircle(ctx, M(-0.44, 0.86)[0], M(-0.44, 0.86)[1], 3.5 * lw, st.ink); C.celCircle(ctx, M(-0.37, 0.85)[0], M(-0.37, 0.85)[1], 3.5 * lw, st.ink); // springs
  // cranks and pedals
  const cr = p.crank; const pedal = (a, near) => { const e = [bb[0] + Math.cos(a) * 0.17, bb[1] + Math.sin(a) * 0.17]; tube([bb, e], 4.5, near ? '#77726a' : sh('#77726a', st), { seed: 81 }); const q = M(e[0], e[1]); C.cel(ctx, [[q[0] - 11 * cx, q[1] - 3], [q[0] + 11 * cx, q[1] - 3], [q[0] + 11 * cx, q[1] + 3], [q[0] - 11 * cx, q[1] + 3]], near ? '#3d3432' : '#5a5250'); return q; };
  anchors.pedalFar = pedal(cr + Math.PI, false); anchors.pedalNear = pedal(cr, true);
  { const q = M(bb[0], bb[1]); C.celCircle(ctx, q[0], q[1], 7 * lw, '#6a655e'); }
  // handlebars: stem up from head tube, swept back
  const stemTop = [0.42, 1.02], grip = [0.2, 1.0];
  tube([head1, stemTop], 6, COL.fender, { seed: 91 });
  tube([stemTop, [0.34, 1.05], [0.26, 1.03], grip], 5.5, COL.fender, { seed: 92, smooth: true });
  tube([[0.24, 1.02], [0.15, 1.0]], 9, COL.grip, { seed: 93 });
  anchors.grip = M(0.18, 1.0); anchors.gripFar = M(0.2, 1.03);
  // brake lever
  tube([[0.32, 1.04], [0.2, 0.96]], 3, COL.fender, { seed: 94 });
  // bell on the grip
  if (p.bell) {
    const b = M(0.3, 1.08); const shake = p.bellShake ? Math.sin(p.t * 60) * 2.5 * p.bellShake : 0;
    ctx.save(); ctx.translate(b[0] + shake, b[1]);
    C.celEllipse(ctx, 0, 0, 13 * lw * cx + 5, 10 * lw, COL.bell); C.celEllipse(ctx, 0, 3, 13 * lw * cx + 5, 5 * lw, C.mix(COL.bell, '#5b5680', 0.3)); C.celEllipse(ctx, -3, -3, 5, 3, '#fffdf0', 0.85);
    if (!st.noLines) C.inkEllipse(ctx, 0, 0, 13 * lw * cx + 5, 10 * lw, { width: 2.2 * lw, seed: 95 });
    C.celCircle(ctx, 0, -11 * lw, 3 * lw, st.ink); C.celCircle(ctx, 9 * lw, 3 * lw, 2.6 * lw, '#8a857a');
    ctx.restore();
    anchors.bell = b;
    if (p.bellRing > 0) { // drawn ring: concentric arcs
      ctx.save(); ctx.strokeStyle = '#fff6d8'; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const r = (14 + i * 11 + p.bellRing * 12) * lw; ctx.globalAlpha = Math.max(0, 0.9 - i * 0.25) * Math.min(1, p.bellRing * 2); ctx.lineWidth = 2.6 * lw; ctx.beginPath(); ctx.arc(b[0], b[1], r, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke(); }
      ctx.restore();
    }
  } else anchors.bell = M(0.3, 1.08);
  // front basket (bent on the far corner) and dynamo lamp
  const bk = [[0.47, 0.8], [0.84, 0.8], [0.88, 1.06], [0.52, 1.04]];
  const bkP = bk.map(q => M(q[0], q[1]));
  ctx.save(); C.pathFrom(ctx, bkP); ctx.globalAlpha = 0.28; ctx.fillStyle = COL.basket; ctx.fill(); ctx.restore();
  // mesh
  ctx.save(); ctx.strokeStyle = C.mix(COL.basket, st.ink, 0.35); ctx.lineWidth = Math.max(0.7, 1.3 * lw); ctx.globalAlpha = 0.85;
  for (let i = 1; i < 8; i++) { const u = i / 8; const a = M(0.47 + 0.37 * u, 0.8), b = M(0.52 + 0.36 * u, 1.04 + 0.02 * u); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  for (let i = 1; i < 4; i++) { const v = i / 4; const a = M(0.47 + 0.05 * v, 0.8 + 0.24 * v), b = M(0.84 + 0.04 * v, 0.8 + 0.26 * v); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  ctx.restore();
  if (!st.noLines) { C.ink(ctx, bkP, { closed: true, width: 2.6 * lw, seed: 101 }); }
  // the dent: the top rail sags at the front corner
  C.ink(ctx, [M(0.52, 1.04), M(0.7, 1.05), M(0.8, 0.99), M(0.88, 1.06)], { width: 3 * lw, color: C.mix(COL.basket, st.ink, 0.3), taper: 0, seed: 102 });
  for (const [x, y] of [[0.6, 0.83], [0.8, 0.95], [0.5, 0.95]]) { const q = M(x, y); C.celCircle(ctx, q[0], q[1], 2.4 * lw, COL.rust, 0.85); }
  anchors.basket = M(0.68, 0.95);
  tube([[0.46, 0.8], [0.44, 0.78]], 4, COL.fender, { seed: 103 });
  { const q = M(0.56, 0.62); C.celEllipse(ctx, q[0], q[1], 9 * lw * Math.max(0.4, cx), 7 * lw, COL.lamp); if (!st.noLines) C.inkEllipse(ctx, q[0], q[1], 9 * lw * Math.max(0.4, cx), 7 * lw, { width: 2 * lw, seed: 104 }); anchors.lamp = q; }
  if (p.wet > 0) { ctx.save(); ctx.globalAlpha = 0.6 * p.wet; ctx.fillStyle = '#ffffff'; for (const [x, y] of [[0.1, 0.36], [-0.25, 0.7], [0.42, 0.74], [0.7, 0.8]]) { const q = M(x, y); ctx.beginPath(); ctx.ellipse(q[0], q[1] + 4, 1.6, 3, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  anchors.frontAxle = M(front[0], front[1]); anchors.rearAxle = M(rear[0], rear[1]);
  return anchors;
}
// End-on views. view: 'rear' (riding away from camera) or 'front' (coming toward it). lean: roll angle (wobble).
function drawEnd(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); const st = style(stIn); const lw = st.lw; const anchors = {}; const front = p.view === 'front';
  const M = (x, y) => [x * U, -y * U];
  ctx.save(); ctx.rotate(p.lean || 0);
  const tube = (pts, w, col, seed = 3) => { const P = pts.map(q => M(q[0], q[1])); if (!st.noLines) C.ink(ctx, P, { width: (w + 3.4) * lw, color: st.ink, taper: 0, wobble: 0.3, seed }); C.ink(ctx, P, { width: w * lw, color: col, taper: 0, wobble: 0.15, seed: seed + 1 }); };
  const wheel = (dy, sc, near) => { const [x, y] = M(0, 0.33 * sc + dy); const ry = 0.33 * U * sc, rx = 0.03 * U * sc; C.celEllipse(ctx, x, y, rx + 3, ry, near ? COL.tire : C.mix(COL.tire, '#000', 0.15)); if (!st.noLines) C.inkEllipse(ctx, x, y, rx + 3, ry, { width: 2.4 * lw, seed: 11 }); C.celEllipse(ctx, x, y, 3.5 * lw, 5 * lw, COL.rim); };
  const bb = 0.27, cr = p.crank || 0;
  const pedal = (side, near) => { const y = bb + side * Math.sin(cr) * 0.17, x = side * 0.13; tube([[side * 0.04, bb], [x, y]], 4, near ? '#77726a' : sh('#77726a', st), 81); const q = M(x + side * 0.05, y); C.cel(ctx, [[q[0] - 14, q[1] - 4], [q[0] + 14, q[1] - 4], [q[0] + 14, q[1] + 4], [q[0] - 14, q[1] + 4]], near ? '#3d3432' : '#5a5250'); return q; };
  const farWheel = () => wheel(front ? 0.05 : 0.07, 0.9, false);
  const bars = () => { const y = 1.02; tube([[0, 0.8], [0, y + 0.02]], 5, COL.fender, 91); tube([[-0.28, y - 0.02], [-0.12, y + 0.03], [0.12, y + 0.03], [0.28, y - 0.02]], 5, COL.fender, 92); tube([[-0.28, y - 0.02], [-0.21, y]], 9, COL.grip, 93); tube([[0.21, y], [0.28, y - 0.02]], 9, COL.grip, 94); anchors.grip = M(-0.25, y - 0.01); anchors.gripFar = M(0.25, y - 0.01); const b = M(-0.17, y + 0.06); C.celEllipse(ctx, b[0], b[1], 11 * lw, 8 * lw, COL.bell); if (!st.noLines) C.inkEllipse(ctx, b[0], b[1], 11 * lw, 8 * lw, { width: 2 * lw, seed: 95 }); anchors.bell = b;
    if (p.bellRing > 0) { ctx.save(); ctx.strokeStyle = '#fff6d8'; ctx.lineCap = 'round'; for (let i = 0; i < 3; i++) { const r = (14 + i * 11 + p.bellRing * 12) * lw; ctx.globalAlpha = Math.max(0, 0.9 - i * 0.25) * Math.min(1, p.bellRing * 2); ctx.lineWidth = 2.6 * lw; ctx.beginPath(); ctx.arc(b[0], b[1], r, -Math.PI * 0.85, -Math.PI * 0.15); ctx.stroke(); } ctx.restore(); } };
  const basket = () => { const P = [M(-0.18, 0.8), M(0.18, 0.8), M(0.19, 1.06), M(-0.19, 1.04)]; ctx.save(); C.pathFrom(ctx, P); ctx.globalAlpha = 0.3; ctx.fillStyle = COL.basket; ctx.fill(); ctx.restore(); ctx.save(); ctx.strokeStyle = C.mix(COL.basket, st.ink, 0.35); ctx.lineWidth = 1.3 * lw; for (let i = 1; i < 6; i++) { const u = i / 6; const a = M(-0.18 + 0.36 * u, 0.8), b = M(-0.19 + 0.38 * u, 1.05); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } ctx.restore(); if (!st.noLines) C.ink(ctx, P, { closed: true, width: 2.4 * lw, seed: 101 }); C.ink(ctx, [M(-0.19, 1.04), M(0.02, 1.05), M(0.12, 1.0), M(0.19, 1.06)], { width: 3 * lw, color: C.mix(COL.basket, st.ink, 0.3), taper: 0 }); anchors.basket = M(0, 0.95); };
  if (!front) {
    farWheel(); basket(); bars(); anchors.pedalFar = pedal(-1, false);
    tube([[0, bb], [0, 0.8]], 8, COL.frame, 52); tube([[0.07, bb], [0.07, 0.33]], 7, COL.chain, 41);
    wheel(0, 1, true);
    const fen = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; fen.push([Math.cos(a) * 0.045, 0.33 + Math.sin(-a) * 0.37]); } tube([[-0.045, 0.33], [-0.045, 0.62], [0.045, 0.62], [0.045, 0.33]], 5, COL.fender, 21);
    tube([[-0.14, 0.72], [0.14, 0.72]], 4, COL.fender, 61); tube([[-0.13, 0.72], [-0.04, 0.4]], 3, COL.fender, 62); tube([[0.13, 0.72], [0.04, 0.4]], 3, COL.fender, 63);
    C.celEllipse(ctx, M(0, 0.62)[0], M(0, 0.62)[1], 7 * lw, 5 * lw, '#c0443a'); // rear reflector
    tube([[0, 0.8], [0, 0.88]], 5, COL.fender, 71); const sd = [M(-0.09, 0.9), M(0.09, 0.9), M(0.08, 0.93), M(-0.08, 0.93)]; part(ctx, sd, COL.saddle, st, { shadeK: 3, lw: 2.8, seed: 72, smooth: true }); anchors.saddle = M(0, 0.93);
    anchors.pedalNear = pedal(1, true);
  } else {
    wheel(0.07, 0.9, false); tube([[0, 0.8], [0, 0.88]], 5, COL.fender, 71); const sd = [M(-0.09, 0.9), M(0.09, 0.9), M(0.08, 0.93), M(-0.08, 0.93)]; part(ctx, sd, COL.saddle, st, { shadeK: 3, lw: 2.8, seed: 72, smooth: true }); anchors.saddle = M(0, 0.93);
    anchors.pedalFar = pedal(-1, false); tube([[0, bb], [0.1, 0.46], [0.02, 0.66]], 9, COL.frame, 53);
    wheel(0, 1, true); tube([[-0.05, 0.33], [-0.05, 0.62], [0.05, 0.62], [0.05, 0.33]], 5, COL.fender, 21); tube([[-0.04, 0.66], [0, 0.35], [0.04, 0.66]], 5, sh(COL.frame, st), 56);
    bars(); basket(); const lp = M(0, 0.62); C.celEllipse(ctx, lp[0], lp[1], 9 * lw, 9 * lw, COL.lamp); if (!st.noLines) C.inkEllipse(ctx, lp[0], lp[1], 9 * lw, 9 * lw, { width: 2 * lw, seed: 104 }); anchors.lamp = lp;
    anchors.pedalNear = pedal(1, true);
  }
  ctx.restore();
  // rotate anchors by lean
  const c = Math.cos(p.lean || 0), s2 = Math.sin(p.lean || 0); for (const k in anchors) { const [x, y] = anchors[k]; anchors[k] = [x * c - y * s2, x * s2 + y * c]; }
  return anchors;
}
module.exports = { draw, drawEnd, defaults, COL, U, LENGTH: 1.5 * U };
