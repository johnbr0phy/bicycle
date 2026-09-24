# Contact sheet of every shot: 4 frames per shot (at 10%, 35%, 65%, 90%) from the rendered shot MP4s.
import json, os, subprocess
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); FILM = os.path.dirname(HERE); shots = json.load(open(os.path.join(FILM, 'src/shots.json')))
os.makedirs(os.path.join(FILM, 'out/review'), exist_ok=True)
import sys; ids = sys.argv[1:] or [s['id'] for s in shots]
for s in shots:
    if s['id'] not in ids: continue
    src = os.path.join(FILM, 'out/shots', s['id'] + '.mp4')
    if not os.path.exists(src): continue
    ims = []
    for f in (0.1, 0.35, 0.65, 0.9):
        png = f"/tmp/cs_{s['id']}_{f}.png"; subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(s['dur'] * f), '-i', src, '-frames:v', '1', png], check=True); ims.append(Image.open(png).resize((960, 540)))
    c = Image.new('RGB', (1920, 1080)); [c.paste(im, ((i % 2) * 960, (i // 2) * 540)) for i, im in enumerate(ims)]; c.save(os.path.join(FILM, 'out/review', s['id'] + '.png'))
print('ok')
