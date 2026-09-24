'use strict';
// Shared staging for the homecoming shots (S23, S24, S26): camera beside her house looking down the lane at night.
const L = require('./lib'); const { C } = L; const P = require('../props');
const CAM = { x: -0.9, y: 0.95, z: 9.5, yaw: 2.94, pitch: 0.05 };
const LANTERNS = [[1.95, 2.3, 2.2], [-1.95, 2.3, -1.5], [1.95, 2.3, -6], [-1.95, 2.3, -11], [1.95, 2.3, -17], [-1.95, 2.3, -24]];
function lanterns(ctx, cam, t, a = 1, v = null) { LANTERNS.forEach(([x, y, z], i) => { const p = cam.p(x, y, z); if (!p) return; let q = [p[0], p[1]], k = 0.24 * cam.f / p[2]; if (v) { q = v.pt(q); k *= v.z; } P.lantern(ctx, q[0], q[1], k, a, t, i, { text: i % 2 ? '祭' : '森田' }); }); }
// her doorstep lantern pool + door spill (screen space)
function doorGlow(ctx, cam, a = 1) { const p = cam.p(2.0, 0.4, 4.6); if (p) L.glowAt(ctx, p[0], p[1], 420, '#ffc878', 0.35 * a); }
const LIGHT = { ambient: '#4a4f88', ambientAmt: 0.42, rim: '#ffcf80', rimDir: [2, -2.5], rimAlpha: 0.85 };
module.exports = { CAM, lanterns, doorGlow, LIGHT };
