'use strict';
// S25 — The photograph. Match cut to the framed photo in the genkan, in focus now: the same lane in summer sunlight,
// a younger her holding the saddle of the same green bicycle, a small girl on it, mid-wobble. Hold.
const L = require('./lib'); const { C, FX, Hm } = L; const HM = require('./home'); const { cached } = require('../engine/cache'); const Lane = require('../sets/lane'); const LK = require('../engine/look');
module.exports = {
  smooth: true, look: 'night', noFinish: true,
  async setup({ W, H }) {
    const photo = await cached('photo_v1', async () => {
      const cam = Lane.makeCam(HM.CAM); const set = Lane.build({ tod: 'day', cam, fg: false, homeDoor: 'closed' });
      const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.drawImage(set.plate, 0, 0);
      const light = { ambient: '#fff4e0', ambientAmt: 0.05, rim: '#fff8e8', rimDir: [-2, -2], rimAlpha: 0.6 };
      const bp = L.at(cam, 0.45, 2.9);
      const ride = L.riding(ctx, W, H, bp, { view: 'rear', crank: 0.9, lean: 0.07 }, { who: 'boy', yaw: Math.PI, cap: false, pigtails: true, cfg: { top: '#f4c6cc', shorts: '#c9483a', hair: '#2a2020', hairDark: '#1a1414' }, headTilt: -0.08, t: 0 }, { light });
      const hp = L.at(cam, 0.05, 3.5); const sad = ride.bike.saddle;
      L.drawChar(ctx, W, H, (c, st) => Hm.draw(c, { who: 'woman', cfg: { hair: '#2e2426', hairDark: '#1e1618', top: '#8aa6c8', topDark: '#6a86a8', skirt: '#e6d6b4', apron: '#e6d6b4', noGlasses: true, hunch: 0.02 }, yaw: Math.PI + 0.05, walk: { phase: 0.3, stride: 1, run: 1 }, bend: 0.35, hands: { L: [(sad[0] - hp.x) / hp.scale - 8, (sad[1] - hp.y) / hp.scale + 34], R: [(sad[0] - hp.x) / hp.scale + 26, (sad[1] - hp.y) / hp.scale + 44] }, t: 0 }, st), hp, { light });
      LK.finish(ctx, W, H, 'photo', 0);
      // print fading: warm cast, faded corners, slight chemical stain
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.0); g.addColorStop(0, 'rgba(255,250,240,1)'); g.addColorStop(1, 'rgba(210,180,140,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffe8c0'; ctx.fillRect(0, 0, W, H); ctx.restore();
      return cv;
    });
    return { photo };
  },
  frame(ctx, t, s, env) {
    const { W, H } = env; const u = L.ease.inOut(L.clamp(t / 6, 0, 1)); const z = L.lerp(1.0, 1.6, u); const fxc = L.lerp(W / 2, 990, u), fyc = L.lerp(H / 2, 600, u);
    // the frame on the genkan pillar: dark wood, a white mat, the print, glass reflection. Slow push in.
    ctx.fillStyle = '#2a2026'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fxc, -fyc);
    const fw = W * 0.86, fh = H * 0.86, fx = (W - fw) / 2, fy = (H - fh) / 2;
    C.cel(ctx, [[fx - 40, fy - 40], [fx + fw + 40, fy - 40], [fx + fw + 40, fy + fh + 40], [fx - 40, fy + fh + 40]], '#4a3228');
    C.ink(ctx, [[fx - 40, fy - 40], [fx + fw + 40, fy - 40], [fx + fw + 40, fy + fh + 40], [fx - 40, fy + fh + 40]], { closed: true, width: 4, color: '#1e1418', taper: 0 });
    C.cel(ctx, [[fx - 14, fy - 14], [fx + fw + 14, fy - 14], [fx + fw + 14, fy + fh + 14], [fx - 14, fy + fh + 14]], '#efe6d4');
    ctx.drawImage(s.photo, fx, fy, fw, fh);
    // the glass: a soft diagonal reflection of the lantern, dust
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.16; const g = ctx.createLinearGradient(fx, fy, fx + fw * 0.6, fy + fh); g.addColorStop(0, 'rgba(255,230,190,0)'); g.addColorStop(0.45, 'rgba(255,230,190,1)'); g.addColorStop(0.55, 'rgba(255,230,190,0)'); ctx.fillStyle = g; ctx.fillRect(fx, fy, fw, fh); ctx.restore();
    ctx.restore();
    // night ambience over the whole frame: the photo is seen by lantern light
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(255,236,210,1)'); vg.addColorStop(1, 'rgba(90,80,120,1)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
    C.post(ctx, W, H, { paper: 0.18, vignette: 0.1 }); L.FX.grain(ctx, W, H, env.drawIdx + 1, 0.04);
  },
};
