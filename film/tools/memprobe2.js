const C = require('../src/engine/core'); const FX = require('../src/engine/fx'); const CP = require('../src/engine/comp'); const R = require('../src/chars/robot');
const W = 1920, H = 1080; const test = process.argv[2];
const cv = C.createCanvas(W, H), ctx = cv.getContext('2d');
for (let i = 0; i < 30; i++) {
  if (test === 'canvas') { const c = C.createCanvas(W, H); c.getContext('2d').fillRect(0, 0, 10, 10); }
  if (test === 'charLayer') { CP.charLayer(W, H, (c, st) => R.draw(c, { yaw: 1 }, st), { x: 900, y: 900, scale: 1 }, {}); }
  if (test === 'blur') { FX.blurCanvas(cv, 4, 1); }
  if (test === 'silhouette') { FX.silhouette(cv, '#000'); }
  if (test === 'rim') { const L = CP.charLayer(W, H, (c, st) => R.draw(c, { yaw: 1 }, st), { x: 900, y: 900, scale: 1 }, {}); FX.rimLight(L, 2, -2, '#fff', 0.8); }
  if (test === 'grade') { const L = C.createCanvas(W, H); FX.gradeLayer(L, '#888', 0.3); }
  if (test === 'getimage') { ctx.getImageData(0, 0, W, H); }
  if (test === 'shadowblur') { ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; ctx.fillRect(100, 100, 50, 50); ctx.restore(); }
  global.gc(); if (i % 10 === 9) console.log(test, i + 1, Math.round(process.memoryUsage().rss / 1048576), 'MB');
}
