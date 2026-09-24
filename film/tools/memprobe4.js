const { createCanvas } = require('canvas'); const W = 1920, H = 1080; const test = process.argv[2];
const P = createCanvas(W, H), px = P.getContext('2d'); px.fillRect(0, 0, 100, 100);
for (let i = 0; i < 30; i++) {
  if (test === 'shrink') { const c = createCanvas(W, H); c.getContext('2d').drawImage(P, 0, 0); c.width = 1; c.height = 1; }
  if (test === 'pattern') { const c = createCanvas(W, H); const x = c.getContext('2d'); x.fillStyle = x.createPattern(P, 'no-repeat'); x.fillRect(0, 0, W, H); }
  if (test === 'viaimg') { const c = createCanvas(W, H); const x = c.getContext('2d'); x.putImageData(px.getImageData(0, 0, W, H), 0, 0); }
  global.gc(); if (i % 10 === 9) console.log(test, i + 1, Math.round(process.memoryUsage().rss / 1048576), 'MB');
}
