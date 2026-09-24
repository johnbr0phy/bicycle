const C = require('../src/engine/core'); const FX = require('../src/engine/fx'); const Lane = require('../src/sets/lane'); const LK = require('../src/engine/look');
const [x, y, z, yaw, pitch, name, door] = process.argv.slice(2);
const cam = Lane.makeCam({ x: +x, y: +y, z: +z, yaw: +yaw, pitch: +pitch });
const set = Lane.build({ tod: 'dawn', cam, fg: false, homeDoor: door || 'closed' });
const cv = C.createCanvas(1920, 1080), ctx = cv.getContext('2d'); ctx.drawImage(set.plate, 0, 0); LK.finish(ctx, 1920, 1080, 'dawn', 0);
require('fs').writeFileSync('out/tests/' + name + '.png', cv.toBuffer('image/png'));
