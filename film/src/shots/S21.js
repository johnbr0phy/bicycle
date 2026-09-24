'use strict';
// S21: The cap goes back. Close. The robot rolls to the boy and raises his gripper: the yellow hat. He places it on
// the boy's head, slightly crooked. His screen shows the bicycle, then a bicycle with a small figure pushing it and a
// small robot beside it. The boy wipes his face. The shiba licks the scraped knee.
const L = require('./lib'); const { C, R, S, Hm } = L; const Al = require('../sets/alley'); const { cached } = require('../engine/cache'); const P = require('../props'); const S20 = require('./S20');
module.exports = {
  smooth: false, look: 'night', lookOver: { vignette: 0.4 },
  async setup() { const cam = Al.makeCam({ x: 0.2, y: 0.78, z: 0.8, yaw: -0.2, pitch: 0.03, f: 1350 }); let set = null; const plate = await cached('alley_S21_v3', () => (set = Al.build({ cam })).plate); const bulb = (set || Al.build({ cam, raw: true })).bulb; return { cam, plate, bulb }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    const light = { ambient: '#4a4f88', ambientAmt: 0.38, rim: '#ffd890', rimDir: [-2.5, -2], rimAlpha: 0.9 };
    const placed = dt > 2.4; const wipe = L.seg(dt, 5.0, 5.4) * (1 - L.seg(dt, 6.0, 6.4)); const lookUp = L.seg(dt, 0.3, 0.8);
    // the boy on the step
    const kp = L.at(cam, -0.62, 3.5, 0.22);
    const bpose = { who: 'boy', yaw: 0.55, seat: [0, -96], feet: { L: [62, 0], R: [44, 0] }, knee: 1, cap: placed, hands: wipe > 0 ? { L: [70, -150], R: [L.lerp(84, 30, wipe), L.lerp(-140, -300, wipe)] } : { L: [70, -150], R: [84, -140] }, headNod: L.lerp(10, -4, lookUp) + (placed ? 2 : 0), headTilt: placed ? -0.08 : 0, bend: 0.25, face: { eyes: wipe > 0.5 ? 'closed' : 'open', mouth: dt > 6.2 ? 'smile' : 'wobble', tears: dt > 6.0 ? 0.2 : 0.9, brows: dt > 6.2 ? 0 : 0.8, look: [0.6, 0] }, t: dt };
    const ka = L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, bpose, st), { x: kp.x, y: kp.y, scale: kp.scale }, { light, contact: { rx: 120, ry: 18, alpha: 0.4 } });
    // the robot at right, reaching up to put the hat on
    const rp = L.at(cam, 0.05, 3.25); const reach = (0.4 + 0.6 * L.seg(dt, 0.8, 2.0)) * (1 - L.seg(dt, 2.6, 3.2));
    const glyph = dt < 3.4 ? 'eyes' : dt < 4.4 ? 'bike' : dt < 7.6 ? 'bikeKid' : 'happy';
    const pose = { yaw: -1.15, t: dt, battery: 1, batteryBlink: true, wet: 0.3, headNod: -6, armL: [0.15, 0.3, 0.3], armR: [0.2 + 2.3 * reach, 0.6 + 0.3 * reach, placed ? 0.9 : 0.4], antenna: L.kf(dt, [[7.6, 0], [7.75, -0.3], [7.9, 0.15], [8.0, 0]]), screen: { mode: glyph, lookX: -0.5 } };
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, contact: { rx: 120, ry: 20, alpha: 0.5 }, emissive: (c, st) => R.drawEmissive(c, pose, st) });
    if (!placed && ra.gripR) P.schoolHat(ctx, ra.gripR[0], ra.gripR[1] - 8, 0.13 * rp.scale * 353, -0.1);
    // the shiba licks the knee (in front of the robot, facing the boy)
    const lick = dt > 4.2 && dt < 6.5; const sp = L.at(cam, -0.02, 3.0);
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, { t: dt, wet: 0.4, headYaw: 0.2, headLift: lick ? 0.5 : 0, mouth: lick && (env.drawIdx % 4 < 2) ? 'pant' : 'closed', tongue: lick ? 1.4 : 0, eyes: lick ? 'happy' : 'open', tail: 1, wag: 1, crouch: 0.2 }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: true }, { light: Object.assign({}, light, { rimDir: [2, -2] }) });
    L.screenGlow(ctx, ra, rp.scale, '#9fe8ff', 0.3);
    S20.bulbLight(ctx, s, W, H, t, 0.8);
  },
};
