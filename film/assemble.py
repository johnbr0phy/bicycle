"""Assemble the film: concatenate shot MP4s in shot-list order, mux the soundtrack, and make a 4:5 vertical cut."""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); DEL = os.path.join(HERE, '..', 'deliverables'); os.makedirs(DEL, exist_ok=True)
shots = json.load(open(os.path.join(HERE, 'src/shots.json')))
# per-shot horizontal crop centre for the vertical cut (fraction of 1920): (start, end) for a slow pan-and-scan
CROP = {'S01': (.5, .5), 'S02': (.47, .47), 'S03': (.47, .5), 'S04': (.62, .55), 'S05': (.42, .4), 'S06': (.62, .5), 'S07': (.68, .7), 'S08': (.54, .54), 'S09': (.55, .55),
        'S10': (.6, .68), 'S11': (.62, .62), 'S12': (.5, .5), 'S13': (.4, .45), 'S14': (.25, .6), 'S15': (.45, .4), 'S16': (.5, .5), 'S17': (.55, .55), 'S18': (.4, .45),
        'S19': (.5, .5), 'S20': (.38, .38), 'S21': (.5, .5), 'S22': (.4, .4), 'S23': (.4, .45), 'S24': (.4, .48), 'S25': (.5, .5), 'S26': (.32, .56), 'S27': (.55, .55), 'S28': (.5, .5)}
def run(args): print(' '.join(args[:6]), '...'); subprocess.run(args, check=True)
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'   # all | main | vertical
audio = os.path.join(OUT, 'audio', 'soundtrack.wav'); lst = os.path.join(OUT, 'concat.txt')
def concat(paths, dst):
    with open(lst, 'w') as f:
        for p in paths: f.write(f"file '{p}'\n")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', dst])
def encode(src, dst, vbit, abit='192k', vf=None):
    """Two-pass x264 at a target bitrate so each file lands under a known size (GitHub 100 MB, chat 30 MB)."""
    base = ['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-i', audio, '-map', '0:v', '-map', '1:a'] + (['-vf', vf] if vf else []) + ['-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-b:v', vbit, '-pix_fmt', 'yuv420p', '-profile:v', 'high']
    plog = os.path.join(OUT, 'x264pass')
    run(base + ['-pass', '1', '-passlogfile', plog, '-an', '-f', 'mp4', os.devnull])
    run(base + ['-pass', '2', '-passlogfile', plog, '-c:a', 'aac', '-b:a', abit, '-ar', '48000', '-movflags', '+faststart', '-shortest', dst])
if MODE in ('all', 'main'):
    picture = os.path.join(OUT, 'picture.mp4'); concat([os.path.join(OUT, 'shots', s['id'] + '.mp4') for s in shots], picture)
    encode(picture, os.path.join(DEL, 'the_bicycle_1080p.mp4'), '3000k')
    encode(picture, os.path.join(DEL, 'the_bicycle_preview_720p.mp4'), '820k', '96k', 'scale=1280:720:flags=lanczos')
if MODE in ('all', 'vertical'):
    # vertical 4:5 (1080x1350): per-shot crop of 864x1080 with a linear pan, then scale 1.25x; the credits are
    # letterboxed on their own paper colour instead, so no line of text is cut
    parts = []
    for s in shots:
        a, b = CROP.get(s['id'], (.5, .5)); d = s['dur']; src = os.path.join(OUT, 'shots', s['id'] + '.mp4'); dst = os.path.join(OUT, 'vert', s['id'] + '.mp4'); os.makedirs(os.path.dirname(dst), exist_ok=True)
        x = f"max(0,min(1920-864,({a}+({b}-{a})*t/{d})*1920-432))"
        vf = "scale=1080:608:flags=lanczos,pad=1080:1350:0:371:color=0xe0d3c0" if s['id'] == 'S28' else f"crop=864:1080:x='{x}':y=0,scale=1080:1350:flags=lanczos"
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', dst])
        parts.append(dst)
    vpic = os.path.join(OUT, 'picture_vert.mp4'); concat(parts, vpic)
    encode(vpic, os.path.join(DEL, 'the_bicycle_vertical_4x5.mp4'), '2400k')
print('done')
