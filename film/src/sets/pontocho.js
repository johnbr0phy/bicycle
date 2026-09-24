'use strict';
// Pontocho: a very narrow alley of two-storey wooden fronts, paper lanterns with the plover crest, dusk sky overhead.
// Painted large (margin) for push-ins; lantern positions are returned in plate pixels so they can be lit per frame.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp'); const Lane = require('./lane');
const HW = 1.35;
function makeCam(o = {}) { return new Cam(Object.assign({ x: -0.1, y: 0.95, z: 0, yaw: 0.01, pitch: 0.06, f: 1150, W: 1920, H: 1080 }, o)); }
function plover(ctx, x, y, s, col) { // chidori crest: a round little bird in a circle
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(0.8, s * 0.08);
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.42, s * 0.26, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + s * 0.3, y - s * 0.12); ctx.lineTo(x + s * 0.55, y - s * 0.2); ctx.lineTo(x + s * 0.34, y - s * 0.02); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.2); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.6, x - s * 0.6, y - s * 0.35); ctx.stroke();
  ctx.restore();
}
function build(o = {}) {
  const tod = o.tod || 'dusk'; const pal = Object.assign({}, Lane.PALS[tod === 'night' ? 'night' : 'dusk']); const margin = o.margin == null ? 0.12 : o.margin;
  const cam0 = o.cam || makeCam(); const cam = new Cam(Object.assign({}, cam0, { W: Math.round(cam0.W * (1 + 2 * margin)), H: Math.round(cam0.H * (1 + 2 * margin)) }));
  const W = cam.W, H = cam.H; const cv = FX.newCanvas(W, H), ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.5); g.addColorStop(0, pal.skyTop); g.addColorStop(1, pal.skyLow); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const RIGHT = [], LEFT = []; let z = 0.4, i = 0; while (z < 70) { const w = 3.2 + (i % 3) * 1.1; RIGHT.push({ z: [z, z + w], bays: [[z + 0.2, z + w * 0.45, i % 2 ? 'lattice' : 'door'], [z + w * 0.5, z + w - 0.2, i % 3 === 1 ? 'dark' : 'lattice']], upper: [[z + 0.3, z + w - 0.3, i % 2 ? 'sudare' : 'window']], posts: [z, z + w * 0.47, z + w], seed: 200 + i, h1: 2.6, h2: 5.0, roof: 5.6, eave: 0.55, roofOut: 0.5, doorGlow: tod === 'night' ? '#f4c070' : '#e8c09a' }); z += w; i++; }
  z = 0.9; i = 0; while (z < 70) { const w = 2.8 + (i % 4) * 0.9; LEFT.push({ z: [z, z + w], bays: [[z + 0.2, z + w - 0.2, i % 2 ? 'door' : 'lattice']], upper: [[z + 0.3, z + w - 0.3, i % 3 ? 'window' : 'sudare']], posts: [z, z + w], seed: 300 + i, h1: 2.6, h2: 5.0, roof: 5.6, eave: 0.55, roofOut: 0.5, doorGlow: tod === 'night' ? '#f4c070' : '#e8c09a', upperGlow: i % 2 ? '#f2c890' : null }); z += w; i++; }
  // the far end: a glimpse of the river-side sky
  K.quad(ctx, cam, [[-HW, 0, 70], [HW, 0, 70], [HW, 6, 70], [-HW, 6, 70]], C.mix(pal.skyLow, '#ffd8b0', 0.3));
  K.paving(ctx, cam, -HW, HW, 0.5, 70, Object.assign({}, pal, { stone: '#8e8096', stone2: '#847690', stone3: '#9a8ca2', joint: '#6a5c76' }), 55);
  // drain channel in the middle (Pontocho has a central stone strip)
  K.quad(ctx, cam, [[-0.15, 0.002, 0.5], [0.15, 0.002, 0.5], [0.15, 0.002, 70], [-0.15, 0.002, 70]], '#7a6e86');
  const items = []; for (const s of RIGHT) items.push([1, s]); for (const s of LEFT) items.push([-1, s]); items.sort((a, b) => b[1].z[0] - a[1].z[0]);
  const lanterns = [];
  for (const [side, sp] of items) {
    K.machiya(ctx, cam, side, HW, sp.z[0], sp.z[1], sp, pal);
    // a lantern hanging at each doorway
    const lz = sp.z[0] + (sp.z[1] - sp.z[0]) * 0.3; const p = cam.p(side * (HW - 0.32), 2.2, lz); if (p) lanterns.push({ x: p[0], y: p[1], s: 0.26 * cam.f / p[2], z: lz, side });
    // small hanging signs
    const q = cam.p(side * (HW - 0.12), 1.95, sp.z[0] + (sp.z[1] - sp.z[0]) * 0.75); if (q && sp.seed % 2) { const k = cam.f / q[2]; K.kanban(ctx, q[0] - 0.08 * k, q[1], 0.16 * k, 0.5 * k, '#d8c8a8', '#3a2c28', ['先斗町', 'おばんざい', '酒処', '甘味'][sp.seed % 4]); }
  }
  // strip of sky between the eaves, with the first stars / thin clouds
  const plate = o.raw ? cv : FX.watercolor(cv, { seed: 81, tremor: 2.6, edge: 1.05, turb: 0.3, gran: 0.2 });
  return { cam, cam0, plate, lanterns: lanterns.sort((a, b) => b.z - a.z), margin, HW };
}
function drawLantern(ctx, L, lit, t, i) {
  const fl = lit > 0 ? 0.9 + 0.06 * Math.sin(t * 13 + i * 2.1) + 0.04 * Math.sin(t * 31 + i) : 0;
  K.chochin(ctx, L.x, L.y, L.s, lit > 0.05 ? C.mix('#e8dcc4', '#fff0c8', lit) : '#e0d4c0', '#2a2226', null, null);
  plover(ctx, L.x, L.y + L.s * 0.05, L.s * 0.5, lit > 0.05 ? '#b8392e' : '#8a3a36');
  if (lit > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = lit * fl; C.celEllipse(ctx, L.x, L.y, L.s * 0.46, L.s * 0.62, '#ffb860', 0.55); const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.s * 4); g.addColorStop(0, 'rgba(255,190,110,0.55)'); g.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = g; ctx.fillRect(L.x - L.s * 4, L.y - L.s * 4, L.s * 8, L.s * 8); ctx.restore(); }
}
module.exports = { build, makeCam, drawLantern, plover, HW };
