"""Segment ESC-50 clips of a category into isolated events and rank them.

    python tools/esc50_events.py CATEGORY [--out DIR] [--top 20] [--sort snr|f0|centroid]
Each event: start/end (s), dur, peak dB, SNR vs clip noise floor, gap before/after,
spectral centroid, rough f0 (autocorrelation, 80-1500 Hz) and harmonicity, clipping."""
import csv, json, os, sys
import numpy as np, soundfile as sf
from scipy import signal
ESC = "/home/user/refs/esc50"

def f0_of(seg, sr):
    seg = seg - seg.mean()
    if len(seg) < 1024: return 0.0, 0.0
    w = seg * np.hanning(len(seg))
    r = np.fft.irfft(np.abs(np.fft.rfft(w, 2*len(w)))**2)[:len(w)]
    r /= r[0] + 1e-20
    lmin, lmax = int(sr/1500), min(int(sr/80), len(r)-1)
    j = lmin + np.argmax(r[lmin:lmax])
    return sr / j, float(r[j])

def events(x, sr, rel_db=-30, min_gap=0.08):
    h = int(0.005*sr); k = len(x)//h
    e = 20*np.log10(np.sqrt((x[:k*h].reshape(k,h)**2).mean(1)) + 1e-9)
    e = np.convolve(e, np.ones(3)/3, "same")
    pk = e.max(); floor = max(np.percentile(e, 10), pk - 80)
    act = e > max(pk + rel_db, floor + 10)
    runs = []; i = 0
    while i < k:
        if act[i]:
            j = i
            while j < k and act[j]: j += 1
            if runs and (i - runs[-1][1]) * h / sr < min_gap:
                runs[-1][1] = j
            else:
                runs.append([i, j])
            i = j
        else:
            i += 1
    out = []
    for n, (a, b) in enumerate(runs):
        lo = runs[n-1][1] if n else 0
        hi = runs[n+1][0] if n+1 < len(runs) else k
        a2 = a
        while a2 > max(lo, a - int(0.15*sr/h)) and e[a2-1] > floor + 10: a2 -= 1
        b2 = b
        while b2 < min(hi, b + int(0.4*sr/h)) and e[b2] > floor + 10: b2 += 1
        out.append((a2*h, b2*h, e[a:b].max()))
    return out, floor, pk

def analyse(cat):
    rows = [r for r in csv.DictReader(open(f"{ESC}/meta/esc50.csv")) if r["category"] == cat]
    res = []
    for r in rows:
        x, sr = sf.read(f"{ESC}/audio/{r['filename']}", dtype="float64")
        evs, floor, pk = events(x, sr)
        clip = np.abs(x) > 0.985
        for n, (a, b, epk) in enumerate(evs):
            seg = x[a:b]
            if len(seg) < 0.03*sr: continue
            f, t, S = signal.stft(seg, sr, nperseg=512)
            P = np.abs(S)**2
            cen = float((f[:,None]*P).sum()/(P.sum()+1e-20))
            f0, hr = f0_of(seg[:int(0.3*sr)], sr)
            gap_b = a/sr - (evs[n-1][1]/sr if n else 0.0)
            gap_a = (evs[n+1][0]/sr if n+1 < len(evs) else len(x)/sr) - b/sr
            res.append(dict(file=r["filename"], src=r["src_file"], n_in_clip=len(evs), t0=round(a/sr,3), t1=round(b/sr,3),
                            dur=round((b-a)/sr,3), peak_db=round(20*np.log10(np.abs(seg).max()+1e-9),1),
                            snr=round(epk-floor,1), gap_before=round(gap_b,2), gap_after=round(gap_a,2),
                            centroid=round(cen), f0=round(f0), harm=round(hr,2), clipped=int(clip[a:b].sum())))
    return res

def sheet(cat, evs, out, n=20, pad=0.15):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    cols = 5; rows_ = int(np.ceil(min(n, len(evs))/cols))
    fig, axs = plt.subplots(rows_, cols, figsize=(20, 3.2*rows_))
    for ax, ev in zip(np.atleast_1d(axs).flat, evs[:n]):
        x, sr = sf.read(f"{ESC}/audio/{ev['file']}", dtype="float64")
        a = max(0, int((ev['t0']-pad)*sr)); b = min(len(x), int((ev['t1']+pad)*sr))
        f, t, S = signal.stft(x[a:b], sr, nperseg=512, noverlap=448)
        Sd = 20*np.log10(np.abs(S)+1e-9)
        ax.pcolormesh(t + a/sr, f, Sd, vmin=Sd.max()-75, vmax=Sd.max(), shading="auto", cmap="magma")
        ax.set_ylim(0, 12000)
        ax.set_title(f"{ev['file']} {ev['t0']}-{ev['t1']}\nsnr{ev['snr']} f0 {ev['f0']} h{ev['harm']} c{ev['centroid']} cl{ev['clipped']}", fontsize=9)
    fig.tight_layout(); fig.savefig(f"{out}/{cat}_events.png", dpi=50); plt.close(fig)

if __name__ == "__main__":
    a = sys.argv[1:]
    cat = a[0]; out = "."; top = 20; key = "snr"
    if "--out" in a: out = a[a.index("--out")+1]
    if "--top" in a: top = int(a[a.index("--top")+1])
    if "--sort" in a: key = a[a.index("--sort")+1]
    os.makedirs(out, exist_ok=True)
    evs = analyse(cat)
    flt = [e for e in evs if e["clipped"] == 0]
    flt.sort(key=lambda e: -e[key])
    json.dump(evs, open(f"{out}/{cat}_events.json", "w"), indent=0)
    for e in flt[:top]:
        print(e)
    sheet(cat, flt, out, top)
