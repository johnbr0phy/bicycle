"""demo.py - render inspection demos into audio/demo/.

    python demo.py                 # everything
    python demo.py instruments     # demo/instruments.wav (+ .png, cues json)
    python demo.py sfx             # demo/sfx_tour.wav (+ page PNGs, cues json)
    python demo.py hum             # demo/hum.wav, demo/hum_low.wav (+ PNGs, spectrum)
    python demo.py reverb          # demo/reverb.wav: dry / room / hall / temple on one phrase
    python demo.py qa              # QA table of lib/ and demo/ (peak, DC, edges, clicks)
"""
from __future__ import annotations

import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mix  # noqa: E402
import sampler  # noqa: E402
import sfx  # noqa: E402
import spectro  # noqa: E402

SR = 48000
DEMO = os.path.join(HERE, "demo")

PHRASE = ["D5", "E5", "F#5", "A5"]
CHORD = ["D3", "A3", "D4", "F#4"]  # low D major chord (open voicing)

ORDER = ["piano", "grand", "zither", "harp", "concert_harp", "ocarina", "ocarina_vib", "flute", "flute_nv",
         "violin", "violins", "violas", "cellos", "cello", "strings", "pizz", "glock", "chimes", "tubular",
         "vibes", "gong", "marktree"]


def _fit(notes, lo):
    """Shift a list of midi notes up by octaves until the lowest is >= lo - 2 (sampled range)."""
    ns = [sampler.note_to_midi(n) for n in notes]
    k = 0
    while min(ns) + 12 * k < lo - 2:
        k += 1
    return [n + 12 * k for n in ns], k


def instruments(path=None):
    path = path or os.path.join(DEMO, "instruments.wav")
    ev, cues = [], []
    t = 0.3
    for inst in ORDER:
        start = t
        if inst in ("gong", "marktree"):
            if inst == "gong":
                ev.append(dict(t=t, inst="gong", note=None, vel=0.5, dur=2.0, release=0.4))
                ev.append(dict(t=t + 2.2, inst="gong", note=None, vel=0.85, gain_db=-2, dur=3.0, release=2.0))
                t += 7.5
            else:
                ev.append(dict(t=t, inst="marktree", var="asc", vel=0.6))
                ev.append(dict(t=t + 3.0, inst="marktree", var="desc", vel=0.6))
                t += 7.0
            cues.append(dict(t=round(start, 2), inst=inst, note="one-shots"))
            continue
        info = sampler.instrument_info("cellos" if inst in ("cello", "strings") else inst)
        lo = sampler.note_to_midi(info["lowest"]) if inst != "strings" else 36
        ph, k1 = _fit(PHRASE, lo)
        ch, k2 = _fit(CHORD, lo)
        sustained = inst in ("ocarina", "ocarina_vib", "flute", "flute_nv", "violin", "violins", "violas", "cellos", "cello", "strings")
        step = 0.42
        for i, n in enumerate(ph):
            ev.append(dict(t=t + i * step, inst=inst, note=n, vel=0.72, dur=step * (0.95 if sustained else 1.0),
                           pan=-0.25 + 0.15 * i))
        tc = t + len(ph) * step + 0.25
        for j, n in enumerate(ch):
            ev.append(dict(t=tc + (0.0 if sustained else 0.012 * j), inst=inst, note=n, vel=0.6, dur=2.2,
                           pan=-0.3 + 0.2 * j, gain_db=-4.0))
        cues.append(dict(t=round(start, 2), inst=inst, phrase_octave_shift=k1, chord_octave_shift=k2))
        t = tc + 2.2 + 1.6
    dry = sampler.render(ev, t + 1.0)
    y = sampler.hall(dry, wet=0.22)
    y = mix.remove_dc(y)
    pk = np.abs(y).max()
    if pk > mix.db2amp(-1.0):
        y = mix.limit(y, -1.0)
    mix.write_wav(path, y)
    with open(os.path.splitext(path)[0] + "_cues.json", "w") as f:
        json.dump(cues, f, indent=1)
    spectro.spectrogram_png(y, os.path.splitext(path)[0] + ".png", "instruments (hall 0.22)", fmax=8000,
                            marks=[(c["t"], c["inst"]) for c in cues], width=28, height=7)
    # per-instrument close-up pages
    pages = [cues[i:i + 6] for i in range(0, len(cues), 6)]
    for pi, pg in enumerate(pages):
        a = pg[0]["t"]
        b = (cues[cues.index(pg[-1]) + 1]["t"] if cues.index(pg[-1]) + 1 < len(cues) else len(y) / SR)
        seg = y[int(a * SR): int(b * SR)]
        spectro.spectrogram_png(seg, os.path.join(DEMO, f"instruments_p{pi + 1}.png"),
                                f"instruments page {pi + 1} ({a:.1f}-{b:.1f}s)", fmax=6000,
                                marks=[(c["t"] - a, c["inst"]) for c in pg], width=20, height=6)
    print(f"{path}: {len(y) / SR:.1f}s  LUFS {mix.lufs(y):.1f}  peak {mix.amp2db(np.abs(y).max()):.1f} dBFS")
    return y


def sfx_tour(path=None, loop_excerpt=6.0, gap=0.5):
    path = path or os.path.join(DEMO, "sfx_tour.wav")
    cat_path = os.path.join(sfx.LIB, "catalogue.json")
    if not os.path.exists(cat_path):
        sfx.build_library()
    with open(cat_path) as f:
        cat = json.load(f)
    pieces, cues = [], []
    t = 0.3
    for nm in sfx.names():
        x = sfx.get(nm)
        x = mix.as_stereo(x) if x.ndim == 1 else x
        kind = cat.get(nm, {}).get("kind", "oneshot")
        if kind == "loop" and len(x) > loop_excerpt * SR:
            x = mix.fades(x[: int(loop_excerpt * SR)], 0.3, 0.6)
        if x.ndim == 2 and x.shape[1] == 2 and cat.get(nm, {}).get("channels", 2) == 1:
            x = x * (1 / np.sqrt(2))  # mono clips: -3 dB centre like the constant-power pan law
        pieces.append((t, x))
        cues.append(dict(t=round(t, 3), name=nm, dur=round(len(x) / SR, 3), kind=kind))
        t += len(x) / SR + gap
    buf = np.zeros((int((t + 0.5) * SR), 2), np.float32)
    for tt, x in pieces:
        i = int(tt * SR)
        buf[i:i + len(x)] += x[: len(buf) - i]
    pk = np.abs(buf).max()
    if pk > mix.db2amp(-1.0):
        buf = mix.limit(buf, -1.0)
    mix.write_wav(path, buf)
    with open(os.path.splitext(path)[0] + "_cues.json", "w") as f:
        json.dump(cues, f, indent=1)
    # spectrogram pages of ~40 s with labels
    page = 40.0
    a = 0.0
    pi = 1
    while a < len(buf) / SR:
        b = min(len(buf) / SR, a + page)
        seg = buf[int(a * SR): int(b * SR)]
        mk = [(c["t"] - a, c["name"]) for c in cues if a <= c["t"] < b]
        spectro.spectrogram_png(seg, os.path.join(DEMO, f"sfx_tour_p{pi:02d}.png"), f"sfx tour {a:.0f}-{b:.0f}s",
                                fmax=12000, marks=mk, width=24, height=6)
        a = b
        pi += 1
    print(f"{path}: {len(buf) / SR:.1f}s, {len(cues)} effects, peak {mix.amp2db(np.abs(buf).max()):.1f} dBFS")
    return buf


def hum():
    notes = ["D5", "E5", "F#5", "A5", "F#5", "E5", "D5"]
    seq = [(sampler.note_to_midi(n), 0.3 + 0.6 * i, 0.6) for i, n in enumerate(notes)]
    y = sfx.hum_voice(seq)
    y = np.concatenate([np.zeros(int(0.0 * SR), np.float32), y])
    p = os.path.join(DEMO, "hum.wav")
    mix.write_wav(p, y)
    spectro.spectrogram_png(y, os.path.join(DEMO, "hum.png"), "hum_voice D5 E5 F#5 A5 F#5 E5 D5 (0.6 s each)",
                            fmax=5000, nfft=4096)
    spectro.spectrum_png(y, os.path.join(DEMO, "hum_spectrum.png"), "hum_voice long-term spectrum (D5 phrase)",
                         fmax=5000, marks_hz=[(587.3, "D5"), (1020, "antiformant"), (1350, "N2"), (2300, "N3")])
    # natural register for an older woman: one octave lower
    seq2 = [(m - 12, s, d) for m, s, d in seq]
    y2 = sfx.hum_voice(seq2)
    p2 = os.path.join(DEMO, "hum_low.wav")
    mix.write_wav(p2, y2)
    spectro.spectrogram_png(y2, os.path.join(DEMO, "hum_low.png"), "hum_voice one octave lower (D4..A4)",
                            fmax=5000, nfft=4096)
    spectro.spectrum_png(y2, os.path.join(DEMO, "hum_low_spectrum.png"), "hum_voice long-term spectrum (D4 phrase)",
                         fmax=5000, marks_hz=[(293.7, "D4"), (1020, "antiformant"), (1350, "N2"), (2300, "N3")])
    # with a room around it, as it would sit in the film
    y3 = sampler.room(mix.as_stereo(np.concatenate([y2, np.zeros(SR, np.float32)])) * 0.7, wet=0.25)
    mix.write_wav(os.path.join(DEMO, "hum_low_room.wav"), y3)
    print(f"{p}: {len(y) / SR:.2f}s peak {mix.amp2db(np.abs(y).max()):.1f}; {p2}")
    return y


def reverb_demo():
    ev = [dict(t=0.2 + 0.45 * i, inst="piano", note=n, vel=0.6, dur=0.45) for i, n in enumerate(PHRASE)]
    dry = sampler.render(ev, 4.5)
    parts = [dry, sampler.room(dry, 0.3), sampler.hall(dry, 0.3), sampler.preset(dry, "temple", 0.35)]
    y = np.concatenate(parts)
    y = mix.limit(y, -1.0) if np.abs(y).max() > mix.db2amp(-1) else y
    mix.write_wav(os.path.join(DEMO, "reverb.wav"), y)
    spectro.spectrogram_png(y, os.path.join(DEMO, "reverb.png"), "piano phrase: dry | room 0.3 | hall 0.3 | temple 0.35",
                            fmax=8000, marks=[(0, "dry"), (4.5, "room"), (9, "hall"), (13.5, "temple")])
    ir = sampler.make_ir(**{k: v for k, v in sampler.PRESETS["hall"].items()})
    spectro.spectrogram_png(ir[:, 0], os.path.join(DEMO, "ir_hall.png"), "hall IR (LL)", fmax=16000)
    return y


def qa():
    sys.path.insert(0, os.path.join(HERE, "tools"))
    import qa as Q
    for d in (sfx.LIB, DEMO):
        import glob
        for f in sorted(glob.glob(os.path.join(d, "*.wav"))):
            pk, dc, e0, e1, flag = Q.qa(f)
            print(f"{os.path.relpath(f, HERE):36s} peak {pk:6.1f} dc {dc:.1e} {' '.join(flag)}")


if __name__ == "__main__":
    os.makedirs(DEMO, exist_ok=True)
    what = sys.argv[1:] or ["instruments", "sfx", "hum", "reverb"]
    for w in what:
        {"instruments": instruments, "sfx": sfx_tour, "hum": hum, "reverb": reverb_demo, "qa": qa}[w]()
