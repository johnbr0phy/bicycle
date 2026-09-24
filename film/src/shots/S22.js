'use strict';
// S22 — Walking it home. Lateral tracking shot, right to left (the journey reversed). The boy pushes the bicycle;
// the robot rolls beside him at one bar; the shiba trots ahead. Lanterns, wet stone, a persimmon tree over a wall,
// the cream elder cat in silhouette on the wall. The rear wheel squeaks once per turn.
const L = require('./lib'); const { C, R, S, K, Hm, B } = L; const SS = require('../sets/streetside'); const PAL = require('../sets/palettes'); const { cached } = require('../engine/cache'); const Kit = require('../sets/kit'); const P = require('../props');
const FAC = [
  { z: [8, 14], bays: [[8.2, 13.8, 'lattice']], upper: [[8.4, 13.6, 'window']], posts: [8, 11, 14], seed: 81, upperGlow: '#f2b86a', doorGlow: '#f4c070' },
  { z: [4, 8], bays: [[4.2, 7.8, 'plaster']], posts: [4, 8], seed: 82, twoStory: false, roof: 2.9, h1: 2.4 },
  { z: [-1, 4], bays: [[-0.8, 1.6, 'door'], [1.8, 3.8, 'lattice']], upper: [[-0.6, 3.6, 'sudare']], posts: [-1, 1.7, 4], seed: 83, doorGlow: '#f6c779' },
  { z: [-7, -1], bays: [[-6.8, -1.2, 'lattice']], upper: [[-6.6, -1.4, 'mushiko']], posts: [-7, -4, -1], seed: 84, upperGlow: '#f2b86a' },
  { z: [-13, -7], bays: [[-12.8, -7.2, 'dark']], upper: [[-12.6, -7.4, 'window']], posts: [-13, -10, -7], seed: 85 },
];
module.exports = {
  smooth: true, look: 'night',
  async setup() {
    const o = { pal: Object.assign({}, PAL.nightwet), depth: 3.4, z0: -9, z1: 11, camY: 0.62, pitch: 0.06, facades: FAC, pots: [[-6.5, -5.4, 21], [2.1, 3.2, 22]],
      facadeExtra: (ctx, cam) => { // persimmon tree leaning over the low wall section, fruit glowing orange
        const b = cam.p(3.6, 2.4, 6); if (!b) return; const k = cam.f / b[2]; C.ink(ctx, [[b[0], b[1]], [b[0] - 0.4 * k, b[1] - 1.4 * k]], { width: 0.14 * k, color: '#2a2230', taper: 'end' }); const Rr = new C.Rng(4); for (let i = 0; i < 70; i++) { const a = Rr.range(0, Math.PI * 2), d = Math.sqrt(Rr.next()) * 1.3; C.celEllipse(ctx, b[0] - 0.4 * k + Math.cos(a) * d * k, b[1] - 1.5 * k + Math.sin(a) * d * 0.6 * k, 0.12 * k, 0.08 * k, Rr.next() > 0.5 ? '#2c3a36' : '#34443e', 0.95, Rr.range(-1, 1)); } for (let i = 0; i < 12; i++) C.celCircle(ctx, b[0] - 0.4 * k + Rr.range(-1.1, 1.1) * k, b[1] - 1.4 * k + Rr.range(-0.5, 0.5) * k, 0.06 * k, '#e0823a'); } };
    const layers = []; let set = null;
    for (let i = 0; i < 4; i++) { const cv = await cached('S22_layer' + i + '_v1', () => { set = set || SS.build(o); return set.layers[i].canvas; }); layers.push(cv); }
    const meta = [3.2, 3.4 - 0.825, 3.4 - 1.725, 0.9];
    return { set: { layers: layers.map((cv, i) => ({ canvas: cv, depth: meta[i], W: cv.width })), zc: 1, f: 1250, refCam: { y: 0.62, pitch: 0.06 }, depth: 3.4 } };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt;
    const cz = L.lerp(-5.5, 6.5, t / 10); const cam = SS.camAt(s.set, cz);
    SS.draw(ctx, s.set, cz, (Ly) => Ly.depth > 1.2);
    // lanterns hanging from the eaves (per frame so they flicker)
    for (const lz of [-10, -4.5, 0.2, 6.5, 12]) { const p = cam.p(2.95, 1.75, lz); if (p) P.lantern(ctx, p[0], p[1], 0.24 * cam.f / p[2], 1, t, lz, { text: '御料理' }); }
    // the elder cat on the low wall, silhouetted by a lit window behind
    const cp = L.at(cam, 3.15, 3.3, 0.36);
    if (cp) { const st0 = cam.p(3.0, 0.36, 3.3); const k0 = cam.f / st0[2]; C.cel(ctx, [[st0[0] - 0.35 * k0, st0[1]], [st0[0] + 0.35 * k0, st0[1]], [st0[0] + 0.35 * k0, st0[1] + 0.36 * k0], [st0[0] - 0.35 * k0, st0[1] + 0.36 * k0]], '#4a4a64'); C.ink(ctx, [[st0[0] - 0.35 * k0, st0[1]], [st0[0] + 0.35 * k0, st0[1]]], { width: 2, color: '#1e1a28', taper: 0 }); } if (cp) L.drawChar(ctx, W, H, (c, st) => K.draw(c, { cat: 'elder', pose: 'loaf', headYaw: 1.2, eyes: 'half', t: dt, pupil: 1 }, st), { x: cp.x, y: cp.y, scale: cp.scale, flip: false }, { light: { ambient: '#2a2c50', ambientAmt: 0.6, rim: '#ffcf80', rimDir: [0, -3], rimAlpha: 0.9 }, contact: false });
    const light = { ambient: '#4a4f88', ambientAmt: 0.42, rim: '#ffcf80', rimDir: [0, -3], rimAlpha: 0.85 };
    const walkZ = cz + 0.2; const speed = 12 / 10;
    // shiba ahead (screen left)
    const sp = L.at(cam, 2.2, walkZ + 1.25); L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'trot', phase: dt * 2.2, stride: 0.7, t: dt, mouth: 'pant', tail: 1, headYaw: 0.3 }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: true }, { light });
    // the boy pushing the bicycle (bicycle on the far side of him from camera)
    const bp = L.at(cam, 2.85, walkZ + 0.4); const wheelRot = -walkZ / 0.33;
    const bA = L.drawChar(ctx, W, H, (c, st) => B.draw(c, { stand: false, wheel: wheelRot, t: dt, wet: 0.4 }, st), { x: bp.x, y: bp.y, scale: bp.scale, flip: true }, { light, contact: { rx: 300, ry: 25, alpha: 0.4 } });
    const kp = L.at(cam, 2.58, walkZ + 0.36);
    L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'boy', yaw: -1.35, walk: { phase: dt * 0.95, stride: 0.75 }, knee: 2, cap: true, hands: bA.grip ? { L: [(bA.grip[0] - kp.x) / kp.scale, (bA.grip[1] - kp.y) / kp.scale], R: [(bA.saddle[0] - kp.x) / kp.scale, (bA.saddle[1] - kp.y) / kp.scale + 6] } : null, face: { eyes: 'open', mouth: 'closed' }, headNod: 4, t: dt }, st), { x: kp.x, y: kp.y, scale: kp.scale }, { light, contact: { rx: 110, ry: 20, alpha: 0.4 } });
    // the robot, nearest the camera, one bar blinking
    const rp = L.at(cam, 2.45, walkZ - 0.75); const pose = { yaw: -1.1, t: dt, wheel: walkZ * 6, battery: 1, batteryBlink: true, bob: 1.2 * Math.abs(Math.sin(dt * 11)), antenna: 0.1 + 0.08 * Math.sin(dt * 9), headYaw: 0.25 * Math.sin(dt * 0.6) + 0.2, screen: { mode: 'eyes', lookX: 0.4 } };
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, pose, st) }); L.screenGlow(ctx, ra, rp.scale, '#9fe8ff', 0.25);
      },
};
