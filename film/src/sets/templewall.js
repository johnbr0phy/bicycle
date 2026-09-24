'use strict';
// Temple wall (tsuijibei): ochre earthen wall with five white bands on a stone base, tiled cap. Beyond it a maple,
// a temple hall roof and a morning sky. The cats' wall. Wall face on the plane x = WX, running along z.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
const WX = 1.5, WH = 2.45, BASE = 0.55, CAP = 3.05;
const PAL = { sky1: '#8fb6dc', sky2: '#d8e8f0', cloud: '#f6f8f6', wall: '#dcb97e', wallShade: '#c49e66', band: '#f4f0e6', stone: '#a9a39a', stone2: '#958f88', stone3: '#bdb6aa', moss: '#7d9a5c', tile: '#6e7282', tileDark: '#4c4f5e', tileLine: '#5a5e6e', ground: '#c9bba4', ground2: '#b9ab94', leaf: '#6f9a58', leafDark: '#4f7442', leafLight: '#9dbd72', red: '#c9563c', trunk: '#5a4636', hall: '#5e6272', hallDark: '#44475a', gold: '#d9b24a', line: '#4a3c36', light: '#fff2d0' };
function makeCam(o = {}) { return new Cam(Object.assign({ x: -2.6, y: 0.6, z: 3.0, yaw: 0.72, pitch: 0.2, f: 1150, W: 1920, H: 1080 }, o)); }
function build(o = {}) {
  const cam = o.cam || makeCam(); const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d');
  // sky
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, PAL.sky1); g.addColorStop(0.7, PAL.sky2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const R = new C.Rng(8); for (let i = 0; i < 7; i++) { const cx = R.range(0, W), cy = R.range(40, H * 0.5), w = R.range(160, 420), h = R.range(30, 70); const pts = []; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; pts.push([cx + Math.cos(a) * w * (0.85 + 0.15 * Math.sin(a * 4 + i)), cy + Math.sin(a) * h * (a > Math.PI ? 1 : 0.5)]); } C.wash(ctx, pts, PAL.cloud, { alpha: 0.8, bleed: 8, seed: i, smooth: true, edge: 0.1 }); }
  // temple hall roof beyond the wall (big curved hip roof with ridge ornaments)
  const hall = (zc, xc, w, h, y0) => { const pts = []; const n = 24; for (let i = 0; i <= n; i++) { const u = i / n; const z = zc - w / 2 + w * u; const y = y0 + h * (1 - Math.pow(Math.abs(u - 0.5) * 2, 1.6)) - 0.4 * Math.pow(Math.abs(u - 0.5) * 2, 6); pts.push(cam.pc(xc, y, z)); } pts.push(cam.pc(xc, y0 - 2, zc + w / 2 + 1)); pts.push(cam.pc(xc, y0 - 2, zc - w / 2 - 1)); const P = pts.map(p => [p[0], p[1]]); C.wash(ctx, P, PAL.hall, { bleed: 4, seed: 3, edge: 0.3 });
    for (let i = 1; i < 20; i++) { const u = i / 20; const z = zc - w / 2 + w * u; const top = cam.pc(xc, y0 + h * (1 - Math.pow(Math.abs(u - 0.5) * 2, 1.6)), z), bot = cam.pc(xc, y0 - 1.5, z); C.ink(ctx, [[top[0], top[1]], [bot[0], bot[1]]], { width: 1.2, color: PAL.hallDark, taper: 0, alpha: 0.5 }); }
    const r0 = cam.pc(xc, y0 + h + 0.3, zc); C.ink(ctx, [cam.pc(xc, y0 + h + 0.25, zc - w * 0.3), cam.pc(xc, y0 + h + 0.3, zc + w * 0.3)].map(p => [p[0], p[1]]), { width: 5, color: PAL.hallDark, taper: 0 });
    for (const s of [-1, 1]) { const e = cam.pc(xc, y0 + h + 0.3, zc + s * w * 0.3); C.cel(ctx, [[e[0] - 8, e[1]], [e[0] + 8, e[1]], [e[0] + s * 4, e[1] - 30]], PAL.gold); } };
  hall(26, 14, 22, 5.5, 6.5);
  // the maple beyond the wall (big canopy), a few leaves already turning
  const tree = (x, z, r, seed) => { const b = cam.p(x, 0, z); if (!b) return; const k = cam.f / b[2]; const top = cam.p(x, 7.5, z); C.ink(ctx, [[b[0], cam.p(x, 3, z)[1]], [top[0], top[1] + r * k * 0.4]], { width: 0.35 * k, color: PAL.trunk, taper: 'end' });
    const Rr = new C.Rng(seed); const cl = []; for (let i = 0; i < 60; i++) { const a = Rr.range(0, Math.PI * 2), d = Math.sqrt(Rr.next()) * r; cl.push([top[0] + Math.cos(a) * d * k * 1.25, top[1] + Math.sin(a) * d * k * 0.75, Rr.range(0.45, 0.9) * k, Math.sin(a)]); }
    cl.sort((u, v) => u[3] - v[3]);
    for (const [cx, cy, sz, sa] of cl) { const col = sa < -0.3 ? PAL.leafLight : sa < 0.3 ? PAL.leaf : PAL.leafDark; for (let j = 0; j < 9; j++) { const ox = Rr.range(-0.6, 0.6) * sz, oy = Rr.range(-0.4, 0.4) * sz; const fruit = Rr.next() < 0.035; C.celEllipse(ctx, cx + ox, cy + oy, sz * (fruit ? 0.13 : Rr.range(0.25, 0.4)), sz * (fruit ? 0.12 : Rr.range(0.18, 0.28)), fruit ? '#e0823a' : j % 3 === 0 ? C.mix(col, '#ffffff', 0.12) : col, 1, Rr.range(-0.8, 0.8)); } } };
  tree(5, 9, 3.2, 11); tree(6, 17, 3.8, 12);
  // ground in front of the wall
  K.quad(ctx, cam, [[-3, 0, 0.3], [WX, 0, 0.3], [WX, 0, 40], [-3, 0, 40]], PAL.ground);
  const Rg = new C.Rng(4); for (let i = 0; i < 120; i++) { const x = Rg.range(-2, WX), z = Rg.range(0.5, 30); const p = cam.p(x, 0, z); if (p) { const k = cam.f / p[2]; C.celEllipse(ctx, p[0], p[1], Rg.range(0.05, 0.25) * k, Rg.range(0.02, 0.06) * k, Rg.next() > 0.5 ? PAL.ground2 : '#d6c9b2', 0.7); } }
  // gutter along the wall base
  K.quad(ctx, cam, [[WX - 0.35, 0.002, 0.3], [WX, 0.002, 0.3], [WX, 0.002, 40], [WX - 0.35, 0.002, 40]], '#9a948a');
  // stone base: irregular fitted stones
  K.quad(ctx, cam, [[WX, 0, 0.3], [WX, 0, 40], [WX, BASE, 40], [WX, BASE, 0.3]], PAL.stone);
  let z = 0.3; const Rs = new C.Rng(6); while (z < 40) { const w = Rs.range(0.35, 0.8); let y = 0; while (y < BASE - 0.05) { const h = Math.min(BASE - y, Rs.range(0.18, 0.32)); const col = Rs.pick([PAL.stone, PAL.stone2, PAL.stone3]); const q = [[WX, y + 0.02, z + 0.02], [WX, y + 0.02, z + w - 0.02], [WX, y + h - 0.02, z + w - 0.03], [WX, y + h - 0.02, z + 0.03]]; K.quad(ctx, cam, q, col, { line: PAL.line, lw: K.lwAt(z, 1.0) }); if (Rs.next() < 0.3) K.quad(ctx, cam, [[WX - 0.001, y + h * 0.5, z + 0.05], [WX - 0.001, y + h * 0.5, z + w * 0.6], [WX - 0.001, y + h - 0.02, z + w * 0.5], [WX - 0.001, y + h - 0.02, z + 0.08]], PAL.moss, { alpha: 0.8 }); y += h; } z += w; }
  // wall face with five white bands (the rank of the temple)
  K.quad(ctx, cam, [[WX, BASE, 0.3], [WX, BASE, 40], [WX, WH, 40], [WX, WH, 0.3]], PAL.wall);
  K.quad(ctx, cam, [[WX, BASE, 0.3], [WX, BASE, 40], [WX, BASE + 0.35, 40], [WX, BASE + 0.35, 0.3]], PAL.wallShade, { alpha: 0.5 });
  for (let i = 0; i < 5; i++) { const y = WH - 0.38 - i * 0.16; K.quad(ctx, cam, [[WX - 0.001, y, 0.3], [WX - 0.001, y, 40], [WX - 0.001, y + 0.06, 40], [WX - 0.001, y + 0.06, 0.3]], PAL.band); }
  // stains and cracks
  const Rw = new C.Rng(9); for (let i = 0; i < 26; i++) { const zz = Rw.range(0.5, 38), yy = Rw.range(BASE + 0.1, WH - 1.2); K.seg3(ctx, cam, [WX - 0.002, yy + Rw.range(0.2, 0.6), zz], [WX - 0.002, yy, zz + Rw.range(-0.05, 0.05)], PAL.wallShade, K.lwAt(zz, 2.5), { alpha: 0.35, taper: 'end' }); }
  // tiled cap: small roof over the wall top
  const capO = 0.42; const ridge = [[WX, CAP, 0.1], [WX, CAP, 40.2]]; const eaveN = [[WX - capO, WH + 0.05, 0.1], [WX - capO, WH + 0.05, 40.2]];
  K.quad(ctx, cam, [[WX - capO, WH + 0.05, 0.1], [WX - capO, WH + 0.05, 40.2], [WX - capO + 0.02, WH - 0.06, 40.2], [WX - capO + 0.02, WH - 0.06, 0.1]], '#3e3a44');
  K.quad(ctx, cam, [ridge[0], ridge[1], eaveN[1], eaveN[0]], PAL.tile);
  for (let zz = 0.1; zz < 40; zz += 0.24) K.seg3(ctx, cam, [WX, CAP, zz], [WX - capO, WH + 0.05, zz], PAL.tileLine, K.lwAt(zz, 1.1), { alpha: 0.9 });
  for (let zz = 0.1; zz < 40; zz += 0.24) { const p = cam.p(WX - capO, WH + 0.02, zz); if (p) C.celCircle(ctx, p[0], p[1], C.clamp(0.05 * cam.f / p[2], 0.5, 8), PAL.tileDark); }
  K.quad(ctx, cam, [[WX, CAP - 0.02, 0.1], [WX, CAP - 0.02, 40.2], [WX + 0.02, CAP + 0.12, 40.2], [WX + 0.02, CAP + 0.12, 0.1]], PAL.tileDark);
  // morning light: warm wash on the wall face, shadow under the cap
  K.quad(ctx, cam, [[WX - 0.003, WH - 0.35, 0.3], [WX - 0.003, WH - 0.35, 40], [WX - 0.003, WH, 40], [WX - 0.003, WH, 0.3]], '#6a5a60', { alpha: 0.28 });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.25; ctx.fillStyle = PAL.light; ctx.fillRect(0, 0, W, H); ctx.restore();
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 41, tremor: 2.8, edge: 1.0, turb: 0.3, gran: 0.2 });
  return { cam, plate, WX, CAP, WH };
}
module.exports = { build, makeCam, PAL, WX, CAP, WH };
