'use strict';
// KOTARO, the red shiba. Side-view rig facing screen right (flip via placement for left).
// Moves like a spring: stiff legs, bouncy body, sudden freezes. Tail always curls over the dog's LEFT side:
// facing right (left side toward camera) the curl is in front of the back; facing left it sits behind.
// Units: robot units (353 per metre). Ground y=0. Shoulder height ~134.
const C = require('../engine/core'); const { style, sh, hi, part, line } = require('./common');
const COL = { red: '#d98a4e', redDark: '#b86c3c', cream: '#f5e8cf', nose: '#2d2426', eye: '#2a1d1b', collar: '#3f6fb2', tag: '#e0b84e', ear: '#e9b49c', tongue: '#e57a7d', mouthIn: '#6a2f33' };

function defaults() {
  return { gait: 'stand', phase: 0, stride: 1, bob: 0, pitch: 0, crouch: 0, sit: 0, headYaw: 0, headTilt: 0, headLift: 0, eyes: 'normal', blink: 0, ears: 'up', mouth: 'closed', tail: 1, wag: 0, t: 0, wet: 0, tongue: 0, shake: 0, legsOverride: null };
}
// 2-bone IK: from root to target with lengths a,b. bend: +1 knee forward (screen +x), -1 backward.
function ik(root, target, a, b, bend) {
  const dx = target[0] - root[0], dy = target[1] - root[1]; let d = Math.hypot(dx, dy); d = Math.min(d, a + b - 0.01);
  const ang = Math.atan2(dy, dx); const cosA = C.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1); const A = Math.acos(cosA);
  const k = ang - bend * A; return [root[0] + Math.cos(k) * a, root[1] + Math.sin(k) * a];
}
// Foot targets from gait. Returns {FL,FR,BL,BR:[x,y]} in body-local ground coords and a body bob.
function gaitFeet(p) {
  const rest = { FL: [58, 0], FR: [68, 0], BL: [-64, 0], BR: [-54, 0] };
  if (p.legsOverride) return { feet: p.legsOverride, bob: 0 };
  if (p.gait === 'stand' || p.gait === 'sit' || p.gait === 'crouch') return { feet: rest, bob: 0 };
  const L = 44 * p.stride, lift = 18 * p.stride; const out = {}; let bob = 0;
  const offs = p.gait === 'trot' ? { FL: 0, BR: 0, FR: 0.5, BL: 0.5 } : p.gait === 'walk' ? { BL: 0, FL: 0.25, BR: 0.5, FR: 0.75 } : { FL: 0, FR: 0.1, BL: 0.5, BR: 0.6 };
  const duty = p.gait === 'walk' ? 0.62 : p.gait === 'trot' ? 0.5 : 0.35;
  for (const k of Object.keys(rest)) {
    const ph = ((p.phase + offs[k]) % 1 + 1) % 1; let x, y;
    if (ph < duty) { const u = ph / duty; x = L / 2 - L * u; y = 0; } else { const u = (ph - duty) / (1 - duty); x = -L / 2 + L * C.ease.inOut(u); y = -lift * Math.sin(Math.PI * u); }
    out[k] = [rest[k][0] + x, y];
  }
  if (p.gait === 'trot') bob = 7 * p.stride * Math.abs(Math.sin(p.phase * Math.PI * 2));
  else if (p.gait === 'walk') bob = 3 * Math.sin(p.phase * Math.PI * 4);
  else if (p.gait === 'bound') bob = 26 * p.stride * Math.max(0, Math.sin(p.phase * Math.PI * 2));
  return { feet: out, bob };
}

function drawHead(ctx, p, st, flipped) {
  // local head space: centre (0,0), skull radius ~34; headYaw 0 = profile right, ~1.2 = three-quarter to camera
  const yaw = C.clamp(p.headYaw, 0, 1.45); const R = 34;
  const dir = (az, el, r) => [Math.cos(az) * Math.cos(el) * r, -Math.sin(el) * r, Math.sin(az) * Math.cos(el) * r];
  const face = -yaw + 0; // azimuth of the face direction: 0 = +x, turning toward camera = negative angle maps to z+
  const az = (a) => a; // helper
  // screen projection: x = X, y = Y; depth = Z (positive toward camera means az negative here)
  const fAz = -yaw; // face azimuth in our convention: point = (cos, -, -sin) so z toward camera = sin(yaw)
  const P = (a, el, r) => { const v = [Math.cos(a) * Math.cos(el) * r, -Math.sin(el) * r, -Math.sin(a) * Math.cos(el) * r]; return v; };
  // ears (far first)
  const ears = [{ a: fAz + 1.05, s: 'far' }, { a: fAz - 1.05, s: 'near' }].map(e => ({ ...e, v: P(e.a * 0.55 + fAz * 0.45, 1.05, R) }));
  const earBack = p.ears === 'back' ? 0.9 : p.ears === 'perk' ? -0.15 : 0;
  const drawEar = (e) => {
    const base = e.v; const sideK = e.s === 'near' ? 1 : -1; const bx = base[0] - 6 - earBack * 10, by = base[1] - 2;
    const tip = [bx + 6 - earBack * 26, by - 34 + earBack * 18];
    const pts = [[bx - 13, by + 4], tip, [bx + 13, by + 5]];
    const col = e.v[2] < -4 ? sh(COL.red, st) : COL.red;
    part(ctx, pts, col, st, { shadeK: 3, lw: 3, seed: 7 + (e.s === 'near' ? 1 : 0) });
    if (e.v[2] > -8 && earBack < 0.6) C.cel(ctx, [[bx - 7, by + 1], [tip[0] + 0.5, tip[1] + 9], [bx + 7, by + 2]], COL.ear);
  };
  const farEars = ears.filter(e => e.v[2] < 0), nearEars = ears.filter(e => e.v[2] >= 0);
  if (yaw < 0.3) { drawEar(ears[0]); } else farEars.forEach(drawEar);
  // skull + cheek ruff
  const skull = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; const cheek = (Math.sin(a) > 0.2 ? 5 : 0) * Math.max(0, Math.sin(a)); skull.push([Math.cos(a) * (R + cheek), Math.sin(a) * (R * 0.92 + cheek * 0.6)]); }
  // muzzle: from skull front toward the nose tip; shortened by yaw
  const mLen = 24 * Math.cos(yaw) + 5, mDrop = 11 + 4 * Math.sin(yaw);
  const tipX = (R - 6) * Math.cos(yaw) + mLen, tipY = mDrop;
  const mx = Math.cos(yaw) * (R - 10);
  const muzzle = [[mx - 6, -8], [tipX - 4, tipY - 12], [tipX + 3, tipY - 5], [tipX + 2, tipY + 5], [tipX - 8, tipY + 12], [mx - 4, tipY + 16], [mx - 18, 22]];
  // union fill: skull then muzzle
  C.celShade(ctx, skull, COL.red, sh(COL.red, st), [st.light[0], st.light[1]], 7);
  // cream urajiro: lower face + cheeks + muzzle
  ctx.save(); C.pathFrom(ctx, skull); ctx.clip();
  C.cel(ctx, [[mx - 30, 4], [R + 20, -2], [R + 20, R + 10], [-R * 0.3, R + 10]], COL.cream, { smooth: true });
  ctx.restore();
  C.cel(ctx, muzzle, COL.cream, { smooth: true });
  // red bridge of the nose on top of the muzzle
  C.cel(ctx, [[mx - 8, -10], [tipX - 8, tipY - 13], [tipX - 2, tipY - 8], [mx - 2, -1]], COL.red, { smooth: true });
  if (!st.noLines) {
    // silhouette line: skull top/back, then muzzle
    C.ink(ctx, skull.slice(15).concat(skull.slice(0, 3)), { width: 3.4 * st.lw, seed: 11, taper: 'both' });
    C.ink(ctx, C.smoothPts(muzzle, false).slice(0, 26), { width: 3 * st.lw, seed: 12, taper: 'both' });
    C.ink(ctx, skull.slice(3, 13), { width: 2.8 * st.lw, seed: 13, taper: 'both' });
  }
  // mouth
  const mo = p.mouth;
  if (mo === 'open' || mo === 'bark' || mo === 'pant') {
    const open = mo === 'bark' ? 16 : 9;
    const jaw = [[tipX - 6, tipY + 6], [mx - 8, tipY + 10], [mx - 12, tipY + 12 + open * 0.3], [tipX - 12, tipY + 8 + open], [tipX - 4, tipY + 8 + open * 0.5]];
    C.cel(ctx, [[tipX - 4, tipY + 5], [mx - 10, tipY + 9], [tipX - 12, tipY + 8 + open]], COL.mouthIn);
    C.cel(ctx, jaw, COL.cream, { smooth: true }); line(ctx, jaw, st, { lw: 2.2, seed: 14 });
    if (mo === 'pant' || p.tongue > 0) C.cel(ctx, [[tipX - 10, tipY + 10], [tipX - 2, tipY + 12 + 10 * (p.tongue || 1)], [tipX - 12, tipY + 20 + 10 * (p.tongue || 1)], [tipX - 16, tipY + 12]], COL.tongue, { smooth: true });
  } else if (mo === 'growl') {
    line(ctx, [[mx - 6, tipY + 9], [tipX - 8, tipY + 6], [tipX - 2, tipY + 9]], st, { lw: 2.2 });
    C.cel(ctx, [[tipX - 12, tipY + 5], [tipX - 3, tipY + 6], [tipX - 5, tipY + 10], [tipX - 11, tipY + 9]], '#fbf6ea'); // teeth
    line(ctx, [[tipX - 14, tipY - 8], [tipX - 8, tipY - 4]], st, { lw: 1.5 }); // wrinkle
  } else line(ctx, [[mx - 4, tipY + 10], [tipX - 8, tipY + 8], [tipX - 3, tipY + 6]], st, { lw: 2, seed: 15 });
  // nose
  C.celEllipse(ctx, tipX + 1, tipY - 5, 7, 5.5, COL.nose); C.celEllipse(ctx, tipX - 1, tipY - 7, 2.5, 1.5, '#8a7a80', 0.9);
  // eyes (near and, in three-quarter, far)
  const eyeAt = (a) => P(a, 0.22, R);
  const eyes = [eyeAt(fAz + 0.62), eyeAt(fAz - 0.62)].filter(v => v[2] > -12).map(v => [v[0] + 4 * Math.cos(yaw), v[1] - 6, v[2]]);
  if (yaw < 0.3) eyes.splice(0, eyes.length, [R * 0.42, -8, 1]);
  for (const [ex, ey, ez] of eyes) {
    const foreshort = C.clamp(0.55 + ez / R * 0.6, 0.45, 1);
    const blink = C.clamp(p.blink, 0, 1);
    // cream eyebrow dot
    C.celEllipse(ctx, ex - 3, ey - 12, 5 * foreshort, 3.4, COL.cream);
    if (p.eyes === 'happy') { line(ctx, [[ex - 7 * foreshort, ey + 1], [ex, ey - 4], [ex + 7 * foreshort, ey + 1]], st, { lw: 3 }); continue; }
    const h = (p.eyes === 'narrow' ? 3.2 : p.eyes === 'wide' ? 8 : 6.5) * (1 - blink * 0.9);
    C.celEllipse(ctx, ex, ey, 6.2 * foreshort, Math.max(1, h), COL.eye, 1, -0.15);
    if (blink < 0.5 && p.eyes !== 'narrow') C.celCircle(ctx, ex + 2 * foreshort, ey - 2.4, 1.9, '#ffffff', 0.95);
    if (p.eyes === 'narrow') line(ctx, [[ex - 9 * foreshort, ey - 6], [ex + 8 * foreshort, ey - 3]], st, { lw: 2.4 });
    // dark eye rim (shiba "eyeliner")
    line(ctx, [[ex - 7 * foreshort, ey + 1], [ex + 7 * foreshort, ey - 1]], st, { lw: 1.6, alpha: 0.7 });
  }
  if (yaw < 0.3) {} else nearEars.forEach(drawEar);
  if (yaw < 0.3) drawEar(ears[1]);
  if (p.wet > 0) { ctx.save(); ctx.globalAlpha = 0.7 * p.wet; for (let i = 0; i < 5; i++) line(ctx, [[-R + i * 12, -R + 4], [-R + i * 12 + 3, -R + 14]], st, { lw: 2, color: C.mix(COL.redDark, '#000', 0.2) }); ctx.restore(); }
  return { nose: [tipX + 1, tipY - 5], mouth: [tipX - 6, tipY + 10] };
}

function draw(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); const st = style(stIn); const flipped = !!stIn.flipped || !!p.mirrored;
  const anchors = {};
  const { feet, bob } = gaitFeet(p);
  const shake = p.shake ? Math.sin(p.t * 70) * 5 * p.shake : 0;
  ctx.save(); ctx.scale(0.86, 0.86);
  ctx.translate(shake * 0.4, -(bob + p.bob));
  // body pose: hips and shoulders (spine joints)
  const lie = C.clamp(p.lie || 0, 0, 1); const sit = Math.max(C.clamp(p.sit, 0, 1), lie), cr = C.clamp(p.crouch, 0, 1);
  let hip = [-60, -98 + cr * 6], sho = [54, -100 + cr * 34];
  hip = [C.lerp(hip[0], -34, sit), C.lerp(hip[1], -46, sit)]; sho = [C.lerp(sho[0], 24, sit), C.lerp(sho[1], -108, sit)];
  if (lie > 0) { hip = [C.lerp(hip[0], -50, lie), C.lerp(hip[1], -40, lie)]; sho = [C.lerp(sho[0], 50, lie), C.lerp(sho[1], -52, lie)]; }
  const pitch = Math.atan2(sho[1] - hip[1], sho[0] - hip[0]) + p.pitch;
  const mid = [(hip[0] + sho[0]) / 2, (hip[1] + sho[1]) / 2];
  const len = Math.hypot(sho[0] - hip[0], sho[1] - hip[1]);
  // body silhouette in spine-aligned frame: round rump, level back, deep chest, tucked belly
  const h2 = len / 2;
  const bodyLocal = [[-h2 - 30, 4], [-h2 - 26, -18], [-h2 - 6, -30], [-h2 + 30, -29], [0, -27], [h2 - 12, -30], [h2 + 16, -26], [h2 + 32, -8], [h2 + 34, 18], [h2 + 22, 38], [h2 - 4, 42], [h2 - 34, 34], [0, 24], [-h2 + 16, 24], [-h2 - 10, 30], [-h2 - 28, 20]];
  const ca = Math.cos(pitch), sa = Math.sin(pitch);
  const toW = ([x, y]) => [mid[0] + x * ca - y * sa, mid[1] + x * sa + y * ca];
  const body = bodyLocal.map(toW);
  const legCol = (far) => far ? sh(COL.red, st) : COL.red;
  const limb = (pts, w, far, seed) => { if (!st.noLines) C.ink(ctx, pts, { width: (w + 5.5) * st.lw, taper: 0, wobble: 0.5, seed }); C.ink(ctx, pts, { width: w * st.lw, color: legCol(far), taper: 0, wobble: 0.2, seed: seed + 1 }); };
  const pawAt = (x, y, far, seed) => { C.celEllipse(ctx, x + 6, y - 6, 13, 7.5, far ? sh(COL.cream, st) : COL.cream); if (!st.noLines) C.inkEllipse(ctx, x + 6, y - 6, 13, 7.5, { width: 2.4 * st.lw, seed }); line(ctx, [[x + 9, y - 10], [x + 10, y - 3]], st, { lw: 1.2, alpha: 0.6 }); };
  const drawFront = (key, far) => {
    const root = toW([h2 + 8, 6]); let paw;
    if (lie > 0.5) paw = [sho[0] + 62 + (far ? 10 : 0), 0]; else if (sit > 0.5) paw = [sho[0] + 12 + (far ? 10 : 0), 0]; else if (cr > 0) paw = [feet[key][0] + 30 * cr, 0]; else paw = [feet[key][0], feet[key][1]];
    const elbow = lie > 0.5 ? [root[0] + 18, -12] : ik(root, [paw[0], paw[1] - 7], 44, 46, 1);
    limb([root, elbow, [paw[0] + 2, paw[1] - 7]], far ? 18 : 20, far, 31);
    C.ink(ctx, [[elbow[0] + 3, elbow[1]], [paw[0] + 4, paw[1] - 8]], { width: 7 * st.lw, color: far ? sh(COL.cream, st) : COL.cream, taper: 'end', wobble: 0.2, seed: 35 });
    pawAt(paw[0], paw[1], far, 37); return paw;
  };
  const drawHind = (key, far) => {
    const root = toW([-h2 - 4, 10]);
    if (sit > 0.5) { // folded haunch: big thigh on the ground, paw forward
      const p2 = [hip[0] + 40 + (far ? 8 : 0), 0];
      const thigh = C.circlePts(hip[0] + 8, -32, 40, 32, 20).map(([x, y]) => [x, y]);
      if (!far) part(ctx, thigh, COL.red, st, { shadeK: 6, lw: 3.2, seed: 41 });
      limb([[hip[0] + 20, -12], [p2[0], -8]], 16, far, 43); pawAt(p2[0], 0, far, 44); return p2;
    }
    const paw = [feet[key][0], feet[key][1]]; const hock = [paw[0] - 14, paw[1] - 30];
    const knee = ik(root, hock, 40, 38, -1);
    limb([root, knee, hock, [paw[0] + 2, paw[1] - 7]], far ? 20 : 23, far, 45);
    C.ink(ctx, [hock, [paw[0] + 3, paw[1] - 8]], { width: 8 * st.lw, color: far ? sh(COL.cream, st) : COL.cream, taper: 'end', seed: 47 });
    pawAt(paw[0], paw[1], far, 48); return paw;
  };
  const tailBase = toW([-h2 - 22, -20]);
  const drawTail = (behind) => {
    const wag = Math.sin(p.t * 14) * 0.14 * p.wag; const k = p.tail;
    ctx.save(); ctx.translate(tailBase[0], tailBase[1]); ctx.rotate(wag + (sit > 0.5 ? -0.2 : pitch * 0.6));
    const ctrl = [[0, 0], [-9, -16], [-8, -36], [6, -50], [28, -50], [40, -36], [34, -20], [20, -17], [15, -27], [22, -33]].map(([x, y], i) => [x * (0.6 + 0.4 * k), y * (0.5 + 0.5 * k) + (1 - k) * i * 4]);
    const pts = C.smoothPts(ctrl, false, 5);
    const col = behind ? sh(COL.red, st) : COL.red;
    if (!st.noLines) C.ink(ctx, pts, { width: 30 * st.lw, taper: 'end', wobble: 0.4, seed: 51 });
    C.ink(ctx, pts, { width: 24 * st.lw, color: col, taper: 'end', wobble: 0.2, seed: 52 });
    C.ink(ctx, pts.slice(14), { width: 10 * st.lw, color: behind ? sh(COL.cream, st) : COL.cream, taper: 'end', wobble: 0.2, seed: 53 });
    ctx.restore();
  };
  if (flipped) drawTail(true);
  anchors.pawBL = drawHind('BL', true); anchors.pawFR = drawFront('FR', true);
  // neck mass joining body and head
  const headC = toW([h2 + 38 + p.headLift * 4, -52 - p.headLift * 16 + cr * 20 + (p.lie ? -8 + (p.headDown || 0) * 34 : 0)]);
  const neck = [toW([h2 - 14, -28]), [headC[0] - 30, headC[1] - 14], [headC[0] + 8, headC[1] + 26], toW([h2 + 32, 8])];
  part(ctx, neck, COL.red, st, { shadeK: 5, lw: 3.4, seed: 60, smooth: true });
  C.cel(ctx, [[headC[0] + 4, headC[1] + 22], toW([h2 + 30, 6]), toW([h2 + 14, 0]), [headC[0] - 10, headC[1] + 18]], COL.cream, { smooth: true });
  // body
  part(ctx, body, COL.red, st, { shadeK: 9, lw: 3.8, seed: 61, smooth: true });
  ctx.save(); C.pathFrom(ctx, body, true, true); ctx.clip();
  C.cel(ctx, [toW([-h2 + 4, 20]), toW([h2 - 20, 22]), toW([h2 + 18, 4]), toW([h2 + 40, -6]), toW([h2 + 40, 50]), toW([-h2, 50])], COL.cream, { smooth: true });
  ctx.restore();
  // haunch (near side) gives the hind leg some muscle
  if (sit <= 0.5) { const hc = toW([-h2 + 4, 4]); const th = C.circlePts(hc[0], hc[1], 30, 34, 20); C.celShade(ctx, th, COL.red, sh(COL.red, st), st.light, 6); line(ctx, th.slice(8, 17), st, { lw: 2.2 }); }
  line(ctx, [toW([-h2 + 14, -27]), toW([-h2 + 20, -32]), toW([-h2 + 25, -27])], st, { lw: 1.6, alpha: 0.6 });
  anchors.pawBR = drawHind('BR', false); anchors.pawFL = drawFront('FL', false);
  if (!flipped) drawTail(false);
  // collar
  const cA = [neck[0][0] + 14, neck[0][1] - 4], cB = [neck[3][0] - 2, neck[3][1] - 6];
  C.ink(ctx, [cA, [(cA[0] + cB[0]) / 2 + 8, (cA[1] + cB[1]) / 2 - 2], cB], { width: 10 * st.lw, color: COL.collar, taper: 0, wobble: 0.2, seed: 71 });
  C.celCircle(ctx, cB[0] + 2, cB[1] + 8, 6, COL.tag); C.celCircle(ctx, cB[0] + 0.5, cB[1] + 6.5, 2, '#fff3c0'); anchors.collar = [cB[0], cB[1]]; anchors.tag = [cB[0] + 2, cB[1] + 8];
  ctx.save(); ctx.translate(headC[0], headC[1]); ctx.rotate(p.headTilt); ctx.scale(1.28, 1.28);
  const ha = drawHead(ctx, p, st, flipped);
  ctx.restore();
  const hs = 1.28; anchors.head = headC; anchors.nose = [headC[0] + ha.nose[0] * hs, headC[1] + ha.nose[1] * hs]; anchors.mouth = [headC[0] + ha.mouth[0] * hs, headC[1] + ha.mouth[1] * hs];
  if (p.wet > 0) { ctx.save(); ctx.globalAlpha = 0.6 * p.wet; for (let i = 0; i < 9; i++) { const q = toW([-len / 2 + i * len / 8, 30]); line(ctx, [q, [q[0] + 1, q[1] + 10]], st, { lw: 2.4, color: C.mix(COL.redDark, '#000', 0.25) }); } ctx.restore(); }
  ctx.restore();
  for (const k in anchors) anchors[k] = [anchors[k][0] * 0.86, anchors[k][1] * 0.86];
  return anchors;
}
module.exports = { draw, defaults, COL };
