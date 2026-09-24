'use strict';
// Compositing: places cel characters into painted sets with shadows, rim light and ambient grading.
const C = require('./core'); const FX = require('./fx');

// Render a character draw function into its own full-frame layer.
// place: { x, y (screen ground point), scale, flip, rot }
function charLayer(W, H, drawFn, place, st) {
  const L = FX.newCanvas(W, H), ctx = L.getContext('2d');
  ctx.save(); ctx.translate(place.x, place.y); if (place.rot) ctx.rotate(place.rot); ctx.scale(place.scale * (place.flip ? -1 : 1), place.scale);
  const s = Object.assign({}, st); if (place.flip && s.light) s.light = [-s.light[0], s.light[1]];
  s.lw = (s.lw || 1) * C.clamp(Math.pow(place.scale, 0.35), 0.55, 1.35) / place.scale * place.scale; // keep screen lines readable at small scales
  const anchors = drawFn(ctx, s) || {};
  ctx.restore();
  // transform anchors to screen
  const out = {}; for (const k in anchors) { const [ax, ay] = anchors[k]; const sx = ax * place.scale * (place.flip ? -1 : 1), sy = ay * place.scale; const c = Math.cos(place.rot || 0), sn = Math.sin(place.rot || 0); out[k] = [place.x + sx * c - sy * sn, place.y + sx * sn + sy * c]; }
  L.anchors = out; return L;
}

// Soft contact shadow ellipse on the ground under a character.
function contactShadow(ctx, x, y, rx, ry, color = '#2a2240', alpha = 0.35) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, C.rgba(color, alpha)); g.addColorStop(0.6, C.rgba(color, alpha * 0.6)); g.addColorStop(1, C.rgba(color, 0));
  ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// Cast shadow: the character silhouette flattened onto the ground, sheared away from the light, blurred.
// dir: [dx, dy] screen direction the shadow falls; len: length factor relative to height; groundY
function castShadow(ctx, layer, groundY, dir, len, color = '#2a2240', alpha = 0.3, blur = 3) {
  const sil = FX.silhouette(layer, color, 1); const W = layer.width, H = layer.height;
  const tmp = FX.newCanvas(W, H), t = tmp.getContext('2d');
  // x' = x + A*(y0 - y), y' = y0 + B*(y0 - y): heights above the ground are laid down along dir
  const A = dir[0] * len, B = dir[1] * len * 0.38;
  t.setTransform(1, 0, -A, -B, A * groundY, (1 + B) * groundY);
  t.drawImage(sil, 0, 0);
  const b = blur > 0 ? FX.blurCanvas(tmp, blur, 1) : tmp;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = alpha; ctx.drawImage(b, 0, 0); ctx.restore();
}
// Final placement of a character layer with lighting.
// o: { ambient: '#hex', ambientAmt, rim: '#hex', rimDir: [dx,dy] px, rimAlpha, rimSoft, add: '#hex' (screen tint), addAmt, alpha }
function placeLayer(ctx, layer, o = {}) {
  if (o.ambient) FX.gradeLayer(layer, o.ambient, o.ambientAmt == null ? 0.25 : o.ambientAmt, 'multiply');
  if (o.add) FX.gradeLayer(layer, o.add, o.addAmt == null ? 0.15 : o.addAmt, 'screen');
  if (o.rim) FX.rimLight(layer, o.rimDir[0], o.rimDir[1], o.rim, o.rimAlpha == null ? 0.85 : o.rimAlpha, o.rimSoft || 0);
  ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; if (o.blur) ctx.drawImage(FX.blurCanvas(layer, o.blur, 1), 0, 0); else ctx.drawImage(layer, 0, 0); ctx.restore();
}

// Frame timing: drawings on twos (12 per second); camera smooth.
const FPS = 24, DRAW_FPS = 12;
function drawTime(t) { return Math.floor(t * DRAW_FPS + 1e-6) / DRAW_FPS; }
function boilIndex(t) { return Math.floor(t * 6 + 1e-6); }

module.exports = { charLayer, contactShadow, castShadow, placeLayer, drawTime, boilIndex, FPS, DRAW_FPS };
