'use strict';
// A side-on street: the camera looks straight at a row of facades and travels along the street.
// Painted as wide multiplane strips (facade plane, two ground bands, foreground) so a lateral dolly has true parallax.
const C = require('../engine/core'); const FX = require('../engine/fx'); const K = require('./kit'); const { Cam } = require('../engine/persp');
// Camera looks toward +x; screen right = -z. The camera travels along z.
function wideCam(o, W) { return new Cam({ x: 0, y: o.camY || 0.72, z: o.zc, yaw: Math.PI / 2, pitch: o.pitch || 0.1, f: o.f || 1250, W, H: 1080 }); }
function build(o) {
  const pal = o.pal; const depth = o.depth || 3.2; const f = o.f || 1250;
  const z0 = o.z0, z1 = o.z1; const zc = (z0 + z1) / 2; const span = z1 - z0; // metres of street to paint
  const layers = [];
  const paintBand = (dNear, dFar, drawFn, wc, blur = 0) => {
    const dMid = (dNear + dFar) / 2; const W = Math.round(1920 + span * f / dMid) + 200;
    const cam = wideCam(Object.assign({}, o, { zc }), W); const cv = FX.newCanvas(W, 1080); const ctx = cv.getContext('2d');
    drawFn(ctx, cam, W);
    let out = wc === false ? cv : FX.watercolor(cv, Object.assign({ seed: 31, tremor: 2.6, edge: 1.0, turb: 0.28, gran: 0.2 }, wc || {}));
    if (blur) out = FX.blurCanvas(out, blur, 1);
    layers.push({ canvas: out, depth: dMid, zc, W });
  };
  // 1. facade plane (+ sky strip above, channel and pots at its base)
  paintBand(depth - 0.4, depth, (ctx, cam, W) => {
    ctx.fillStyle = pal.skyLow || '#dfe4ea'; ctx.fillRect(0, 0, W, 1080);
    // ground at the facade base (asphalt with a stone channel)
    K.quad(ctx, cam, [[depth - 1.2, 0, z0 - 3], [depth, 0, z0 - 3], [depth, 0, z1 + 3], [depth - 1.2, 0, z1 + 3]], pal.asphalt);
    for (const spec of o.facades) K.machiya(ctx, cam, 1, depth, spec.z[0], spec.z[1], spec, pal);
    K.quad(ctx, cam, [[depth - 0.42, 0.003, z0 - 3], [depth - 0.05, 0.003, z0 - 3], [depth - 0.05, 0.003, z1 + 3], [depth - 0.42, 0.003, z1 + 3]], pal.channel);
    K.seg3(ctx, cam, [depth - 0.42, 0.004, z0 - 3], [depth - 0.42, 0.004, z1 + 3], pal.line, 1.4, { alpha: 0.7 });
    for (let z = z0 - 3; z < z1 + 3; z += 0.6) K.seg3(ctx, cam, [depth - 0.42, 0.004, z], [depth - 0.05, 0.004, z], pal.line, 1.0, { alpha: 0.5 });
    if (o.facadeExtra) o.facadeExtra(ctx, cam, W);
    for (const pr of o.pots || []) K.pots(ctx, cam, 1, depth - 0.1, pr[0], pr[1], pal, pr[2] || 7, 1.3);
  }, o.wc);
  // 2. ground bands (asphalt texture with a few painted cracks and a manhole cover)
  const band = (dn, df, seed) => paintBand(dn, df, (ctx, cam, W) => {
    K.quad(ctx, cam, [[dn - 0.02, 0, z0 - 3], [df, 0, z0 - 3], [df, 0, z1 + 3], [dn - 0.02, 0, z1 + 3]], pal.asphalt);
    const R = new C.Rng(seed); for (let i = 0; i < span * 3; i++) { const z = R.range(z0 - 2, z1 + 2), x = R.range(dn, df); const p = cam.p(x, 0, z); if (p) C.celEllipse(ctx, p[0], p[1], R.range(10, 60), R.range(3, 10), R.next() > 0.5 ? pal.asphalt2 : pal.asphalt3, 0.5); }
    for (let i = 0; i < span / 3; i++) { const z = R.range(z0, z1), x = R.range(dn, df); const pts = []; for (let k = 0; k < 5; k++) pts.push([x + R.range(-0.1, 0.1), 0.002, z + k * 0.15]); K.poly3(ctx, cam, pts, pal.line, 1, { alpha: 0.35 }); }
    if (o.bandExtra) o.bandExtra(ctx, cam, W, dn, df);
  }, Object.assign({ seed: seed }, o.wc || {}));
  band(depth - 1.25, depth - 0.4, 71); band(depth - 2.2, depth - 1.25, 73);
  // 3. foreground passers (blurred bushes / a pole base) at ~0.9 m
  if (o.foreground !== false) paintBand(0.8, 1.0, (ctx, cam, W) => {
    const R = new C.Rng(91); for (let z = z0; z < z1; z += R.range(2.5, 4.5)) { const p = cam.p(0.9, 0, z); if (!p) continue; const k = cam.f / p[2];
      for (let j = 0; j < 14; j++) C.celEllipse(ctx, p[0] + R.range(-0.35, 0.35) * k, p[1] - R.range(0, 0.5) * k, R.range(0.08, 0.16) * k, R.range(0.05, 0.1) * k, R.next() > 0.5 ? pal.plantDark : pal.plant); }
  }, { tremor: 4, edge: 0.6 }, 9);
  const refCam = new Cam({ x: 0, y: o.camY || 0.72, z: zc, yaw: Math.PI / 2, pitch: o.pitch || 0.1, f, W: 1920, H: 1080 });
  return { layers, refCam, zc, f, depth };
}
// Draw the layers for a camera at street position cz (screen-right = -z, so a camera moving to smaller z pans right)
function draw(ctx, set, cz, which = null) {
  for (const L of set.layers) { if (which && !which(L)) continue; const dx = (cz - set.zc) * set.f / L.depth; ctx.drawImage(L.canvas, -(L.W - 1920) / 2 + dx, 0); }
}
function camAt(set, cz) { return new Cam({ x: 0, y: set.refCam.y, z: cz, yaw: Math.PI / 2, pitch: set.refCam.pitch, f: set.f, W: 1920, H: 1080 }); }
module.exports = { build, draw, camAt };
