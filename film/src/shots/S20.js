'use strict';
// S20 — The alley. A dead-end behind a shuttered shop, one bare bulb. The bicycle lies against the wall, basket bent,
// and on the step beside it a boy of about eight sits with his knees hugged, face down, one knee scraped. The robot
// stops. Hold. He looks at the bicycle. Then at the boy. The boy looks up and sees a robot and a dog.
const L = require('./lib'); const { C, FX, R, S, Hm, B } = L; const Al = require('../sets/alley'); const { cached } = require('../engine/cache');
function bulbLight(ctx, s, W, H, t, a = 1) { const b = s.bulb; const fl = 0.93 + 0.05 * Math.sin(t * 40) + 0.03 * Math.sin(t * 7); L.glowAt(ctx, b[0], b[1], 900, '#ffd890', 0.28 * fl * a); L.glowAt(ctx, b[0], b[1], 90, '#fff4d0', 0.9 * a); C.celCircle(ctx, b[0], b[1], 11, '#fff8e0'); }
function scene(ctx, s, env, o) {
  const { W, H } = env; const cam = s.cam; const t = env.dt;
  // ambient: the bulb lights a pool; everything else is blue
  const light = { ambient: '#4a4f88', ambientAmt: 0.42, rim: '#ffd890', rimDir: [-2.5, -2], rimAlpha: 0.9 };
  // bicycle leaning against the right wall, tilted
  const bp = L.at(cam, 0.35, 5.2); L.drawChar(ctx, W, H, (c, st) => B.draw(c, { stand: false, yaw: 0.0, wheel: 0.4, t, wet: 0.5 }, st), { x: bp.x, y: bp.y, scale: bp.scale, flip: true, rot: -0.12 }, { light: Object.assign({}, light, { rimDir: [2, -2] }), contact: { rx: 300, ry: 30, alpha: 0.5 } });
  // the boy on the step
  const kp = L.at(cam, -0.62, 3.5, 0.22); const bo = o.boy || {};
  L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, Object.assign({ who: 'boy', yaw: 0.75, seat: [0, -96], feet: { L: [62, 0], R: [44, 0] }, knee: 1, cap: false, hands: { L: [70, -150], R: [84, -140] }, headNod: 14, bend: 0.35, face: { eyes: 'down', mouth: 'closed' }, t }, bo), st), { x: kp.x, y: kp.y, scale: kp.scale }, { light, contact: { rx: 120, ry: 18, alpha: 0.4 } });
  return light;
}
module.exports = {
  smooth: false, look: 'night', lookOver: { vignette: 0.42 }, scene, bulbLight,
  async setup() { const cam = Al.makeCam(); let set = null; const plate = await cached('alley_v2', () => (set = Al.build({ cam })).plate); const bulb = (set || Al.build({ cam, raw: true })).bulb; return { cam, plate, bulb }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    const up = L.seg(dt, 6.2, 6.8);
    const light = scene(ctx, s, env, { boy: { headNod: L.lerp(14, -2, up), headYaw: L.lerp(0, 0.25, up), face: { eyes: up > 0.5 ? 'open' : 'down', mouth: up > 0.7 ? 'o' : 'closed', tears: 0.8, brows: up * 0.6 } } });
    // robot and shiba enter from the camera side and stop
    const inR = L.seg(dt, 0, 2.2, L.ease.out); const rp = L.at(cam, L.lerp(0.62, 0.52, inR), L.lerp(-1.2, 0.25, inR));
    const lookBike = L.seg(dt, 3.0, 3.5) * (1 - L.seg(dt, 4.6, 5.1)); const lookBoy = L.seg(dt, 4.8, 5.3);
    const pose = { yaw: Math.PI - 0.35 + 0.35 * lookBike - 0.45 * lookBoy, headYaw: 0.4 * lookBike - 0.5 * lookBoy, t: dt, wheel: -inR * 12, battery: 1, batteryBlink: true, bob: inR < 1 ? 1.3 * Math.abs(Math.sin(dt * 12)) : 0, wet: 0.4, antenna: inR < 1 ? -0.1 : 0.15, armR: [0.3, 0.8, 0.4], screen: { mode: 'eyes' } };
    const sp = L.at(cam, L.lerp(-0.4, -0.42, inR), L.lerp(-1.3, 0.05, inR));
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, pose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, contact: { rx: 120, ry: 20, alpha: 0.5 }, emissive: (c, st) => R.drawEmissive(c, pose, st) }); L.screenGlow(ctx, ra, rp.scale, '#9fe8ff', 0.25);
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, inR < 1 ? { gait: 'walk', phase: dt * 1.6, stride: 0.6, t: dt, wet: 0.5 } : { t: dt, wet: 0.5, headYaw: 0.3 + 0.4 * lookBoy, ears: 'perk', tail: 1, mouth: 'closed', sit: L.seg(dt, 5.5, 6.2) }, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: true }, { light: Object.assign({}, light, { rimDir: [-2, -2] }) });
    bulbLight(ctx, s, W, H, t);
    // drips from the pipe
    const dp = cam.p(0.9, 5.5 - ((dt * 3) % 1) * 5.5, 4); if (dp) C.celEllipse(ctx, dp[0], dp[1], 2, 4, '#c8d0f0', 0.8);
  },
};
