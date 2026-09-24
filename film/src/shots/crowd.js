'use strict';
// Crowds: generic adults walking along a corridor, deterministic from a seed.
const L = require('./lib'); const { C, Hm } = L;
const TOPS = ['#6a7a9a', '#9a5a4a', '#e8e0d0', '#4a5a4a', '#c9a060', '#3a3a4a', '#b87a8a', '#7a8a6a', '#d8d0c8', '#5a6a8a'];
const BOTS = ['#3a3a4a', '#4a4a5e', '#6a5a4a', '#2e2e3a', '#8a8070', '#5a4a58'];
const HAIR = ['#2e2628', '#4a3a30', '#8a8088', '#1e181a', '#6a5040'];
function make(seed, n, zRange, xRange, o = {}) { const R = new C.Rng(seed); const out = []; for (let i = 0; i < n; i++) { const dir = R.next() < 0.68 ? 1 : -1; const xx = dir < 0 ? (R.next() < 0.5 ? -1 : 1) * R.range(0.75, Math.max(...xRange.map(Math.abs))) : R.range(...xRange); out.push({ x: xx, z0: R.range(...zRange), dir, speed: R.range(0.8, 1.3) * (o.speed || 1), phase: R.next(), cfg: { top: R.pick(TOPS), topDark: '#3a3040', legs: R.pick(BOTS), skirt: R.pick(BOTS), hair: R.pick(HAIR), dress: R.next() < 0.3, shoe: R.pick(['#3a3032', '#6a5a4a', '#e8e4dc']) }, scale: R.range(0.92, 1.06), bag: R.next() < 0.5, bagColor: R.pick(['#f2efe6', '#e8d8b8', '#d8e0e8', '#c9a080']), greens: R.next() < 0.3 }); } return out; }
// draw all people for camera cam at time t; returns positions for depth sorting
function items(people, cam, t, W, H, light, o = {}) {
  const res = [];
  for (const p of people) { const z = p.z0 + p.dir * p.speed * t; if (o.wrap) {} const x = p.x; const pos = L.at(cam, x, z); if (!pos || z < (o.minZ || 2.1)) continue;
    const yaw = L.faceYaw(cam, 0, p.dir); const pose = { who: 'adult', cfg: p.cfg, yaw, walk: { phase: t * p.speed * 0.95 + p.phase, stride: 0.95 }, face: { eyes: 'open' }, arms: { L: [0.08 + 0.12 * Math.sin((t * p.speed * 0.95 + p.phase) * Math.PI * 2), 0.25], R: [0.08 - 0.12 * Math.sin((t * p.speed * 0.95 + p.phase) * Math.PI * 2), 0.25] }, prop: p.bag ? 'bag' : null, bagColor: p.bagColor, bagGreens: p.greens, t };
    res.push({ depth: z, draw: () => L.drawChar(ctx0(o), W, H, (c, st) => Hm.draw(c, pose, st), { x: pos.x, y: pos.y, scale: pos.scale * p.scale }, { light, contact: { rx: 110, ry: 20, alpha: 0.3 }, blur: z < 1.6 ? 3 : 0 }) }); }
  return res;
}
let _ctx = null; function ctx0() { return _ctx; } function bind(ctx) { _ctx = ctx; }
module.exports = { make, items, bind };
