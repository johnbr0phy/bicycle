"""Survey ESC-50 categories: per-clip features + contact-sheet spectrograms.

    python tools/esc50_survey.py dog cat ... [--out DIR]
Writes DIR/<category>.png (grid of spectrograms annotated with features) and
DIR/<category>.json (features per clip). Used to hand-pick the clips in sfx.ESC_PICKS."""
import csv, json, os, sys
import numpy as np, soundfile as sf
from scipy import signal
ESC = "/home/user/refs/esc50"

def features(x, sr):
    x = x.astype(np.float64)
    pk = np.abs(x).max() + 1e-12
    h = int(0.01 * sr)
    k = len(x) // h
    e = np.sqrt((x[:k*h].reshape(k, h) ** 2).mean(1) + 1e-20)
    edb = 20*np.log10(e/pk)
    active = (edb > -30).mean() * len(x) / sr
    floor = np.percentile(edb, 10)
    # onsets: rises of >9 dB within 50 ms above -35 dB
    sm = np.convolve(edb, np.ones(3)/3, 'same')
    d = sm[5:] - sm[:-5]
    on = np.where((d[1:] > 9) & (d[:-1] <= 9) & (sm[6:] > -35))[0]
    # merge onsets closer than 120 ms
    ons = []
    for o in on:
        if not ons or o - ons[-1] > 12: ons.append(o)
    f, t, S = signal.stft(x, sr, nperseg=1024)
    P = np.abs(S) ** 2
    loud = P.sum(0) > 0.1 * P.sum(0).max()
    Pl = P[:, loud] if loud.any() else P
    cent = float((f[:, None] * Pl).sum() / (Pl.sum() + 1e-20))
    flat = float(np.exp(np.mean(np.log(Pl + 1e-20), 0)).mean() / (Pl.mean(0).mean() + 1e-20))
    gm = np.exp(np.mean(np.log(Pl + 1e-20), 0)); am = Pl.mean(0)
    flat = float(np.median(gm / (am + 1e-20)))
    clip = int((np.abs(x) > 0.99).sum())
    return dict(rms_db=round(float(20*np.log10(np.sqrt((x**2).mean())+1e-12)), 1),
                peak_db=round(float(20*np.log10(pk)), 1), active_s=round(float(active), 2),
                floor_db=round(float(floor), 1), onsets=len(ons),
                onset_t=[round(o*0.01+0.03, 2) for o in ons][:12],
                centroid=round(cent), flatness=round(flat, 3), clipped=clip)

def survey(cat, out):
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    rows = [r for r in csv.DictReader(open(f"{ESC}/meta/esc50.csv")) if r["category"] == cat]
    res = []
    fig, axs = plt.subplots(8, 5, figsize=(25, 26))
    for ax, r in zip(axs.flat, rows):
        x, sr = sf.read(f"{ESC}/audio/{r['filename']}", dtype="float32")
        ft = features(x, sr); ft.update(file=r["filename"], src=r["src_file"], take=r["take"])
        res.append(ft)
        f, t, S = signal.stft(x, sr, nperseg=1024, noverlap=768)
        Sd = 20*np.log10(np.abs(S) + 1e-9)
        ax.pcolormesh(t, f, Sd, vmin=Sd.max()-80, vmax=Sd.max(), shading="auto", cmap="magma")
        ax.set_ylim(0, 16000)
        ax.set_title(f"{r['filename']} pk{ft['peak_db']} fl{ft['floor_db']} on{ft['onsets']} c{ft['centroid']} F{ft['flatness']} cl{ft['clipped']}", fontsize=8)
        ax.set_xticks([0,1,2,3,4,5]); ax.tick_params(labelsize=6)
    fig.tight_layout(); fig.savefig(f"{out}/{cat}.png", dpi=45); plt.close(fig)
    json.dump(res, open(f"{out}/{cat}.json", "w"), indent=1)
    return res

if __name__ == "__main__":
    args = sys.argv[1:]
    out = "."
    if "--out" in args:
        i = args.index("--out"); out = args[i+1]; args = args[:i] + args[i+2:]
    os.makedirs(out, exist_ok=True)
    for c in args:
        survey(c, out); print("done", c)
