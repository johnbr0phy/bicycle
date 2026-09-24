"""Full-clip spectrograms of specific ESC-50 files: python tools/esc50_view.py OUT.png FILE [FILE...] [--fmax 12000]"""
import sys, numpy as np, soundfile as sf
from scipy import signal
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
a = sys.argv[1:]; fmax = 12000
if "--fmax" in a: i = a.index("--fmax"); fmax = float(a[i+1]); a = a[:i] + a[i+2:]
out, files = a[0], a[1:]
rows = int(np.ceil(len(files)/2))
fig, axs = plt.subplots(rows*2, 2, figsize=(20, 4.2*rows), gridspec_kw=dict(height_ratios=[1,3]*rows))
axs = np.atleast_2d(axs)
for n, f in enumerate(files):
    x, sr = sf.read(f"/home/user/refs/esc50/audio/{f}", dtype="float64")
    r, c = (n//2)*2, n % 2
    h = int(0.005*sr); k = len(x)//h
    e = 20*np.log10(np.abs(x[:k*h]).reshape(k, h).max(1)+1e-9)
    axs[r, c].plot(np.arange(k)*h/sr, e, lw=.6); axs[r, c].set_ylim(-80, 0); axs[r, c].set_xlim(0, 5); axs[r, c].grid(alpha=.3)
    axs[r, c].set_title(f, fontsize=11); axs[r, c].set_xticks(np.arange(0, 5.01, 0.25)); axs[r,c].tick_params(labelsize=6)
    ff, t, S = signal.stft(x, sr, nperseg=1024, noverlap=896)
    Sd = 20*np.log10(np.abs(S)+1e-9)
    axs[r+1, c].pcolormesh(t, ff, Sd, vmin=Sd.max()-80, vmax=Sd.max(), shading="auto", cmap="magma")
    axs[r+1, c].set_ylim(0, fmax); axs[r+1, c].set_xlim(0, 5); axs[r+1, c].set_xticks(np.arange(0, 5.01, 0.25)); axs[r+1,c].tick_params(labelsize=7)
fig.tight_layout(); fig.savefig(out, dpi=55)
