"""Assemble the film: concatenate shot MP4s in shot-list order, mux the soundtrack, and make a 4:5 vertical cut."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); DEL = os.path.join(HERE, '..', 'deliverables'); os.makedirs(DEL, exist_ok=True)
shots = json.load(open(os.path.join(HERE, 'src/shots.json')))
# per-shot horizontal crop centre for the vertical cut (fraction of 1920): (start, end) for a slow pan-and-scan
CROP = {'S01': (.5, .5), 'S02': (.47, .47), 'S03': (.47, .5), 'S04': (.62, .55), 'S05': (.42, .4), 'S06': (.62, .5), 'S07': (.55, .55), 'S08': (.45, .38), 'S09': (.55, .55),
        'S10': (.5, .55), 'S11': (.62, .62), 'S12': (.5, .5), 'S13': (.4, .45), 'S14': (.25, .6), 'S15': (.45, .4), 'S16': (.5, .5), 'S17': (.55, .55), 'S18': (.4, .45),
        'S19': (.5, .5), 'S20': (.38, .38), 'S21': (.5, .5), 'S22': (.4, .4), 'S23': (.4, .45), 'S24': (.4, .48), 'S25': (.5, .5), 'S26': (.45, .6), 'S27': (.55, .55), 'S28': (.5, .5)}
def run(args): print(' '.join(args[:6]), '...'); subprocess.run(args, check=True)
lst = os.path.join(OUT, 'concat.txt')
with open(lst, 'w') as f:
    for s in shots: f.write(f"file '{os.path.join(OUT, 'shots', s['id'] + '.mp4')}'\n")
picture = os.path.join(OUT, 'picture.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', picture])
audio = os.path.join(OUT, 'audio', 'soundtrack.wav')
final = os.path.join(DEL, 'the_bicycle_1080p.mp4')
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', picture, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
     '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', final])
# vertical 4:5 (1080x1350): per-shot crop of 864x1080 with a linear pan, then scale 1.25x
parts = []
for s in shots:
    a, b = CROP.get(s['id'], (.5, .5)); d = s['dur']; src = os.path.join(OUT, 'shots', s['id'] + '.mp4'); dst = os.path.join(OUT, 'vert', s['id'] + '.mp4'); os.makedirs(os.path.dirname(dst), exist_ok=True)
    x = f"max(0,min(1920-864,({a}+({b}-{a})*t/{d})*1920-432))"
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vf', f"crop=864:1080:x='{x}':y=0,scale=1080:1350:flags=lanczos", '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst])
    parts.append(dst)
with open(lst, 'w') as f:
    for p in parts: f.write(f"file '{p}'\n")
vpic = os.path.join(OUT, 'picture_vert.mp4'); run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vpic])
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vpic, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', os.path.join(DEL, 'the_bicycle_vertical_4x5.mp4')])
print('done')
