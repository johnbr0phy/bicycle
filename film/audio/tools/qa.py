"""QA for rendered audio: python tools/qa.py FILE.wav [...]  (or a directory)
Reports peak dBFS, DC offset, edge sample values, and click candidates: 2 ms frames whose
>7 kHz energy jumps > thr dB above the median of the surrounding +-60 ms."""
import os, sys, glob
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import mix

def clicks(x, sr=48000, thr=22.0):
    m = mix.as_mono(x)
    if len(m) < sr * 0.05:
        return []
    hp = mix.highpass(m, 7000, sr, 4)
    h = int(0.002 * sr); k = len(hp) // h
    e = 10 * np.log10((hp[:k*h].reshape(k, h) ** 2).mean(1) + 1e-14)
    from scipy.ndimage import median_filter
    med = median_filter(e, size=61, mode="nearest")
    lvl = 20*np.log10(np.abs(m).max()+1e-12)
    idx = np.where((e - med > thr) & (e > lvl*1 - 70))[0]
    out = []
    for i in idx:
        if not out or i - out[-1] > 10: out.append(i)
    return [round(i * h / sr, 3) for i in out]

def qa(path):
    x, sr = sf.read(path, dtype="float32")
    pk = 20*np.log10(np.abs(x).max()+1e-12)
    dc = float(np.abs(x.mean(axis=0)).max())
    e0 = float(np.abs(x[:1]).max()); e1 = float(np.abs(x[-1:]).max())
    c = clicks(x, sr)
    flag = []
    if pk > -1.0: flag.append("PEAK")
    if dc > 1e-3 and len(x) > 0.5 * sr: flag.append("DC")  # mean of a short transient is not DC
    if max(e0, e1) > 1e-3: flag.append("EDGE")
    if c: flag.append(f"CLICK?{c[:6]}")
    return pk, dc, e0, e1, flag

if __name__ == "__main__":
    files = []
    for a in sys.argv[1:]:
        files += sorted(glob.glob(os.path.join(a, "*.wav"))) if os.path.isdir(a) else [a]
    bad = 0
    for f in files:
        pk, dc, e0, e1, flag = qa(f)
        bad += bool(flag)
        print(f"{os.path.basename(f):32s} peak {pk:6.1f} dc {dc:.1e} edges {e0:.1e}/{e1:.1e} {' '.join(flag)}")
    print(f"{len(files)} files, {bad} flagged")
