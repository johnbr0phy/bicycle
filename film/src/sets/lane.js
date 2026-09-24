'use strict';
// The lane in Higashiyama: the old woman's machiya on the right, the pagoda at the top of the hill.
// Used at dawn (S02, S04-S06, S27), night (S23, S24) and in sunlight for the photograph (S25).
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit');
const { Cam } = require('../engine/persp');

const PALS = {
  dawn: {
    skyTop: '#a3b1d6', skyMid: '#e6c6cc', skyLow: '#ffe2bd', sun: '#fff4d6', hills: ['#b7aed0', '#c9b9cf'], pagoda: '#7d7599', pagodaRim: '#ffe0b0',
    wood: '#8a7074', woodDark: '#5f4d58', lattice: '#6d5961', plaster: '#d3c9d6', interior: '#4a3f52', interiorDeep: '#382f40', doorPaper: '#e6d9d6',
    tile: '#7d7e9c', tileLine: '#666783', tileDark: '#51506a', soffit: '#4e4258', stone: '#bdb5c8', stone2: '#b1a8bf', stone3: '#c8c0d2', joint: '#958ca8', plinth: '#a49bb0',
    line: '#54445a', bamboo: '#ab957e', pole: '#8e869a', poleDark: '#5e566a', wire: '#5b5064', dirt: '#6a5a6e',
    plant: '#6c8878', plantDark: '#4f675d', plantLight: '#8fa892', pots: ['#9a7a70', '#8088a0', '#a8927c', '#8e8494'], maple: '#c88a66', flower: '#d9a09a',
    accent1: '#d49e7a', accent2: '#c9b37a', accent3: '#9fad7e', light: '#ffdcae', haze: '#f0d6d0', shutter: '#aea9ba', noren: '#3f5186', vend: '#7a5d55',
  },
  dusk: {
    skyTop: '#5e5b92', skyMid: '#c98a9a', skyLow: '#ffb27a', sun: '#ffcf8a', hills: ['#6a5f8a', '#7f6f94'], pagoda: '#4a4068', pagodaRim: '#ffb070',
    wood: '#6a4e56', woodDark: '#45343f', lattice: '#553f49', plaster: '#b89aa6', interior: '#3a2c38', interiorDeep: '#2a2029', doorPaper: '#f2c486',
    tile: '#5a5578', tileLine: '#4a4666', tileDark: '#3a3654', soffit: '#352a38', stone: '#9a8aa2', stone2: '#8f7f98', stone3: '#a898ae', joint: '#766884', plinth: '#857790',
    line: '#3f3040', bamboo: '#8a735f', pole: '#6e6480', poleDark: '#463e56', wire: '#3a3044', dirt: '#4a3a4e',
    plant: '#566a5e', plantDark: '#3e4f48', plantLight: '#728676', pots: ['#8a6058', '#5d6a8a', '#9a7a62', '#6e6278'], maple: '#c46a48', flower: '#d8807a',
    accent1: '#c08a6a', accent2: '#b89a6a', accent3: '#8a9a6e', light: '#ffc488', haze: '#d8a0a0', shutter: '#8a8298', noren: '#33406e', vend: '#6a4a44',
  },
  night: {
    skyTop: '#161a33', skyMid: '#242a4d', skyLow: '#3b3f69', sun: '#9fa7d8', hills: ['#23264a', '#2c2f55'], pagoda: '#1f2140', pagodaRim: null,
    wood: '#3b3044', woodDark: '#261f30', lattice: '#2f2639', plaster: '#565673', interior: '#1d1826', interiorDeep: '#15111c', doorPaper: '#f3c27a',
    tile: '#35364f', tileLine: '#2a2a40', tileDark: '#1f1f33', soffit: '#1a1522', stone: '#4a4c68', stone2: '#43455f', stone3: '#525471', joint: '#34354d', plinth: '#3f3f58',
    line: '#1e1a2a', bamboo: '#4f4656', pole: '#3a3950', poleDark: '#23222f', wire: '#1b1a26',
    plant: '#2e3d3f', plantDark: '#223033', plantLight: '#3c4f4f', pots: ['#4b3d44', '#3a4259', '#56495a', '#443d4d'], maple: '#6a4a4a', flower: '#7a5a66',
    accent1: '#7a5a50', accent2: '#6a6050', accent3: '#56604e', light: '#ffc978', haze: '#2d325a', shutter: '#4b4a5e', noren: '#26305a', vend: '#4a3834',
  },
  day: { // the photograph, thirty years ago: summer afternoon, slightly faded
    skyTop: '#8fb6d9', skyMid: '#c9dde6', skyLow: '#efe8d2', sun: '#ffffff', hills: ['#9fb3b8', '#b5c3bf'], pagoda: '#7a6f76', pagodaRim: null,
    wood: '#8a6a50', woodDark: '#5d4535', lattice: '#704f3b', plaster: '#e9dcc4', interior: '#4a3a34', interiorDeep: '#3a2c28', doorPaper: '#efe4cf',
    tile: '#6f727e', tileLine: '#5b5e6a', tileDark: '#474953', soffit: '#4a3a34', stone: '#cbbfaa', stone2: '#bfb39f', stone3: '#d6cbb7', joint: '#a39580', plinth: '#b0a28c',
    line: '#5a4638', bamboo: '#b89a66', pole: '#9a8e82', poleDark: '#6a5e54', wire: '#5a4a44',
    plant: '#6f9a5c', plantDark: '#4f7446', plantLight: '#9ab872', pots: ['#b0745a', '#6d86a8', '#c09a6a', '#8a7a8a'], maple: '#7fa45a', flower: '#e07a70',
    accent1: '#d49a6a', accent2: '#cdb46a', accent3: '#9cad6e', light: '#fff4d8', haze: '#eef0e6', shutter: '#b0aeb0', noren: '#3b5a8f', vend: '#7a5a46',
  },
};

function makeCam(o = {}) { return new Cam(Object.assign({ x: -0.55, y: 0.95, z: 0, yaw: 0.075, pitch: 0.035, f: 1250, W: 1920, H: 1080 }, o)); }

function sky(ctx, W, H, pal, cam, tod) {
  const hy = cam.horizonY();
  const g = ctx.createLinearGradient(0, 0, 0, hy + 40); g.addColorStop(0, pal.skyTop); g.addColorStop(0.55, pal.skyMid); g.addColorStop(1, pal.skyLow);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sp = cam.p(1.2, 30, 150);
  if ((tod === 'dawn' || tod === 'dusk') && sp) { const r = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 700); r.addColorStop(0, C.rgba(pal.sun, 0.95)); r.addColorStop(0.15, C.rgba(pal.sun, 0.55)); r.addColorStop(1, C.rgba(pal.sun, 0)); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H); }
  // soft clouds: horizontal washes
  const R = new C.Rng(tod === 'night' ? 91 : 17);
  for (let i = 0; i < 9; i++) {
    const cx = R.range(-100, W + 100), cy = R.range(40, hy - 160), w = R.range(220, 620), h = R.range(18, 46);
    const pts = []; for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; pts.push([cx + Math.cos(a) * w * (0.8 + 0.2 * Math.sin(a * 3 + i)), cy + Math.sin(a) * h * (a > Math.PI ? 1.2 : 0.6)]); }
    const col = tod === 'dusk' ? (cy < hy * 0.45 ? '#7a6a9a' : '#f4a888') : tod === 'dawn' ? (cy < hy * 0.45 ? '#b7a7c9' : '#f6cdb4') : tod === 'night' ? '#2c3158' : '#f4f6f4';
    C.wash(ctx, pts, col, { alpha: 0.55, bleed: 10, seed: 40 + i, smooth: true, edge: 0.12 });
    if (tod === 'dawn' || tod === 'dusk') C.wash(ctx, pts.map(([x, y]) => [x, y + h * 0.35]), '#ffe0bf', { alpha: 0.35, bleed: 6, seed: 60 + i, smooth: true, edge: 0 });
  }
  if (tod === 'night') { // stars and a thin moon
    for (let i = 0; i < 90; i++) { const x = R.range(0, W), y = R.range(0, hy - 120); C.celCircle(ctx, x, y, R.range(0.6, 1.6), '#dfe3ff', R.range(0.3, 0.8)); }
    C.celCircle(ctx, W * 0.2, 150, 34, '#f4ecd0', 0.95); C.celCircle(ctx, W * 0.2 + 13, 142, 31, pal.skyTop, 1);
  }
}

// Facade specs along both sides (z ranges). Deterministic.
const RIGHT = [
  { z: [-34, -20], bays: [[-33.8, -20.2, 'lattice']], upper: [[-33, -21, 'window']], posts: [-34, -27, -20], seed: 41 },
  { z: [-20, -9], bays: [[-19.8, -14, 'shutter'], [-13.8, -9.2, 'lattice']], upper: [[-19, -10, 'mushiko']], posts: [-20, -14, -9], seed: 43, inuyarai: [-13.6, -9.4] },
  { z: [-9, 0.6], bays: [[-8.8, -4, 'lattice'], [-3.8, 0.4, 'dark']], upper: [[-8, 0, 'sudare']], posts: [-9, -3.9, 0.6], seed: 45 },
  { z: [0.6, 9.8], bays: [[0.8, 3.6, 'lattice'], [3.85, 5.25, 'door'], [5.4, 9.6, 'lattice']], upper: [[1.2, 4.4, 'mushiko'], [6.2, 9.2, 'mushiko']], posts: [0.6, 3.7, 5.35, 9.8], seed: 3, home: true },
  { z: [9.8, 15.2], bays: [[10.0, 12.2, 'lattice'], [12.4, 15.0, 'dark']], upper: [[10.2, 14.8, 'sudare']], posts: [9.8, 12.3, 15.2], seed: 5, shop: true },
  { z: [15.2, 21.6], bays: [[15.4, 21.4, 'lattice']], upper: [[16, 21, 'window']], posts: [15.2, 21.6], seed: 7, inuyarai: [15.5, 21.2] },
  { z: [21.6, 28.4], bays: [[23.3, 28.2, 'lattice']], upper: [[22.2, 27.8, 'mushiko']], posts: [21.6, 23.1, 28.4], seed: 9 },
  { z: [28.4, 38.5], bays: [[28.6, 33.2, 'shutter'], [33.4, 38.3, 'lattice']], upper: [[29, 38, 'window']], posts: [28.4, 33.3, 38.5], seed: 11 },
  { z: [38.5, 52], bays: [[38.7, 51.8, 'lattice']], upper: [[39, 51, 'sudare']], posts: [38.5, 45, 52], seed: 13, inuyarai: [39, 44.5] },
  { z: [52, 68], bays: [[52.2, 67.8, 'lattice']], upper: [[53, 67, 'mushiko']], posts: [52, 60, 68], seed: 15 },
  { z: [68, 90], bays: [[68.2, 89.8, 'dark']], upper: [[69, 89, 'window']], posts: [68, 79, 90], seed: 17 },
];
const LEFT = [
  { z: [-34, -20], bays: [[-33.8, -20.2, 'lattice']], upper: [[-33, -21, 'mushiko']], posts: [-34, -27, -20], seed: 51 },
  { z: [-20, -8], bays: [[-19.8, -13, 'lattice'], [-12.8, -8.2, 'shop']], upper: [[-19, -9, 'window']], posts: [-20, -12.9, -8], seed: 53 },
  { z: [-8, -1], bays: [[-7.8, -1.2, 'lattice']], upper: [[-7, -2, 'window']], posts: [-8, -4.5, -1], seed: 55, inuyarai: [-7.5, -1.5] },
  { z: [-1, 6.6], bays: [[-0.8, 6.4, 'lattice']], upper: [[0, 6, 'mushiko']], posts: [-1, 2.8, 6.6], seed: 21, inuyarai: [-0.6, 6.2] },
  { z: [6.6, 12.4], bays: [[6.8, 9.0, 'dark'], [9.2, 12.2, 'lattice']], upper: [[7, 12, 'window']], posts: [6.6, 9.1, 12.4], seed: 23, noren: [6.85, 8.95], sign: 11.6 },
  { z: [12.4, 19.5], bays: [[12.6, 19.3, 'plaster']], upper: [], posts: [12.4, 19.5], seed: 25, twoStory: false, roof: 3.6 },
  { z: [19.5, 27.5], bays: [[19.7, 23, 'shop'], [23.2, 27.3, 'lattice']], upper: [[20, 27, 'mushiko']], posts: [19.5, 23.1, 27.5], seed: 27, lantern: 21 },
  { z: [27.5, 37], bays: [[27.7, 36.8, 'lattice']], upper: [[28, 36, 'window']], posts: [27.5, 32, 37], seed: 29, inuyarai: [28, 36.5] },
  { z: [37, 50], bays: [[37.2, 49.8, 'lattice']], upper: [[38, 49, 'sudare']], posts: [37, 43, 50], seed: 31 },
  { z: [50, 68], bays: [[50.2, 67.8, 'shop']], upper: [[51, 67, 'mushiko']], posts: [50, 59, 68], seed: 33 },
  { z: [68, 90], bays: [[68.2, 89.8, 'lattice']], upper: [[69, 89, 'window']], posts: [68, 79, 90], seed: 35 },
];
const HW = 2.25;
const POLES = [[1.72, -24], [-1.72, -12], [-1.72, 10.6], [1.72, 23.0], [-1.72, 35.0], [1.72, 49.0], [-1.72, 62.0], [1.72, 78]];

function build(o = {}) {
  const tod = o.tod || 'dawn'; const pal = Object.assign({}, PALS[tod], o.pal || {}); const cam = o.cam || makeCam(o.camOpts || {});
  const W = cam.W, H = cam.H; const hw = HW;
  const plate = FX.newCanvas(W, H), ctx = plate.getContext('2d');
  sky(ctx, W, H, pal, cam, tod);
  const hy = cam.horizonY();
  K.hills(ctx, W, hy + 10, [{ h: 150, scale: 420, color: pal.hills[0] }, { h: 90, scale: 260, color: pal.hills[1] }], 5);
  K.pagoda(ctx, cam, 1.2, 150, 44, pal.pagoda, null, pal.pagodaRim);
  // haze over the far distance
  const hazeRect = (a) => { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = pal.haze; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  // end-of-lane buildings (perpendicular) at both ends
  const endWall = (endZ, dir) => { K.quad(ctx, cam, [[-6, 0, endZ], [6, 0, endZ], [6, 6.8, endZ], [-6, 6.8, endZ]], pal.plaster); K.quad(ctx, cam, [[-6, 0, endZ], [6, 0, endZ], [6, 2.9, endZ], [-6, 2.9, endZ]], pal.wood); K.quad(ctx, cam, [[-6.5, 6.8, endZ], [6.5, 6.8, endZ], [6, 8.4, endZ + 2 * dir], [-6, 8.4, endZ + 2 * dir]], pal.tile); };
  const camZ = cam.z; const fwd = Math.cos(cam.yaw) >= 0 ? 1 : -1;
  if (fwd > 0) endWall(90, 1); else endWall(-34, -1);
  hazeRect(0.16);
  // depth slabs ordered by distance from THIS camera, far to near
  const bounds = [-34, -20, -9, -2, 8, 18, 35, 60, 95];
  let slabs = []; for (let i = 0; i < bounds.length - 1; i++) { const za = bounds[i], zb = bounds[i + 1]; const d = camZ < za ? za - camZ : camZ > zb ? camZ - zb : 0; const ahead = (za + zb) / 2 - camZ; slabs.push({ za, zb, d, ahead }); }
  slabs = slabs.filter(sl => Math.sign(sl.ahead) === fwd || sl.d < 12).sort((a, b) => b.d - a.d);
  const hazeFor = (d) => d > 50 ? 0.14 : d > 25 ? 0.1 : d > 12 ? 0.06 : d > 5 ? 0.03 : 0;
  const signs = [], anim = { noren: [], lanterns: [], home: null, door: null, spot: null, vending: null };
  const homeOpen = o.homeDoor === 'open';
  for (const { za, zb, d } of slabs) {
    K.paving(ctx, cam, -hw, hw, za, zb, pal, 100 + za);
    K.quad(ctx, cam, [[hw - 0.45, 0.001, za], [hw - 0.2, 0.001, za], [hw - 0.2, 0.001, zb], [hw - 0.45, 0.001, zb]], C.mix(pal.stone, pal.woodDark, 0.45));
    K.seg3(ctx, cam, [hw - 0.45, 0, za], [hw - 0.45, 0, zb], pal.line, K.lwAt(Math.max(1, d + 3), 1.4), { alpha: 0.6 });
    const items = [];
    for (const side of [-1, 1]) for (const sp of (side < 0 ? LEFT : RIGHT)) if (sp.z[0] >= za && sp.z[0] < zb) items.push({ side, sp, dist: Math.abs((sp.z[0] + sp.z[1]) / 2 - camZ) + Math.abs(side * hw - cam.x) * 0.1 });
    items.sort((a, b) => b.dist - a.dist);
    for (const { side, sp: s0 } of items) {
      const spec = Object.assign({}, s0); if ((tod === 'dawn' || tod === 'dusk') && side < 0) { spec.lit = pal.light; spec.litA = 0.45; }
      if (tod === 'night' && (s0.home || s0.seed % 4 === 1)) { spec.doorGlow = '#f6c779'; spec.upperGlow = '#f2b86a'; }
      if (s0.home && homeOpen) spec.bays = spec.bays.map(bb => bb[2] === 'door' ? [bb[0], bb[1], 'dark'] : bb);
      K.machiya(ctx, cam, side, hw, s0.z[0], s0.z[1], spec, pal);
      if (s0.inuyarai) K.inuyarai(ctx, cam, side, hw, s0.inuyarai[0], s0.inuyarai[1], pal);
      if (s0.noren) anim.noren.push({ side, hw, z0: s0.noren[0], z1: s0.noren[1] });
      if (s0.shop) anim.noren.push({ side, hw, z0: 12.5, z1: 14.9 });
      if (s0.lantern) anim.lanterns.push({ side, hw, z: s0.lantern });
      if (s0.sign) signs.push({ side, z: s0.sign });
      if (s0.home) anim.home = s0;
      if (!s0.inuyarai && s0.seed % 3 !== 0) K.pots(ctx, cam, side, hw - 0.12, s0.z[0] + 0.3, Math.min(s0.z[0] + 2.2, s0.z[1]), pal, s0.seed * 13, 1);
      if (s0.home && homeOpen) {
        // the genkan seen through the open door: dim earthen floor, the step, shoji glow, the photograph on the pillar
        const dz0 = 3.85, dz1 = 5.25; const door = K.quad; const P = [cam.pc(hw, 0.2, dz0), cam.pc(hw, 0.2, dz1), cam.pc(hw, 2.2, dz1), cam.pc(hw, 2.2, dz0)].map(q => [q[0], q[1]]);
        ctx.save(); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (const q of P) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.clip();
        const inn = tod === 'night' ? { f: '#3a2e2a', w: '#5a4638', sh: '#f0c070', ph: '#b89a70' } : { f: '#3e3548', w: '#55506a', sh: '#a8a8c8', ph: '#a09080' };
        K.quad(ctx, cam, [[hw, 0, -4], [hw + 3.2, 0, -4], [hw + 3.2, 0, 7], [hw, 0, 7]], inn.f);
        K.quad(ctx, cam, [[hw + 3.2, 0, -5], [hw + 3.2, 0, 7], [hw + 3.2, 2.6, 7], [hw + 3.2, 2.6, -5]], inn.w);
        // raised floor along the far side with a glowing shoji behind it
        K.quad(ctx, cam, [[hw + 1.2, 0.36, -5], [hw + 3.2, 0.36, -5], [hw + 3.2, 0.36, 1.2], [hw + 1.2, 0.36, 1.2]], C.mix(inn.w, '#6a5550', 0.4));
        K.quad(ctx, cam, [[hw + 1.2, 0, -5], [hw + 1.2, 0, 1.2], [hw + 1.2, 0.36, 1.2], [hw + 1.2, 0.36, -5]], C.mix(inn.w, '#8a7060', 0.3));
        K.quad(ctx, cam, [[hw + 3.19, 0.36, -3.5], [hw + 3.19, 0.36, -0.2], [hw + 3.19, 2.0, -0.2], [hw + 3.19, 2.0, -3.5]], inn.sh);
        for (let i = 0; i < 17; i++) K.seg3(ctx, cam, [hw + 3.18, 0.36, -3.5 + i * 0.2], [hw + 3.18, 2.0, -3.5 + i * 0.2], '#3a2c30', 1.2);
        for (let k2 = 1; k2 < 6; k2++) K.seg3(ctx, cam, [hw + 3.18, 0.36 + k2 * 0.28, -3.5], [hw + 3.18, 0.36 + k2 * 0.28, -0.2], '#3a2c30', 1.0);
        // pillar with the framed photograph
        K.quad(ctx, cam, [[hw + 3.17, 0, 0.1], [hw + 3.17, 0, 0.3], [hw + 3.17, 2.6, 0.3], [hw + 3.17, 2.6, 0.1]], '#4a3a36');
        K.quad(ctx, cam, [[hw + 3.15, 1.18, 0.35], [hw + 3.15, 1.18, 0.65], [hw + 3.15, 1.52, 0.65], [hw + 3.15, 1.52, 0.35]], '#3a2a26');
        K.quad(ctx, cam, [[hw + 3.14, 1.21, 0.38], [hw + 3.14, 1.21, 0.62], [hw + 3.14, 1.49, 0.62], [hw + 3.14, 1.49, 0.38]], inn.ph);
        // her slippers on the stepping stone
        { const q = cam.p(hw + 1.0, 0, 0.6); if (q) { const k = cam.f / q[2]; C.celEllipse(ctx, q[0], q[1] - 0.04 * k, 0.26 * k, 0.07 * k, '#5a5460'); C.celEllipse(ctx, q[0] - 0.07 * k, q[1] - 0.08 * k, 0.07 * k, 0.02 * k, '#6a4a48'); C.celEllipse(ctx, q[0] + 0.07 * k, q[1] - 0.08 * k, 0.07 * k, 0.02 * k, '#6a4a48'); } }
        ctx.restore();
      }
      if (s0.home) {
        K.pots(ctx, cam, 1, hw - 0.1, 2.7, 3.75, pal, 777, 1.6);
        if (o.emptySpot !== false) {
          const z0 = 5.45, z1 = 7.15;
          const dust = [[hw - 0.72, 0.002, z0 - 0.15], [hw - 0.05, 0.002, z0 - 0.15], [hw - 0.05, 0.002, z1 + 0.15], [hw - 0.72, 0.002, z1 + 0.15]];
          K.quad(ctx, cam, dust, C.mix(pal.stone, '#6a5a50', 0.35), { alpha: 0.5 });
          K.quad(ctx, cam, [[hw - 0.62, 0.002, z0], [hw - 0.12, 0.002, z0], [hw - 0.12, 0.002, z1], [hw - 0.62, 0.002, z1]], C.mix(pal.stone3, '#ffffff', tod === 'night' ? 0.08 : 0.3), { alpha: 0.95 });
          const dp = cam.p(hw - 0.4, 0, 6.2); if (dp) { const k = cam.f / dp[2]; C.celEllipse(ctx, dp[0], dp[1], 0.035 * k, 0.01 * k, C.mix(pal.stone, '#2a2030', 0.5), 0.55); }
          const lf = cam.p(hw - 0.3, 0, 6.8); if (lf) { const k = cam.f / lf[2]; C.celEllipse(ctx, lf[0], lf[1], 0.05 * k, 0.018 * k, '#d0763f', 0.95, -0.3); C.ink(ctx, [[lf[0] - 0.04 * k, lf[1] + 0.01 * k], [lf[0] + 0.04 * k, lf[1] - 0.01 * k]], { width: Math.max(0.8, 0.004 * k), color: '#8a4a2a', taper: 0 }); }
          for (const zz of [5.8, 6.85]) { const pp = cam.p(hw - 0.38, 0, zz); if (pp) { const k = cam.f / pp[2]; C.celEllipse(ctx, pp[0], pp[1], 0.025 * k, 0.008 * k, '#8a5a44', 0.5); } }
        }
        anim.spot = [hw - 0.37, 0, 6.3]; anim.door = [hw, 0, 4.55];
      }
    }
    for (const [px, pz] of POLES) if (pz >= za && pz < zb) K.pole(ctx, cam, px, pz, pal);
    const hz = hazeFor(d); if (hz > 0) hazeRect(hz);
  }
  // wires: along poles and crossing
  const wtop = (px, pz, y) => [px, y, pz];
  for (let i = 0; i < POLES.length - 1; i++) {
    const [ax, az] = POLES[i], [bx, bz] = POLES[i + 1];
    for (const [y, sag, dx] of [[9.1, 0.5, -0.5], [9.1, 0.55, 0.5], [8.2, 0.7, 0.3]]) K.wire(ctx, cam, [ax + dx * Math.sign(-ax), y, az], [bx + dx * Math.sign(-bx), y, bz], sag, pal.wire, K.lwAt((az + bz) / 2, 1.1));
  }
  // service wires from poles to facades
  for (const [px, pz] of POLES.slice(0, 4)) { const s = Math.sign(px); K.wire(ctx, cam, [px, 7.6, pz], [s * hw, 5.8, pz + 3], 0.25, pal.wire, K.lwAt(pz, 0.9)); K.wire(ctx, cam, [px, 8.4, pz], [-s * hw, 6.0, pz + 1.5], 0.35, pal.wire, K.lwAt(pz, 0.9)); }
  // hanging sign boards
  for (const s of signs) { const p = cam.p(s.side * (2.0 - 0.35), 2.6, s.z); if (p) { const k = cam.f / p[2]; K.kanban(ctx, p[0] - 0.11 * k, p[1], 0.22 * k, 0.8 * k, tod === 'night' ? '#6a5a4a' : '#c9b48e', '#3a2c28', '甘味処'); } }
  // our house: a small wooden name plate by the door
  { const p = cam.p(2.0, 1.6, 3.65); if (p) { const k = cam.f / p[2]; K.kanban(ctx, p[0] - 0.08 * k, p[1], 0.11 * k, 0.33 * k, '#d8c9a4', '#3a2c28', '森田', 'Shippori'); } }

  // ---- wet night: reflections of lit doors and windows smeared down the stone, and a torii
  if (o.wet) {
    const Rf = FX.newCanvas(W, H), rx = Rf.getContext('2d');
    for (const [side, list] of [[1, RIGHT], [-1, LEFT]]) for (const sp of list) { if (!(sp.home || sp.seed % 4 === 1)) continue; for (let zz = sp.z[0] + 0.4; zz < sp.z[1] - 0.2; zz += 0.5) { const a = cam.p(side * (hw - 0.05), 0.001, zz), b = cam.p(side * (hw - 1.2), 0.001, zz - 0.4); if (!a || !b) continue; const k = cam.f / a[2]; rx.save(); rx.globalAlpha = 0.28; rx.strokeStyle = '#ffcf7a'; rx.lineWidth = Math.max(1, 0.05 * k); rx.lineCap = 'round'; rx.beginPath(); rx.moveTo(a[0], a[1]); rx.lineTo(b[0], b[1]); rx.stroke(); rx.restore(); } }
    for (let i = 0; i < 400; i++) { const R2 = new C.Rng(900 + i); const x = R2.range(-hw, hw), zz = R2.range(2, 50); const p = cam.p(x, 0.001, zz); if (!p) continue; const k = cam.f / p[2]; rx.save(); rx.globalAlpha = 0.25; rx.fillStyle = '#b8c0f0'; rx.beginPath(); rx.ellipse(p[0], p[1], R2.range(0.1, 0.4) * k, 0.01 * k + 0.5, 0, 0, Math.PI * 2); rx.fill(); rx.restore(); }
    const Rb = FX.blurCanvas(Rf, 5, 1); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(Rb, 0, 0); ctx.restore();
  }
  if (o.torii) { const tz = o.torii; const col = '#c8452e', dk = '#5a2018'; const pil = (x) => K.quad(ctx, cam, [[x - 0.1, 0, tz], [x + 0.1, 0, tz], [x + 0.09, 2.7, tz], [x - 0.09, 2.7, tz]], col, { line: dk, lw: K.lwAt(tz, 1.4) });
    pil(-1.3); pil(1.3); K.quad(ctx, cam, [[-1.55, 2.3, tz], [1.55, 2.3, tz], [1.55, 2.45, tz], [-1.55, 2.45, tz]], col, { line: dk, lw: K.lwAt(tz, 1.2) });
    K.quad(ctx, cam, [[-1.95, 2.72, tz], [1.95, 2.72, tz], [1.8, 2.95, tz], [-1.8, 2.95, tz]], '#2a2020', { line: dk, lw: K.lwAt(tz, 1.2) }); K.quad(ctx, cam, [[-1.85, 2.62, tz], [1.85, 2.62, tz], [1.85, 2.74, tz], [-1.85, 2.74, tz]], col);
    const pl = cam.p(0, 2.55, tz); if (pl) { const k = cam.f / pl[2]; C.cel(ctx, [[pl[0] - 0.12 * k, pl[1] - 0.18 * k], [pl[0] + 0.12 * k, pl[1] - 0.18 * k], [pl[0] + 0.12 * k, pl[1] + 0.18 * k], [pl[0] - 0.12 * k, pl[1] + 0.18 * k]], '#2a2020'); ctx.save(); ctx.fillStyle = '#e8c878'; ctx.font = `${Math.round(0.11 * k)}px Shippori`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('稲荷', pl[0], pl[1]); ctx.restore(); }
    // stone lanterns at the gate
    for (const x of [-1.75, 1.75]) { const b = cam.p(x, 0, tz - 0.4); if (!b) continue; const k = cam.f / b[2]; C.cel(ctx, [[b[0] - 0.12 * k, b[1]], [b[0] + 0.12 * k, b[1]], [b[0] + 0.08 * k, b[1] - 0.7 * k], [b[0] - 0.08 * k, b[1] - 0.7 * k]], '#6a6880'); C.cel(ctx, [[b[0] - 0.2 * k, b[1] - 0.7 * k], [b[0] + 0.2 * k, b[1] - 0.7 * k], [b[0] + 0.2 * k, b[1] - 0.95 * k], [b[0] - 0.2 * k, b[1] - 0.95 * k]], '#f2c070'); C.cel(ctx, [[b[0] - 0.3 * k, b[1] - 0.95 * k], [b[0] + 0.3 * k, b[1] - 0.95 * k], [b[0], b[1] - 1.2 * k]], '#5a5870'); }
  }
  // ---- light pass
  const L = FX.newCanvas(W, H), lx = L.getContext('2d');
  if (tod === 'dawn' || tod === 'dusk') {
    // sunlit strip down the middle of the lane, narrowing toward the camera, with pole shadows
    K.quad(lx, cam, [[-1.9, 0.003, 90], [1.9, 0.003, 90], [1.2, 0.003, 45], [-1.6, 0.003, 42]], pal.light, { alpha: 0.75 });
    for (let i = 0; i < 5; i++) { const x0 = -1.2 + i * 0.55; K.quad(lx, cam, [[x0 - 0.12, 0.003, 42], [x0 + 0.12, 0.003, 42], [x0 * 0.4 + 0.1, 0.003, 6], [x0 * 0.4 - 0.1, 0.003, 6]], pal.light, { alpha: 0.12 }); }
    // upper floors of the left side catch the low sun
    // roof edges on the right catch a rim of light
    for (const s of RIGHT) K.seg3(lx, cam, [hw - 0.75, 6.25, s.z[0]], [hw - 0.75, 6.25, s.z[1]], '#ffe7c0', K.lwAt(s.z[0], 2.2), { alpha: 0.8 });
    // god rays from the top of the lane
    const sp = cam.p(1.4, 8, 190); if (sp) { lx.save(); for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + (i - 3) * 0.13 + 0.05; const len = 1300; lx.globalAlpha = 0.07 + 0.04 * (i % 2); lx.fillStyle = pal.light; lx.beginPath(); lx.moveTo(sp[0], sp[1]); lx.lineTo(sp[0] + Math.cos(a - 0.035) * len, sp[1] + Math.sin(a - 0.035) * len); lx.lineTo(sp[0] + Math.cos(a + 0.035) * len, sp[1] + Math.sin(a + 0.035) * len); lx.fill(); } lx.restore(); }
    const Lb = FX.blurCanvas(L, 7, 1);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(Lb, 0, 0); ctx.restore();
    // pole shadows across the lit strip (long, toward the camera)
    for (const [px, pz] of POLES) { if (pz < 9) continue; K.quad(ctx, cam, [[px - 0.1, 0.004, pz], [px + 0.1, 0.004, pz], [px * 0.2 + 0.2, 0.004, pz - 12], [px * 0.2, 0.004, pz - 12]], pal.joint, { alpha: 0.35 }); }
  } else if (tod === 'night') {
    // warm pools of light spilling from lit doors and windows
    for (const s of RIGHT.concat(LEFT)) { if (!(s.home || s.seed % 4 === 1)) continue; const side = RIGHT.includes(s) ? 1 : -1; const zc = s.home ? 4.55 : (s.z[0] + s.z[1]) / 2; const p = cam.p(side * 1.2, 0, zc); if (!p) continue; const k = cam.f / p[2];
      const g = lx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 2.2 * k); g.addColorStop(0, C.rgba(pal.light, 0.32)); g.addColorStop(1, C.rgba(pal.light, 0)); lx.fillStyle = g; lx.beginPath(); lx.ellipse(p[0], p[1], 2.4 * k, 0.8 * k, 0, 0, Math.PI * 2); lx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(L, 0, 0); ctx.restore();
  } else if (tod === 'day') {
    // high summer sun from the left: the right side lit, crisp eave shadows
    for (const s of RIGHT) K.quad(lx, cam, [[2, 0, s.z[0]], [2, 0, s.z[1]], [2, 2.5, s.z[1]], [2, 2.5, s.z[0]]], '#fff3d0', { alpha: 0.25 });
    K.quad(lx, cam, [[-1.2, 0.003, 2], [1.9, 0.003, 2], [1.9, 0.003, 90], [-1.2, 0.003, 90]], '#fff6de', { alpha: 0.45 });
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(L, 0, 0); ctx.restore();
  }
  if (tod === 'dawn' || tod === 'dusk') {
    const vp = cam.p(0, 1.2, 80);
    if (vp) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(vp[0], vp[1], 0, vp[0], vp[1], 520); g.addColorStop(0, 'rgba(255,226,180,0.75)'); g.addColorStop(0.35, 'rgba(255,214,170,0.3)'); g.addColorStop(1, 'rgba(255,214,170,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g2 = ctx.createLinearGradient(0, H * 0.55, 0, H); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(120,112,160,0.55)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); ctx.restore(); } ctx.save(); ctx.globalCompositeOperation = 'multiply'; {
    const g3 = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.45, H * 1.1); g3.addColorStop(0, 'rgba(255,255,255,0)'); g3.addColorStop(1, 'rgba(110,100,150,0.6)'); ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  // ---- paint it
  const painted = o.raw ? plate : FX.watercolor(plate, { seed: 3, tremor: 2.0, edge: 0.85, turb: 0.2, gran: 0.14 });
  // foreground pots on the left, near camera, defocused
  let fg = null;
  if (o.fg !== false) {
    fg = FX.newCanvas(W, H); const fx = fg.getContext('2d');
    K.pots(fx, cam, -1, hw - 0.25, 1.25, 2.0, Object.assign({}, pal, { plant: C.mix(pal.plantDark, '#2a2436', 0.3), plantDark: C.mix(pal.plantDark, '#2a2436', 0.5), noPot: true }), 4242, 1.2, ['leaf'], 1.7);
    fg = FX.watercolor(fg, { seed: 9, tremor: 3, edge: 0.7, turb: 0.15, gran: 0.1 });
    if (o.fgBlur !== 0) fg = FX.blurCanvas(fg, o.fgBlur || 4, 1);
  }
  return { plate: painted, fg, cam, pal, anim, tod };
}

module.exports = { build, makeCam, PALS };
