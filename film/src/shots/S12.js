'use strict';
// S12: Nishiki. Noon. A forest of shoppers' legs at the robot's height. He threads through; the shiba weaves ahead.
// The black cat, who led them here, eats a dropped fish tail by the fish stall, satisfied and useless.
const L = require('./lib'); const { C, R, S, K } = L; const M = require('../sets/market'); const { cached } = require('../engine/cache'); const CR = require('./crowd'); const T = require('../title');
module.exports = {
  smooth: true, look: 'noon',
  async setup() { const cam = M.makeCam({ y: 0.72, pitch: 0.14, W: 2100, H: 1180 }); const plate = await cached('market_S12_v3', () => M.build({ cam }).plate); const people = CR.make(12, 18, [1.6, 22], [-1.1, 1.1]); return { cam, plate, people }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; CR.bind(ctx);
    const zoom = L.kf(t, [[0, 1.0], [8, 1.09]], L.ease.inOut); const cam0 = M.makeCam({ y: 0.72, pitch: 0.14 }); const v = L.view(W, H, zoom, W / 2, H * 0.55);
    ctx.save(); v.apply(ctx); ctx.drawImage(s.plate, -(s.plate.width - W) / 2, -(s.plate.height - H) / 2); ctx.restore();
    const light = { ambient: '#f4f0f8', ambientAmt: 0.08, rim: '#fff6e0', rimDir: [0, -2.5], rimAlpha: 0.4 };
    const list = CR.items(s.people, cam0, dt, W, H, light).map(i => ({ depth: i.depth, draw: () => { ctx.save(); i.draw(); ctx.restore(); } }));
    // robot threads through, weaving
    const rz = L.lerp(2.6, 6.0, dt / 8), rx = 0.15 + 0.35 * Math.sin(dt * 0.9); const rp = L.at(cam0, rx, rz);
    const rpose = { yaw: Math.PI + 0.35 * Math.cos(dt * 0.9), headYaw: 0.5 * Math.sin(dt * 1.3), t: dt, wheel: -rz * 6, battery: 3, bob: 1.4 * Math.abs(Math.sin(dt * 12)), antenna: -0.15, screen: { mode: 'eyes' } };
    list.push({ depth: rz, draw: () => L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: null }) });
    // shiba ahead, weaving between legs
    const sz = L.lerp(4.4, 8.6, dt / 8), sx = -0.2 + 0.5 * Math.sin(dt * 1.3 + 1); const sp = L.at(cam0, sx, sz);
    list.push({ depth: sz, draw: () => L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'trot', phase: dt * 2.3, stride: 0.8, mouth: 'pant', t: dt, headYaw: 0.1 }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: Math.cos(dt * 1.3 + 1) < 0 }, { light }) });
    // black cat eating the fish tail by the fish stall (right, near)
    const cp = L.at(cam0, 0.9, 2.45); const chew = Math.sin(dt * 9) > 0;
    list.push({ depth: 2.45, draw: () => { L.drawChar(ctx, W, H, (c, st) => K.draw(c, { cat: 'kuro', pose: 'crouch', headYaw: 0.3, headDY: 10 + (chew ? 2 : 0), eyes: 'closed', t: dt, tailAmp: 1.2, mouth: chew ? 'open' : 'closed' }, st), { x: cp.x, y: cp.y, scale: cp.scale, flip: true }, { light });
      const fx = cp.x - 80 * cp.scale, fy = cp.y - 6; C.celEllipse(ctx, fx, fy, 28 * cp.scale, 9 * cp.scale, '#b8c2cc'); C.cel(ctx, [[fx - 26 * cp.scale, fy], [fx - 46 * cp.scale, fy - 14 * cp.scale], [fx - 44 * cp.scale, fy + 12 * cp.scale]], '#9aa6b2'); } });
    list.sort((a, b) => b.depth - a.depth).forEach(i => i.draw());
  },
  after(ctx, t, s, env) { T.chapter(ctx, env.W, env.H, '昼', 'NOON', L.seg(t, 0.3, 1.2) * (1 - L.seg(t, 3.6, 4.4))); },
};
