'use strict';
// Minimal perspective camera for laying out sets in real metres.
// World: X right, Y up, Z forward (away from camera). Camera at (cx, cy, cz) with yaw (radians, +turns right) and pitch.
class Cam {
  constructor(o = {}) { Object.assign(this, { x: 0, y: 1.0, z: 0, yaw: 0, pitch: 0, f: 1400, W: 1920, H: 1080, ox: 0, oy: 0 }, o); this.update(); }
  update() { this.cyw = Math.cos(this.yaw); this.syw = Math.sin(this.yaw); this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch); this.cx0 = this.W / 2 + this.ox; this.cy0 = this.H / 2 + this.oy; return this; }
  // world -> camera space
  toCam(X, Y, Z) { let x = X - this.x, y = Y - this.y, z = Z - this.z; const x1 = x * this.cyw - z * this.syw, z1 = x * this.syw + z * this.cyw; const y2 = y * this.cp - z1 * this.sp, z2 = y * this.sp + z1 * this.cp; return [x1, y2, z2]; }
  // world -> screen [sx, sy, depth]; returns null if behind camera
  p(X, Y, Z) { const [x, y, z] = this.toCam(X, Y, Z); if (z < 0.05) return null; return [this.cx0 + this.f * x / z, this.cy0 - this.f * y / z, z]; }
  // project with clamped depth (for polygons crossing near plane)
  pc(X, Y, Z) { const [x, y, z0] = this.toCam(X, Y, Z); const z = Math.max(z0, 0.05); return [this.cx0 + this.f * x / z, this.cy0 - this.f * y / z, z]; }
  // pixels per metre at a world point
  scaleAt(X, Y, Z) { const [, , z] = this.toCam(X, Y, Z); return this.f / Math.max(0.05, z); }
  horizonY() { return this.cy0 + this.f * Math.tan(this.pitch); }
}
// Clip a 3D polygon to the near plane (z>=near) in camera space, then project.
function projPoly(cam, pts3, near = 0.08) {
  const cp = pts3.map(([X, Y, Z]) => cam.toCam(X, Y, Z)); const out = [];
  for (let i = 0; i < cp.length; i++) {
    const a = cp[i], b = cp[(i + 1) % cp.length]; const ain = a[2] >= near, bin = b[2] >= near;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (near - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near]); }
  }
  return out.map(([x, y, z]) => [cam.cx0 + cam.f * x / z, cam.cy0 - cam.f * y / z]);
}
module.exports = { Cam, projPoly };
