'use strict';
// S07 — Past the shiba. Low tracking shot alongside the robot. Doorstep pots, a stone channel, lattice.
// A red shiba lies tied outside a shop; its head lifts and its eyes follow him. He does not notice.
const L = require('./lib'); const { C, R, S } = L; const SS = require('../sets/streetside'); const PAL = require('../sets/palettes'); const { cached } = require('../engine/cache'); const P = require('../props'); const K = require('../sets/kit');
const FAC = [
  { z: [4, 11], bays: [[4.2, 10.8, 'lattice']], upper: [], posts: [4, 7.5, 11], seed: 61 },
  { z: [1.6, 4], bays: [[1.8, 3.8, 'plaster']], posts: [1.6, 4], seed: 62 },
  { z: [-1.6, 1.6], bays: [[-1.4, 1.4, 'dark']], posts: [-1.6, 1.6], seed: 63 },
  { z: [-6, -1.6], bays: [[-5.8, -1.8, 'lattice']], posts: [-6, -3.8, -1.6], seed: 64 },
  { z: [-12, -6], bays: [[-11.8, -6.2, 'lattice']], posts: [-12, -9, -6], seed: 65 },
];
module.exports = {
  smooth: true, look: 'morning',
  async setup() {
    const o = { pal: PAL.morning, depth: 3.3, z0: -8, z1: 9, camY: 0.58, pitch: 0.04, facades: FAC, pots: [[4.3, 5.6, 11], [7.2, 8.4, 12], [-3.5, -2.2, 13], [-7.6, -6.4, 14]],
      facadeExtra: (ctx, cam) => { // wooden post the dog is tied to, and a shop sign
        K.quad(ctx, cam, [[3.05, 0, 1.75], [3.05, 0, 1.9], [3.05, 1.1, 1.9], [3.05, 1.1, 1.75]], '#6a5040'); const p = cam.p(3.3, 1.6, 1.25); if (p) { const k = cam.f / p[2]; K.kanban(ctx, p[0] - 0.12 * k, p[1], 0.24 * k, 0.75 * k, '#d8c49a', '#3a2c28', 'おはぎ'); } } };
    let set = null; const keys = ['fac', 'b1', 'b2', 'fg']; const layers = [];
    for (let i = 0; i < 4; i++) { const cv = await cached('S07_layer' + i + '_v2', () => { set = set || SS.build(o); return set.layers[i].canvas; }); layers.push(cv); }
    const meta = [{ depth: 3.1 }, { depth: 3.3 - 0.825 }, { depth: 3.3 - 1.725 }, { depth: 0.9 }];
    const f = 1250, zc = 0.5; const L2 = layers.map((cv, i) => ({ canvas: cv, depth: meta[i].depth, W: cv.width }));
    return { set: { layers: L2, zc, f, refCam: { y: 0.58, pitch: 0.04 }, depth: 3.3 } };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt;
    const cz = L.lerp(5.6, -3.6, C.ease.smooth(t / 7) * 0.2 + (t / 7) * 0.8); const cam = SS.camAt(s.set, cz);
    SS.draw(ctx, s.set, cz, (Ly) => Ly.depth > 1.2);
    // the shiba, tied to the post, lying by the shop doorway
    const sz = 1.2, sx = 2.75; const sp = L.at(cam, sx, sz);
    const lift = L.seg(dt, 2.5, 2.9); const follow = L.clamp((sz - (cz + 0.4)) / 2.5, -1, 1);
    const spose = { lie: 1, headDown: 1 - lift, headYaw: lift * L.clamp(0.4 + follow * 0.9, 0, 1.3), ears: lift > 0.5 ? 'perk' : 'up', eyes: lift > 0.3 ? 'open' : 'closed', blink: L.blink(dt, [5.3]), tail: 0.9, t: dt, headTilt: lift * 0.08 * Math.sin(dt * 1.5) };
    const sa = L.drawChar(ctx, W, H, (c, st) => S.draw(c, spose, st), { x: sp.x, y: sp.y, scale: sp.scale * 0.92, flip: true }, { light: { ambient: '#d8d4f0', ambientAmt: 0.18 }, contact: { rx: 170, ry: 18, alpha: 0.35 } });
    // leash from collar to the post
    const post = cam.p(3.05, 0.7, 1.8); if (sa.collar && post) { const a = sa.collar; C.ink(ctx, C.qbez(a, [(a[0] + post[0]) / 2, Math.max(a[1], post[1]) + 40], [post[0], post[1]], 14), { width: 3, color: '#3f6fb2', taper: 0, wobble: 0.4 }); }
    // the robot rolls along the street, facing screen right, three-quarter to camera
    const rz = cz - 0.9, rx = 2.35; const rp = L.at(cam, rx, rz);
    const pose = { yaw: 1.15, t: dt, wheel: -rz * 6, battery: 4, bob: 1.5 * Math.abs(Math.sin(dt * 13)), antenna: -0.15 + 0.08 * Math.sin(dt * 11), headYaw: 0.1 * Math.sin(dt * 0.9), screen: { mode: 'bike', blink: 0 } };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light: { ambient: '#e8e4f8', ambientAmt: 0.12, rim: '#fff2d0', rimDir: [-2, -2], rimAlpha: 0.6 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    // noren on the shop doorway (cel, animated) and the near foreground bushes
    P.noren(ctx, cam, { side: 1, hw: 3.3, z0: -1.4, z1: 1.4 }, dt, { wind: 0.6, color: '#7e4a44', crest: '#efe4d2', top: 2.3, bot: 1.5 });
  },
};
