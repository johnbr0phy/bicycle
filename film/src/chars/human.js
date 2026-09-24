'use strict';
// People: FUMIKO (the old woman) and the BOY. One 2.5D rig with IK targets for hands and feet.
// Units: robot units (353/m). Ground y=0. yaw 0 = facing camera, +PI/2 = facing screen right.
const C = require('../engine/core'); const { style, sh, hi, part, line, rrect } = require('./common');

const CFG = {
  adult: {
    height: 590, headR: 42, neck: 12, torso: 180, hipW: 30, shW: 58, upperArm: 84, foreArm: 78, thigh: 140, shin: 140, footL: 42,
    skin: '#eccab0', skinSh: '#d4a890', hair: '#2e2628', hairDark: '#1e181a', top: '#6a7a9a', topDark: '#4a5a7a', blouse: '#f0ece4', skirt: '#3a3a4a', shorts: '#3a3a4a', apron: '#c8c0b0', apronDot: '#9a9080', legs: '#3a3a4a', sock: '#e8e4dc', shoe: '#3a3032', glasses: '#4a4040', blush: '#e8a090', cap: '#f2c632', capDark: '#d09c1c',
    hunch: 0.05, cheek: 1.0, trousers: true,
  },
  woman: {
    height: 522, headR: 46, neck: 8, torso: 150, hipW: 32, shW: 50, upperArm: 70, foreArm: 66, thigh: 108, shin: 110, footL: 38,
    skin: '#f0d3bb', skinSh: '#d8ae98', hair: '#bdb8be', hairDark: '#948f99', top: '#c99e46', topDark: '#a67c32', blouse: '#f4efe4', skirt: '#4b5170', apron: '#b9c5cf', apronDot: '#8a9aac', legs: '#c9ab96', shoe: '#6d5e7a', glasses: '#6a5a58', blush: '#eaa08e',
    hunch: 0.18, cheek: 1.08,
  },
  boy: {
    height: 441, headR: 52, neck: 6, torso: 112, hipW: 25, shW: 44, upperArm: 54, foreArm: 50, thigh: 80, shin: 78, footL: 36,
    skin: '#f3d2b4', skinSh: '#dcae8e', hair: '#3b2f31', hairDark: '#2a2124', top: '#f3f1ea', topDark: '#cfd0d6', shorts: '#34405f', legs: '#f3d2b4', sock: '#f4f2ec', shoe: '#6a82a3', cap: '#f2c632', capDark: '#d09c1c', blush: '#f0a08a',
    hunch: 0, cheek: 1.0,
  },
};

function defaults() {
  return {
    who: 'woman', yaw: 0, headYaw: 0, headNod: 0, headTilt: 0, bend: 0, lean: 0, bob: 0,
    walk: null, // { phase, stride, run }
    seat: null, // [x,y] pelvis target when sitting
    feet: null, // { L:[x,y], R:[x,y] }
    hands: null, // { L:[x,y], R:[x,y] } (L = person's left)
    arms: { L: [0.06, 0.18], R: [0.06, 0.18] }, // [shoulder swing, elbow] when no hand target
    face: { eyes: 'open', mouth: 'closed', brows: 0, look: [0, 0], blink: 0, tears: 0 },
    cap: true, prop: null, t: 0, knee: 0, wet: 0,
  };
}
function ik(root, target, a, b, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1]; let d = Math.hypot(dx, dy); d = Math.min(Math.max(d, Math.abs(a - b) + 0.01), a + b - 0.01);
  const ang = Math.atan2(dy, dx); const A = Math.acos(C.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)); const k = ang - bend * A;
  return [root[0] + Math.cos(k) * a, root[1] + Math.sin(k) * a];
}

// ---------------------------------------------------------------- head
function drawHead(ctx, cfg, p, st, who) {
  const R = cfg.headR; const yaw = p.yaw + p.headYaw; const fAz = yaw; // face azimuth: 0 camera
  // sphere point: azimuth a (0 toward camera, + toward screen right), elevation e (+ up)
  const P = (a, e, r = R) => [Math.sin(a) * Math.cos(e) * r, -Math.sin(e) * r, Math.cos(a) * Math.cos(e) * r];
  const vis = (v) => v[2] > -R * 0.15;
  const skin = cfg.skin, f = p.face;
  const skull = C.circlePts(0, 0, R * cfg.cheek, R, 32).map(([x, y]) => [x, y > 0 ? y * 1.02 : y]);
  // back hair / bun (behind head when facing camera)
  const bunV = P(fAz + Math.PI, 0.55, R * 0.95);
  const drawBun = () => { const bx = bunV[0], by = bunV[1] - 8; part(ctx, C.circlePts(bx, by, 25, 22, 18), cfg.hair, st, { shadeK: 5, lw: 3, seed: 3 }); line(ctx, [[bx - 14, by - 4], [bx + 4, by + 10]], st, { lw: 1.4, color: cfg.hairDark }); line(ctx, [[bx - 6, by - 14], [bx + 12, by + 2]], st, { lw: 1.4, color: cfg.hairDark }); };
  if (who === 'woman' && bunV[2] < 0) drawBun();
  if (who === 'woman') { // soft hair volume around the upper head, wider than the skull
    const vol = []; for (let i = 0; i <= 24; i++) { const a = Math.PI * 0.92 + i / 24 * Math.PI * 1.16; vol.push([Math.cos(a) * R * cfg.cheek * 1.16, -4 + Math.sin(a) * R * 1.1]); }
    part(ctx, vol, cfg.hair, st, { shadeK: 6, lw: 3.2, seed: 4 });
  }
  // ears
  for (const s of [-1, 1]) { const v = P(fAz + s * Math.PI / 2, -0.05, R * 0.98); if (v[2] > -R * 0.5 && Math.abs(v[0]) > R * 0.35) { part(ctx, C.circlePts(v[0], v[1] + 4, 9, 13, 12), skin, st, { shadeK: 2, lw: 2.4, seed: 5 }); } }
  // face (in profile the outline grows a nose and a chin)
  const side = Math.sin(fAz), prof = Math.abs(side);
  if (prof > 0.45 && Math.cos(fAz) > -0.3) {
    const sg = Math.sign(side); const k = (prof - 0.45) / 0.55; const idx = (i) => (i + 32) % 32;
    // skull point index nearest the nose direction
    const noseY = R * 0.2, chinY = R * 0.72;
    let best = 0, bd = 1e9; skull.forEach(([x, y], i) => { const d = Math.hypot(x - sg * R, y - noseY); if (d < bd) { bd = d; best = i; } });
    const nx = sg * (R * cfg.cheek + 9 * k), ny = noseY;
    skull.splice(best, 1, [sg * R * cfg.cheek * 0.98, noseY - 12], [nx, ny + 2], [sg * R * cfg.cheek * 0.97, ny + 10]);
  }
  part(ctx, skull, skin, st, { shadeK: 8, lw: 3.4, seed: 7 });
  // hair: cap of hair over the top/back, parting follows yaw
  const hairPts = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; hairPts.push([Math.cos(a) * R * cfg.cheek * 1.04, Math.sin(a) * R * 1.05]); }
  const fx = Math.sin(fAz) * R * 0.6, fr = Math.cos(fAz);
  if (who === 'woman') {
    // hairline: swept back from the forehead
    const hl = [[R * cfg.cheek * 1.04, -2], [R * 0.72, -R * 0.32], [fx + R * 0.35 * fr, -R * 0.52], [fx, -R * 0.62], [fx - R * 0.35 * fr, -R * 0.52], [-R * 0.72, -R * 0.32], [-R * cfg.cheek * 1.04, -2]];
    const hp = hairPts.concat(hl.slice().reverse().map(q => q)); // closed
    if (fr < -0.2) { part(ctx, skull, cfg.hair, st, { shadeK: 6, lw: 3.2, seed: 9 }); } else part(ctx, hairPts.concat(hl), cfg.hair, st, { shadeK: 5, lw: 3.0, seed: 9, smooth: false });
    for (let i = 0; i < 4; i++) { const x0 = fx + (i - 1.5) * 14 * fr; line(ctx, [[x0, -R * 0.6], [x0 * 1.2 + (i - 1.5) * 8, -R * 0.95]], st, { lw: 1.2, color: cfg.hairDark, alpha: 0.8 }); }
  } else {
    // boy: short messy hair with a fringe under the cap
    const fringe = [[-R * cfg.cheek * 1.04, -6], [-R * 0.7, -R * 0.2], [fx - R * 0.3, -R * 0.28], [fx - R * 0.1, -R * 0.15], [fx + R * 0.1, -R * 0.3], [fx + R * 0.35, -R * 0.2], [R * 0.7, -R * 0.25], [R * cfg.cheek * 1.04, -6]];
    if (fr < -0.2) part(ctx, skull, cfg.hair, st, { shadeK: 6, lw: 3.2, seed: 9 }); else part(ctx, hairPts.concat(fringe.slice().reverse()), cfg.hair, st, { shadeK: 4, lw: 3, seed: 9 });
  }
  if (who === 'woman' && bunV[2] >= 0) drawBun();
  if (p.pigtails) for (const sd of [-1, 1]) { const v = P(fAz + sd * Math.PI * 0.55, 0.1, R * 1.05); part(ctx, C.circlePts(v[0] + sd * 10, v[1] + 6, 13, 20, 14), cfg.hair, st, { shadeK: 3, lw: 2.6, seed: 17 }); C.celCircle(ctx, v[0] + sd * 4, v[1] - 8, 5, '#e05a6a'); }
  if (fr > -0.25) {
    // eyes
    const eyeY = who === 'boy' ? 6 : 4; const eyes = [-1, 1].map(s => P(fAz + s * 0.42, -0.08)).filter(vis);
    const look = f.look || [0, 0];
    for (const v of eyes) {
      const ex = v[0] + look[0] * 3, ey = v[1] + eyeY + look[1] * 3; const fs = C.clamp(0.4 + v[2] / R * 0.7, 0.35, 1);
      if (who === 'woman') {
        // round glasses
        if (!cfg.noGlasses) { ctx.save(); ctx.globalAlpha = 0.07; C.celEllipse(ctx, v[0], ey, 13 * fs, 12, '#ffffff'); ctx.restore();
        C.ink(ctx, C.circlePts(v[0], ey, 13 * fs, 12, 20), { closed: true, width: 1.6 * st.lw, color: cfg.glasses, seed: 21, wobble: 0.3, alpha: 0.85 }); }
        if (f.eyes === 'closed' || f.eyes === 'smile' || f.blink > 0.7) line(ctx, [[ex - 6 * fs, ey + (f.eyes === 'smile' ? 2 : 0)], [ex, ey - (f.eyes === 'smile' ? 3 : -1)], [ex + 6 * fs, ey + (f.eyes === 'smile' ? 2 : 0)]], st, { lw: 2.4 });
        else if (f.eyes === 'down') line(ctx, [[ex - 6 * fs, ey + 1], [ex + 6 * fs, ey + 2]], st, { lw: 2.6 });
        else { C.celEllipse(ctx, ex, ey + 1, 3.6 * fs, 4.4, st.ink); C.celCircle(ctx, ex + 1, ey - 0.5, 1.1, '#ffffff'); }
        const other = eyes.find(w => w !== v); if (!cfg.noGlasses && other && v[0] < other[0]) line(ctx, [[v[0] + 13 * fs, ey - 2], [(v[0] + other[0]) / 2, ey - 5], [other[0] - 13 * C.clamp(0.4 + other[2] / R * 0.7, 0.35, 1), ey - 2]], st, { lw: 1.5, color: cfg.glasses, taper: 0 });
        if (!cfg.noGlasses && (eyes.length === 1 || Math.abs(Math.sin(fAz)) > 0.3)) { const sg = v[0] > 0 ? -1 : 1; if (Math.sign(Math.sin(fAz)) === -sg || eyes.length === 1) line(ctx, [[v[0] + sg * 13 * fs, ey - 3], [v[0] + sg * 40, ey - 6]], st, { lw: 1.4, color: cfg.glasses, taper: 0 }); }
        // laugh lines at the outer corners
        const outer = v[0] > 0 ? 1 : -1; line(ctx, [[v[0] + outer * 17 * fs, ey + 2], [v[0] + outer * 21 * fs, ey + 5]], st, { lw: 1.1, alpha: 0.5 });
      } else if (who === 'adult') {
        if (f.eyes === 'closed' || f.blink > 0.7) line(ctx, [[ex - 5 * fs, ey], [ex + 5 * fs, ey]], st, { lw: 2.2 }); else C.celEllipse(ctx, ex, ey, 3 * fs, 3.8, st.ink);
      } else {
        // boy: big dark eyes
        if (f.eyes === 'closed' || f.blink > 0.7) line(ctx, [[ex - 7 * fs, ey], [ex, ey + 3], [ex + 7 * fs, ey]], st, { lw: 2.6 });
        else if (f.eyes === 'down') line(ctx, [[ex - 7 * fs, ey + 2], [ex, ey + 4], [ex + 7 * fs, ey + 2]], st, { lw: 2.6 });
        else { C.celEllipse(ctx, ex, ey, 6.5 * fs, 9, '#2e2226'); C.celEllipse(ctx, ex, ey + 3, 5 * fs, 5, '#5a3e36'); C.celCircle(ctx, ex + 2 * fs, ey - 3.5, 2.4, '#ffffff'); C.celCircle(ctx, ex - 1.5 * fs, ey + 3, 1, '#ffffff', 0.7); }
        if (f.tears > 0) { ctx.save(); ctx.globalAlpha = 0.7 * f.tears; C.celEllipse(ctx, ex, ey + 10, 5 * fs, 3, '#bfe2f2'); C.ink(ctx, [[ex + 2, ey + 11], [ex + 3, ey + 24]], { width: 2.5, color: '#bfe2f2', taper: 'end' }); ctx.restore(); }
      }
      // brows
      const bw = f.brows || 0; const inner = v[0] * fs < 0 ? 1 : -1;
      line(ctx, [[v[0] - 8 * fs, ey - 16 + (inner > 0 ? bw * 0 : -bw * 3)], [v[0] + 8 * fs, ey - 16 + (inner > 0 ? -bw * 3 : bw * 0)]].map(([x, y], i) => [x, y + (i === (inner > 0 ? 1 : 0) ? -bw * 2 : 0)]), st, { lw: who === 'boy' ? 2.8 : 2.0, color: who === 'woman' ? cfg.hairDark : st.ink });
    }
    // nose and mouth
    const n = P(fAz, -0.22); if (vis(n)) line(ctx, [[n[0] + 2 * Math.sign(Math.sin(fAz) || 1), n[1] + 4], [n[0] + 4 * Math.sign(Math.sin(fAz) || 1), n[1] + 10], [n[0], n[1] + 11]], st, { lw: 1.8 });
    const m = P(fAz, -0.45); if (vis(m)) {
      const mx = m[0], my = m[1] + 6;
      if (f.mouth === 'hum') { line(ctx, [[mx - 5, my], [mx + 5, my]], st, { lw: 2 }); C.celEllipse(ctx, mx, my + 5, 6, 2, cfg.skinSh, 0.5); }
      else if (f.mouth === 'smile') line(ctx, [[mx - 9, my - 2], [mx, my + 3], [mx + 9, my - 2]], st, { lw: 2.2 });
      else if (f.mouth === 'open' || f.mouth === 'o') { C.celEllipse(ctx, mx, my + 2, f.mouth === 'o' ? 4 : 7, f.mouth === 'o' ? 5 : 6, '#7a3a3a'); }
      else if (f.mouth === 'sad') line(ctx, [[mx - 7, my + 2], [mx, my - 1], [mx + 7, my + 2]], st, { lw: 2 });
      else if (f.mouth === 'wobble') line(ctx, [[mx - 7, my + 1], [mx - 3, my - 1], [mx + 1, my + 2], [mx + 6, my]], st, { lw: 2 });
      else line(ctx, [[mx - 6, my], [mx + 6, my + 0.5]], st, { lw: 1.9 });
      // blush
      ctx.save(); ctx.globalAlpha = who === 'boy' ? 0.45 : who === 'adult' ? 0 : 0.3; for (const s of [-1, 1]) { const c = P(fAz + s * 0.62, -0.32); if (vis(c)) C.celEllipse(ctx, c[0], c[1] + 4, 10, 5, cfg.blush); } ctx.restore();
      if (who === 'woman') { for (const s of [-1, 1]) { const c = P(fAz + s * 0.35, -0.5); if (vis(c)) line(ctx, [[c[0], c[1] - 2], [c[0] + s * 2, c[1] + 6]], st, { lw: 1, alpha: 0.35 }); } }
    }
  }
  // boy's yellow school hat: round crown, short brim all the way round
  if (who === 'boy' && p.cap) {
    const brimY = -R * 0.3; const bw = R * 1.3, bh = R * 0.26;
    C.celEllipse(ctx, 0, brimY + 4, bw, bh, cfg.capDark); if (!st.noLines) C.inkEllipse(ctx, 0, brimY + 4, bw, bh, { width: 2.6 * st.lw, seed: 33 });
    const crown = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; crown.push([Math.cos(a) * R * 1.0, brimY + Math.sin(a) * R * 0.95]); }
    crown.push([R, brimY + 6], [-R, brimY + 6]);
    part(ctx, crown, cfg.cap, st, { shadeK: 8, lw: 3.2, seed: 31 });
    line(ctx, [[-R * 0.98, brimY - 6], [R * 0.98, brimY - 6]], st, { lw: 5, color: cfg.capDark, taper: 0 });
    C.celCircle(ctx, 0, brimY - R * 0.95, 4.5, cfg.capDark);
    // reflective name patch
    const px = Math.sin(fAz) * R * 0.55; if (Math.cos(fAz) > -0.2) C.cel(ctx, rrect(px - 9, brimY - 34, 18, 12, 3), '#f7f3e4');
  }
}

// ---------------------------------------------------------------- body
function draw(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); p.face = Object.assign(defaults().face, pose.face || {}); p.arms = Object.assign(defaults().arms, pose.arms || {});
  const who = p.who, cfg = Object.assign({}, CFG[who], p.cfg || {}); const st = style(stIn); const anchors = {};
  const yaw = p.yaw, sy = Math.sin(yaw), cy = Math.cos(yaw), facing = Math.abs(sy) > 0.2 ? Math.sign(sy) : 0;
  const legLen = cfg.thigh + cfg.shin; const hipH = legLen + 6;
  // walk cycle
  let feet = p.feet, bob = p.bob, pelvis;
  const hipOff = (s) => s * cfg.hipW * cy; // s=+1 person's left (screen right when facing camera)
  if (p.seat) pelvis = p.seat.slice();
  else pelvis = [0, -hipH];
  if (!feet) {
    if (p.walk) {
      const { phase, stride = 1, run = 0 } = p.walk; const L = (run ? 150 : 70) * stride; const lift = (run ? 55 : 22) * stride; const dir = facing || 1;
      const leg = (ph) => { ph = (ph % 1 + 1) % 1; const duty = run ? 0.38 : 0.6; if (ph < duty) { const u = ph / duty; return [dir * (L / 2 - L * u) * Math.abs(sy) , 0]; } const u = (ph - duty) / (1 - duty); return [dir * (-L / 2 + L * C.ease.inOut(u)) * Math.abs(sy), -lift * Math.sin(Math.PI * u)]; };
      const l = leg(phase), r = leg(phase + 0.5); feet = { L: [hipOff(1) + l[0], l[1]], R: [hipOff(-1) + r[0], r[1]] };
      bob += (run ? 16 : 6) * Math.abs(Math.cos(phase * Math.PI * 2)); if (run) pelvis[1] += 18;
    } else feet = { L: [hipOff(1) + 4, 0], R: [hipOff(-1) - 4, 0] };
  }
  pelvis[1] -= bob;
  // torso: rotate about pelvis by bend (+ forward) and lean
  const fwd = facing || 0; const bend = p.bend + cfg.hunch * 0.3; const tAng = -Math.PI / 2 + fwd * bend + p.lean;
  const chest = [pelvis[0] + Math.cos(tAng) * cfg.torso, pelvis[1] + Math.sin(tAng) * cfg.torso];
  const neckTop = [chest[0] + Math.cos(tAng + fwd * cfg.hunch) * cfg.neck, chest[1] + Math.sin(tAng + fwd * cfg.hunch) * cfg.neck];
  const headC = [neckTop[0] + Math.cos(tAng + fwd * cfg.hunch * 1.5) * cfg.headR * 0.9 + fwd * p.headNod * 0.5, neckTop[1] + Math.sin(tAng) * cfg.headR * 0.9 + p.headNod];
  const perp = [Math.cos(tAng + Math.PI / 2), Math.sin(tAng + Math.PI / 2)]; // points screen-right-ish when upright? (tAng=-90 => perp=(1,0))
  const shoulder = (s) => [chest[0] + perp[0] * s * cfg.shW * cy - 6 * Math.cos(tAng), chest[1] + perp[1] * s * cfg.shW * cy + 14];
  const hip = (s) => [pelvis[0] + s * cfg.hipW * cy, pelvis[1]];
  // depth: person's left side toward camera when facing right (sy>0) => left is near
  const nearSide = sy > 0.2 ? 1 : sy < -0.2 ? -1 : 0;
  const isFar = (s) => nearSide !== 0 && s !== nearSide;
  // ---- legs
  const drawLeg = (s) => {
    const h = hip(s), ft = feet[s > 0 ? 'L' : 'R']; const kneeBend = facing ? facing : (s > 0 ? 0.3 : -0.3);
    const knee = ik(h, [ft[0], ft[1] - 10], cfg.thigh, cfg.shin, facing ? facing : (s > 0 ? 0.2 : -0.2));
    const far = isFar(s); const legCol = who === 'woman' || who === 'adult' ? cfg.legs : cfg.skin;
    const w = who === 'woman' ? 20 : who === 'adult' ? 30 : 22;
    if (!st.noLines) C.ink(ctx, [h, knee, [ft[0], ft[1] - 10]], { width: (w + 5) * st.lw, taper: 0, wobble: 0.4, seed: 41 + s });
    C.ink(ctx, [h, knee, [ft[0], ft[1] - 10]], { width: w * st.lw, color: far ? sh(legCol, st) : legCol, taper: 0, wobble: 0.2, seed: 43 + s });
    if (who === 'boy') { // socks + scraped knee
      C.ink(ctx, [[C.lerp(knee[0], ft[0], 0.7), C.lerp(knee[1], ft[1] - 10, 0.7)], [ft[0], ft[1] - 10]], { width: w * st.lw, color: far ? sh(cfg.sock, st) : cfg.sock, taper: 0, seed: 45 });
      if (s === -1 && p.knee > 0) { C.celEllipse(ctx, knee[0] + 2, knee[1] + 2, 7, 5, '#d8605a', 0.85 * p.knee); if (p.knee > 1) { C.cel(ctx, rrect(knee[0] - 9, knee[1] - 3, 18, 10, 3), '#f0d0a8'); } }
    }
    // shoe
    const dir = facing || (s > 0 ? 0.25 : -0.25); const fl = cfg.footL * (facing ? 1 : 0.55);
    const shoe = [[ft[0] - fl * 0.35 * Math.sign(dir || 1), ft[1] - 14], [ft[0] + fl * 0.75 * Math.sign(dir || 1), ft[1] - 10], [ft[0] + fl * 0.8 * Math.sign(dir || 1), ft[1] - 1], [ft[0] - fl * 0.4 * Math.sign(dir || 1), ft[1]]];
    part(ctx, shoe, far ? sh(cfg.shoe, st) : cfg.shoe, st, { shadeK: 2, lw: 2.6, seed: 47, smooth: true });
    anchors['foot' + (s > 0 ? 'L' : 'R')] = ft; anchors['knee' + (s > 0 ? 'L' : 'R')] = knee;
    return knee;
  };
  // ---- arms
  const drawArm = (s) => {
    const sh0 = shoulder(s); const key = s > 0 ? 'L' : 'R'; const far = isFar(s);
    let hand; let elbow;
    if (p.hands && p.hands[key]) { hand = p.hands[key]; elbow = ik(sh0, hand, cfg.upperArm, cfg.foreArm, -(facing || s)); }
    else { const [sw, el] = p.arms[key]; const side = facing ? facing : s; const a1 = Math.PI / 2 - side * (facing ? -sw : sw) * (facing ? 1 : 1); elbow = [sh0[0] + Math.cos(a1) * cfg.upperArm, sh0[1] + Math.sin(a1) * cfg.upperArm]; const a2 = a1 - side * el * (facing ? -1 : 1); hand = [elbow[0] + Math.cos(a2) * cfg.foreArm, elbow[1] + Math.sin(a2) * cfg.foreArm]; }
    const sleeve = cfg.top; const sw = who === 'woman' ? 24 : who === 'adult' ? 26 : 20;
    if (!st.noLines) C.ink(ctx, [sh0, elbow, hand], { width: (sw + 5) * st.lw, taper: 0, wobble: 0.5, seed: 51 + s });
    const scol = far ? sh(sleeve, st) : sleeve;
    if (who === 'woman' || who === 'adult') C.ink(ctx, [sh0, elbow, [C.lerp(elbow[0], hand[0], 0.85), C.lerp(elbow[1], hand[1], 0.85)]], { width: (who === 'adult' ? 26 : sw) * st.lw, color: scol, taper: 0, wobble: 0.2, seed: 53 });
    else { C.ink(ctx, [sh0, [C.lerp(sh0[0], elbow[0], 0.7), C.lerp(sh0[1], elbow[1], 0.7)]], { width: (sw + 2) * st.lw, color: scol, taper: 0, seed: 53 }); C.ink(ctx, [[C.lerp(sh0[0], elbow[0], 0.65), C.lerp(sh0[1], elbow[1], 0.65)], elbow, hand], { width: 13 * st.lw, color: far ? sh(cfg.skin, st) : cfg.skin, taper: 0, seed: 54 }); }
    C.celCircle(ctx, hand[0], hand[1], 11, st.ink); C.celCircle(ctx, hand[0], hand[1], 9, far ? sh(cfg.skin, st) : cfg.skin);
    anchors['hand' + key] = hand; anchors['elbow' + key] = elbow;
  };
  // draw order: far arm, far leg, (skirt), body, near leg, near arm
  const sides = nearSide === 0 ? [1, -1] : [-nearSide, nearSide];
  if (nearSide !== 0) drawArm(sides[0]);
  drawLeg(sides[0]); drawLeg(sides[1]);
  // ---- clothing / torso
  const tw = cfg.shW * (0.72 + 0.28 * Math.abs(cy)) + 10; const pw = cfg.hipW * (0.8 + 0.2 * Math.abs(cy)) + 18;
  const T = (u, v) => [pelvis[0] + (chest[0] - pelvis[0]) * u + perp[0] * v, pelvis[1] + (chest[1] - pelvis[1]) * u + perp[1] * v];
  if (who === 'woman') {
    // skirt: waist to hem, hem follows the knees/feet spread
    const fL = feet.L, fR = feet.R; const hemY = Math.min(-78, Math.max(fL[1], fR[1]) - 78) + (p.seat ? 40 : 0);
    const hx0 = Math.min(fL[0], fR[0]) - 34, hx1 = Math.max(fL[0], fR[0]) + 34;
    const skirt = [T(0.05, -pw), T(0.05, pw), [Math.max(hx1, pelvis[0] + pw + 14), hemY], [Math.min(hx0, pelvis[0] - pw - 14), hemY]];
    if (p.seat) { const kL = anchors.kneeL, kR = anchors.kneeR; const fdir = facing || 1; const kn = fdir > 0 ? (kL[0] > kR[0] ? kL : kR) : (kL[0] < kR[0] ? kL : kR); const ky = Math.min(kL[1], kR[1]);
      skirt.length = 0; skirt.push(T(0.05, -pw * fdir), T(0.05, pw * fdir), [kn[0] + 10 * fdir, ky - 16], [kn[0] + 22 * fdir, ky + 8], [kn[0] + 18 * fdir, ky + 84], [kn[0] - 44 * fdir, ky + 86], [pelvis[0] - pw * 1.1 * fdir, pelvis[1] + 26]); }
    part(ctx, skirt, cfg.skirt, st, { shadeK: 10, lw: 3.4, seed: 61, smooth: false });
    for (let i = 1; i < 4; i++) { const u = i / 4; line(ctx, [T(0.05, -pw + 2 * pw * u), [C.lerp(skirt[3][0], skirt[2][0], u), skirt[2][1] - 6]], st, { lw: 1.3, alpha: 0.4 }); }
  } else if (who === 'adult') {
    if (cfg.dress) { const hemY = pelvis[1] + 150; const sk = [T(0.02, -pw), T(0.02, pw), [pelvis[0] + pw + 30, hemY], [pelvis[0] - pw - 30, hemY]]; part(ctx, sk, cfg.skirt, st, { shadeK: 8, lw: 3, seed: 62 }); }
    else { const tr = [T(0.02, -pw), T(0.02, pw), [hip(1)[0] + 18, pelvis[1] + 30], [hip(-1)[0] - 18, pelvis[1] + 30]]; part(ctx, tr, cfg.legs, st, { shadeK: 5, lw: 3, seed: 62 }); }
  } else {
    // shorts
    const shorts = [T(0.02, -pw), T(0.02, pw), [hip(1)[0] + 20 * cy + 8, pelvis[1] + 44], [hip(-1)[0] - 20 * cy - 8, pelvis[1] + 44]];
    part(ctx, shorts, cfg.shorts, st, { shadeK: 6, lw: 3.2, seed: 62 });
  }
  const torso = who === 'adult' ? [T(-0.04, -pw * 1.05), T(-0.04, pw * 1.05), T(0.5, tw * 0.92), T(0.88, tw * 1.02), T(0.99, tw * 0.9), T(1.03, 0), T(0.99, -tw * 0.9), T(0.88, -tw * 1.02), T(0.5, -tw * 0.92)] : who === 'woman' ? [T(-0.08, -pw * 1.25), T(-0.08, pw * 1.25), T(0.45, tw * 1.05), T(0.82, tw * 0.95), T(0.98, tw * 0.55), T(1.03, 0), T(0.98, -tw * 0.55), T(0.82, -tw * 0.95), T(0.45, -tw * 1.05)] : [T(0.04, -pw * 0.95), T(0.04, pw * 0.95), T(0.78, tw * 1.02), T(0.97, tw * 0.62), T(1.02, 0), T(0.97, -tw * 0.62), T(0.78, -tw * 1.02)];
  // woman: hunched back bulge on the back side
  if (who === 'woman' && facing) { const b = T(0.7, -facing * tw * 1.18); torso.splice(facing > 0 ? 8 : 3, 0, b); }
  part(ctx, torso, cfg.top, st, { shadeK: 12, lw: 3.6, seed: 63, smooth: true });
  // front details shift with yaw
  const fx = sy * tw * 0.55, frontVis = cy > -0.1;
  if (who === 'woman') {
    if (frontVis) {
      const ap = [T(0.72, fx - tw * 0.55 * cy), T(0.72, fx + tw * 0.55 * cy), T(-0.28, fx + pw * 0.95 * cy), T(-0.28, fx - pw * 0.95 * cy)];
      part(ctx, ap, cfg.apron, st, { shadeK: 5, lw: 2.6, seed: 65 });
      for (let i = 0; i < 9; i++) { const q = T(0.6 - (i % 3) * 0.3, fx + ((i / 3 | 0) - 1) * pw * 0.45 * cy); C.celCircle(ctx, q[0], q[1], 2.5, cfg.apronDot, 0.8); }
      // blouse collar and cardigan buttons
      C.cel(ctx, [T(1.0, fx - 14 * cy), T(1.0, fx + 14 * cy), T(0.9, fx)], cfg.blouse);
      for (let i = 0; i < 3; i++) { const q = T(0.9 - i * 0.07, fx + tw * 0.62 * cy); C.celCircle(ctx, q[0], q[1], 3, cfg.topDark); }
    } else { // apron bow at the back
      const b = T(0.1, -fx); C.celEllipse(ctx, b[0] - 14, b[1], 14, 8, cfg.apron); C.celEllipse(ctx, b[0] + 14, b[1], 14, 8, cfg.apron); C.celCircle(ctx, b[0], b[1], 6, cfg.apron); line(ctx, [[b[0] - 4, b[1] + 4], [b[0] - 10, b[1] + 34]], st, { lw: 5, color: cfg.apron, taper: 0 });
    }
    // knitted texture lines on the cardigan
    for (let i = 0; i < 5; i++) line(ctx, [T(0.2 + i * 0.12, -tw * 0.8), T(0.22 + i * 0.12, -tw * 0.5)], st, { lw: 1, alpha: 0.25 });
  } else {
    if (frontVis) { C.cel(ctx, [T(1.0, fx - 12 * cy), T(1.0, fx + 12 * cy), T(0.86, fx)], cfg.topDark); line(ctx, [T(0.86, fx), T(0.1, fx)], st, { lw: 1.4, alpha: 0.5 }); for (let i = 0; i < 3; i++) { const q = T(0.75 - i * 0.22, fx); C.celCircle(ctx, q[0], q[1], 2.4, cfg.topDark); } }
  }
  // head
  ctx.save(); ctx.translate(headC[0], headC[1]); ctx.rotate(p.headTilt + fwd * cfg.hunch * 0.5);
  drawHead(ctx, cfg, p, st, who);
  ctx.restore();
  anchors.head = headC; anchors.pelvis = pelvis; anchors.chest = chest;
  if (nearSide !== 0) drawArm(sides[1]); else { drawArm(1); drawArm(-1); }
  // props held in the right hand
  if (p.prop === 'bag' && anchors.handR) { const h = anchors.handR; const bc = p.bagColor || '#f2efe6'; C.ink(ctx, [[h[0] - 14, h[1] + 30], h, [h[0] + 14, h[1] + 30]], { width: 3 * st.lw, color: C.mix(bc, '#000', 0.3), taper: 0 }); part(ctx, [[h[0] - 32, h[1] + 26], [h[0] + 32, h[1] + 26], [h[0] + 38, h[1] + 100], [h[0] - 38, h[1] + 100]], bc, st, { shadeK: 6, lw: 2.6, seed: 95 }); if (p.bagGreens) for (let i = 0; i < 3; i++) C.ink(ctx, [[h[0] - 14 + i * 12, h[1] + 30], [h[0] - 20 + i * 14, h[1] - 10]], { width: 5, color: '#6a9a4a', taper: 'end' }); }
  if (p.prop === 'kettle' && anchors.handR) { const h = anchors.handR; const k = [[h[0] - 30, h[1] + 20], [h[0] + 30, h[1] + 20], [h[0] + 36, h[1] + 64], [h[0] - 36, h[1] + 64]]; part(ctx, k, '#a9aeb0', st, { shadeK: 6, lw: 3, seed: 91, smooth: true }); line(ctx, [[h[0] - 22, h[1] + 20], [h[0], h[1] - 4], [h[0] + 22, h[1] + 20]], st, { lw: 3 }); C.ink(ctx, [[h[0] + 32, h[1] + 44], [h[0] + 56, h[1] + 30]], { width: 8 * st.lw, color: '#a9aeb0', taper: 'end' }); }
  if (p.prop === 'lantern' && anchors.handR) { const h = anchors.handR; C.ink(ctx, [h, [h[0], h[1] + 30]], { width: 2 * st.lw, color: st.ink, taper: 0 }); part(ctx, C.circlePts(h[0], h[1] + 58, 22, 30, 20), '#fff0c8', st, { shadeK: 0, lw: 2.4, seed: 93 }); anchors.lantern = [h[0], h[1] + 58]; }
  return anchors;
}
module.exports = { draw, defaults, CFG };
