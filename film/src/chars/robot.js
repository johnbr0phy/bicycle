'use strict';
// TETSU, the household robot. 2.5D rig: one definition, any yaw, any expression.
// Local units: ground at y=0, top of head at y=-296. Facing yaw: 0 = camera, +PI/2 = screen right.
const C = require('../engine/core');
const { style, sh, hi, part, line, rrect, lv } = require('./common');

const COL = {
  body: '#eee3c9', stripe: '#5f9b96', skirt: '#8f918a', skirtDark: '#6d6f6a', tire: '#3d3736', hub: '#b9b2a4',
  screen: '#22313a', screenHi: '#557079', eye: '#c9f6ff', eyeGlow: '#7fdcff', arm: '#aaa9a0', grip: '#8a8b84', neck: '#4f5052',
  rust: '#b0683e', antenna: '#5b5a58', ball: '#d65a48', batOff: '#474541', green: '#8fd08a', amber: '#f1c35a', red: '#ef6a5a', panel: '#d9ceb4',
};

function defaults() {
  return {
    yaw: 0, headYaw: 0, headTilt: 0, headNod: 0, lean: 0, bob: 0, squash: 0,
    armL: [0.18, 0.25, 0.4], armR: [0.18, 0.25, 0.4], // [shoulder swing, elbow bend, gripper open 0..1] (L = robot's left)
    antenna: 0, // spring deflection (radians)
    wheel: 0, battery: 4, batteryBlink: false, t: 0,
    screen: { mode: 'eyes', lookX: 0, lookY: 0, bright: 1, blink: 0, glyph: null },
    wet: 0, cloth: false,
  };
}

// Screen contents (drawn in screen-local coords: centre 0,0, radius ~ rx, ry)
function drawScreen(ctx, rx, ry, sc, st, t) {
  const b = sc.bright == null ? 1 : sc.bright; if (b <= 0.01 || sc.mode === 'off') return;
  const eye = sc.color || COL.eye, glow = COL.eyeGlow;
  const g = (fn) => { // draw a glyph with glow: fn(ctx, color, widthScale)
    ctx.save(); ctx.globalAlpha = b; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = glow; ctx.shadowBlur = 16 * C.ctxScale(ctx); fn(eye, 1); ctx.restore();
    ctx.save(); ctx.globalAlpha = b; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; fn(eye, 1); ctx.restore();
  };
  const lx = (sc.lookX || 0) * rx * 0.35, ly = (sc.lookY || 0) * ry * 0.35;
  const mode = sc.mode;
  if (mode === 'eyes' || mode === 'tired' || mode === 'sad' || mode === 'wide') {
    const blink = C.clamp(sc.blink || 0, 0, 1);
    const ew = mode === 'wide' ? 9 : 7.5, eh = (mode === 'wide' ? 15 : 13) * (1 - blink * 0.92);
    for (const s of [-1, 1]) {
      const cx = lx + s * rx * 0.36, cy = ly - 2;
      g((c, k) => {
        ctx.save();
        if (mode === 'tired' || mode === 'sad') { // eyelid: clip away the top of the eye
          const tilt = mode === 'sad' ? -s * 5 : 0, ly0 = cy - (mode === 'tired' ? 1 : 4);
          ctx.beginPath(); ctx.moveTo(cx - 30, ly0 + tilt); ctx.lineTo(cx + 30, ly0 - tilt); ctx.lineTo(cx + 30, cy + 40); ctx.lineTo(cx - 30, cy + 40); ctx.closePath(); ctx.clip();
        }
        ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(cx, cy, ew * (k > 1 ? 1.9 : 1), Math.max(1.4, eh) * (k > 1 ? 1.5 : 1), 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    }
    if (mode !== 'tired' && mode !== 'sad' && blink < 0.5) { // tiny catchlight
      ctx.save(); ctx.globalAlpha = 0.9 * b; ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(lx + s * rx * 0.36 - 2.2, ly - 6, 2, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    }
  } else if (mode === 'happy') {
    for (const s of [-1, 1]) g((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 4.5 * k; ctx.beginPath(); ctx.arc(lx + s * rx * 0.36, ly + 2, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    if (sc.blush !== false) { ctx.save(); ctx.globalAlpha = 0.45 * b; ctx.fillStyle = '#ff9aa8'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(lx + s * rx * 0.62, ly + 12, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  } else if (mode === 'question') {
    g((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.arc(0, -8, 11, Math.PI * 1.05, Math.PI * 2.35); ctx.quadraticCurveTo(0, 4, 0, 8); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 19, 3.2 * k, 0, Math.PI * 2); ctx.fill(); });
  } else if (mode === 'bike' || mode === 'bikeKid') {
    const s = mode === 'bikeKid' ? 0.72 : 1, ox = mode === 'bikeKid' ? -10 : 0;
    g((c, k) => {
      ctx.strokeStyle = c; ctx.lineWidth = 3 * k;
      const wx = 15 * s, wy = 8 * s, r = 9 * s;
      ctx.beginPath(); ctx.arc(ox - wx, wy, r, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(ox + wx, wy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox - wx, wy); ctx.lineTo(ox - 2 * s, wy); ctx.lineTo(ox + 6 * s, -8 * s); ctx.lineTo(ox + wx, wy); ctx.moveTo(ox - 2 * s, wy); ctx.lineTo(ox - 7 * s, -9 * s); ctx.moveTo(ox - 11 * s, -10 * s); ctx.lineTo(ox - 3 * s, -10 * s);
      ctx.moveTo(ox + 6 * s, -8 * s); ctx.lineTo(ox + 5 * s, -14 * s); ctx.lineTo(ox + 11 * s, -15 * s); ctx.stroke();
      // basket
      ctx.strokeRect(ox + 8 * s, -12 * s, 9 * s, 7 * s);
      if (mode === 'bikeKid') { // small figure pushing + tiny robot
        ctx.beginPath(); ctx.arc(ox - 25, -14, 3.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox - 25, -10); ctx.lineTo(ox - 23, 4); ctx.moveTo(ox - 25, -6); ctx.lineTo(ox - 14, -6); ctx.moveTo(ox - 23, 4); ctx.lineTo(ox - 27, 14); ctx.moveTo(ox - 23, 4); ctx.lineTo(ox - 19, 14); ctx.stroke();
        ctx.strokeRect(ox + 27, 2, 8, 9); ctx.beginPath(); ctx.arc(ox + 31, -2, 4, Math.PI, 0); ctx.stroke();
      }
    });
  } else if (mode === 'heart') {
    g((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-22, -2, -12, -18, 0, -6); ctx.bezierCurveTo(12, -18, 22, -2, 0, 12); ctx.fill(); });
  } else if (mode === 'battery') {
    g((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 3 * k; ctx.strokeRect(-16, -9, 30, 18); ctx.fillStyle = c; ctx.fillRect(15, -4, 4, 8); if ((t * 2 | 0) % 2 === 0) ctx.fillRect(-12, -5, 6, 10); });
  } else if (mode === 'house') {
    g((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, -14); ctx.lineTo(16, 0); ctx.moveTo(-11, -3); ctx.lineTo(-11, 13); ctx.lineTo(11, 13); ctx.lineTo(11, -3); ctx.stroke(); });
  } else if (mode === 'dots') { // thinking ellipsis
    for (let i = 0; i < 3; i++) { const on = ((t * 3 | 0) % 4) > i; g((c, k) => { ctx.fillStyle = c; ctx.globalAlpha *= on ? 1 : 0.25; ctx.beginPath(); ctx.arc(-14 + i * 14, 0, 3.4 * (k > 1 ? 1.8 : 1), 0, Math.PI * 2); ctx.fill(); }); }
  }
}

function drawArm(ctx, side, sx, sy, arm, st, zFront) {
  // side: +1 = screen right, -1 = screen left. arm=[swing, elbow, open]
  const [swing, elbow, open] = arm;
  const a1 = Math.PI / 2 - side * swing; // hanging straight down = PI/2
  const ex = sx + Math.cos(a1) * 36, ey = sy + Math.sin(a1) * 36;
  const a2 = a1 - side * elbow; const wx = ex + Math.cos(a2) * 32, wy = ey + Math.sin(a2) * 32;
  const lw = st.lw;
  const tube = (pts, w, col) => { if (!st.noLines) C.ink(ctx, pts, { width: (w + 5.4) * lw, color: st.ink, taper: 0, wobble: 0.5, seed: 21 }); C.ink(ctx, pts, { width: w * lw, color: col, taper: 0, wobble: 0.2, seed: 22 }); };
  const col = zFront ? COL.arm : sh(COL.arm, st);
  // shoulder cap
  tube([[sx, sy], [ex, ey]], 15, col); tube([[ex, ey], [wx, wy]], 13, col);
  // accordion rings on the forearm
  for (let i = 1; i <= 2; i++) { const u = i / 3; const rx0 = ex + (wx - ex) * u, ry0 = ey + (wy - ey) * u; const nx = -(wy - ey), ny = wx - ex, L = Math.hypot(nx, ny) || 1; line(ctx, [[rx0 - nx / L * 6, ry0 - ny / L * 6], [rx0 + nx / L * 6, ry0 + ny / L * 6]], st, { lw: 1.4, taper: 0 }); }
  // elbow joint
  C.celCircle(ctx, ex, ey, 9.5, st.ink); C.celCircle(ctx, ex, ey, 7, sh(col, st));
  C.celCircle(ctx, sx, sy, 12.5, st.ink); C.celCircle(ctx, sx, sy, 10, zFront ? COL.stripe : sh(COL.stripe, st));
  // gripper: two curved fingers
  const g = Math.atan2(wy - ey, wx - ex); const op = 0.25 + open * 0.55;
  for (const f of [-1, 1]) {
    const fa = g + f * op; const mid = [wx + Math.cos(fa) * 9, wy + Math.sin(fa) * 9]; const tip = [wx + Math.cos(g + f * op * 0.2) * 20, wy + Math.sin(g + f * op * 0.2) * 20];
    const pts = C.qbez([wx, wy], mid, tip, 6);
    if (!st.noLines) C.ink(ctx, pts, { width: 10.5 * lw, color: st.ink, taper: 'end', wobble: 0.3, seed: 23 + f });
    C.ink(ctx, pts, { width: 6 * lw, color: COL.grip, taper: 'end', wobble: 0.1, seed: 25 + f });
  }
  C.celCircle(ctx, wx, wy, 8.5, st.ink); C.celCircle(ctx, wx, wy, 6.2, COL.grip);
  return [wx + Math.cos(g) * 16, wy + Math.sin(g) * 16];
}

function drawWheel(ctx, x, y, r, yaw, rot, st, near) {
  const s = Math.abs(Math.sin(yaw)); const rx = Math.max(8.5, r * s);
  const tire = near ? COL.tire : C.mix(COL.tire, '#000', 0.1);
  C.celEllipse(ctx, x, y, rx, r, tire);
  if (!st.noLines) C.inkEllipse(ctx, x, y, rx, r, { width: 2.6 * st.lw, color: st.ink, seed: 31 });
  if (s > 0.25) {
    C.celEllipse(ctx, x, y, rx * 0.58, r * 0.58, near ? COL.hub : sh(COL.hub, st));
    ctx.save(); ctx.strokeStyle = C.mix(COL.hub, '#3a2c28', 0.5); ctx.lineWidth = 2.2 * st.lw; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = rot + i * Math.PI * 2 / 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rx * 0.56, y + Math.sin(a) * r * 0.56); ctx.stroke(); }
    ctx.restore(); C.celEllipse(ctx, x, y, rx * 0.16, r * 0.16, st.ink);
  } else {
    // edge-on: tread lines
    ctx.save(); ctx.strokeStyle = C.mix(COL.tire, '#fff', 0.15); ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { const yy = y + ((i * 11 + rot * 20) % 60) * 0.5; if (Math.abs(yy - y) < r * 0.85) { ctx.beginPath(); ctx.moveTo(x - rx * 0.6, yy); ctx.lineTo(x + rx * 0.6, yy); ctx.stroke(); } } ctx.restore();
  }
}

// Main draw. Returns anchors in local coordinates.
function draw(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); p.screen = Object.assign(defaults().screen, pose.screen || {});
  const st = style(stIn);
  const th = p.yaw, S = Math.sin(th), Co = Math.cos(th);
  const anchors = {};
  ctx.save();
  // bob / squash about the ground, lean about the ground contact
  ctx.translate(0, -p.bob); ctx.rotate(p.lean); ctx.scale(1 + p.squash * 0.5, 1 - p.squash);
  const wheelY = -30, wheelR = 30, axle = 64;
  const wL = { x: axle * Math.sin(th + Math.PI / 2), z: Math.cos(th + Math.PI / 2) }; // robot's left wheel
  const wR = { x: axle * Math.sin(th - Math.PI / 2), z: Math.cos(th - Math.PI / 2) };
  const caster = { x: 46 * Math.sin(th + Math.PI), z: Math.cos(th + Math.PI) };
  const shL = { x: 70 * Math.sin(th + Math.PI / 2), z: Math.cos(th + Math.PI / 2) }, shR = { x: 70 * Math.sin(th - Math.PI / 2), z: Math.cos(th - Math.PI / 2) };
  const wheelRot = p.wheel;
  // contact shadow drawn by compositor; here draw far elements
  // caster (behind)
  if (caster.z < 0.2) { C.celEllipse(ctx, caster.x, -10, Math.max(4, 10 * Math.abs(S)), 10, COL.tire); if (!st.noLines) C.inkEllipse(ctx, caster.x, -10, Math.max(4, 10 * Math.abs(S)), 10, { width: 2 * st.lw, seed: 41 }); line(ctx, [[caster.x, -10], [caster.x * 0.8, -30]], st, { lw: 3 }); }
  const far = [], nearArr = [];
  for (const [w, id] of [[wL, 'L'], [wR, 'R']]) (w.z > 0.35 ? nearArr : far).push([w, id]);
  for (const [w] of far) drawWheel(ctx, w.x, wheelY, wheelR, th, wheelRot, st, false);
  // far arms
  const armInfo = [[shL, p.armL, 'L'], [shR, p.armR, 'R']];
  for (const [s, a, id] of armInfo) if (s.z < -0.05) { const side = s.x >= 0 ? 1 : -1; anchors['grip' + id] = drawArm(ctx, side, s.x * 0.92, -166, a, st, false); }
  // skirt
  const skirt = [[-70, -62], [70, -62], [62, -20], [-62, -20]];
  part(ctx, skirt, COL.skirt, st, { shadeK: 14, lw: 3.4, seed: 51 });
  line(ctx, [[-66, -48], [66, -48]], st, { lw: 1.6, color: C.mix(COL.skirtDark, st.ink, 0.4), alpha: 0.8 });
  // vents on the skirt (move with yaw)
  for (let i = -2; i <= 2; i++) { const a = i * 0.28; const x = 58 * Math.sin(th + a); if (Math.cos(th + a) > 0.15) line(ctx, [[x, -40], [x, -28]], st, { lw: 2.2, color: COL.skirtDark }); }
  // body: slightly tapered rounded box
  const body = []; const addC = (cx, cy, r, a0, a1, n = 6) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; body.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  addC(66 - 26, -182 + 26, 26, -Math.PI / 2, 0); addC(76 - 16, -64 - 16, 16, 0, Math.PI / 2); addC(-76 + 16, -64 - 16, 16, Math.PI / 2, Math.PI); addC(-66 + 26, -182 + 26, 26, Math.PI, Math.PI * 1.5);
  part(ctx, body, COL.body, st, { shadeK: 18, lw: 4.2, seed: 61 });
  // stripe band (curved for cylinder feel)
  const band = []; for (let i = 0; i <= 12; i++) { const u = i / 12; const x = -69 + 138 * u; band.push([x, -160 + 4 * Math.sin(Math.PI * u)]); } for (let i = 12; i >= 0; i--) { const u = i / 12; const x = -70 + 140 * u; band.push([x, -146 + 5 * Math.sin(Math.PI * u)]); }
  ctx.save(); C.pathFrom(ctx, body); ctx.clip(); C.celShade(ctx, band, COL.stripe, sh(COL.stripe, st), lv(st), 16 * st.shadowK); ctx.restore();
  line(ctx, band.slice(0, 13), st, { lw: 1.8 }); line(ctx, band.slice(13), st, { lw: 1.8 });
  // front features (visible when facing forward-ish): battery panel
  const fx = 60 * S, fvis = Co; anchors.chest = [fx, -106];
  if (fvis > 0.05) {
    const pw = 46 * fvis, ph = 24; const pan = C.rrect ? null : null;
    const pr = rrect(fx - pw / 2, -118, pw, ph, 6);
    part(ctx, pr, COL.panel, st, { shadeK: 4, lw: 2.4, seed: 71 });
    const blinkOff = p.batteryBlink && ((p.t * 2.5) | 0) % 2 === 1;
    for (let i = 0; i < 4; i++) {
      const on = i < p.battery && !(blinkOff && i === p.battery - 1);
      const col = !on ? COL.batOff : p.battery >= 3 ? COL.green : p.battery === 2 ? COL.amber : COL.red;
      const bx = fx - pw / 2 + pw * (0.12 + i * 0.2), bw = pw * 0.14;
      ctx.save(); ctx.fillStyle = col; ctx.fillRect(bx, -113, bw, 14); if (on) { ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, -113, bw, 3); } ctx.restore();
    }
    // a small speaker grille
    for (let i = 0; i < 3; i++) { const x = fx + (i - 1) * 7 * fvis; C.celCircle(ctx, x, -80, 2, C.mix(COL.body, st.ink, 0.45)); }
  }
  // dent on robot's left shoulder + rust
  { const a = th + 0.95; const dx = 58 * Math.sin(a), dz = Math.cos(a); if (dz > 0.1) { const w = 14 * dz;
      const dent = [[dx - w, -170], [dx, -164], [dx + w, -168], [dx + w * 0.4, -176]];
      C.cel(ctx, dent, sh(COL.body, st), { smooth: true }); line(ctx, [[dx - w, -170], [dx, -163], [dx + w, -168]], st, { lw: 1.6 }); line(ctx, [[dx - w * 0.3, -160], [dx + w * 0.2, -156]], st, { lw: 1.1, alpha: 0.7 });
      C.celCircle(ctx, dx + w * 0.8, -158, 2.2, COL.rust, 0.8); C.celCircle(ctx, dx + w * 1.1, -154, 1.4, COL.rust, 0.7); } }
  for (const [ang, yy, r] of [[-0.6, -72, 2.4], [-0.45, -76, 1.6], [0.7, -70, 2], [-2.4, -90, 2]]) { const a = th + ang; if (Math.cos(a) > 0.1) C.celCircle(ctx, 66 * Math.sin(a), yy, r, COL.rust, 0.75); }
  // near wheels
  for (const [w] of nearArr) drawWheel(ctx, w.x, wheelY, wheelR, th, wheelRot, st, true);
  // neck
  C.cel(ctx, [[-17, -178], [17, -178], [15, -196], [-15, -196]], COL.neck);
  // head (pivot at 0,-192)
  const hth = th + p.headYaw, HS = Math.sin(hth), HC = Math.cos(hth);
  ctx.save(); ctx.translate(0, -192 + p.headNod); ctx.rotate(p.headTilt);
  const head = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); const k = 2.7; head.push([79 * Math.sign(c) * Math.pow(Math.abs(c), 2 / k), -50 + 52 * Math.sign(s) * Math.pow(Math.abs(s), 2 / k) * (s < 0 ? 1 : 0.9)]); }
  // ears (far)
  const earL = { x: 78 * Math.sin(hth + Math.PI / 2), z: Math.cos(hth + Math.PI / 2) }, earR = { x: 78 * Math.sin(hth - Math.PI / 2), z: Math.cos(hth - Math.PI / 2) };
  const drawEar = (e) => { const rx = Math.max(4, 14 * Math.abs(HS) + 5 * (1 - Math.abs(HS))); C.celEllipse(ctx, e.x, -48, rx, 16, e.z >= 0 ? COL.stripe : sh(COL.stripe, st)); if (!st.noLines) C.inkEllipse(ctx, e.x, -48, rx, 16, { width: 2.6 * st.lw, seed: 81 }); };
  for (const e of [earL, earR]) if (e.z < -0.2) drawEar(e);
  // antenna (drawn behind head top if it is on the far side)
  const antA = hth - 0.55; const ax = 44 * Math.sin(antA), az = Math.cos(antA);
  const drawAnt = () => {
    const base = [ax, -97]; const k1 = [ax + 4 + Math.sin(p.antenna) * 10, -120]; const bend = 0.55 + p.antenna;
    const tip = [k1[0] + Math.sin(bend) * 22, k1[1] - Math.cos(bend) * 22];
    if (!st.noLines) C.ink(ctx, [base, k1, tip], { width: 5.4 * st.lw, color: st.ink, taper: 0, wobble: 0.3, seed: 91 });
    C.ink(ctx, [base, k1, tip], { width: 2.4 * st.lw, color: COL.antenna, taper: 0, wobble: 0.1, seed: 92 });
    C.celCircle(ctx, tip[0], tip[1], 7.5, st.ink); C.celCircle(ctx, tip[0], tip[1], 5.6, COL.ball); C.celCircle(ctx, tip[0] - 1.8, tip[1] - 1.8, 1.8, '#ffd9cc');
    anchors.antennaTip = tip;
  };
  if (az < 0) drawAnt();
  part(ctx, head, COL.body, st, { shadeK: 16, lw: 4.2, seed: 101 });
  // plastic highlight on the dome (moves slightly with yaw)
  { const hx = -34 + 20 * HS; ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(hx, -86, 18, 6, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx + 24, -92, 5, 3, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  // teal cap line across the dome
  const cap = []; for (let i = 0; i <= 16; i++) { const u = i / 16; const x = -74 + 148 * u; cap.push([x, -80 - 10 * Math.sin(Math.PI * u)]); }
  line(ctx, cap, st, { lw: 1.6, alpha: 0.8 });
  // screen
  const sx = 46 * HS, sw = 50 * Math.pow(Math.max(0, HC), 0.85), shh = 37; anchors.screen = [sx, -46];
  if (HC > 0.05) {
    const scr = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const c = Math.cos(a), s = Math.sin(a); const k = 3.2; scr.push([sx + sw * Math.sign(c) * Math.pow(Math.abs(c), 2 / k), -46 + shh * Math.sign(s) * Math.pow(Math.abs(s), 2 / k)]); }
    // bezel
    const bez = scr.map(([x, y]) => [sx + (x - sx) * 1.12, -46 + (y + 46) * 1.14]);
    C.cel(ctx, bez, C.mix(COL.body, '#8a8474', 0.35));
    C.cel(ctx, scr, COL.screen);
    ctx.save(); C.pathFrom(ctx, scr); ctx.clip(); ctx.translate(sx, -46); ctx.scale(Math.max(0.05, Math.pow(HC, 0.85)), 1);
    drawScreen(ctx, 50, 37, p.screen, st, p.t);
    ctx.restore();
    // glass reflection
    ctx.save(); C.pathFrom(ctx, scr); ctx.clip(); ctx.globalAlpha = 0.22; ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx - sw * 0.1, -30, sw * 0.9, Math.PI * 1.15, Math.PI * 1.42); ctx.stroke(); ctx.restore();
    if (!st.noLines) C.ink(ctx, scr, { closed: true, width: 2.8 * st.lw, seed: 111 });
  }
  for (const e of [earL, earR]) if (e.z >= -0.2) drawEar(e);
  if (az >= 0) drawAnt();
  if (p.wet > 0) { ctx.save(); ctx.globalAlpha = 0.5 * p.wet; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = -50 + i * 25 + 6 * Math.sin(i * 3.1); ctx.beginPath(); ctx.moveTo(x, -92); ctx.lineTo(x + 1, -84 + (i % 2) * 5); ctx.stroke(); } ctx.restore(); }
  ctx.restore(); // head
  anchors.head = [0, -250 + p.headNod];
  // near arms
  for (const [s, a, id] of armInfo) if (s.z >= -0.05) { const side = s.x >= 0.5 ? 1 : s.x <= -0.5 ? -1 : (id === 'L' ? 1 : -1); anchors['grip' + id] = drawArm(ctx, side, s.x * 0.92, -166, a, st, true); }
  if (p.wet > 0) { ctx.save(); ctx.globalAlpha = 0.45 * p.wet; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = -60 + i * 24; ctx.beginPath(); ctx.moveTo(x, -150 + (i % 3) * 20); ctx.lineTo(x + 1, -140 + (i % 3) * 20); ctx.stroke(); } ctx.restore(); }
  if (p.cloth) { // folded tenugui cloth draped over the dented shoulder
    const a = th + 0.95, dx = 58 * Math.sin(a);
    const cl = [[dx - 34, -186], [dx + 22, -190], [dx + 30, -150], [dx + 20, -118], [dx + 6, -122], [dx + 4, -160], [dx - 30, -168]];
    part(ctx, cl, '#6f86b5', st, { shadeK: 8, lw: 3, seed: 121, smooth: true });
    for (let i = 0; i < 3; i++) C.celCircle(ctx, dx - 16 + i * 14, -176 + i * 8, 3, '#e9e4d6', 0.9);
    line(ctx, [[dx + 4, -160], [dx + 18, -128]], st, { lw: 1.6 });
  }
  ctx.restore();
  return anchors;
}

// Emissive pass: only the lit screen glyphs and battery bars, in exactly the same place as draw().
function drawEmissive(ctx, pose = {}, stIn = {}) {
  const p = Object.assign(defaults(), pose); p.screen = Object.assign(defaults().screen, pose.screen || {}); const st = style(stIn);
  const th = p.yaw, S = Math.sin(th), Co = Math.cos(th);
  ctx.save(); ctx.translate(0, -p.bob); ctx.rotate(p.lean); ctx.scale(1 + p.squash * 0.5, 1 - p.squash);
  const fx = 60 * S, fvis = Co;
  if (fvis > 0.05 && p.battery > 0) { const pw = 46 * fvis; const blinkOff = p.batteryBlink && ((p.t * 2.5) | 0) % 2 === 1; for (let i = 0; i < p.battery; i++) { if (blinkOff && i === p.battery - 1) continue; const col = p.battery >= 3 ? COL.green : p.battery === 2 ? COL.amber : COL.red; const bx = fx - pw / 2 + pw * (0.12 + i * 0.2), bw = pw * 0.14; ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = col; ctx.fillRect(bx, -113, bw, 14); ctx.restore(); } }
  const hth = th + p.headYaw, HS = Math.sin(hth), HC = Math.cos(hth);
  ctx.translate(0, -192 + p.headNod); ctx.rotate(p.headTilt);
  const sx = 46 * HS, sw = 50 * Math.pow(Math.max(0, HC), 0.85);
  if (HC > 0.05) { const scr = []; for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const c = Math.cos(a), s2 = Math.sin(a); const k = 3.2; scr.push([sx + sw * Math.sign(c) * Math.pow(Math.abs(c), 2 / k), -46 + 37 * Math.sign(s2) * Math.pow(Math.abs(s2), 2 / k)]); }
    ctx.save(); C.pathFrom(ctx, scr); ctx.clip(); ctx.translate(sx, -46); ctx.scale(Math.max(0.05, Math.pow(HC, 0.85)), 1); drawScreen(ctx, 50, 37, p.screen, st, p.t); ctx.restore(); }
  ctx.restore(); return {};
}
module.exports = { draw, drawEmissive, defaults, COL, HEIGHT: 300 };
