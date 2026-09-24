'use strict';
// Shared shot helpers: camera view transforms, character placement with lighting and shadows.
const C = require('../engine/core'); const FX = require('../engine/fx'); const CP = require('../engine/comp');
const R = require('../chars/robot'); const S = require('../chars/shiba'); const K = require('../chars/cats'); const Hm = require('../chars/human'); const B = require('../chars/bicycle');
const UNITS = 353; // rig units per metre
// A 2D view (zoom about a focus point, plus shake). pt maps frame coords -> screen.
function view(W, H, z = 1, fx = W / 2, fy = H / 2, center = false) { const tx = center ? W / 2 : fx, ty = center ? H / 2 : fy; return { z, fx, fy, W, H, pt: ([x, y]) => [(x - fx) * z + tx, (y - fy) * z + ty], apply(ctx) { ctx.setTransform(z, 0, 0, z, tx - fx * z, ty - fy * z); } }; }
// Screen placement for a character standing at world (X,Z) under a perspective camera
function at(cam, X, Z, Y = 0) { const p = cam.p(X, Y, Z); if (!p) return null; return { x: p[0], y: p[1], k: cam.f / p[2], scale: (cam.f / p[2]) / UNITS }; }
// Draw a lit character. o: { st, light (placeLayer opts), shadow: { dir, len, alpha, blur }, contact: { rx, ry, alpha }, v (view) }
function drawChar(ctx, W, H, fn, place, o = {}) {
  const v = o.v; let pl = place; if (v) { const q = v.pt([place.x, place.y]); pl = Object.assign({}, place, { x: q[0], y: q[1], scale: place.scale * v.z }); }
  const L = CP.charLayer(W, H, fn, pl, o.st || {});
  if (o.shadow) CP.castShadow(ctx, L, pl.y, o.shadow.dir || [0.3, 1], o.shadow.len || 0.8, o.shadow.color || '#2a2240', o.shadow.alpha == null ? 0.3 : o.shadow.alpha, o.shadow.blur == null ? 4 : o.shadow.blur);
  if (o.contact !== false) { const c = o.contact || {}; CP.contactShadow(ctx, pl.x, pl.y, (c.rx || 120) * pl.scale, (c.ry || 22) * pl.scale, c.color || '#2a2240', c.alpha == null ? 0.45 : c.alpha); }
  CP.placeLayer(ctx, L, o.light || {});
  if (o.emissive) { const E = CP.charLayer(W, H, o.emissive, pl, o.st || {}); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.emissiveAlpha == null ? 0.85 : o.emissiveAlpha; ctx.drawImage(E, 0, 0); ctx.restore(); }
  return L.anchors;
}
// Robot screen glow (the face lights its surroundings a little at night)
function screenGlow(ctx, anchors, scale, color = '#9fe8ff', a = 0.35) { if (!anchors.screen) return; const [x, y] = anchors.screen; const r = 140 * scale; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, C.rgba(color, a)); g.addColorStop(1, C.rgba(color, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
function glowAt(ctx, x, y, r, color, a) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, C.rgba(color, a)); g.addColorStop(1, C.rgba(color, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); }
// Keyframed pose helper: keys = [[t, value], ...], returns eased value
const kf = C.kf, seg = C.seg, lerp = C.lerp, clamp = C.clamp, ease = C.ease;
// Blink helper: returns 0..1 eyelid for a blink starting at tb
function blink(t, times, d = 0.16) { for (const tb of times) { if (t >= tb && t < tb + d) { const u = (t - tb) / d; return u < 0.5 ? u * 2 : 2 - u * 2; } } return 0; }
module.exports = { view, at, drawChar, screenGlow, glowAt, kf, seg, lerp, clamp, ease, blink, R, S, K, Hm, B, C, FX, CP, UNITS };
// Convert a world facing direction (dx, dz) into the rig's screen yaw for a given camera (0 = facing camera, +PI/2 = screen right).
function faceYaw(cam, dx, dz) { const f = [Math.sin(cam.yaw), Math.cos(cam.yaw)], r = [Math.cos(cam.yaw), -Math.sin(cam.yaw)]; return Math.atan2(dx * r[0] + dz * r[1], -(dx * f[0] + dz * f[1])); }
function faceToward(cam, from, to) { return faceYaw(cam, to[0] - from[0], to[1] - from[1]); }
module.exports.faceYaw = faceYaw; module.exports.faceToward = faceToward;
// Build (or load) a lane plate for a camera
const Lane = require('../sets/lane'); const { cached } = require('../engine/cache');
async function lanePlate(key, tod, camOpts, o = {}) { const cam = Lane.makeCam(camOpts); let set = null; const get = () => (set = set || Lane.build(Object.assign({ tod, cam }, o))); const plate = await cached(key + '_plate', () => get().plate); const fg = o.fg === false ? null : await cached(key + '_fg', () => get().fg); return { cam, plate, fg }; }
module.exports.lanePlate = lanePlate;

// Readability cheat: keep a face turned at least partly toward camera (|yaw| <= max) while preserving direction.
function cheat(yaw, max = 0.95) { const s = Math.sign(Math.sin(yaw)) || 1; const back = Math.cos(yaw) < -0.35; if (back) return yaw; return s * Math.min(Math.abs(yaw), max); }
module.exports.cheat = cheat;

// A rider on the bicycle. place: screen placement for both; bikePose incl. view ('side'|'rear'|'front'), flip for side view.
// who: 'boy'|'girl'. Returns { bike, rider } anchors.
function riding(ctx, W, H, place, bikePose, riderPose, o = {}) {
  const view = bikePose.view || 'side'; const B2 = require('../chars/bicycle'); const Hm2 = require('../chars/human');
  const fn = view === 'side' ? (c, st) => B2.draw(c, bikePose, st) : (c, st) => B2.drawEnd(c, bikePose, st);
  // first pass: anchors only (cheap: draw into a scratch at tiny cost by reusing charLayer)
  const probe = CP.charLayer(8, 8, fn, Object.assign({}, place, { x: 0, y: 0 }), o.st || {}); const A = probe.anchors; const sc = place.scale * (o.v ? o.v.z : 1);
  const loc = (k, dy = 0) => A[k] ? [A[k][0] / place.scale, A[k][1] / place.scale + dy] : null;
  const rp = Object.assign({ who: 'boy', seat: loc('saddle', -14), feet: { L: loc(view === 'rear' ? 'pedalFar' : 'pedalNear', -4), R: loc(view === 'rear' ? 'pedalNear' : 'pedalFar', -4) }, hands: view === 'front' ? { L: loc('gripFar'), R: loc('grip') } : { L: loc('grip'), R: loc('gripFar') } }, riderPose);
  const order = view === 'front' ? ['rider', 'bike'] : view === 'rear' ? ['bike', 'rider'] : ['bike', 'rider'];
  const out = {};
  for (const w of order) {
    if (w === 'bike') out.bike = drawChar(ctx, W, H, fn, place, Object.assign({}, o, { contact: o.contact == null ? { rx: view === 'side' ? 300 : 60, ry: 22, alpha: 0.35 } : o.contact }));
    else out.rider = drawChar(ctx, W, H, (c, st) => Hm2.draw(c, rp, st), Object.assign({}, place, { flip: false }), Object.assign({}, o, { contact: false }));
  }
  return out;
}
module.exports.riding = riding;
