'use strict';
// Multiplane plates: painted layers at known depths, moved with correct parallax for dollies and pans.
const FX = require('./fx'); const C = require('./core'); const { Cam } = require('./persp');

// Make a camera for painting a layer: same optics as the shot camera, but a larger canvas (margin) so moves never show edges.
function paintCam(cam, margin) { const m = margin || 0; return new Cam(Object.assign({}, cam, { W: Math.round(cam.W * (1 + 2 * m)), H: Math.round(cam.H * (1 + 2 * m)), ox: 0, oy: 0 })); }

class Plate {
  // layers: [{ canvas, depth (metres, Infinity for sky), alpha }], ordered far -> near
  constructor(cam, margin, layers = []) { this.cam = cam; this.margin = margin; this.layers = layers; }
  add(canvas, depth, o = {}) { this.layers.push(Object.assign({ canvas, depth }, o)); this.layers.sort((a, b) => b.depth - a.depth); return this; }
  // transform of a layer for a camera move: move = { tx, ty, tz (metres), pan, tilt (radians), zoom }
  layerXf(L, move = {}) {
    const cam = this.cam, W = cam.W, H = cam.H; const f = cam.f * (move.zoom || 1);
    const d = L.depth === Infinity ? 1e9 : L.depth; const dz = move.tz || 0; const dd = Math.max(0.2, d - dz);
    const s = (d / dd) * (move.zoom || 1);
    const sx = -(move.tx || 0) * f / dd + f * Math.tan(-(move.pan || 0));
    const sy = (move.ty || 0) * f / dd + f * Math.tan(move.tilt || 0);
    return { s, sx, sy, cx: W / 2 + (cam.ox || 0), cy: H / 2 + (cam.oy || 0) };
  }
  drawLayer(ctx, L, move) {
    const { s, sx, sy, cx, cy } = this.layerXf(L, move); const cv = L.canvas;
    ctx.save(); if (L.alpha != null) ctx.globalAlpha = L.alpha; if (L.op) ctx.globalCompositeOperation = L.op;
    const r = L.res || 1; ctx.translate(cx + sx, cy + sy); ctx.scale(s / r, s / r); ctx.drawImage(cv, -cv.width / 2 - (L.dx || 0) * r, -cv.height / 2 - (L.dy || 0) * r); ctx.restore();
  }
  // screen position of a world point under a camera move (for placing characters consistently with layers)
  project(X, Y, Z, move = {}) {
    const cam = this.cam; const c = new Cam(Object.assign({}, cam, { x: cam.x + (move.tx || 0), y: cam.y + (move.ty || 0), z: cam.z + (move.tz || 0), yaw: cam.yaw + (move.pan || 0), pitch: cam.pitch + (move.tilt || 0), f: cam.f * (move.zoom || 1) }));
    const p = c.p(X, Y, Z); if (!p) return null; return { x: p[0], y: p[1], k: c.f / p[2], depth: p[2] };
  }
}
module.exports = { Plate, paintCam };
