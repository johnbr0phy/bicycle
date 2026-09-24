'use strict';
// S14: Kamo river. Very wide, long hold. Afternoon gold, people evenly spaced on the far bank, a heron in the
// shallows, a black kite circling. The robot and the shiba are small figures on the near path. He slows.
const L = require('./lib'); const { C, R, S } = L; const Rv = require('../sets/river'); const { cached } = require('../engine/cache'); const Bd = require('../chars/birds');
const FX = require('../engine/fx');
function bankEdge(W, H) { const top = H * 0.84, pts = []; for (let i = 0; i <= 24; i++) { const x = W * i / 24; pts.push([x, top + 26 * Math.sin(i * 0.9 + 1.3) + 12 * Math.sin(i * 2.3) + (i > 12 ? (i - 12) * 5 : 0)]); } return pts; }
function bankLayer(W, H) {
  const pts = bankEdge(W, H); const c = C.keep(FX.newCanvas(W, H)); const x = c.getContext('2d');
  C.wash(x, [[0, H + 20], ...pts, [W, H + 20]], '#7f8c47', { bleed: 10, seed: 3 });
  C.wash(x, [[0, H + 20], ...pts.map(p => [p[0], p[1] + 60]), [W, H + 20]], '#66743a', { bleed: 12, seed: 4, alpha: 0.55 });
  const R0 = new C.Rng(77); for (let i = 0; i < 90; i++) { const px = R0.range(0, W), py = R0.range(H * 0.87, H); x.globalAlpha = 0.25; x.fillStyle = R0.next() < 0.5 ? '#4f5c2c' : '#a3ad62'; x.beginPath(); x.ellipse(px, py, R0.range(20, 60), R0.range(4, 10), 0, 0, Math.PI * 2); x.fill(); }
  x.globalAlpha = 1; C.ink(x, pts, { width: 2.4, color: '#3d4424', wobble: 0.6, seed: 5, taper: 0 });
  return FX.watercolor(c, { seed: 14 });
}
function fgBank(ctx, W, H, t, layer) {
  ctx.drawImage(layer, 0, 0); const pts = bankEdge(W, H); const R0 = new C.Rng(14);
  const edge = (x) => { const i = Math.max(0, Math.min(23, Math.floor(x / W * 24))), f = x / W * 24 - i; return pts[i][1] * (1 - f) + pts[i + 1][1] * f; };
  // tufts of grass rooted along the bank
  for (let k = 0; k < 34; k++) { const rx = R0.range(-20, W + 20), ry = edge(rx) + R0.range(10, 50), n = 6 + Math.floor(R0.range(0, 5)), hh = R0.range(60, 130), ph = R0.range(0, 6);
    for (let j = 0; j < n; j++) { const fan = (j / (n - 1) - 0.5) * 1.1 + R0.range(-0.1, 0.1), h = hh * R0.range(0.6, 1), sw = Math.sin(t * 1.4 + ph + j * 0.2) * 9;
      const tipx = rx + Math.sin(fan) * h * 0.6 + sw, tipy = ry - Math.cos(fan) * h;
      C.ink(ctx, [[rx + j * 2 - n, ry], [rx + Math.sin(fan) * h * 0.25 + sw * 0.3, ry - h * 0.55], [tipx, tipy]], { width: R0.range(3.2, 5.5), color: j % 3 === 0 ? '#4c5828' : j % 3 === 1 ? '#6f7d3a' : '#98a358', wobble: 0.3, seed: k * 13 + j, taper: 1 }); } }
  // susuki: tall stems with feathered cream plumes leaning with the wind
  for (let i = 0; i < 9; i++) { const x0 = W * (0.04 + i * 0.115) + R0.range(-40, 40), y0 = edge(x0) + R0.range(20, 45), h = R0.range(170, 240), sw = Math.sin(t * 1.1 + i * 0.9) * 14;
    const tip = [x0 + 30 + sw, y0 - h]; C.ink(ctx, [[x0, y0], [x0 + 10 + sw * 0.4, y0 - h * 0.55], tip], { width: 3.2, color: '#646838', wobble: 0.3, seed: 40 + i, taper: 1 });
    for (let k = 0; k < 9; k++) { const bx = tip[0] - 3 + k * 1.2, by = tip[1] + k * 5, l = 58 - k * 3.5, an = 0.15 + k * 0.13 + 0.004 * sw;
      C.ink(ctx, [[bx, by], [bx + l * 0.5 * Math.cos(an * 0.5), by + l * 0.5 * Math.sin(an * 0.5)], [bx + l * Math.cos(an) + sw * 0.2, by + l * Math.sin(an)]], { width: 4.2 - k * 0.25, color: k % 2 ? '#f3e6c4' : '#e3cf9c', wobble: 0.5, seed: 60 + i * 9 + k, taper: 1, alpha: 0.9 }); } }
}
module.exports = {
  smooth: false, look: 'afternoon',
  async setup() { const cam = Rv.makeCam({ z: -5.5, y: 2.3, pitch: -0.12 }); const plate = await cached('river_wide_v3', () => Rv.buildWide({ cam }).plate); const bank = await cached('river_bank_S14_v1', () => bankLayer(1920, 1080)); return { cam, plate, bank }; },
  frame(ctx, t, s, env) {
    const { W, H } = env; const dt = env.dt; const cam = s.cam; ctx.drawImage(s.plate, 0, 0);
    // heron
    const hp = cam.p(3.2, Rv.WY, 13); const hk = cam.f / hp[2]; const step = L.seg(dt, 5.2, 5.6) * (1 - L.seg(dt, 5.6, 6.0)); Bd.heron(ctx, hp[0] + 0.25 * hk * L.seg(dt, 5.2, 6.0), hp[1], hk, dt, { step, neck: 1 - 0.5 * L.seg(dt, 2.5, 3.2) * (1 - L.seg(dt, 3.8, 4.4)) });
    // kite
    const ka = dt * 0.35; Bd.kite(ctx, W * 0.62 + Math.cos(ka) * 260, 150 + Math.sin(ka) * 60, 26, dt);
    // the pair on the path, walking left to right; he slows toward the end
    const u = L.kf(dt, [[0, 0], [5.5, 0.72], [8, 0.82]], (x) => x); const rx = L.lerp(-5.8, 2.2, u), rz = 2.6; const rp = L.at(cam, rx, rz);
    const slow = L.seg(dt, 4.5, 7);
    const rpose = { yaw: 1.15, t: dt, wheel: -rx * 6, battery: 2, bob: (1 - slow) * 1.4 * Math.abs(Math.sin(dt * 12)), antenna: L.lerp(-0.15, 0.4, slow), headNod: 6 * slow, screen: { mode: slow > 0.6 ? 'tired' : 'eyes' } };
    const light = { ambient: '#ffe8c8', ambientAmt: 0.25, rim: '#ffd890', rimDir: [-2, -1], rimAlpha: 0.9 };
    L.drawChar(ctx, W, H, (c, st) => R.draw(c, rpose, st), { x: rp.x, y: rp.y, scale: rp.scale }, { light, shadow: { dir: [0.9, 0.3], len: 1.1, alpha: 0.3 } });
    const sx = rx + 1.1 + 0.2 * Math.sin(dt * 0.7); const sp = L.at(cam, sx, rz - 0.15);
    L.drawChar(ctx, W, H, (c, st) => S.draw(c, { gait: 'trot', phase: dt * 2.2, stride: 0.7, mouth: 'pant', t: dt, headYaw: 0.1 }, st), { x: sp.x, y: sp.y, scale: sp.scale }, { light, shadow: { dir: [0.9, 0.3], len: 0.9, alpha: 0.3 } });
    // near bank: a grassy lip with susuki plumes swaying in the river wind
    fgBank(ctx, W, H, t, s.bank);
  },
};
