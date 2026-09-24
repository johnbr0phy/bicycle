'use strict';
// Hand-lettered text: title, chapter cards, credits. Ink bleeds in rather than fading.
const C = require('./engine/core'); const FX = require('./engine/fx');
function inkText(ctx, text, x, y, o = {}) {
  const size = o.size || 100, font = o.font || 'Yuji', color = o.color || '#2e2426', a = o.alpha == null ? 1 : o.alpha; if (a <= 0) return;
  const vertical = !!o.vertical; const spacing = o.spacing || 0;
  const tmp = C.createCanvas(ctx.canvas.width, ctx.canvas.height), tx = tmp.getContext('2d');
  tx.fillStyle = color; tx.font = `${o.weight || ''} ${size}px ${font}`.trim(); tx.textBaseline = 'middle'; tx.textAlign = o.align || 'center';
  if (vertical) { [...text].forEach((ch, i) => tx.fillText(ch, x, y + i * size * (1.08 + spacing))); }
  else if (spacing) { const chars = [...text]; const widths = chars.map(c => tx.measureText(c).width); const total = widths.reduce((s, w) => s + w, 0) + spacing * size * (chars.length - 1); let cx = o.align === 'left' ? x : x - total / 2; tx.textAlign = 'left'; chars.forEach((c, i) => { tx.fillText(c, cx, y); cx += widths[i] + spacing * size; }); }
  else tx.fillText(text, x, y);
  // bleed: a blurred copy under the crisp letters, strongest while appearing
  const bleed = o.bleed == null ? (1 - a) * 6 + 1 : o.bleed;
  ctx.save(); ctx.globalAlpha = a * 0.35; ctx.drawImage(FX.blurCanvas(tmp, bleed + 2, 1), 0, 0); ctx.globalAlpha = a; ctx.drawImage(bleed > 1.5 ? FX.blurCanvas(tmp, bleed * 0.4, 1) : tmp, 0, 0); ctx.restore();
}
function seal(ctx, x, y, s, a = 1, ch = '自') {
  if (a <= 0) return; const t = C.createCanvas(Math.ceil(s + 4), Math.ceil(s + 4)), tx = t.getContext('2d'); const col = '#b8392e';
  C.cel(tx, [[1, 1], [s + 1, 3], [s, s + 1], [2, s]], col);
  tx.globalCompositeOperation = 'destination-out'; tx.fillStyle = '#000'; tx.font = `${Math.round(s * 0.7)}px Shippori`; tx.textAlign = 'center'; tx.textBaseline = 'middle'; tx.fillText(ch, s / 2 + 1, s / 2 + 3);
  // worn stamp texture
  const R = new C.Rng(5); for (let i = 0; i < 40; i++) { tx.globalAlpha = 0.5; tx.beginPath(); tx.arc(R.range(0, s), R.range(0, s), R.range(0.5, 1.6), 0, Math.PI * 2); tx.fill(); }
  ctx.save(); ctx.globalAlpha = a * 0.92; ctx.drawImage(t, x, y); ctx.restore();
}
module.exports = { inkText, seal };
function chapter(ctx, W, H, kanji, en, a) { if (a <= 0) return; inkText(ctx, kanji, W - 150, 150, { size: 92, font: 'YujiMai', alpha: a, color: '#2c2230' }); inkText(ctx, en, W - 150, 236, { size: 22, font: 'Shippori', alpha: a * 0.85, spacing: 0.4, color: '#3a2c34' }); seal(ctx, W - 214, 112, 26, a * 0.9, kanji[0]); }
module.exports.chapter = chapter;
