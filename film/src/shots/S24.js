'use strict';
// S24: She runs. She holds the saddle from behind and runs, an old woman running, down the lane under the lanterns.
// She lets go. He wobbles and keeps going. The robot watches from the step, the shiba beside him.
const L = require('./lib'); const { C, R, S, Hm, B } = L; const HM = require('./home');
function bikeZ(t) { if (t < 1.2) return 4.7; const u = Math.min(t, 5) - 1.2; let z = 4.7 - 0.4 * u * u; if (t > 5) z -= 3.04 * (t - 5); return z; }
function herZ(t) { if (t <= 5) return bikeZ(t) + 0.62; const u = Math.min(t - 5, 3.04 / 1.8); return bikeZ(5) + 0.62 - (3.04 * u - 0.9 * u * u); }
module.exports = {
  smooth: false, look: 'night', bikeZ,
  async setup() { return await L.lanePlate('lane_night_home_v1', 'night', HM.CAM, { fg: false, homeDoor: 'open' }); },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam;
    const zoom = L.kf(t, [[0, 1.0], [5, 1.0], [11, 1.12]], L.ease.inOut); const hz = herZ(dt); const hp0 = cam.p(0.2, 1.0, hz);
    const zk = (zoom - 1) / 0.12; const v = L.view(W, H, zoom, L.lerp(W / 2, hp0 ? hp0[0] : W / 2, zk * 0.6), L.lerp(H / 2, H * 0.56, zk), true);
    ctx.save(); v.apply(ctx); ctx.drawImage(s.plate, 0, 0); ctx.restore();
    HM.lanterns(ctx, cam, t, 1, v); const dg = cam.p(2.0, 0.4, 4.6); if (dg) { const q = v.pt([dg[0], dg[1]]); L.glowAt(ctx, q[0], q[1], 420 * zoom, '#ffc878', 0.35); }
    const light = HM.LIGHT; const at = (x, z) => { const p = L.at(cam, x, z); const q = v.pt([p.x, p.y]); return { x: q[0], y: q[1], scale: p.scale * zoom }; };
    // the bicycle with the boy, riding away
    const bz = bikeZ(dt), bx = L.lerp(0.55, 0.25, L.seg(dt, 1.2, 8)); const wob = (0.09 * Math.sin(dt * 5.2) + 0.04 * Math.sin(dt * 9.1)) * (dt > 5 ? L.lerp(1.4, 0.3, L.seg(dt, 5, 10)) : 0.3);
    const bp = at(bx, bz); const crank = (4.7 - bz) * 2.6;
    const ride = L.riding(ctx, W, H, bp, { view: 'rear', crank, lean: wob, bellRing: 0 }, { who: 'boy', yaw: Math.PI, cap: true, knee: 2, headTilt: -wob * 0.8, face: { eyes: 'open' }, t: dt }, { light });
    // her, running behind holding the saddle, then letting go, stopping, breathing
    const let_ = dt > 5.0; const hx = L.lerp(0.02, -0.1, L.seg(dt, 1.2, 8)); const hp = at(hx, hz);
    const moving = dt > 1.2 && dt < 6.6; const runPh = dt * (let_ ? 1.3 : 1.5); const settle = L.seg(dt, 6.4, 7.2);
    const sad = ride.bike.saddle; const hands = !let_ && sad ? { L: [(sad[0] - hp.x) / hp.scale - 8, (sad[1] - hp.y) / hp.scale + 34], R: [(sad[0] - hp.x) / hp.scale + 26, (sad[1] - hp.y) / hp.scale + 44] } : { L: [L.lerp(40, -10, settle), L.lerp(-300, -330, settle)], R: [50, -260] };
    L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'woman', yaw: Math.PI + 0.05, walk: moving ? { phase: runPh, stride: let_ ? L.lerp(1, 0.3, L.seg(dt, 5, 6.6)) : 1, run: let_ && dt > 5.8 ? 0 : 1 } : null, bend: moving ? (let_ ? 0.25 : 0.42) : 0.05 + 0.03 * Math.sin(dt * 5), hands, bob: dt > 6.6 ? 4 * Math.abs(Math.sin(dt * 4.5)) * (1 - L.seg(dt, 7, 10)) : 0, headNod: dt > 7 ? -4 : 0, t: dt }, st), hp, { light, contact: { rx: 110, ry: 20, alpha: 0.4 } });
    // the robot and the shiba watching from her step, backs to us, in the foreground
    const rp = at(1.72, 6.25); const pose = { yaw: L.faceYaw(cam, -0.35, -1), headYaw: 0.1 * Math.sin(dt * 0.4) - 0.15 * L.seg(dt, 4, 9), t: dt, battery: 1, batteryBlink: true, antenna: 0.05 + 0.05 * Math.sin(dt * 2), screen: { mode: 'happy' } };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), rp, { light: Object.assign({}, light, { rimDir: [-2, -2] }), contact: { rx: 120, ry: 20, alpha: 0.4 } });
    const sp = at(2.08, 6.55); L.drawChar(ctx, W, H, (c, st) => S.draw(c, { sit: 1, headYaw: 0.1, tail: 1, wag: dt > 5.5 ? 1 : 0.3, t: dt, mouth: dt > 5.5 ? 'pant' : 'closed', ears: 'perk' }, st), Object.assign({}, sp, { flip: true }), { light });
  },
};
