const { createCanvas } = require('canvas'); const W = 1920, H = 1080; const test = process.argv[2];
const P = createCanvas(W, H), px = P.getContext('2d'); px.fillRect(0, 0, 100, 100);
for (let i = 0; i < 30; i++) {
  if (test === 'newdst') { const c = createCanvas(W, H); c.getContext('2d').drawImage(P, 0, 0); }
  if (test === 'newsrc') { const c = createCanvas(W, H); c.getContext('2d').fillRect(0, 0, 5, 5); px.drawImage(c, 0, 0); }
  if (test === 'newdst_img') { const c = createCanvas(W, H); c.getContext('2d').putImageData(px.getImageData(0, 0, 10, 10), 0, 0); }
  if (test === 'newsrc_noctx') { const c = createCanvas(W, H); px.drawImage(c, 0, 0); }
  global.gc(); if (i % 10 === 9) console.log(test, i + 1, Math.round(process.memoryUsage().rss / 1048576), 'MB');
}
