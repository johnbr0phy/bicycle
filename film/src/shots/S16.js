'use strict';
// S16: Lanterns. Dusk. Pontocho. The lanterns come on one by one as the robot rolls through; light rain begins,
// drawn as single lines. His wheel hits a puddle: a little puff of drops. The shiba is ahead, then further ahead.
const L = require('./lib'); const { C, R, S } = L; const Pt = require('../sets/pontocho'); const { cached } = require('../engine/cache'); const P = require('../props'); const T = require('../title');
module.exports = {
  smooth: false, look: 'dusk',
  async setup() {
    let set = null; const get = () => (set = set || Pt.build({ tod: 'dusk' }));
    const plate = await cached('pontocho_dusk_v1', () => get().plate);
    const meta = await cached('pontocho_dusk_meta_v1', () => { const c = require('canvas').createCanvas(1, 1); c.meta = JSON.stringify(get().lanterns); return c; }).catch(() => null);
    const lanterns = set ? set.lanterns : Pt.build({ tod: 'dusk', raw: true }).lanterns; // positions only (fast when raw)
    return { plate, lanterns, cam: Pt.makeCam(), margin: 0.12 };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const m = s.margin; const PW = W * (1 + 2 * m), PH = H * (1 + 2 * m);
    const zoom = L.kf(t, [[0, 1.0], [7, 1.12]], (x) => x); const v = L.view(W, H, zoom, W / 2, H * 0.56);
    ctx.save(); v.apply(ctx); ctx.drawImage(s.plate, -m * W, -m * H, PW, PH);
    // lanterns light up one by one from near to far, tracking the robot's progress
    const rz = L.lerp(2.7, 8.0, C.ease.inOut(dt / 7));
    s.lanterns.forEach((Ln, i) => { const on = L.seg(dt, 0.2 + (Ln.z - 1) * 0.42, 0.5 + (Ln.z - 1) * 0.42); ctx.save(); ctx.translate(-m * W, -m * H); Pt.drawLantern(ctx, Ln, on, t, i); ctx.restore(); });
    ctx.restore();
    const cam = s.cam;
    // puddles on the path (screen-space via view)
    const pud = cam.p(-0.35, 0, 4.6); const pk = cam.f / pud[2]; const pq = v.pt([pud[0], pud[1]]); P.puddle(ctx, pq[0], pq[1], 0.45 * pk * zoom, 0.07 * pk * zoom, '#6a6480', '#d8b0a0');
    const light = { ambient: '#c8a8c8', ambientAmt: 0.3, rim: '#ffc070', rimDir: [0, -3], rimAlpha: 0.8 };
    // shiba bounding ahead, getting further away
    const sz = L.lerp(6.5, 20, dt / 7), sx = 0.3 + 0.2 * Math.sin(dt); const sp = L.at(cam, sx, sz); const sq = v.pt([sp.x, sp.y]);
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'trot', phase: dt * 2.6, stride: 0.9, t: dt, headYaw: 1.2 }, st), { x: sq[0], y: sq[1], scale: sp.scale * zoom, flip: false, rot: 0 }, { light });
    // robot rolling away from camera
    const rx = -0.2 + 0.12 * Math.sin(dt * 0.8); const rp = L.at(cam, rx, rz); const rq = v.pt([rp.x, rp.y]);
    const pose = { yaw: Math.PI - 0.15 * Math.sin(dt * 0.8), t: dt, wheel: -rz * 6, battery: 2, bob: 1.4 * Math.abs(Math.sin(dt * 12)), antenna: -0.15 + 0.1 * Math.sin(dt * 9), wet: L.seg(dt, 3, 7) * 0.6, headYaw: 0.3 * L.seg(dt, 5.2, 5.6) * (1 - L.seg(dt, 6.2, 6.6)) };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rq[0], y: rq[1], scale: rp.scale * zoom }, { light, contact: { rx: 120, ry: 20, alpha: 0.4 } });
    // splash when the wheel crosses the puddle (z ~ 4.6)
    const su = L.seg(dt, 3.55, 4.15, (x) => x); if (su > 0 && su < 1) P.splash(ctx, rq[0] - 20 * rp.scale, rq[1], 90 * rp.scale * zoom, su, '#f0d8e8');
    // rain begins
    const rainA = L.seg(t, 2.0, 5.5); if (rainA > 0) P.rain(ctx, W, H, env.drawIdx, { count: Math.round(420 * rainA), alpha: 0.45, color: '#f2dcec', len: 40 });
  },
  after(ctx, t, s, env) { T.chapter(ctx, env.W, env.H, '夕', 'DUSK', L.seg(t, 0.3, 1.2) * (1 - L.seg(t, 3.6, 4.4))); },
};
