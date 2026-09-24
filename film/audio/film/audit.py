import os, sys, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from PIL import Image, ImageDraw, ImageFont
import score as SC
OUT = os.path.join(os.path.dirname(__file__), '../../out/audio')
W, H = 2400, 1400; img = Image.new('RGB', (W, H), (245, 240, 230)); d = ImageDraw.Draw(img)
try: F = ImageFont.truetype('/home/user/bicycle/film/fonts/KleeOne-Regular.ttf', 18)
except Exception: F = None
stems = ['music', 'ambience', 'effects', 'voice']; cols = [(60, 90, 170), (70, 150, 90), (200, 90, 60), (160, 60, 160)]
tot = SC.TOTAL + 1
def rms_db(x, win=0.1, sr=48000):
    x = x.mean(1) if x.ndim > 1 else x; n = int(win * sr); m = len(x) // n; r = np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1) + 1e-12); return 20 * np.log10(r)
for i, s in enumerate(stems + ['soundtrack']):
    x, sr = sf.read(os.path.join(OUT, ('stem_' + s if s != 'soundtrack' else s) + '.wav')); r = rms_db(x)
    y0 = 40 + i * 250; d.text((10, y0), s, fill=(0, 0, 0), font=F)
    for db in (-60, -40, -20): yy = y0 + 220 - (db + 70) * 3; d.line([(80, yy), (W, yy)], fill=(210, 205, 195)); d.text((40, yy - 10), str(db), fill=(120, 120, 120), font=F)
    pts = [(80 + k * 0.1 / tot * (W - 90), y0 + 220 - (max(-70, v) + 70) * 3) for k, v in enumerate(r)]
    d.line(pts, fill=cols[i] if i < 4 else (20, 20, 20), width=2)
for sh in SC.SHOTS:
    x = 80 + SC.START[sh['id']] / tot * (W - 90); d.line([(x, 20), (x, H)], fill=(180, 170, 160)); d.text((x + 3, 22), sh['id'], fill=(90, 80, 70), font=F)
img.save(os.path.join(OUT, 'audit_levels.png')); print('ok')
