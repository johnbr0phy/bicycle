"""The Bicycle — original score, composed against the shot list.

Key D major (the low point in B minor), 76 bpm. One melody of eleven notes, inside an octave, whistleable:

    A4 B4 D5 . E5 F#5 E5 D5 B4 A4 . B4 D5
    5  6  1    2  3   2  1  6  5    6  1

It rises (a question), turns at the third, falls back to the dominant and lifts home. It is heard only in fragments
(3, 5, 7, 9 notes) until the moment she lets go of the saddle, when it is played complete with harmony for the first
time. Its highest note (F#5) is placed exactly on the frame where her hands leave the saddle.
"""
import json, os
HERE = os.path.dirname(__file__)
SHOTS = json.load(open(os.path.join(HERE, '../../src/shots.json')))
START = {}; _t = 0.0
for s in SHOTS: START[s['id']] = _t; _t += s['dur']
TOTAL = _t
BPM = 76.0; BEAT = 60.0 / BPM

# (midi, start beat, length beats) of the full melody
MEL = [(69, 0, .5), (71, .5, .5), (74, 1, 1.5), (76, 2.5, .5), (78, 3, 1), (76, 4, .5), (74, 4.5, 1), (71, 5.5, .5), (69, 6, 1.5), (71, 7.5, .5), (74, 8, 4)]
# harmony under the full melody (beat, length, chord tones low->high)
HARM = [(0, 2, [50, 57, 62, 66]), (2, 2, [43, 55, 62, 66]), (4, 2, [47, 54, 59, 62]), (6, 1, [45, 52, 57, 62]), (7, 1, [45, 52, 57, 61]), (8, 2, [43, 55, 59, 62]), (10, 2, [50, 57, 62, 66])]

def T(shot, t): return START[shot] + t
def ev(t, inst, note, vel=0.6, dur=None, pan=0.0, gain_db=0.0, **k):
    e = dict(t=float(t), inst=inst, note=note, vel=vel, pan=pan, gain_db=gain_db); e.update(k)
    if dur is not None: e['dur'] = float(dur)
    return e
def phrase(t0, notes, inst, beat=BEAT, vel=0.6, octave=0, pan=0.0, gain_db=0.0, legato=1.0, n=None, humanize=0.0, **k):
    out = []; import random; R = random.Random(int(t0 * 100))
    for i, (m, b, l) in enumerate(notes[:n] if n else notes):
        jitter = R.uniform(-humanize, humanize)
        v = vel * (1.0 + 0.08 * (1 if i % 2 == 0 else -1)) * (1.08 if m == 78 else 1.0)
        out.append(ev(t0 + b * beat + jitter, inst, m + 12 * octave, min(1, v), l * beat * legato, pan, gain_db, **k))
    return out

def cues():
    E = []   # music events (absolute seconds)
    # S05: her hum (rendered as voice in the mix, listed here for timing)
    # S06: the zither answers her three notes when the bicycle glyph appears
    E += phrase(T('S06', 2.6), MEL, 'zither', vel=0.55, n=3, pan=0.1, beat=0.62)
    E += [ev(T('S06', 4.3), 'strings', m, 0.28, 5.6, 0, -8, attack=1.6) for m in (50, 57, 62, 66)]
    # S07-S08: the errand. A slow harp figure and pizzicato bass, very light, morning.
    for i in range(14):
        t = T('S07', 0.2) + i * BEAT * 1.0
        E.append(ev(t, 'harp', [62, 69, 74, 69, 66, 69, 74, 78][i % 8], 0.34 + 0.04 * (i % 2), None, -0.3 + 0.6 * ((i % 4) / 3), -3))
        if i % 4 == 0: E.append(ev(t, 'pizz', [50, 45, 47, 43][(i // 4) % 4], 0.45, None, -0.1, -4))
    E += [ev(T('S08', 0.5) + i * 0.33, 'glock', 86 + [0, 2, 4, 7, 9][i], 0.18, None, 0.4, -12) for i in range(5)]
    for i in range(8):
        t = T('S08', 2.9) + i * BEAT
        E.append(ev(t, 'harp', [66, 69, 74, 69][i % 4], 0.3, None, -0.2, -5))
    # S09: one low plucked note when the cat turns its head east
    E.append(ev(T('S09', 2.2), 'zither', 45, 0.7, None, 0, 0))
    E.append(ev(T('S09', 2.2), 'cello', 38, 0.3, 3.0, 0, -9))
    # S10: the standoff: a low held cello, uneasy (the sixth over the bass)
    E.append(ev(T('S10', 3.4), 'cello', 42, 0.35, 3.4, -0.2, -6, attack=0.8))
    E.append(ev(T('S10', 3.4), 'cello', 47, 0.3, 3.4, 0.2, -9, attack=0.8))
    # S11: memory shimmer, then the second fragment (five notes, bright) as the dog springs away
    E.append(ev(T('S11', 2.3), 'marktree', None, 0.45, None, 0.3, -8, var='desc'))
    E += [ev(T('S11', 2.4) + i * 0.18, 'chimes', m, 0.25, None, 0.2, -8) for i, m in enumerate([81, 83, 86, 90])]
    E += phrase(T('S11', 5.25), MEL, 'zither', vel=0.7, n=5, pan=0, beat=0.36)
    E += phrase(T('S11', 5.25), MEL, 'harp', vel=0.4, n=5, pan=-0.3, beat=0.36, octave=-1, gain_db=-4)
    E += [ev(T('S11', 5.25 + 3 * 0.36), 'pizz', m, 0.5, None, 0, -3) for m in (50, 57)]
    # S12: Nishiki: light, playful: pizz + glock in a skipping pattern
    for i in range(20):
        t = T('S12', 0.3) + i * BEAT * 0.5
        if i % 2 == 0: E.append(ev(t, 'pizz', [50, 57, 54, 57][(i // 2) % 4], 0.38, None, -0.2, -6))
        if i % 4 == 1: E.append(ev(t, 'glock', [86, 88, 90, 93][(i // 4) % 4], 0.14, None, 0.3, -14))
    # S13: a questioning dyad when he turns the hat over and sees the name
    E += [ev(T('S13', 6.1), 'piano', m, 0.4, 2.6, 0, -2) for m in (59, 62, 64)]
    # S14: the river: third fragment (seven notes) on piano, a warm string bed under it (IV, then I)
    E += phrase(T('S14', 1.0), MEL, 'piano', vel=0.5, n=7, beat=0.95, humanize=0.015)
    E += [ev(T('S14', 0.6), 'strings', m, 0.26, 4.2, 0, -8, attack=1.8) for m in (43, 50, 59, 62)]
    E += [ev(T('S14', 4.6), 'strings', m, 0.24, 4.0, 0, -9, attack=1.2) for m in (50, 57, 62, 66)]
    E += [ev(T('S14', 1.0) + b * 0.95, 'piano', m, 0.3, 2.0, -0.2, -6) for b, m in [(0, 38), (2.5, 43), (4.5, 47)]]
    # S15: vibes for the sleeping cat, a harp flourish as the dog snorts and runs
    E += [ev(T('S15', 4.2) + i * 0.7, 'vibes', m, 0.25, None, 0.3, -6) for i, m in enumerate([81, 78, 74])]
    E += [ev(T('S15', 5.6) + i * 0.06, 'harp', m, 0.38, None, -0.2, -4) for i, m in enumerate([62, 66, 69, 74, 78, 81])]
    # S16: dusk: each lantern lighting is a soft chime; the pad darkens from D to B minor
    for i, z in enumerate([1.4, 2.2, 3.0, 3.8, 4.6, 5.4, 6.2]):
        E.append(ev(T('S16', 0.2 + (z - 1) * 0.42 * 1.0 + 0.05), 'chimes', [86, 83, 81, 78, 76, 74, 71][i], 0.22, None, -0.4 + 0.13 * i, -8))
    E += [ev(T('S16', 0.5), 'strings', m, 0.22, 3.5, 0, -9, attack=1.5) for m in (50, 57, 62, 66)]
    E += [ev(T('S16', 3.8), 'strings', m, 0.22, 5.0, 0, -9, attack=1.5) for m in (47, 54, 59, 62)]
    # S17: one bar: the first fragment, slow, in B minor, low on the piano
    for i, (m, b) in enumerate([(66, 0), (67, 1.3), (71, 2.6)]):
        E.append(ev(T('S17', 1.8) + b, 'piano', m - 12, 0.42 - 0.04 * i, 2.4, 0, -1))
    E += [ev(T('S17', 1.6), 'strings', m, 0.2, 6.0, 0, -10, attack=2.2) for m in (35, 47, 54, 59)]
    E.append(ev(T('S17', 5.8), 'piano', 47, 0.3, 3.0, 0, -4))
    # S18: silence under the rain. One high hand chime when his eyes come back on.
    E.append(ev(T('S18', 5.95), 'chimes', 86, 0.35, None, 0, -6))
    E.append(ev(T('S18', 6.0), 'strings', 74, 0.18, 3.0, 0, -12, attack=1.5))
    # S19: the turn: nine notes, rising, with light harmony, building into the alley
    E += phrase(T('S19', 0.9), MEL, 'flute', vel=0.5, n=9, beat=0.74, legato=0.95)
    E += phrase(T('S19', 0.9), MEL, 'zither', vel=0.45, n=9, beat=0.74, octave=-1, gain_db=-5, pan=-0.3)
    for i, (b, l, ch) in enumerate(HARM[:5]):
        E += [ev(T('S19', 0.9) + b * 0.74, 'strings', m, 0.26 + 0.03 * i, l * 0.74 + 0.4, 0, -8, attack=0.6) for m in ch]
    for i in range(12): E.append(ev(T('S19', 0.9) + i * 0.37, 'harp', [50, 57, 62, 66, 69, 66][i % 6] + (0 if i < 6 else 5), 0.3, None, 0.3, -6))
    E += [ev(T('S19', 0.9 + 6 * 0.74), 'strings', m, 0.3, 4.2, 0, -8, attack=0.5) for m in (45, 52, 57, 61, 64)]
    # S21: the cap goes back: one warm plucked phrase when the "come home" glyph appears
    E += phrase(T('S21', 4.4), MEL, 'zither', vel=0.55, n=4, beat=0.6)
    E += [ev(T('S21', 4.4), 'harp', m, 0.3, None, -0.3, -6) for m in (50, 57)]
    E += [ev(T('S21', 4.4), 'strings', m, 0.2, 3.6, 0, -11, attack=1.2) for m in (50, 57, 62)]
    # S22: walking home: the melody fuller, but still not complete (nine notes), ocarina over harp and strings
    E += phrase(T('S22', 0.9), MEL, 'ocarina', vel=0.55, n=9, beat=0.84, legato=0.92)
    for i, (b, l, ch) in enumerate(HARM[:5]):
        E += [ev(T('S22', 0.9) + b * 0.84, 'strings', m, 0.24, l * 0.84 + 0.4, 0, -9, attack=0.7) for m in ch]
    for i in range(16): E.append(ev(T('S22', 0.9) + i * 0.42, 'harp', [50, 57, 62, 57][i % 4] + [0, 0, -7, -3, -5][min(4, i // 4)], 0.28, None, -0.3, -6))
    E += [ev(T('S22', 0.9) + b * 0.84, 'pizz', m, 0.45, None, 0.1, -5) for b, m in [(0, 38), (2, 43), (4, 47), (6, 45)]]
    E += [ev(T('S22', 0.9 + 6 * 0.84), 'strings', m, 0.22, 3.4, 0, -10, attack=0.5) for m in (45, 52, 57, 61)]
    # S24: THE FULL MELODY, with harmony, for the first time. F#5 lands on the frame she lets go (S24 t=5.0).
    t0 = T('S24', 5.0) - 3 * BEAT
    E += phrase(t0, MEL, 'ocarina', vel=0.62, legato=0.95, humanize=0.01)
    E += phrase(t0, MEL, 'violins', vel=0.35, legato=1.0, gain_db=-7)
    E += phrase(t0, MEL, 'cello', vel=0.35, octave=-2, legato=1.0, gain_db=-9, n=0) if False else []
    for (b, l, ch) in HARM:
        E += [ev(t0 + b * BEAT, 'strings', m, 0.33, l * BEAT + 0.3, 0, -6, attack=0.4) for m in ch]
        E.append(ev(t0 + b * BEAT, 'cello', ch[0] - 12 if ch[0] > 45 else ch[0], 0.4, l * BEAT, -0.1, -5, attack=0.3))
        for k in range(int(l * 2)):
            E.append(ev(t0 + (b + k * 0.5) * BEAT, 'harp', ch[1:][k % 3] + 12, 0.34, None, 0.35, -5))
    E += [ev(t0 + b * BEAT, 'piano', m, 0.35, BEAT * 1.9, -0.2, -6) for b in (0, 2, 4, 6, 8) for m in [x + 12 for x in dict((h[0], h[2]) for h in HARM)[b][1:3]]]
    E.append(ev(t0 + 3 * BEAT - 0.05, 'marktree', None, 0.4, None, 0.4, -10, var='slowasc'))
    # S25-S26: the piano takes the melody (second statement, slower), resolving to D and holding; then silence for the bell.
    t1 = t0 + 12 * BEAT; b2 = 0.86
    E += phrase(t1, MEL, 'piano', vel=0.5, beat=b2, humanize=0.012)
    for (b, l, ch) in HARM:
        E += [ev(t1 + b * b2, 'strings', m, 0.25, l * b2 + 0.4, 0, -9, attack=0.8) for m in ch]
        E.append(ev(t1 + b * b2, 'piano', ch[0], 0.32, l * b2, -0.2, -5))
    # S27: (her hum returns, complete; rendered as voice in the mix)
    # S28: the zither plays the whole melody once more, alone, and a final harp chord
    E += phrase(T('S28', 2.2), MEL, 'zither', vel=0.55, beat=0.9, humanize=0.01)
    E += [ev(T('S28', 2.2 + 12 * 0.9), 'harp', m, 0.3, None, 0, -4) for m in (50, 57, 62, 66, 69)]
    E += [ev(T('S28', 2.2) + b * 0.9, 'harp', m, 0.22, None, -0.3, -9) for b, m in [(0, 50), (2, 43), (4, 47), (6, 45), (8, 43), (10, 50)]]
    return E

def hums():
    """Her hum: (list of (midi, start, dur)) phrases with absolute start times. Natural register: melody an octave down."""
    out = []
    # S05: she hums the opening, and stops mid-phrase when she sees the empty spot (E cut short)
    b = 0.6; t = T('S05', 0.55)
    out.append((t, [(57, 0, b * 0.5), (59, b * 0.5, b * 0.5), (62, b * 1.0, b * 1.5), (64, b * 2.5, 0.22)]))
    # S27: the hum returns, complete, from inside the house
    b = 0.82; t = T('S27', 0.9)
    out.append((t, [(m - 12, s * b, l * b * 0.96) for (m, s, l) in MEL]))
    return out

if __name__ == '__main__':
    E = cues(); print(len(E), 'events; total', TOTAL, 's; S24 let-go at', T('S24', 5.0))
