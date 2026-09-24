// Generates the style sheet and character sheets (deliverables) from the same rigs that render the film.
const C = require('../src/engine/core'); const FX = require('../src/engine/fx'); const CP = require('../src/engine/comp');
const R = require('../src/chars/robot'); const S = require('../src/chars/shiba'); const K = require('../src/chars/cats'); const Hm = require('../src/chars/human'); const B = require('../src/chars/bicycle');
const Lane = require('../src/sets/lane'); const fs = require('fs');
const OUT = '/home/user/bicycle/sheets/'; const which = process.argv[2] || 'all';
const INK = '#3a2c28';
function sheet(W, H, title, sub) {
  const cv = C.createCanvas(W, H), ctx = cv.getContext('2d'); ctx.fillStyle = '#f2e8d5'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = INK; ctx.font = '64px Shippori'; ctx.fillText(title, 70, 110); ctx.font = '30px Klee'; ctx.fillStyle = '#6a5a50'; ctx.fillText(sub, 74, 160);
  C.ink(ctx, [[70, 185], [W - 70, 185]], { width: 2.5, color: '#8a7a6a', taper: 'both' });
  return { cv, ctx, W, H };
}
function label(ctx, x, y, text, size = 28, col = '#5a4a40', font = 'Klee') { ctx.save(); ctx.fillStyle = col; ctx.font = `${size}px ${font}`; ctx.fillText(text, x, y); ctx.restore(); }
function section(ctx, x, y, text) { label(ctx, x, y, text, 36, INK, 'Shippori'); C.ink(ctx, [[x, y + 12], [x + 44 + text.length * 17, y + 12]], { width: 2, color: '#b0a090', taper: 'both' }); }
function finish(s, name) { C.post(s.ctx, s.W, s.H, { paper: 0.18, vignette: 0.05 }); fs.writeFileSync(OUT + name, s.cv.toBuffer('image/png')); console.log('wrote', name); }
function put(ctx, fn, x, y, scale, flip = false, st = {}) { ctx.save(); ctx.translate(x, y); ctx.scale(scale * (flip ? -1 : 1), scale); const a = fn(ctx, Object.assign({ flipped: flip }, st)); ctx.restore(); return a; }
function lit(ctx, W, H, fn, place, st, light) { const L = CP.charLayer(W, H, fn, place, st); CP.contactShadow(ctx, place.x, place.y, 60 * place.scale * 2, 10 * place.scale * 2, '#2a2240', 0.4); CP.placeLayer(ctx, L, light); }

// ------------------------------------------------------------------ STYLE SHEET
function styleSheet() {
  const s = sheet(3600, 2400, '自転車  THE BICYCLE  —  style sheet', 'Picture-book anime: flat cel characters with a breathing ink line, watercolour backgrounds with real draftsmanship, twelve drawings a second.'); const { ctx } = s;
  // A. colour script
  section(ctx, 70, 260, 'Colour script (one palette per time of day, locked per chapter)');
  const rows = [['dawn 夜明け', Lane.PALS.dawn], ['noon 昼', Lane.PALS.day], ['dusk 夕', Lane.PALS.dusk], ['night 夜', Lane.PALS.night]];
  const keys = [['skyTop', 'sky'], ['skyLow', 'horizon'], ['light', 'light'], ['plaster', 'plaster'], ['wood', 'wood'], ['stone', 'stone'], ['plant', 'foliage'], ['tile', 'roof'], ['haze', 'haze']];
  rows.forEach(([name, pal], r) => { const y = 300 + r * 118; label(ctx, 80, y + 62, name, 30, INK); keys.forEach(([k, nm], i) => { const x = 330 + i * 150; C.wash(ctx, [[x, y], [x + 130, y + 4], [x + 128, y + 80], [x + 2, y + 78]], pal[k], { bleed: 3, seed: r * 10 + i }); label(ctx, x + 4, y + 104, `${nm} ${pal[k]}`, 17, '#6a5a50'); }); });
  // character palette
  const cp = [['robot', R.COL.body], ['stripe', R.COL.stripe], ['screen', R.COL.screen], ['eyes', R.COL.eye], ['shiba', S.COL.red], ['urajiro', S.COL.cream], ['collar', S.COL.collar], ['bicycle', B.COL.frame], ['cardigan', Hm.CFG.woman.top], ['hat', Hm.CFG.boy.cap], ['ink', INK], ['shadow tint', '#5b5680']];
  label(ctx, 80, 820, 'cast', 30, INK); cp.forEach(([nm, c], i) => { const x = 330 + i * 112; C.cel(ctx, [[x, 770], [x + 96, 770], [x + 96, 840], [x, 840]], c); label(ctx, x, 870, nm, 17); label(ctx, x, 892, c, 15, '#8a7a70'); });
  // B. line weights
  section(ctx, 1760, 260, 'Line');
  const lw = [[4.2, 'character outline 4.2 px (tapered, boils every 2nd drawing)'], [2.6, 'inner detail 2.4–2.8 px'], [1.6, 'background line 0.5–2 px, broken, coloured (never black)'], [1.0, 'whiskers, hair strands 1 px']];
  lw.forEach(([w, t], i) => { const y = 320 + i * 70; for (let b = 0; b < 3; b++) { C.setBoil(b); C.ink(ctx, C.smoothPts([[1780 + b * 150, y], [1830 + b * 150, y - 14], [1890 + b * 150, y + 6]], false), { width: w, color: i === 2 ? '#6a5a70' : INK, taper: 'both', seed: 3 }); } C.setBoil(0); label(ctx, 2250, y + 8, t, 24); });
  label(ctx, 1780, 610, 'three consecutive drawings of the same stroke: the wobble re-rolls at 6 Hz, the drawing at 12 fps', 20, '#8a7a70');
  // C. eyes
  section(ctx, 1760, 700, 'Eyes');
  const eyeModes = ['eyes', 'happy', 'tired', 'question', 'bike'];
  eyeModes.forEach((m, i) => { put(ctx, (c, st) => R.draw(c, { yaw: 0, screen: { mode: m } }, st), 1830 + i * 170, 1030, 0.5); label(ctx, 1800 + i * 170, 1060, m === 'eyes' ? 'robot: dots' : m, 20); });
  put(ctx, (c, st) => S.draw(c, { headYaw: 0.9, sit: 1, mouth: 'pant' }, st), 2740, 1030, 0.75); label(ctx, 2690, 1060, 'shiba: almond, cream brow dots', 20);
  put(ctx, (c, st) => K.draw(c, { cat: 'boss', pose: 'loaf', headYaw: 1.3, pupil: 0.25 }, st), 3000, 1030, 0.9); put(ctx, (c, st) => K.draw(c, { cat: 'kuro', pose: 'loaf', headYaw: 1.3, pupil: 0.9 }, st), 3260, 1030, 0.9); label(ctx, 2950, 1060, 'cats: slit pupils narrow in light, round in the dark', 20);
  label(ctx, 1780, 1110, 'People: dots and arcs, never realistic irises. Grandmother always behind round glasses. The boy has big dark eyes with two highlights.', 22);
  // D. shadows and light
  section(ctx, 70, 980, 'Shadow and light');
  for (let i = 0; i < 3; i++) { const cx = 180 + i * 230, cy = 1140; const L = [[-0.6, -0.8], [0.9, -0.3], [0, -1]][i]; C.celShade(ctx, C.circlePts(cx, cy, 80, 80, 40), '#e9dcc0', C.mix('#e9dcc0', '#5b5680', 0.32), L, 26); C.inkCircle(ctx, cx, cy, 80, { width: 3.6 }); }
  label(ctx, 90, 1260, 'One shadow tone per colour: base mixed 32% toward cool violet #5b5680. Crescent shadow on the side away from the light. No gradients.', 22);
  const lights = [['dawn backlight', '#b8b0e0', '#ffe2b0', [0, -3], '#d8cce8'], ['noon', '#ffffff', null, [0, 0], '#e8e4d0'], ['dusk', '#e8a890', '#ffb070', [-3, -2], '#e0a898'], ['night lantern', '#4a4f88', '#ffc478', [3, -1], '#3a3f66']];
  lights.forEach(([nm, amb, rim, dir, bg], i) => { const x = 110 + i * 400, y = 1310; C.wash(ctx, [[x, y], [x + 370, y], [x + 370, y + 330], [x, y + 330]], bg, { bleed: 4, seed: i }); const W = s.W, H = s.H; lit(ctx, W, H, (c, st) => R.draw(c, { yaw: 0.5, screen: { mode: 'eyes' } }, st), { x: x + 185, y: y + 300, scale: 0.85 }, {}, { ambient: amb, ambientAmt: i === 1 ? 0 : 0.4, rim, rimDir: dir, rimAlpha: 0.9 }); label(ctx, x + 10, y + 370, nm, 24); });
  // E. background studies
  section(ctx, 1760, 1180, 'Background studies: the lane at four times of day');
  ['dawn', 'day', 'dusk', 'night'].forEach((tod, i) => { const set = Lane.build({ tod, fg: false }); const th = C.createCanvas(1920, 1080), tx = th.getContext('2d'); tx.drawImage(set.plate, 0, 0); FX.grade(tx, 1920, 1080, { dawn: { contrast: 0.22, sat: 1.35, shadow: '#40387a', shadowAmt: 0.2, high: '#ffd9a8', highAmt: 0.18 }, day: { contrast: 0.15, sat: 1.1, shadowAmt: 0.1, highAmt: 0.1 }, dusk: { contrast: 0.2, sat: 1.3, shadow: '#3a2a5a', shadowAmt: 0.25, high: '#ffb880', highAmt: 0.2 }, night: { contrast: 0.2, sat: 1.2, shadow: '#141a3a', shadowAmt: 0.25, high: '#ffd08a', highAmt: 0.15 } }[tod]);
    const x = 1780 + (i % 2) * 900, y = 1230 + Math.floor(i / 2) * 530; ctx.drawImage(th, x, y, 860, 484); label(ctx, x, y + 516, tod === 'day' ? 'noon (also the photograph, thirty years earlier)' : tod, 22); });
  // F. do not
  section(ctx, 70, 1780, 'Do not');
  const donts = ['gradient or airbrush on a character', 'pure black line or fill (darkest ink is #3a2c28 / #241f2e)', 'pure white except the bell ring flash and eye highlights', '3D volume shading, specular plastic, motion blur, lens flares', 'photo textures or photoreal lighting', 'outlines on distant background objects', 'drift: every character is drawn by one rig, never redrawn freehand'];
  donts.forEach((t, i) => label(ctx, 90, 1850 + i * 42, '✕  ' + t, 25, '#8a3a32'));
  // tiny drawn counter-examples
  const ex = C.createCanvas(360, 200), exx = ex.getContext('2d'); const g = exx.createRadialGradient(120, 90, 10, 160, 110, 110); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#6a6070'); exx.fillStyle = g; exx.beginPath(); exx.arc(150, 100, 80, 0, Math.PI * 2); exx.fill(); exx.strokeStyle = '#000'; exx.lineWidth = 6; exx.stroke();
  ctx.drawImage(ex, 1020, 1860); C.ink(ctx, [[1080, 1880], [1300, 2050]], { width: 8, color: '#c0443a', taper: 0 }); C.ink(ctx, [[1300, 1880], [1080, 2050]], { width: 8, color: '#c0443a', taper: 0 });
  C.celShade(ctx, C.circlePts(1500, 1960, 80, 80, 40), '#e9dcc0', C.mix('#e9dcc0', '#5b5680', 0.32), [-0.6, -0.8], 26); C.inkCircle(ctx, 1500, 1960, 80, { width: 3.6 }); C.ink(ctx, [[1400, 2070], [1440, 2100], [1600, 1860]], { width: 8, color: '#4a8a4a', taper: 0 });
  label(ctx, 1030, 2090, 'not this', 22, '#8a3a32'); label(ctx, 1450, 2090, 'this', 22, '#3a6a3a');
  finish(s, 'style_sheet.png');
}

// ------------------------------------------------------------------ ROBOT
function robotSheet() {
  const s = sheet(3600, 2400, 'Tetsu  (the robot)', 'Waist-high (0.85 m). Old rice-cooker cream, faded teal stripe, dent on the left shoulder, rust flecks, one bent antenna. The battery on his chest is the film\'s clock.'); const { ctx } = s;
  section(ctx, 70, 260, 'Turnaround');
  const yaws = [[0, 'front'], [0.6, 'three-quarter'], [Math.PI / 2, 'side'], [2.4, 'three-quarter back'], [Math.PI, 'back']];
  yaws.forEach(([y, n], i) => { put(ctx, (c, st) => R.draw(c, { yaw: y }, st), 280 + i * 420, 720, 1.35); label(ctx, 200 + i * 420, 770, n, 28); });
  section(ctx, 2250, 260, 'Scale');
  put(ctx, (c, st) => Hm.draw(c, { who: 'woman', yaw: 0.5 }, st), 2500, 780, 1.0); put(ctx, (c, st) => R.draw(c, { yaw: -0.5, screen: { mode: 'eyes', lookY: -0.8, lookX: -0.5 }, headNod: -8 }, st), 2780, 780, 1.0); put(ctx, (c, st) => S.draw(c, { headYaw: 0.4 }, st), 3100, 780, 1.0, true); put(ctx, (c, st) => K.draw(c, { cat: 'boss', pose: 'sit', headYaw: 0.8 }, st), 3380, 780, 1.0);
  label(ctx, 2300, 820, 'He comes up to her waist. The shiba reaches his chest; the cats are his peers.', 22);
  section(ctx, 70, 900, 'Expressions (screen face)');
  const ex = [['eyes', 'neutral'], ['happy', 'happy'], ['tired', 'tired'], ['sad', 'sad'], ['wide', 'surprised'], ['question', 'asking'], ['bike', 'bicycle glyph'], ['bikeKid', 'come home with me'], ['heart', 'fond'], ['dots', 'thinking'], ['battery', 'low battery'], ['off', 'screen off']];
  ex.forEach(([m, n], i) => { const x = 200 + (i % 6) * 560, y = 1240 + Math.floor(i / 6) * 0; if (i < 6) { put(ctx, (c, st) => R.draw(c, { yaw: 0.2, screen: { mode: m }, headTilt: m === 'question' ? -0.18 : 0 }, st), 180 + i * 290, 1260, 0.8); label(ctx, 120 + i * 290, 1300, n, 22); } else { put(ctx, (c, st) => R.draw(c, { yaw: 0.2, screen: { mode: m }, t: 0.1 }, st), 180 + (i - 6) * 290, 1680, 0.8); label(ctx, 120 + (i - 6) * 290, 1720, n, 22); } });
  section(ctx, 1860, 900, 'Poses');
  const poses = [[{ yaw: 0.4, armL: [2.2, 0.4, 0.9], armR: [0.4, 0.3, 0.3], screen: { mode: 'happy' }, antenna: -0.3, bob: 10 }, 'happy (antenna springs)'], [{ yaw: 0.6, headNod: 14, headTilt: 0.22, armL: [0.02, 0.05, 0.1], armR: [0.02, 0.05, 0.1], screen: { mode: 'tired' }, antenna: 0.9, battery: 1, batteryBlink: true, squash: 0.04 }, 'tired, one bar'], [{ yaw: 0.9, lean: 0.12, armR: [1.3, 0.2, 0.8], screen: { mode: 'eyes', lookX: 0.8 } }, 'reaching'], [{ yaw: -0.3, headNod: -10, screen: { mode: 'eyes', lookY: -0.9 } }, 'looking up']];
  poses.forEach(([p, n], i) => { put(ctx, (c, st) => R.draw(c, p, st), 2000 + (i % 2) * 700, 1260 + Math.floor(i / 2) * 420, 0.9); label(ctx, 1920 + (i % 2) * 700, 1300 + Math.floor(i / 2) * 420, n, 22); });
  section(ctx, 70, 1830, 'Consistency test: the same robot, ten times (random yaw, head and arm poses, different line boil)');
  const rng = new C.Rng(99); for (let i = 0; i < 10; i++) { C.setBoil(i); const p = { yaw: rng.range(-1.1, 1.1), headTilt: rng.range(-0.15, 0.15), armL: [rng.range(0, 0.8), rng.range(0, 0.8), 0.4], armR: [rng.range(0, 0.8), rng.range(0, 0.8), 0.4], screen: { mode: 'eyes', lookX: rng.range(-1, 1) }, battery: 1 + (i % 4) }; put(ctx, (c, st) => R.draw(c, p, st), 220 + i * 335, 2300, 1.0); } C.setBoil(0);
  finish(s, 'char_robot.png');
}
// ------------------------------------------------------------------ WOMAN
function womanSheet() {
  const s = sheet(3600, 2000, 'Fumiko  (the old woman)', 'About seventy. Lives alone in a narrow machiya. Mustard cardigan, apron, round glasses, grey bun. She hums. She says nothing.'); const { ctx } = s;
  section(ctx, 70, 260, 'Turnaround');
  [[0, 'front'], [0.7, 'three-quarter'], [Math.PI / 2, 'side'], [2.5, 'three-quarter back'], [Math.PI, 'back']].forEach(([y, n], i) => { put(ctx, (c, st) => Hm.draw(c, { who: 'woman', yaw: y }, st), 280 + i * 400, 960, 1.25); label(ctx, 200 + i * 400, 1010, n, 26); });
  section(ctx, 2150, 260, 'Faces');
  const faces = [[{ eyes: 'open', mouth: 'hum' }, 'humming'], [{ eyes: 'down', mouth: 'closed' }, 'looking at the empty spot'], [{ eyes: 'smile', mouth: 'smile' }, 'smile'], [{ eyes: 'open', mouth: 'o', brows: 1 }, 'surprise'], [{ eyes: 'closed', mouth: 'closed', brows: 0.6 }, 'eyes closed']];
  faces.forEach(([f, n], i) => { ctx.save(); const x = 2280 + (i % 3) * 430, y = 520 + Math.floor(i / 3) * 440; ctx.beginPath(); ctx.rect(x - 190, y - 250, 380, 400); ctx.clip(); ctx.translate(x, y); ctx.scale(2.3, 2.3); ctx.translate(0, 385); Hm.draw(ctx, { who: 'woman', yaw: 0.35, face: f }, {}); ctx.restore(); label(ctx, x - 130, y + 170, n, 22); });
  section(ctx, 70, 1120, 'Poses');
  const ps = [[{ yaw: 0.9, prop: 'kettle', arms: { R: [0.2, 1.1] }, face: { mouth: 'hum' } }, 'at the door with the kettle'], [{ yaw: 1.2, headNod: 16, face: { eyes: 'down' } }, 'looks at the spot'], [{ yaw: 1.3, walk: { phase: 0.25, stride: 0.8 } }, 'walks'], [{ yaw: 1.1, seat: [0, -112], feet: { L: [78, 0], R: [58, 0] }, prop: 'lantern', hands: { R: [120, -170], L: [100, -150] }, face: { eyes: 'open' } }, 'waiting on the step'], [{ yaw: 1.45, bend: 0.45, walk: { phase: 0.1, stride: 1, run: 1 }, hands: { L: [150, -250], R: [160, -240] }, face: { eyes: 'open', mouth: 'open' } }, 'runs holding the saddle']];
  ps.forEach(([p, n], i) => { put(ctx, (c, st) => Hm.draw(c, Object.assign({ who: 'woman' }, p), st), 260 + i * 700, 1880, 1.15); label(ctx, 130 + i * 700, 1930, n, 24); });
  finish(s, 'char_woman.png');
}
// ------------------------------------------------------------------ SHIBA
function shibaSheet() {
  const s = sheet(3600, 2000, 'Kotaro  (the shiba)', 'A spring, not a liquid: stiff legs, sudden stops, bouncing trot. Tail ALWAYS curls over the dog\'s LEFT side (in front of the back when facing right, behind it when facing left).'); const { ctx } = s;
  section(ctx, 70, 260, 'Model');
  put(ctx, (c, st) => S.draw(c, {}, st), 420, 760, 2.2); label(ctx, 200, 820, 'side, facing right (tail curl in front)', 24);
  put(ctx, (c, st) => S.draw(c, {}, st), 1180, 760, 2.2, true); label(ctx, 950, 820, 'facing left (tail curl behind)', 24);
  put(ctx, (c, st) => S.draw(c, { sit: 1, headYaw: 1.1 }, st), 1800, 760, 2.2); label(ctx, 1680, 820, 'three-quarter, sitting', 24);
  section(ctx, 2200, 260, 'Expressions');
  [[{ eyes: 'narrow', ears: 'back', mouth: 'growl', crouch: 0.6 }, 'suspicious / growl'], [{ mouth: 'bark', headLift: 1 }, 'bark'], [{ eyes: 'happy', mouth: 'pant', sit: 1, headYaw: 1.2 }, 'happy pant'], [{ eyes: 'wide', ears: 'perk', headTilt: -0.3, sit: 1, headYaw: 0.9 }, 'head tilt: curious']].forEach(([p, n], i) => { put(ctx, (c, st) => S.draw(c, p, st), 2400 + (i % 2) * 620, 640 + Math.floor(i / 2) * 330, 1.2); label(ctx, 2280 + (i % 2) * 620, 680 + Math.floor(i / 2) * 330, n, 22); });
  section(ctx, 70, 1000, 'Spring trot (8 drawings of one stride, on twos)');
  for (let i = 0; i < 8; i++) put(ctx, (c, st) => S.draw(c, { gait: 'trot', phase: i / 8, mouth: i % 4 < 2 ? 'pant' : 'closed' }, st), 240 + i * 420, 1420, 1.2);
  section(ctx, 70, 1520, 'Bound (the spring): crouch, launch, flight, land');
  [{ crouch: 0.8 }, { gait: 'bound', phase: 0.15 }, { gait: 'bound', phase: 0.25 }, { gait: 'bound', phase: 0.4 }, { crouch: 0.3 }].forEach((p, i) => put(ctx, (c, st) => S.draw(c, p, st), 260 + i * 520, 1900, 1.2));
  finish(s, 'char_shiba.png');
}
// ------------------------------------------------------------------ CATS
function catsSheet() {
  const s = sheet(3600, 2200, 'The cats  (the informant network)', 'Four cats who look nothing alike. Liquid: every pose morphs from the same body, tails are travelling waves. Each knows one tiny piece of the answer.'); const { ctx } = s;
  const cats = ['boss', 'kuro', 'bobtail', 'elder']; const notes = ['torn left ear, heavy, amber eyes. Runs the shrine wall. Opens the film.', 'skinny, long tail, huge ears. Leads the robot to fish instead of answers.', 'white with a black cap and a pom tail. Sits on the clue.', 'fluffy, sleepy, half-closed eyes. Falls asleep mid-answer.'];
  cats.forEach((c, i) => {
    const y0 = 300 + i * 470; label(ctx, 80, y0, K.CATS[c].name, 34, INK, 'Shippori'); label(ctx, 80, y0 + 40, notes[i], 22);
    put(ctx, (cx, st) => K.draw(cx, { cat: c, pose: 'sit', headYaw: 0.9 }, st), 250, y0 + 400, 1.8);
    put(ctx, (cx, st) => K.draw(cx, { cat: c, pose: 'sit', headYaw: 0 }, st), 620, y0 + 400, 1.8);
    put(ctx, (cx, st) => K.draw(cx, { cat: c, pose: 'walk', phase: 0.3, headYaw: 0.2, t: 1 }, st), 1100, y0 + 400, 1.7);
    put(ctx, (cx, st) => K.draw(cx, { cat: c, pose: 'loaf', headYaw: 1.3, eyes: c === 'elder' ? 'closed' : 'open' }, st), 1600, y0 + 400, 1.8);
    put(ctx, (cx, st) => K.draw(cx, { cat: c, pose: 'lie', headYaw: 0.6, t: 2 }, st), 2050, y0 + 400, 1.6);
    ctx.save(); ctx.translate(2900, y0 + 230); ctx.scale(0.45, 0.45); K.drawFace(ctx, c, { pupil: c === 'kuro' ? 0.8 : 0.35, eyes: c === 'elder' ? 'half' : 'open' }); ctx.restore();
  });
  finish(s, 'char_cats.png');
}
// ------------------------------------------------------------------ BOY
function boySheet() {
  const s = sheet(3600, 1900, 'The boy', 'About eight. Yellow school hat, white shirt, navy shorts, a scraped knee. He wanted to learn to ride. He never speaks.'); const { ctx } = s;
  section(ctx, 70, 260, 'Turnaround');
  [[0, 'front'], [0.7, 'three-quarter'], [Math.PI / 2, 'side'], [Math.PI, 'back']].forEach(([y, n], i) => { put(ctx, (c, st) => Hm.draw(c, { who: 'boy', yaw: y, knee: 1 }, st), 260 + i * 380, 900, 1.3); label(ctx, 180 + i * 380, 950, n, 26); });
  section(ctx, 1700, 260, 'Faces');
  [[{ eyes: 'open' }, 'neutral'], [{ eyes: 'open', mouth: 'wobble', brows: 1, tears: 1 }, 'crying, trying not to'], [{ eyes: 'open', mouth: 'o', brows: 0.3 }, 'sees a robot and a dog'], [{ eyes: 'closed', mouth: 'smile' }, 'relief'], [{ eyes: 'open', mouth: 'open' }, 'riding!']].forEach(([f, n], i) => { ctx.save(); const x = 1850 + (i % 3) * 560, y = 560 + Math.floor(i / 3) * 420; ctx.beginPath(); ctx.rect(x - 220, y - 220, 440, 370); ctx.clip(); ctx.translate(x, y); ctx.scale(2.4, 2.4); ctx.translate(0, 305); Hm.draw(ctx, { who: 'boy', yaw: 0.35, face: f }, {}); ctx.restore(); label(ctx, x - 150, y + 170, n, 22); });
  section(ctx, 70, 1050, 'Poses');
  [[{ yaw: 1.3, bend: 1.3, face: { eyes: 'closed' } }, 'bows deeply'], [{ yaw: 1.4, walk: { phase: 0.3 }, hands: { L: [110, -250], R: [120, -245] } }, 'pushes the bicycle'], [{ yaw: 0.9, seat: [0, -96], feet: { L: [62, 0], R: [44, 0] }, face: { eyes: 'down', tears: 1 }, knee: 1, hands: { L: [70, -150], R: [84, -140] }, headNod: 14, bend: 0.35 }, 'on the step, knees up']].forEach(([p, n], i) => { put(ctx, (c, st) => Hm.draw(c, Object.assign({ who: 'boy' }, p), st), 300 + i * 600, 1780, 1.15); label(ctx, 180 + i * 600, 1830, n, 24); });
  finish(s, 'char_boy.png');
}
// ------------------------------------------------------------------ BICYCLE
function bikeSheet() {
  const s = sheet(3600, 2000, 'The bicycle', 'A faded green step-through mamachari. Bent wire basket, swept-back bars, chain case, rear stand, dynamo lamp. The bell only clacks. It was the bicycle she taught her daughter to ride on.'); const { ctx } = s;
  section(ctx, 70, 260, 'Turnaround');
  put(ctx, (c, st) => B.draw(c, { wheel: 0.2 }, st), 700, 1000, 1.25); label(ctx, 360, 1060, 'side (right)', 26);
  put(ctx, (c, st) => B.draw(c, { wheel: 0.2 }, st), 1650, 1000, 1.25, true); label(ctx, 1350, 1060, 'side (left)', 26);
  put(ctx, (c, st) => B.draw(c, { wheel: 0.2, yaw: 0.9 }, st), 2350, 1000, 1.25); label(ctx, 2150, 1060, 'three-quarter', 26);
  put(ctx, (c, st) => B.draw(c, { wheel: 0.2, yaw: 1.35 }, st), 3050, 1000, 1.25); label(ctx, 2950, 1060, 'nearly head-on', 26);
  section(ctx, 70, 1160, 'Silhouette test: readable across a street');
  [1, 0.5, 0.25, 0.12].forEach((sc, i) => { const L = C.createCanvas(900, 600), lx = L.getContext('2d'); lx.translate(450, 520); lx.scale(sc, sc); B.draw(lx, { stand: true }, {}); const sil = FX.silhouette(L, '#3a3048'); ctx.drawImage(sil, 60 + i * 700, 1180, 900 * 0.75, 600 * 0.75); label(ctx, 150 + i * 700, 1680, `${Math.round(sc * 100)}% — ${['close', 'mid', 'across the lane', 'across the street'][i]}`, 22); });
  label(ctx, 90, 1760, 'The bent basket corner and the high swept-back bars are the silhouette keys. The bell is drawn large enough to ring on screen.', 24);
  section(ctx, 2300, 1160, 'The bell');
  put(ctx, (c, st) => B.draw(c, { bell: true, bellRing: 0 }, st), 2450, 1900, 1.3); put(ctx, (c, st) => B.draw(c, { bell: true, bellRing: 0.6, bellShake: 1, t: 0.1 }, st), 3150, 1900, 1.3);
  label(ctx, 2320, 1950, 'clack (broken)            ring (the last shot)', 22);
  finish(s, 'char_bicycle.png');
}
const jobs = { style: styleSheet, robot: robotSheet, woman: womanSheet, shiba: shibaSheet, cats: catsSheet, boy: boySheet, bike: bikeSheet };
for (const k of Object.keys(jobs)) if (which === 'all' || which === k) jobs[k]();
