'use strict';
// S15: The elder cat. On the first turtle stepping stone, the cream long-haired elder is dozing. The robot shows
// the glyph and holds up the hat. The cat looks at it, then looks up-river, then closes its eyes: asleep.
// The shiba shoves its nose into the hat, snorts, and springs off up the path.
const L = require('./lib'); const { C, R, S, K } = L; const Rv = require('../sets/river'); const { cached } = require('../engine/cache'); const P = require('../props');
module.exports = {
  smooth: false, look: 'afternoon',
  async setup() { const set = await (async () => { let st = null; const plate = await cached('river_stones_v2', () => (st = Rv.buildStones()).plate); return { plate, cam: Rv.makeCam({ y: 0.55, pitch: 0.0, yaw: -0.18, f: 1300 }) }; })(); return set; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    const light = { ambient: '#ffe8c8', ambientAmt: 0.22, rim: '#ffd890', rimDir: [-2.5, -1], rimAlpha: 0.9 };
    // elder cat loafing on the turtle
    const cp = L.at(cam, 0.25, 3.72, 0.16); const look = L.seg(dt, 1.4, 1.8); const upriver = L.seg(dt, 2.3, 3.0) * (1 - L.seg(dt, 3.6, 4.1)); const sleep = L.seg(dt, 3.6, 4.2);
    const cpose = { cat: 'elder', pose: 'loaf', headYaw: L.lerp(1.3, 0.25, upriver), headTilt: 0.08 * sleep, headDY: 6 * sleep, eyes: sleep > 0.5 || dt < 1.3 ? 'closed' : 'half', lookX: -0.5 * look, t: dt, breathe: sleep, tailAmp: 0.3 };
    L.drawChar(ctx, W, H, (c, st) => K.draw(c, cpose, st), { x: cp.x, y: cp.y, scale: cp.scale, flip: true }, { light, contact: { rx: 80, ry: 10, alpha: 0.3 } });
    // sleep bubble: a small soft circle that swells and shrinks from the nose
    if (sleep > 0.8) { const b = 0.5 + 0.5 * Math.sin((dt - 4.2) * 2.4); const hx = cp.x - 55 * cp.scale * 1.2, hy = cp.y - 60 * cp.scale; ctx.save(); ctx.globalAlpha = 0.7; C.celCircle(ctx, hx, hy, 6 + 12 * b, '#e8f4ff'); C.inkCircle(ctx, hx, hy, 6 + 12 * b, { width: 1.5, color: '#6a7a8a' }); C.celCircle(ctx, hx - 3 - 3 * b, hy - 3 - 3 * b, 2 + 2 * b, '#ffffff'); ctx.restore(); }
    // robot on the bank, facing the stones
    const rp = L.at(cam, -0.55, 2.35); const hold = L.seg(dt, 1.0, 1.4) * (1 - L.seg(dt, 4.2, 4.7)); const lower = L.seg(dt, 4.3, 4.8) * (1 - L.seg(dt, 5.6, 6.0));
    const rpose = { yaw: L.lerp(0.85, 0.35, lower), t: dt, battery: 2, headNod: 4 + 14 * lower, headTilt: -0.1 * L.seg(dt, 3.9, 4.3) * (1 - L.seg(dt, 4.5, 4.8)), screen: { mode: dt < 3.9 ? 'bike' : dt < 4.6 ? 'dots' : 'eyes', lookX: 0.4 - 0.9 * L.seg(dt, 5.6, 6.2) },
      armL: [0.2 + 1.3 * hold + 0.35 * lower, 0.5 + 0.9 * lower, 0.3], yaw2: 0 };
    if (dt > 5.8) rpose.yaw = L.lerp(0.85, -0.9, L.seg(dt, 5.8, 6.4));
    const ra = L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, emissive: (c, st) => R.drawEmissive(c, rpose, st) });
    const hk = rp.scale * 353;
    if (ra.gripL && dt < 5.9) P.schoolHat(ctx, ra.gripL[0] + 8, ra.gripL[1] - 4, 0.12 * hk, -0.15 + 0.25 * lower);
    // shiba: sits beside him, then sniffs the hat, snorts, and springs away left
    const go = L.seg(dt, 5.6, 7.0, L.ease.in); const come0 = L.seg(dt, 4.2, 4.7); const come = come0; const sp = L.at(cam, go > 0 ? L.lerp(0.12, -4.2, go) : L.lerp(-1.35, 0.12, come), go > 0 ? L.lerp(2.5, 3.2, go) : L.lerp(2.05, 2.5, come));
    const sniff = dt > 4.6 && dt < 5.3; const snort = dt > 5.3 && dt < 5.6;
    const spose = come > 0 && come < 1 && go === 0 ? { gait: 'trot', phase: dt * 2.4, stride: 0.6, t: dt, mouth: 'pant' } : go > 0 ? { gait: 'bound', phase: dt * 2.2, stride: 1.1, mouth: 'pant', t: dt }
      : { sit: sniff || snort ? 0 : 1, headYaw: sniff ? 0.1 : 0.8, headTilt: sniff ? -0.35 + 0.05 * Math.sin(dt * 30) : snort ? -0.5 : 0, headLift: snort ? 1 : 0, eyes: sniff ? 'closed' : 'open', mouth: snort ? 'bark' : 'pant', tail: 1, wag: 1, t: dt, crouch: sniff ? 0.3 : 0 };
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, spose, st), { x: sp.x, y: sp.y, scale: sp.scale, flip: go > 0 || come >= 1 }, { light });

  },
};
