'use strict';
// S08: The wall of cats. Low and wide along a temple wall. Five cats on the tiled cap, each a different shape.
// The robot rolls in below, tilts his face up and shows the bicycle glyph. The cats look down. One yawns.
const L = require('./lib'); const { C, R, K } = L; const TW = require('../sets/templewall'); const { cached } = require('../engine/cache');
const CATS = [['elder', 10.6, 'loaf', 0.4], ['extra1', 9.2, 'lie', 1.3], ['bobtail', 7.9, 'sit', 2.1], ['kuro', 7.0, 'loaf', 0.7], ['boss', 5.6, 'sit', 1.6]];
module.exports = {
  smooth: false, look: 'morning',
  async setup() { const cam = TW.makeCam(); const plate = await cached('wall_S08_v1', () => TW.build({ cam }).plate); return { cam, plate }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // robot rolls in from frame right and stops below the boss
    const rz = L.kf(dt, [[0, 3.2], [2.2, 4.9]]), rx = L.kf(dt, [[0, 0.4], [2.2, 0.95]]); const rp = L.at(cam, rx, rz);
    const up = L.seg(dt, 2.5, 3.1); const moving = dt < 2.2;
    const noticed = L.seg(dt, 3.0, 3.6);
    for (const [c, z, pose, ph] of CATS) {
      const p = L.at(cam, TW.WX - 0.14, z, TW.CAP - 0.1);
      const yawn = c === 'bobtail' && dt > 5.2 && dt < 6.6; const yA = L.seg(dt, 5.2, 5.6) * (1 - L.seg(dt, 6.2, 6.6));
      const look = noticed * (c === 'elder' ? 0.3 : 1);
      const cp = { cat: c, pose, headYaw: L.lerp(0.5 + 0.4 * Math.sin(ph), 1.15, look), headTilt: look * 0.12 * Math.sin(ph * 3), lookY: 0.7 * look, lookX: -0.2 * look, pupil: 0.3, t: dt + ph * 3, tailAmp: c === 'kuro' ? 1.4 : 0.8, blink: L.blink(dt, [1.2 + ph, 4.5 + ph * 0.7]), mouth: yawn && yA > 0.3 ? 'yawn' : 'closed', eyes: yawn && yA > 0.3 ? 'closed' : c === 'elder' ? 'half' : 'open', headDY: yawn ? -3 * yA : 0, whisker: 0.3 * Math.sin(dt * 2 + ph) };
      L.drawChar(ctx, W, H, (cx, st) => K.draw(cx, cp, st), { x: p.x, y: p.y, scale: p.scale, flip: true }, { contact: { rx: 70, ry: 8, alpha: 0.3 }, light: { rim: '#fff6dc', rimDir: [-2, -2], rimAlpha: 0.5 } });
    }
    const pose = { yaw: moving ? -1.2 : L.lerp(-1.2, -0.55, L.seg(dt, 2.2, 2.6)), headNod: -20 * up, headTilt: 0.1 * up, t: dt, wheel: -rz * 6, battery: 4, bob: moving ? 1.4 * Math.abs(Math.sin(dt * 13)) : 0, antenna: moving ? -0.15 : L.kf(dt, [[2.2, -0.2], [2.5, 0.15], [2.8, 0]]),
      armL: [L.kf(dt, [[3.3, 0.12], [3.7, 0.9]]), 0.4, 0.5], screen: { mode: dt > 2.9 ? 'bike' : 'eyes', lookY: -up, blink: L.blink(dt, [1.5]) } };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light: { ambient: '#f0ecf8', ambientAmt: 0.1, rim: '#fff4d8', rimDir: [-2, -2], rimAlpha: 0.5 }, shadow: { dir: [0.6, 0.5], len: 0.5, alpha: 0.2 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
  },
};
