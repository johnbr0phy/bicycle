'use strict';
// Per-time-of-day finishing: grade, diffusion glow, paper, grain, vignette. Locked per chapter so colour cannot drift.
const C = require('./core'); const FX = require('./fx');
const LOOKS = {
  dawn: { grade: { contrast: 0.22, sat: 1.32, shadow: '#40387a', shadowAmt: 0.2, high: '#ffd9a8', highAmt: 0.18 }, glow: { threshold: 0.7, radius: 30, strength: 0.4 }, paper: 0.2, vignette: 0.16, grain: 0.035 },
  morning: { grade: { contrast: 0.18, sat: 1.22, shadow: '#3f4a7a', shadowAmt: 0.14, high: '#fff0c8', highAmt: 0.14 }, glow: { threshold: 0.74, radius: 26, strength: 0.32 }, paper: 0.2, vignette: 0.12, grain: 0.03 },
  noon: { grade: { contrast: 0.16, sat: 1.16, shadow: '#44507a', shadowAmt: 0.1, high: '#fff6e0', highAmt: 0.1 }, glow: { threshold: 0.78, radius: 24, strength: 0.28 }, paper: 0.2, vignette: 0.1, grain: 0.03 },
  afternoon: { grade: { contrast: 0.2, sat: 1.28, shadow: '#4a3f78', shadowAmt: 0.16, high: '#ffd690', highAmt: 0.2 }, glow: { threshold: 0.7, radius: 30, strength: 0.4 }, paper: 0.2, vignette: 0.16, grain: 0.035 },
  dusk: { grade: { contrast: 0.22, sat: 1.3, shadow: '#3a2a5e', shadowAmt: 0.24, high: '#ffb880', highAmt: 0.2 }, glow: { threshold: 0.66, radius: 34, strength: 0.48 }, paper: 0.22, vignette: 0.22, grain: 0.04 },
  night: { grade: { contrast: 0.2, sat: 1.2, shadow: '#141a3a', shadowAmt: 0.24, high: '#ffd08a', highAmt: 0.14 }, glow: { threshold: 0.6, radius: 38, strength: 0.55 }, paper: 0.22, vignette: 0.3, grain: 0.045 },
  photo: { grade: { contrast: 0.08, sat: 0.82, shadow: '#5a4a50', shadowAmt: 0.12, high: '#ffe8c0', highAmt: 0.2, lift: 0.06 }, glow: { threshold: 0.8, radius: 20, strength: 0.2 }, paper: 0.25, vignette: 0.12, grain: 0.05 },
  paper: { grade: null, glow: null, paper: 0.3, vignette: 0.08, grain: 0.02 },
};
function finish(ctx, W, H, tod, frameIndex, over = {}) {
  const L = Object.assign({}, LOOKS[tod] || LOOKS.dawn, over);
  C.post(ctx, W, H, { paper: L.paper, vignette: L.vignette });
  if (L.grade) FX.grade(ctx, W, H, L.grade);
  if (L.glow) FX.glow(ctx, W, H, L.glow);
  if (L.grain) FX.grain(ctx, W, H, frameIndex + 1, L.grain);
}
module.exports = { LOOKS, finish };
