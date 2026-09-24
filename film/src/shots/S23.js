'use strict';
// S23: The doorstep. The lane at night. She sits on her doorstep with a small lantern, waiting. She sees them and
// stands. The boy stops, takes off his hat, and bows deeply. Long hold. She walks to the bicycle and puts her hand on
// the saddle, looking at the boy. The robot hands her the bell.
const L = require('./lib'); const { C, R, S, Hm, B } = L; const HM = require('./home'); const S18 = require('./S18'); const P = require('../props');
module.exports = {
  smooth: false, look: 'night',
  async setup() { return await L.lanePlate('lane_night_home_v1', 'night', HM.CAM, { fg: false, homeDoor: 'open' }); },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    HM.lanterns(ctx, cam, t); HM.doorGlow(ctx, cam);
    const light = HM.LIGHT; const list = [];
    // arrivals: from screen right (lane side) toward the house
    const arr = L.seg(dt, 0.9, 3.5, L.ease.out); const walkPh = dt * 0.95;
    const bikeX = L.lerp(-2.9, 0.1, arr), bikeZ = 5.0; const fwd = L.seg(dt, 3.5, 4.3); const boyX = L.lerp(bikeX - 0.15, 0.9, fwd), boyZ = L.lerp(5.45, 5.2, fwd);
    const standUp = L.seg(dt, 2.0, 2.8); const toBike = L.seg(dt, 7.9, 9.2); const capOff = dt > 4.3; const bow = L.seg(dt, 4.7, 5.4) * (1 - L.seg(dt, 6.6, 7.2));
    // the bicycle (side view facing the house = screen left)
    const bp = L.at(cam, bikeX, bikeZ); const bikeA = {};
    list.push({ x: bikeX, depth: bikeZ, draw: () => Object.assign(bikeA, L.drawChar(ctx, W, H, (c, st) => B.draw(c, { stand: arr >= 1, wheel: bikeX / 0.33, t: dt, wet: 0.3 }, st), { x: bp.x, y: bp.y, scale: bp.scale, flip: true }, { light, contact: { rx: 300, ry: 25, alpha: 0.35 } })) });
    // the boy: pushing, then stopping, hat off, deep bow toward her
    const kp = L.at(cam, boyX, boyZ); const faceHer = L.faceYaw(cam, 1, -0.2);
    list.push({ x: boyX, depth: boyZ, draw: () => { const hands = fwd === 0 && bikeA.saddle ? { L: [(bikeA.grip[0] - kp.x) / kp.scale, (bikeA.grip[1] - kp.y) / kp.scale], R: [(bikeA.saddle[0] - kp.x) / kp.scale, (bikeA.saddle[1] - kp.y) / kp.scale + 6] } : capOff ? { R: [40, -250 + 80 * bow], L: [-20, -230 + 60 * bow] } : null;
      const a = L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'boy', yaw: fwd < 1 ? L.faceYaw(cam, 1, 0) : dt > 8.8 ? L.faceYaw(cam, -1, -0.4) : faceHer, walk: arr < 1 || (fwd > 0 && fwd < 1) ? { phase: walkPh, stride: 0.7 } : null, cap: !capOff, knee: 2, hands, arms: { L: [0.05, 0.2], R: dt > 4.0 && !capOff ? [2.6, 0.4] : [0.05, 0.2] }, bend: 1.25 * bow, headNod: 10 * bow, face: { eyes: bow > 0.3 ? 'closed' : 'open', mouth: 'closed', brows: 0.4 }, t: dt }, st), { x: kp.x, y: kp.y, scale: kp.scale }, { light, contact: { rx: 110, ry: 20, alpha: 0.4 } });
      if (capOff && a.handR) P.schoolHat(ctx, a.handR[0] + 6, a.handR[1] + 10, 0.12 * kp.scale * 353, 0.4 + 0.4 * bow, { upside: false }); } });
    // her: seated on the step with the lantern, stands, walks to the bike, hand on the saddle, takes the bell
    const wx = toBike < 0.5 ? L.lerp(1.95, 0.9, toBike * 2) : L.lerp(0.9, -0.3, toBike * 2 - 1), wz = toBike < 0.5 ? L.lerp(4.6, 4.2, toBike * 2) : L.lerp(4.2, 4.4, toBike * 2 - 1); const wp = L.at(cam, wx, wz);
    const seatY = L.lerp(-150, -(108 + 110 + 6), standUp);
    const takeBell = L.seg(dt, 6.9, 7.5);
    list.push({ x: wx, depth: wz, draw: () => { const handsW = toBike > 0.95 && bikeA.saddle ? { R: [(bikeA.saddle[0] - wp.x) / wp.scale, (bikeA.saddle[1] - wp.y) / wp.scale - 6], L: [30, -250] } : takeBell > 0 && toBike === 0 ? { R: [L.lerp(-60, -110, takeBell), L.lerp(-200, -260, takeBell)] } : { R: [-60, -230 + (1 - standUp) * 60] };
      const a = L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'woman', yaw: toBike > 0 && toBike < 1 ? L.faceYaw(cam, -1, -0.1) : toBike >= 1 ? L.cheat(L.faceYaw(cam, 1, 0.4), 1.2) : L.faceYaw(cam, -1, 0.25), seat: standUp < 1 ? [0, seatY] : null, feet: standUp < 1 ? { L: [-L.lerp(70, 10, standUp), 0], R: [-L.lerp(40, -20, standUp), 0] } : null, walk: toBike > 0 && toBike < 1 ? { phase: dt * 1.1, stride: 0.5 } : null, prop: dt < 6.5 ? 'lantern' : null, hands: handsW, headNod: bow > 0.2 ? 8 : 0, face: { eyes: dt < 2.2 ? 'down' : 'open', mouth: 'closed', brows: dt > 5 ? 0.3 : 0 }, t: dt }, st), { x: wp.x, y: wp.y, scale: wp.scale }, { light: Object.assign({}, light, { rimDir: [-2, -2] }), contact: { rx: 110, ry: 20, alpha: 0.4 } });
      if (a.lantern) L.glowAt(ctx, a.lantern[0], a.lantern[1], 260, '#ffc878', 0.5);
      if (takeBell >= 1) { const hnd = toBike > 0.95 ? a.handL : a.handR; if (hnd) S18.bell(ctx, hnd[0] - 6, hnd[1] - 4, 13 * wp.scale * 3); } } });
    // the robot: trails in, then rolls up and offers the bell
    const rIn = L.seg(dt, 0.3, 2.9, L.ease.out); const offer = L.seg(dt, 6.4, 7.0); const rx = L.lerp(-2.9, 1.8, rIn), rz = L.lerp(5.9, 5.45, rIn); const rp = L.at(cam, rx, rz);
    const rpose = { yaw: rIn < 1 ? L.faceYaw(cam, 1, -0.1) : offer > 0 && takeBell < 1 ? L.faceYaw(cam, 0.3, -1) : L.cheat(L.faceYaw(cam, -1, -0.2), 0.95), t: dt, wheel: rx * 6, battery: 1, batteryBlink: true, bob: rIn > 0 && rIn < 1 ? 1.3 * Math.abs(Math.sin(dt * 12)) : 0, armR: [0.4 + 1.2 * offer * (1 - takeBell), 0.8, 0.4], screen: { mode: 'eyes', lookX: 0.6 } };
    list.push({ x: rx, depth: rz, draw: () => { const a = L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, rpose, st) }); L.screenGlow(ctx, a, rp.scale, '#9fe8ff', 0.25); if (takeBell < 1 && a.gripR) S18.bell(ctx, a.gripR[0], a.gripR[1], 12 * rp.scale * 3); } });
    // the shiba runs ahead to her and sits, tail wagging
    const sIn = L.seg(dt, 0.1, 2.2, L.ease.out); const sx = L.lerp(-2.2, 2.05, sIn), sz = L.lerp(5.9, 6.1, sIn); const sp = L.at(cam, sx, sz);
    list.push({ x: sx, depth: sz, draw: () => L.drawChar(ctx, W, H, (c, st) => S.draw(c, sIn < 1 ? { gait: 'trot', phase: dt * 2.3, stride: 0.8, t: dt, mouth: 'pant' } : { sit: 1, headYaw: 0.6, mouth: 'pant', eyes: 'happy', tail: 1, wag: 1, t: dt }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: sIn < 1 }, { light }) });
    list.forEach(i => { i.d = cam.toCam(i.x == null ? 0 : i.x, 0, i.depth)[2]; }); list.sort((a, b) => b.d - a.d).forEach(i => i.draw());
  },
};
