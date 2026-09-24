'use strict';
// S26: Zero. Close on the robot by her step. His chest: no bars. His eyes dim as he watches the boy ride back up the
// lane toward him. The screen goes dark. Her hand lays a folded cloth over his dented shoulder. The boy stops beside
// them and tries the bell: clack. Clack. Then it rings, clean and bright. For one beat his screen answers.
const L = require('./lib'); const { C, R, S, Hm, B } = L; const HM = require('./home');
const CAM = { x: -0.8, y: 0.75, z: 6.6, yaw: 2.05, pitch: 0.06, f: 1100 };
module.exports = {
  smooth: false, look: 'night', lookOver: { vignette: 0.36 }, CAM,
  async setup() { return await L.lanePlate('lane_night_S26_v2', 'night', CAM, { fg: false, homeDoor: 'open' }); },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    HM.lanterns(ctx, cam, t); HM.doorGlow(ctx, cam);
    const light = HM.LIGHT; const list = [];
    // the boy rides back toward us and stops beside the robot
    const arrive = L.seg(dt, 0, 3.8, L.ease.out); const bz = L.lerp(-4.5, 4.0, arrive), bx = L.lerp(0.6, 1.25, arrive);
    const clack1 = dt > 5.7 && dt < 5.9, clack2 = dt > 6.35 && dt < 6.55; const ring = L.seg(dt, 7.2, 7.35) * (1 - L.seg(dt, 8.6, 9.0));
    const bp = L.at(cam, bx, bz);
    list.push({ d: cam.toCam(bx, 0, bz)[2], draw: () => { const rr = L.riding(ctx, W, H, Object.assign({}, bp, { flip: true }), { view: 'side', stand: arrive >= 1, wheel: -bz / 0.33, crank: -bz * 2.6, bellShake: clack1 || clack2 ? 1 : ring > 0 ? 0.6 : 0, bellRing: ring > 0 ? (dt - 7.2) * 1.2 % 1.2 : 0, t: dt }, { who: 'boy', yaw: -1.35, cap: true, knee: 2, face: { eyes: dt > 7.3 ? 'closed' : 'open', mouth: dt > 7.3 ? 'smile' : 'open' }, headTilt: dt > 7.3 ? 0.1 : 0, t: dt }, { light }); if (ring > 0 && rr.bike.bell) { const fl = Math.max(0, 1 - (dt - 7.2) / 1.4); L.glowAt(ctx, rr.bike.bell[0], rr.bike.bell[1], 160, '#fff6d8', 0.9 * fl * ring); } } });
    // the robot by the step
    const dim = L.seg(dt, 2.2, 4.6); const off = dt > 4.6; const answer = L.seg(dt, 7.5, 7.8) * (1 - L.seg(dt, 8.6, 9.0));
    const rpose = { yaw: L.cheat(L.faceYaw(cam, -0.2, -1), 0.95), headNod: 6 + 10 * dim, headTilt: 0.12 * dim, antenna: 0.1 + 0.6 * dim, t: dt, battery: dt < 1.5 ? 1 : 0, batteryBlink: dt < 1.5, cloth: dt > 5.2, squash: 0.03 * dim,
      armL: [0.04, 0.05, 0.2], armR: [0.04, 0.05, 0.2], screen: off ? (answer > 0 ? { mode: 'happy', bright: 0.45 * answer } : { mode: 'off' }) : { mode: dim > 0.5 ? 'tired' : 'eyes', bright: 1 - dim * 0.85, lookX: 0.5 } };
    list.push({ d: cam.toCam(1.55, 0, 6.35)[2], draw: () => { const rp = L.at(cam, 1.55, 6.35); const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), rp, { light, contact: { rx: 130, ry: 22, alpha: 0.45 }, emissive: (c, st) => R.drawEmissive(c, rpose, st) }); L.screenGlow(ctx, a, rp.scale, '#9fe8ff', off ? 0.3 * answer : 0.3 * (1 - dim)); } });
    // her: standing just behind him (only her lower half and her arm are in frame), lays the cloth at 4.6-5.3
    const lay = L.seg(dt, 4.4, 5.2) * (1 - L.seg(dt, 5.6, 6.3));
    list.push({ d: cam.toCam(2.05, 0, 6.85)[2], draw: () => { const wp = L.at(cam, 2.05, 6.85); L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'woman', yaw: L.faceYaw(cam, 0.3, -1), hands: { R: [L.lerp(40, 190, lay), L.lerp(-230, -280, lay)], L: [-30, -230] }, face: { eyes: 'down' }, headNod: 8, t: dt }, st), wp, { light, contact: { rx: 110, ry: 20, alpha: 0.4 } }); } });
    // the shiba lies down beside them
    list.push({ d: cam.toCam(1.2, 0, 5.7)[2], draw: () => { const sp = L.at(cam, 1.2, 5.7); L.drawChar(ctx, W, H, (c, st) => S.draw(c, { lie: 1, headDown: 0.4, headYaw: 0.3, eyes: dt > 7.3 ? 'happy' : 'open', ears: dt > 7.25 ? 'perk' : 'up', tail: 1, wag: dt > 7.3 ? 1 : 0, t: dt }, st), Object.assign({}, sp, { flip: true }), { light }); } });
    list.sort((a, b) => b.d - a.d).forEach(i => i.draw());
  },
};
