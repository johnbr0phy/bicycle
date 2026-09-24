'use strict';
// S02: The empty spot. Locked wide at robot height. Only the noren moves. Title card.
const C = require('../engine/core'); const Lane = require('../sets/lane'); const { cached } = require('../engine/cache'); const P = require('../props'); const T = require('../title');
module.exports = {
  smooth: false,
  async setup() {
    const cam = Lane.makeCam(); let set = null; const get = () => (set = set || Lane.build({ tod: 'dawn', cam }));
    const plate = await cached('lane_dawn_A_v3_plate', () => get().plate); const fg = await cached('lane_dawn_A_v3_fg', () => get().fg);
    const anim = set ? set.anim : { noren: [{ side: -1, hw: 2.25, z0: 6.85, z1: 8.95 }, { side: 1, hw: 2.25, z0: 12.5, z1: 14.9 }] };
    return { cam, plate, fg, anim };
  },
  frame(ctx, t, s, env) {
    ctx.drawImage(s.plate, 0, 0);
    for (const n of s.anim.noren) P.noren(ctx, s.cam, n, env.dt, { wind: 0.8, color: '#66687e' });
    ctx.drawImage(s.fg, 0, 0);
  },
  after(ctx, t, s, env) {
    const a = C.seg(t, 1.6, 3.4) * (1 - C.seg(t, 5.3, 6.0));
    T.inkText(ctx, '自転車', 884, 150, { size: 124, vertical: true, alpha: a, color: '#2c2230', font: 'YujiMai' });
    T.seal(ctx, 944, 488, 34, a);
    T.inkText(ctx, 'THE  BICYCLE', 884, 560, { size: 30, font: 'Shippori', alpha: a * 0.9, spacing: 0.32, color: '#3a2c34' });
  },
};
