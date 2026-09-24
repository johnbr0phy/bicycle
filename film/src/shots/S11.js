'use strict';
// S11: The shiba remembers. Closer on the pair. The robot shows the bicycle glyph; the shiba tilts its head.
// A picture-book memory blooms above it: the green bicycle leaving at dawn, pushed by a small figure.
// The dog barks once, spins, and springs away up the path. The robot follows.
const L = require('./lib'); const { C, R, S } = L; const Cn = require('../sets/canal'); const { cached } = require('../engine/cache'); const M = require('../memory'); const S10 = require('./S10'); const { Cam } = require('../engine/persp');
module.exports = {
  smooth: true, look: 'morning',
  async setup() {
    const cam = Cn.makeCam({ x: 1.3, y: 0.78, z: 3.0, yaw: -0.08, pitch: 0.03, W: 2300, f: 1350 });
    const plate = await cached('canal_S11_v1', () => Cn.build({ cam }).plate);
    const mem = await cached('memory_v1', () => M.render());
    return { cam, plate, mem };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt;
    const pan = L.kf(t, [[0, 0], [4.8, 0], [6.4, -0.09]], L.ease.inOut);
    const cam = new Cam(Object.assign({}, s.cam, { W: 1920, yaw: s.cam.yaw + pan })); cam.update();
    ctx.drawImage(s.plate, -(s.plate.width - W) / 2 - cam.f * Math.tan(pan), 0);
    // robot (left) facing the dog
    const rgo = L.seg(dt, 5.2, 7.0, L.ease.in); const rx = L.lerp(0.95, 0.4, rgo), rz = L.lerp(5.6, 8.0, rgo); const rp = L.at(cam, rx, rz);
    const rpose = { yaw: rgo > 0 ? L.lerp(L.cheat(L.faceYaw(cam, 1, 0.1), 0.85), L.faceYaw(cam, -0.3, 1), L.seg(dt, 5.0, 5.4)) : L.cheat(L.faceYaw(cam, 1, 0.1), 0.85), t: dt, wheel: -rz * 6, battery: 3, bob: rgo > 0 ? 1.4 * Math.abs(Math.sin(dt * 13)) : 0, headTilt: L.kf(dt, [[1.2, 0], [1.6, -0.12], [2.4, -0.12], [2.8, 0]]),
      armL: [L.kf(dt, [[0.3, 0.1], [0.7, 1.2], [2.2, 1.2], [2.6, 0.1]]), 0.5, 0.6], screen: { mode: dt > 0.5 && dt < 4.6 ? 'bike' : dt >= 4.6 && dt < 5.2 ? 'wide' : 'happy', blink: 0 }, antenna: L.kf(dt, [[4.6, 0], [4.75, 0.4], [4.9, -0.2], [5.05, 0]]) };
    // shiba: curious tilt, memory, bark, spin, spring away
    const sx0 = 2.35, sz0 = 5.3; const leap = L.seg(dt, 5.25, 6.6, L.ease.in); const sx = L.lerp(sx0, 0.6, leap), sz = L.lerp(sz0, 9.8, leap); const sp = L.at(cam, sx, sz);
    const spin = L.seg(dt, 4.85, 5.25); const facingRight = spin > 0.5;
    const tilt = L.kf(dt, [[1.0, 0], [1.4, -0.35], [2.6, -0.35], [3.0, 0.1], [3.4, 0]]);
    const bark = dt > 4.3 && dt < 4.7;
    const spose = leap > 0 ? { gait: 'bound', phase: dt * 2.2, stride: 1.2, mouth: 'pant', tail: 1, t: dt, headYaw: 0.2 }
      : { sit: L.kf(dt, [[0.4, 0], [1.0, 0.9]]) * (1 - spin), headYaw: L.lerp(0.9, 0.2, spin), headTilt: tilt, ears: tilt < -0.1 ? 'perk' : 'up', eyes: dt > 2.4 && dt < 4.2 ? 'wide' : 'open', mouth: bark ? 'bark' : dt > 3.0 && dt < 4.2 ? 'pant' : 'closed', headLift: bark ? 1 : 0, tail: 1, wag: dt > 2.8 ? 1 : 0, t: dt, bob: bark ? 8 : spin > 0 && spin < 1 ? 14 * Math.sin(spin * Math.PI) : 0 };
    const draws = [[rz, () => L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light: { ambient: '#eeeaf8', ambientAmt: 0.1, rim: '#fff2d0', rimDir: [-2, -2], rimAlpha: 0.5 }, emissive: (c, st) => R.drawEmissive(c, rpose, st) })],
      [sz, () => { const flip = !(facingRight && leap === 0) ; const a = L.drawChar(ctx, W, H, (c, st) => S.draw(c, spose, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: leap > 0 ? true : !facingRight }, { light: { ambient: '#eeeaf8', ambientAmt: 0.1, rim: '#fff2d0', rimDir: [-2, -2], rimAlpha: 0.5 } }); S10.leash(ctx, a.collar, sp.y + 4, dt, 150 * sp.scale); s.head = a.head; }]];
    draws.sort((a, b) => b[0] - a[0]).forEach(d => d[1]());
    // the memory vignette
    const ma = L.seg(dt, 2.3, 2.8) * (1 - L.seg(dt, 4.1, 4.4));
    if (ma > 0 && s.head) M.draw(ctx, s.mem, Math.min(W - 300, s.head[0] + 40), Math.max(230, s.head[1] - 300), s.head, ma, t);
    Cn.willow(ctx, cam, -0.3, 3.9, 5.0, 93, Math.sin(t * 0.8) * 0.8, undefined, undefined, true);
  },
};
