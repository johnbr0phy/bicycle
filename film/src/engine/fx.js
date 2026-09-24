'use strict';
// Pixel-level effects: watercolour simulation for background plates, blur, anime diffusion glow,
// rim light and cast shadows for characters.
const { createCanvas, noise2, fbm2, clamp, hex2rgb } = require('./core');

function newCanvas(w, h) { return createCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function cloneCanvas(src) { const c = newCanvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); return c; }

// Separable box blur on a Float32 RGBA buffer (premultiplied), `passes` iterations ~ gaussian.
function boxBlurF(buf, w, h, r, passes = 3) {
  if (r < 1) return buf;
  const tmp = new Float32Array(buf.length);
  for (let p = 0; p < passes; p++) {
    // horizontal
    for (let y = 0; y < h; y++) {
      const row = y * w * 4;
      for (let c = 0; c < 4; c++) {
        let acc = 0; const inv = 1 / (2 * r + 1);
        for (let k = -r; k <= r; k++) acc += buf[row + clamp(k, 0, w - 1) * 4 + c];
        for (let x = 0; x < w; x++) {
          tmp[row + x * 4 + c] = acc * inv;
          acc += buf[row + Math.min(w - 1, x + r + 1) * 4 + c] - buf[row + Math.max(0, x - r) * 4 + c];
        }
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 4; c++) {
        let acc = 0; const inv = 1 / (2 * r + 1);
        for (let k = -r; k <= r; k++) acc += tmp[clamp(k, 0, h - 1) * w * 4 + x * 4 + c];
        for (let y = 0; y < h; y++) {
          buf[y * w * 4 + x * 4 + c] = acc * inv;
          acc += tmp[Math.min(h - 1, y + r + 1) * w * 4 + x * 4 + c] - tmp[Math.max(0, y - r) * w * 4 + x * 4 + c];
        }
      }
    }
  }
  return buf;
}
function toFloat(img) { const d = img.data, f = new Float32Array(d.length); for (let i = 0; i < d.length; i += 4) { const a = d[i + 3] / 255; f[i] = d[i] * a; f[i + 1] = d[i + 1] * a; f[i + 2] = d[i + 2] * a; f[i + 3] = d[i + 3]; } return f; }
function fromFloat(f, img) { const d = img.data; for (let i = 0; i < d.length; i += 4) { const a = f[i + 3]; const ia = a > 0.001 ? 255 / a : 0; d[i] = f[i] * ia; d[i + 1] = f[i + 1] * ia; d[i + 2] = f[i + 2] * ia; d[i + 3] = a; } return img; }

// Fast blur of a canvas (downsample, box blur, upsample). Returns new canvas.
function blurCanvas(src, radius, scaleDown = 0) {
  if (radius <= 0.5) return cloneCanvas(src);
  const s = scaleDown || (radius > 16 ? 4 : radius > 6 ? 2 : 1);
  const w = Math.max(1, Math.round(src.width / s)), h = Math.max(1, Math.round(src.height / s));
  const small = newCanvas(w, h), sx = small.getContext('2d'); sx.imageSmoothingEnabled = true; sx.drawImage(src, 0, 0, w, h);
  const img = sx.getImageData(0, 0, w, h); const f = toFloat(img); boxBlurF(f, w, h, Math.max(1, Math.round(radius / s)), 3); fromFloat(f, img); sx.putImageData(img, 0, 0);
  const out = newCanvas(src.width, src.height), ox = out.getContext('2d'); ox.imageSmoothingEnabled = true; ox.drawImage(small, 0, 0, src.width, src.height);
  return out;
}

// Watercolour simulation (after Bousseau et al. 2006, simplified):
//  1. hand-tremor: sample through a low-frequency displacement field
//  2. edge darkening: pigment pools where colour changes (difference from blurred copy)
//  3. wash turbulence: low-frequency density variation
//  4. granulation: high-frequency density variation, stronger in dark pigment
//  5. soft alpha edges with a slight bleed
// Density model: C' = C - (C - C^2)(d - 1), d>1 darkens, d<1 lightens.
function watercolor(src, o = {}) {
  const w = src.width, h = src.height, seed = o.seed || 7;
  const tremor = o.tremor == null ? 3.0 : o.tremor, tremorScale = o.tremorScale || 44;
  const edge = o.edge == null ? 1.3 : o.edge, edgeR = o.edgeR || 4; const bleed = o.bleed == null ? 0.55 : o.bleed;
  const turb = o.turb == null ? 0.34 : o.turb, turbScale = o.turbScale || 130;
  const gran = o.gran == null ? 0.24 : o.gran;
  const sctx = src.getContext('2d'); const sImg = sctx.getImageData(0, 0, w, h); const sd = sImg.data;
  // 1. displacement
  const disp = new Uint8ClampedArray(sd.length);
  const dxF = new Float32Array(Math.ceil(w / 8 + 2) * Math.ceil(h / 8 + 2)), dyF = new Float32Array(dxF.length); const gw = Math.ceil(w / 8 + 2);
  for (let gy = 0; gy < Math.ceil(h / 8 + 2); gy++) for (let gx = 0; gx < gw; gx++) {
    dxF[gy * gw + gx] = tremor * (fbm2(gx * 8 / tremorScale, gy * 8 / tremorScale, seed, 3) + 0.35 * fbm2(gx * 8 / 9, gy * 8 / 9, seed + 2, 2));
    dyF[gy * gw + gx] = tremor * (fbm2(gx * 8 / tremorScale + 31.7, gy * 8 / tremorScale - 12.1, seed + 5, 3) + 0.35 * fbm2(gx * 8 / 9 + 7, gy * 8 / 9, seed + 4, 2));
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = x / 8, gy = y / 8, ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy; const i0 = iy * gw + ix;
    const ddx = (dxF[i0] * (1 - fx) + dxF[i0 + 1] * fx) * (1 - fy) + (dxF[i0 + gw] * (1 - fx) + dxF[i0 + gw + 1] * fx) * fy;
    const ddy = (dyF[i0] * (1 - fx) + dyF[i0 + 1] * fx) * (1 - fy) + (dyF[i0 + gw] * (1 - fx) + dyF[i0 + gw + 1] * fx) * fy;
    const sx = clamp(Math.round(x + ddx), 0, w - 1), sy = clamp(Math.round(y + ddy), 0, h - 1);
    const si = (sy * w + sx) * 4, di = (y * w + x) * 4;
    disp[di] = sd[si]; disp[di + 1] = sd[si + 1]; disp[di + 2] = sd[si + 2]; disp[di + 3] = sd[si + 3];
  }
  // 2. blurred copy for edge darkening
  const f = new Float32Array(disp.length); for (let i = 0; i < disp.length; i += 4) { const a = disp[i + 3] / 255; f[i] = disp[i] * a; f[i + 1] = disp[i + 1] * a; f[i + 2] = disp[i + 2] * a; f[i + 3] = disp[i + 3]; }
  const bl = boxBlurF(Float32Array.from(f), w, h, edgeR, 2);
  const bl2 = bleed > 0 ? boxBlurF(Float32Array.from(f), w, h, 2, 2) : null;
  const out = sctx.createImageData(w, h); const od = out.data;
  // granulation texture precomputed at low cost
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; const a = disp[i + 3]; if (a === 0) { od[i + 3] = 0; continue; }
    let r = disp[i] / 255, g = disp[i + 1] / 255, b = disp[i + 2] / 255;
    if (bl2) { const wet = clamp((noise2(x / 23, y / 23, seed + 41) + 0.2) * 1.6, 0, 1) * bleed; const a2 = bl2[i + 3] || 1; r += (bl2[i] / a2 - r) * wet; g += (bl2[i + 1] / a2 - g) * wet; b += (bl2[i + 2] / a2 - b) * wet; }
    const ba = bl[i + 3] || 1; const br = bl[i] * 255 / ba, bg = bl[i + 1] * 255 / ba, bb = bl[i + 2] * 255 / ba; // un-premultiplied blur, 0..255
    const diff = (Math.abs(r * 255 - br) + Math.abs(g * 255 - bg) + Math.abs(b * 255 - bb)) / 765;
    const alphaEdge = clamp((255 - bl[i + 3]) / 255, 0, 1) * (a / 255); // near transparent edge
    let d = 1 + edge * Math.min(0.9, diff * 3.2 + alphaEdge * 0.9);
    d += turb * (fbm2(x / turbScale, y / turbScale, seed + 11, 3) + 0.5 * fbm2(x / (turbScale * 0.3), y / (turbScale * 0.3), seed + 13, 2));
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    d += gran * (1.2 - lum) * (noise2(x / 1.7, y / 1.7, seed + 23) * 0.6 + noise2(x / 5.3, y / 5.3, seed + 29) * 0.4);
    const k = d - 1;
    od[i] = 255 * clamp(r - (r - r * r) * k, 0, 1); od[i + 1] = 255 * clamp(g - (g - g * g) * k, 0, 1); od[i + 2] = 255 * clamp(b - (b - b * b) * k, 0, 1);
    od[i + 3] = a;
  }
  const dst = newCanvas(w, h); dst.getContext('2d').putImageData(out, 0, 0);
  return dst;
}

// Anime "diffusion" filter: blur the bright parts and screen them back over the image.
function glow(ctx, w, h, o = {}) {
  const thr = o.threshold == null ? 0.72 : o.threshold, rad = o.radius || 24, str = o.strength == null ? 0.55 : o.strength;
  const src = ctx.canvas; const s = 4; const sw = Math.round(w / s), sh = Math.round(h / s);
  const small = newCanvas(sw, sh), sx = small.getContext('2d'); sx.drawImage(src, 0, 0, sw, sh);
  const img = sx.getImageData(0, 0, sw, sh), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255; const k = clamp((l - thr) / (1 - thr), 0, 1); d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; d[i + 3] = 255; }
  const f = toFloat(img); boxBlurF(f, sw, sh, Math.max(1, Math.round(rad / s)), 3); fromFloat(f, img); sx.putImageData(img, 0, 0);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = str; ctx.drawImage(small, 0, 0, w, h); ctx.restore();
}
// Whole-frame soft diffusion (a lighter, uniform version of glow): mixes a blurred copy via soft-light.
function diffusion(ctx, w, h, amt = 0.25, rad = 10) {
  const b = blurCanvas(ctx.canvas, rad, 4); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.5; ctx.drawImage(b, 0, 0); ctx.restore();
}

// Silhouette of a canvas filled with a colour.
function silhouette(src, color, alpha = 1) { const c = newCanvas(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.globalAlpha = alpha; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; }
// Rim light: colour where the silhouette minus a shifted silhouette (toward the light) is non-zero.
function rimLight(charCanvas, dx, dy, color, alpha = 0.9, soften = 0) {
  const w = charCanvas.width, h = charCanvas.height; const rim = newCanvas(w, h), rx = rim.getContext('2d');
  rx.drawImage(charCanvas, 0, 0); rx.globalCompositeOperation = 'destination-out'; rx.drawImage(charCanvas, -dx, -dy);
  rx.globalCompositeOperation = 'source-in'; rx.fillStyle = color; rx.fillRect(0, 0, w, h);
  const out = soften > 0 ? blurCanvas(rim, soften, 1) : rim;
  const cx = charCanvas.getContext('2d'); cx.save(); cx.globalCompositeOperation = 'source-atop'; cx.globalAlpha = alpha; cx.drawImage(out, 0, 0); cx.restore();
}
// Multiply a colour over everything drawn on a canvas (ambient light grading of a character layer).
function tintLayer(canvas, color, alpha = 1, op = 'multiply') { const x = canvas.getContext('2d'); x.save(); x.globalCompositeOperation = op; x.globalAlpha = alpha; x.fillStyle = color; x.fillRect(0, 0, canvas.width, canvas.height); x.globalCompositeOperation = 'destination-in'; x.globalAlpha = 1; x.restore(); }
// Apply op but keep alpha of original: draw colour with source-atop after op.
function gradeLayer(canvas, color, alpha, op = 'multiply') {
  const w = canvas.width, h = canvas.height; const tmp = newCanvas(w, h), t = tmp.getContext('2d');
  t.drawImage(canvas, 0, 0); t.globalCompositeOperation = op; t.globalAlpha = alpha; t.fillStyle = color; t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'destination-in'; t.globalAlpha = 1; t.drawImage(canvas, 0, 0);
  const x = canvas.getContext('2d'); x.clearRect(0, 0, w, h); x.drawImage(tmp, 0, 0); return canvas;
}

// Film grain (monochrome, per-frame seed) as overlay.
function grain(ctx, w, h, seed, amt = 0.05) {
  const s = 2; const gw = Math.ceil(w / s), gh = Math.ceil(h / s); const c = newCanvas(gw, gh), x = c.getContext('2d'); const img = x.createImageData(gw, gh), d = img.data;
  let st = (seed * 2654435761) >>> 0;
  for (let i = 0; i < d.length; i += 4) { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; const v = 128 + ((st >>> 24) - 128) * 0.9; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  x.putImageData(img, 0, 0); ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = amt; ctx.drawImage(c, 0, 0, w, h); ctx.restore();
}

module.exports = { newCanvas, cloneCanvas, boxBlurF, toFloat, fromFloat, blurCanvas, watercolor, glow, diffusion, silhouette, rimLight, tintLayer, gradeLayer, grain };

// Colour grade: S-curve contrast, split toning (shadows toward one tint, highlights toward another), saturation.
// o: { contrast (0..1), sat (1 = none), shadow: '#hex', shadowAmt, high: '#hex', highAmt, lift (0..1 black lift), gamma }
function grade(ctx, w, h, o = {}) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  const con = o.contrast == null ? 0.18 : o.contrast, sat = o.sat == null ? 1.15 : o.sat, lift = o.lift || 0, gam = o.gamma || 1;
  const sh = hex2rgb(o.shadow || '#4a3f7a'), hi = hex2rgb(o.high || '#ffe2b8'); const sa = o.shadowAmt == null ? 0.22 : o.shadowAmt, ha = o.highAmt == null ? 0.12 : o.highAmt;
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) { let x = Math.pow(i / 255, gam); const s = x * x * (3 - 2 * x); x = x + (s - x) * con * 2; lut[i] = lift + (1 - lift) * clamp(x, 0, 1); }
  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    const ws = (1 - l) * (1 - l) * sa, wh = l * l * ha;
    r = r + (sh[0] / 255 - r) * ws + (hi[0] / 255 - r) * wh; g = g + (sh[1] / 255 - g) * ws + (hi[1] / 255 - g) * wh; b = b + (sh[2] / 255 - b) * ws + (hi[2] / 255 - b) * wh;
    const l2 = 0.3 * r + 0.59 * g + 0.11 * b; r = l2 + (r - l2) * sat; g = l2 + (g - l2) * sat; b = l2 + (b - l2) * sat;
    d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255;
  }
  ctx.putImageData(img, 0, 0);
}
module.exports.grade = grade;
