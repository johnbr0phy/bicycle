const C = require('../src/engine/core'); const Lane = require('../src/sets/lane'); const LK = require('../src/engine/look');
const [x, y, z, yaw, pitch, name, tod, W] = process.argv.slice(2);
const cam = Lane.makeCam({ x: +x, y: +y, z: +z, yaw: +yaw, pitch: +pitch, W: +(W || 1920) });
const set = Lane.build({ tod: tod || 'night', cam, fg: false, homeDoor: 'open', raw: true });
const cv = C.createCanvas(cam.W, 1080), ctx = cv.getContext('2d'); ctx.drawImage(set.plate, 0, 0); LK.finish(ctx, cam.W, 1080, tod || 'night', 0);
require('fs').writeFileSync('out/tests/' + name + '.png', cv.toBuffer('image/png'));
