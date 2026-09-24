'use strict';
// Shot renderer: node render.js S02 [--fps 12|24] [--only t1,t2,...] [--out dir]
// Writes PNG frames to out/frames/<id>/ and encodes out/shots/<id>.mp4 (24 fps, drawings held on twos).
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const C = require('./src/engine/core'); const LK = require('./src/engine/look'); const CP = require('./src/engine/comp');
const args = process.argv.slice(2); const id = args[0]; const opt = {}; for (let i = 1; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[i + 1];
const shots = require('./src/shots.json'); const meta = shots.find(s => s.id === id);
const mod = require('./src/shots/' + id + '.js');
const W = 1920, H = 1080; const dur = meta.dur; const fps = mod.smooth ? 24 : 12;
const outDir = path.join(__dirname, 'out/frames', id); fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const t0 = Date.now(); const state = await mod.setup({ W, H, meta }); console.log(id, 'setup', Date.now() - t0, 'ms');
  const n = Math.round(dur * fps); let times = [...Array(n).keys()].map(i => i / fps);
  if (opt.only) times = opt.only.split(',').map(Number);
  const cv = C.createCanvas(W, H), ctx = cv.getContext('2d');
  for (const t of times) {
    const i = Math.round(t * fps); const dt = CP.drawTime(t); C.setBoil(CP.boilIndex(t) + (mod.boilSeed || 0));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
    const env = { W, H, t, dt, drawIdx: Math.floor(t * 12 + 1e-6), frame: i, dur }; C.frameBegin();
    await mod.frame(ctx, t, state, env);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (!mod.noFinish) LK.finish(ctx, W, H, mod.look || meta.tod, env.drawIdx, mod.lookOver);
    if (mod.after) mod.after(ctx, t, state, env);
    const file = opt.only ? path.join(outDir, `probe_${t.toFixed(2)}.png`) : path.join(outDir, String(i).padStart(5, '0') + '.png');
    fs.writeFileSync(file, cv.toBuffer('image/png', { compressionLevel: 3 }));
    C.frameEnd(); if (global.gc) global.gc();
  }
  console.log(id, 'frames', times.length, 'in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  if (!opt.only && opt.encode !== '0') {
    fs.mkdirSync(path.join(__dirname, 'out/shots'), { recursive: true });
    const vf = fps === 12 ? ['-vf', 'fps=24'] : [];
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(outDir, '%05d.png'), ...vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv420p', '-r', '24', path.join(__dirname, 'out/shots', id + '.mp4')]);
    console.log(id, 'encoded');
  }
})().catch(e => { console.error(e); process.exit(1); });
