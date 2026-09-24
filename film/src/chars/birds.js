'use strict';
// Background birds: grey heron in the shallows, black kite circling. Screen-space cel drawings.
const C = require('../engine/core');
function heron(ctx, x, y, s, t, o = {}) { // s = px per metre; y = waterline
  const ink = '#3a3038', body = '#a8aab4', dark = '#6a6c7a', beak = '#e0b04a'; const step = o.step || 0; const neck = o.neck == null ? 1 : o.neck;
  // legs
  C.ink(ctx, [[x - 0.05 * s, y - 0.5 * s], [x - 0.07 * s, y]], { width: Math.max(1, 0.02 * s), color: '#5a5048', taper: 0 }); C.ink(ctx, [[x + 0.04 * s, y - 0.5 * s], [x + 0.06 * s + step * 0.1 * s, y - step * 0.08 * s]], { width: Math.max(1, 0.02 * s), color: '#5a5048', taper: 0 });
  const bodyP = [[x - 0.32 * s, y - 0.62 * s], [x - 0.1 * s, y - 0.8 * s], [x + 0.18 * s, y - 0.78 * s], [x + 0.22 * s, y - 0.58 * s], [x - 0.05 * s, y - 0.5 * s]];
  C.cel(ctx, bodyP, body, { smooth: true }); C.cel(ctx, [[x - 0.3 * s, y - 0.64 * s], [x - 0.05 * s, y - 0.74 * s], [x + 0.1 * s, y - 0.62 * s], [x - 0.1 * s, y - 0.56 * s]], dark, { smooth: true, alpha: 0.6 });
  C.ink(ctx, C.smoothPts(bodyP, true), { width: Math.max(1, 0.015 * s), color: ink, taper: 0 });
  const nb = [x + 0.16 * s, y - 0.76 * s]; const nt = [x + 0.2 * s + 0.05 * s * (1 - neck), y - (0.8 + 0.42 * neck) * s];
  const neckP = C.bez(nb, [nb[0] + 0.12 * s, nb[1] - 0.12 * s], [nt[0] - 0.12 * s, nt[1] + 0.2 * s], nt, 10);
  C.ink(ctx, neckP, { width: Math.max(1.5, 0.05 * s), color: '#dfe0e6', taper: 'end' }); C.ink(ctx, neckP, { width: Math.max(0.8, 0.012 * s), color: ink, taper: 'end', alpha: 0.7 });
  C.celEllipse(ctx, nt[0], nt[1], 0.05 * s, 0.035 * s, '#e8e8ec'); C.ink(ctx, [[nt[0] - 0.02 * s, nt[1] - 0.02 * s], [nt[0] - 0.1 * s, nt[1] - 0.01 * s]], { width: Math.max(0.8, 0.012 * s), color: '#2a2a30', taper: 'end' });
  C.ink(ctx, [[nt[0] + 0.03 * s, nt[1]], [nt[0] + 0.17 * s, nt[1] + 0.02 * s]], { width: Math.max(1, 0.018 * s), color: beak, taper: 'end' });
  C.celCircle(ctx, nt[0] + 0.015 * s, nt[1] - 0.008 * s, Math.max(0.8, 0.008 * s), '#1a1a1a');
  // reflection
  ctx.save(); ctx.globalAlpha = 0.25; C.celEllipse(ctx, x, y + 0.15 * s, 0.25 * s, 0.06 * s, dark); ctx.restore();
}
function kite(ctx, x, y, s, t) { const flap = 0.15 * Math.sin(t * 2.2); ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#4a3a38'; ctx.beginPath(); ctx.moveTo(-s, -flap * s); ctx.quadraticCurveTo(-s * 0.4, -s * 0.25, 0, 0); ctx.quadraticCurveTo(s * 0.4, -s * 0.25, s, -flap * s); ctx.quadraticCurveTo(s * 0.4, s * 0.05, 0, s * 0.1); ctx.quadraticCurveTo(-s * 0.4, s * 0.05, -s, -flap * s); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.05); ctx.lineTo(0, s * 0.45); ctx.lineTo(s * 0.12, s * 0.05); ctx.fill(); ctx.restore(); }
module.exports = { heron, kite };
