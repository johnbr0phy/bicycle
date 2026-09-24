// Measure per-frame RSS growth of a shot's frame() to find native memory leaks.
const C = require('../src/engine/core'); const LK = require('../src/engine/look');
const id = process.argv[2]; const N = +(process.argv[3] || 40); const skipFinish = process.argv[4] === 'nofinish';
const mod = require('../src/shots/' + id + '.js'); const meta = require('../src/shots.json').find(s => s.id === id);
(async () => { const W = 1920, H = 1080; const st = await mod.setup({ W, H, meta }); const cv = C.createCanvas(W, H), ctx = cv.getContext('2d');
  for (let i = 0; i < N; i++) { const t = i / 12; C.setBoil(i); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H); C.frameBegin(); await mod.frame(ctx, t, st, { W, H, t, dt: t, drawIdx: i, frame: i, dur: meta.dur }); if (!skipFinish) LK.finish(ctx, W, H, mod.look || meta.tod, i); cv.toBuffer('image/png', { compressionLevel: 3 }); C.frameEnd(); global.gc(); if (i % 10 === 9) console.log(i + 1, Math.round(process.memoryUsage().rss / 1048576), 'MB'); } })();
