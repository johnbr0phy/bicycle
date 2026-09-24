# Audio toolkit, "The Bicycle"

Everything is Python 3.11 + numpy/scipy/soundfile (matplotlib only for PNGs).
All audio is **48 kHz float32**; mono = shape `(n,)`, stereo = shape `(n, 2)`. WAVs are written
as 24-bit PCM by `mix.write_wav`.

```
audio/
  sampler.py     multisample instruments (VCSL + VSCO2 CE) -> render(events) ; convolution reverb
  sfx.py         effects: ESC-50 picks + synthesis ; hum_voice ; catalogue ; lib builder
  mix.py         place / fades / loops / filters / compressor / limiter / LUFS / write_wav
  spectro.py     spectrogram + long-term-spectrum PNGs (inspection without listening)
  demo.py        renders demo/*.wav + PNGs
  tools/         esc50_survey.py, esc50_events.py, esc50_view.py (how the ESC-50 clips were chosen),
                 qa.py (peak / DC / edge / click check)
  lib/           rendered effects <name>.wav + lib/catalogue.json   (python sfx.py build, ~20 s)
  demo/          instruments.wav, sfx_tour.wav, hum.wav, hum_low.wav, reverb.wav + PNGs + cue JSONs
  cache/         sample_analysis.json (onsets, tuning, loop points, levels; auto-rebuilt)
```

Quick start

```python
import sys; sys.path.insert(0, "/home/user/bicycle/film/audio")
import sampler, sfx, mix

music = sampler.render([
    dict(t=0.0, inst="piano",   note="D5", vel=0.6, dur=0.5, pan=-0.2),
    dict(t=0.5, inst="strings", note="A3", vel=0.4, dur=6.0, gain_db=-6),
], duration=10.0)                       # dry stereo (n,2)
music = sampler.hall(music, wet=0.25)   # or sampler.reverb(music, wet, decay_s, predelay_ms, lowcut, highcut)

buf = mix.silence(10.0)                 # stereo bus
mix.place(buf, sfx.get("water_channel"), t=0.0, gain_db=-10)
mix.place(buf, sfx.motor_roll(3.0, speed=lambda t: min(1, t / 0.8)), t=2.0, gain_db=-6, pan=-0.4)
mix.place(buf, sfx.get("bike_bell_ring"), t=7.0, gain_db=-3)
mix.place(buf, sfx.hum_voice([(62, 1.0, 0.6), (64, 1.6, 0.6), (66, 2.2, 1.2)]), t=0, gain_db=-4)
out = mix.normalise_to(mix.limit(buf + music, -1.0), -23.0)
mix.write_wav("scene.wav", out)
```

Command line

```
python sampler.py list | test | analyse
python sampler.py render events.json out.wav [--duration S] [--reverb hall|room|temple|street|plate|none] [--wet 0.25]
python sfx.py build [NAME ...]        # (re)render lib/ and lib/catalogue.json
python sfx.py list
python sfx.py render NAME out.wav
python mix.py loudness a.wav [...]    # LUFS, peak, DC, max step, edge
python mix.py normalize in.wav out.wav -23
python spectro.py file.wav [out.png] [--fmax 12000] [--log]
python demo.py [instruments|sfx|hum|reverb|qa]
python tools/qa.py lib demo
```

---------------------------------------------------------------------------------------------

## sampler.py

Conventions: note names use **C4 = MIDI 60, A4 = 440 Hz**; `'F#4'`, `'Bb3'`, ints and floats
(microtonal) are accepted (`sampler.note_to_midi`). Every VCSL/VSCO folder was checked by
measuring the fundamental of its samples: several libraries name middle C "C3", which is corrected
per instrument (`octave` in the spec).

### `render(events, duration=None, sr=48000, verbose=False) -> np.ndarray (n, 2) float32`
Dry stereo mix of note events (no reverb, no limiting). `duration` in seconds (default: last note
end + 0.5 s; notes past the end are cropped). Event dict keys:

| key | default | meaning |
|---|---|---|
| `t` | required | start time (s). Sample onsets are trimmed (-40 dB threshold, 1.5 ms pre-roll, 1 ms fade) so the attack lands on `t` |
| `inst` | required | instrument name (table below) |
| `note` | required (None allowed for `gong`, `marktree`) | MIDI int/float or name `'D5'`; mapped to the nearest sampled pitch and resampled (polyphase, Kaiser) |
| `vel` | 0.7 | 0..1: picks the velocity layer (split evenly across the instrument's layers) and scales gain: amp = (0.12 + 0.88 vel)^2 (vel 1 = 0 dB, 0.5 = -10 dB, 0 = -37 dB) |
| `dur` | natural length (struck/plucked/bells), 1.0 s (sustained) | held time in s; a release fade follows (`release`) |
| `pan` | 0 | -1..1, constant-power (mono sources) / constant-power balance (stereo samples) |
| `gain_db` | 0 | extra gain |
| `attack` | per instrument | fade-in seconds (sustained instruments default to a soft bow/breath attack) |
| `release` | per instrument | release fade after `dur` (exponential-shaped, ends at exactly 0) |
| `width` | 1 | stereo width of the sample (0 = mono fold) |
| `var` | – | one-shot variant, `marktree`: `asc`, `desc`, `fastasc`, `slowasc`, `slowdesc`, `random` |
| `ring` | False | True: ignore `dur` and let a note ring to its natural end |
| `detune` | 0 | cents |

Modes: `decay` = struck/plucked, `dur` honoured (key-off release); `ring` = bells, ring naturally
unless `dur` is given; `sustain` = bowed/blown, notes longer than the sample are extended by
correlation-aligned, power-compensated crossfade looping of the steady region (no audible seam,
checked on 14 s notes); `oneshot` = unpitched one-shots (`note` = None plays at natural pitch; a
note transposes relative to the natural pitch, e.g. the gong's ~140 Hz = C#3).

### Instruments

`gain_db` below is the built-in trim that makes a vel-0.7 phrase in the instrument's middle register
read about -20 LUFS (momentary max), so equal `vel` means roughly equal loudness across instruments.

| name | source | sampled pitch range | mode | vel layers (soft→loud) | trim dB |
|---|---|---|---|---|---|
| `cello` | Cello section (alias of 'cellos' with a slightly quicker attack) | see text | sustain | – | – |
| `cellos` | Cello section sustain vibrato (VSCO2 CE) | C2–F5 (13 pitches) | sustain | 1, 3 | +2.0 |
| `chimes` | Hand chimes (VCSL) | C4–C7 (19 pitches) | ring | 1 | +1.5 |
| `concert_harp` | Concert harp (VCSL), sparse sampling | E1–F7 (23 pitches) | decay | mf, f | +1.5 |
| `flute` | Flute sustain vibrato (VSCO2 CE) | C4–C7 (10 pitches) | sustain | 1 | +2.0 |
| `flute_nv` | Flute straight tone (VSCO2 CE) | C4–C7 (10 pitches) | sustain | 1, 2, 3 | +0.0 |
| `glock` | Glockenspiel (VCSL), sounding G5-C8 | G5–C8 (7 pitches) | ring | soft, medium, loud | +0.0 |
| `gong` | Gong 1 (VCSL), 4 layers; note shifts relative to its natural ~140 Hz (C#3) | C#3–C#3 (1 pitches) | oneshot | p, mf, f, fff | +3.0 |
| `grand` | Steinway B grand (VCSL), close mics, whole-tone sampled, 3 layers | A#0–G#7 (42 pitches) | decay | 2, 3, 4 | +4.0 |
| `harp` | Folk (lever) harp (VCSL), whole-tone sampled, 2 layers | C2–G#6 (29 pitches) | decay | 2, 3 | +4.0 |
| `marktree` | Mark tree glisses (VCSL legacy). var = asc/desc/fastasc/slowasc/slowdesc/random | unpitched | oneshot | 1 | -1.0 |
| `ocarina` | Alto ocarina (VCSL) straight-tone sustains, looped for long notes | A4–C#6 (11 pitches) | sustain | 1 | +1.0 |
| `ocarina_vib` | Alto ocarina with vibrato (VCSL) | A4–C6 (10 pitches) | sustain | 1 | +3.0 |
| `piano` | Yamaha upright (VCSL), sustain-pedal samples, 3 vel layers, 2 round robins | C1–C7 (13 pitches) | decay | 1, 2, 3 | +4.5 |
| `pizz` | Violin section pizzicato (VSCO2 CE) | G3–D6 (11 pitches) | decay | 1, 2 | +1.5 |
| `strings` | String section pad: violins / violas / cellos blended by register, slow attack, looped | see text | sustain | – | – |
| `tubular` | Tubular bells (VCSL set 2), pitch = strike note | C4–F5 (11 pitches) | ring | 2, 4 | +1.5 |
| `vibes` | Vibraphone, soft mallets, no motor (VCSL) | F3–E6 (11 pitches) | decay | 1, 2 | -0.5 |
| `violas` | Viola section sustain vibrato (VSCO2 CE) | C3–D6 (13 pitches) | sustain | 1, 2 | -1.0 |
| `violin` | Solo violin arco vibrato (VSCO2 CE) | G3–C7 (15 pitches) | sustain | p, f | -1.0 |
| `violins` | Violin section sustain vibrato (VSCO2 CE) | G3–D6 (11 pitches) | sustain | 1, 2 | +4.5 |
| `zither` | Dan Tranh (Vietnamese 16-string zither, koto-like) normal plucks (VCSL) | B2–B5 (16 pitches) | decay | mf, f, ff | +2.0 |

* `strings` = register-blended section pad: weights cellos (below ~D4), violas (peak around D4) and
  violins (above ~C4) by pitch with power normalisation, attack 0.45 s, release 0.9 s, looped.
* `cello` = `cellos` with a 0.15 s attack (no solo cello exists in the sources).
* Extras beyond the brief: `concert_harp`, `ocarina_vib`, `flute_nv`, `violin` (solo), `violins`,
  `violas`, `cellos`, `pizz`.
* Piano choice: the VCSL **Yamaha upright** is `piano` (clean -85 dB tails, 3 layers × 2 round
  robins, soft layer is dark and intimate; sampled every C and G, i.e. max ±3 semitone shift in
  48–96). The VSCO "Upright Piano" (Ivy Audio) has denser sampling but a -45..-60 dB hiss floor,
  so it was not used. `grand` = VCSL **Steinway B** (close mics, whole-tone sampled, long sustains);
  the Kawai has fewer long samples.

Sample preparation (automatic, cached in `cache/sample_analysis.json`; delete it to re-analyse):
onset/tail trimming; per-sample **auto-tune** to the measured fundamental when within ±60 cents
(the Dan Tranh is up to +46 cents off, harps/strings 15–30 cents; pianos, tubular bells, gong and
mark tree are left as recorded); **stereo alignment**: 227 of 643 samples (spaced-pair recordings)
had L/R nearly in anti-phase at the fundamental (correlation down to -0.94, i.e. the note would
vanish in mono) – their right channel is shifted by the best lag within ±1.2 ms (correlation now
≥ -0.06 everywhere, median 0.68); **level normalisation**: each sample's level (attack RMS for
struck, 0.3–2.5 s RMS for sustained, loudest 0.4 s for one-shots) is corrected to a smooth
per-instrument register trend so layers/notes are consistent; the layer gives the timbre, `vel`
the gain.

Measured (python sampler.py test): rendered A4 = 440 Hz within 5 cents on every pitched
instrument tested (piano +0.5 c, grand -2.3, zither +0.2, ocarina 0.0, harp +0.1, strings 0.0,
cello +2.4, violin +0.1, flute -0.1, vibes 0.0, chimes -0.1; glock G6 0.0). Across MIDI 55–89 the
median error is < 1 cent; string *sections* show ±5–12 cent ensemble drift on some samples
(natural section intonation, left as is).

### Other functions
* `render_note(inst, note=None, vel=0.7, dur=None, sr=48000, attack=None, release=None, ring=False, var=None, detune=0.0) -> (n,2)` one dry note, onset at sample 0, not panned.
* `note_to_midi(n) -> float|None`, `midi_to_name(m) -> str`, `midi_to_hz(m)`.
* `instrument_names() -> list[str]`, `instrument_info(name) -> dict` (range, layers, sampled MIDI notes, max tuning correction).
* `estimate_f0(y, sr=48000, f_guess=None, win=1.0)`; `self_test()`.

### Reverb
`reverb(x, wet=0.25, decay_s=2.0, predelay_ms=20.0, lowcut=100.0, highcut=9000.0, size=0.6, damping=0.5, cross=0.55, keep_tail=False, sr=48000, seed=11) -> (n,2)`

True-stereo convolution with a synthetic IR set (LL, LR, RL, RR): decorrelated noise split into
octave bands with frequency-dependent RT60 (`damping` shortens the highs), a density build-up
(10–60 ms, `size`), 6–22 low-passed early reflections spread over up to ~90 ms (`size`), band
limited to `lowcut..highcut`, energy-normalised, after `predelay_ms`. `out = (1-wet)*dry + wet*wet_signal`
(`wet=1` = 100 % wet for send busses). `keep_tail=False` returns the input length, render with
room at the end (or pass `keep_tail=True` to get `len(x)+IR` samples).
`make_ir(decay_s, predelay_ms, size, damping, lowcut, highcut, sr, seed, er_level) -> (n,4)` is cached.
Presets (`sampler.PRESETS`): `room` (decay 0.7 s, predelay 6.0 ms, size 0.25, damping 0.6, 120–9000 Hz); `hall` (decay 2.6 s, predelay 24.0 ms, size 0.85, damping 0.45, 90–10000 Hz); `temple` (decay 3.8 s, predelay 35.0 ms, size 1.0, damping 0.55, 70–8000 Hz); `street` (decay 1.1 s, predelay 12.0 ms, size 0.5, damping 0.7, 150–7000 Hz); `plate` (decay 1.8 s, predelay 10.0 ms, size 0.4, damping 0.3, 150–12000 Hz)
`room(x, wet=0.2)`, `hall(x, wet=0.25)`, `preset(x, name, wet=0.25)`.

---------------------------------------------------------------------------------------------

## sfx.py

* `get(name) -> np.ndarray` – loads `lib/<name>.wav` (built) or renders it. Accepts short aliases
  (`bike_bell_clack`, `cicada_tsukutsuku`, `higurashi`, `kite_cry`, `dog_bark`, `cat_meow`, `servo`,
  `motor_roll`, `rain`, `crickets`, `birds`, … see `sfx.ALIASES`).
* `render(name)` – render fresh; `names()` – all catalogue names; `build_library(only=None)`.
* Loudness conventions of lib/: one-shots are normalised to **-18 LUFS momentary max** (400 ms),
  loops/beds to **-24 LUFS integrated**; peaks are kept ≤ -1.5 dBFS (short transients may therefore
  sit lower than -18). Distance is baked in as air-absorption low-pass + reverb, not as level: set
  levels with `gain_db` when placing. Mono clips are meant to be panned with `mix.place`.
* Loops (`kind: loop` in the catalogue) are seamless: the tail is crossfaded into the head and DC
  filtering is done circularly – `mix.loop_to(clip, dur, crossfade)` or tiling them is click-free.

Generators (all return float32 at 48 kHz; `seed` selects a variation):

| function | returns |
|---|---|
| `hum_voice(notes, sr=48000, seed=3, breath=0.035, vib_rate=5.1, vib_cents=22, scoop_cents=80, legato_gap=0.09, tail=0.7, gain_db=0, murmur_hz=None, final_fall_cents=70, oq=0.58, murmur_bw=300, lp_hz=750)` | mono. `notes = [(midi, start_s, dur_s), ...]` |
| `motor_roll(duration=4.0, speed=1.0, seed=0, gravel=1.0, seams=1.0, loop=False)` | mono; `speed` float 0..1, array (spread over the duration) or `f(t)` |
| `robot_beep(kind, seed=0)` | mono; kinds: `query`, `yes`, `no`, `sad`, `curious`, `happy`, `tired`, `startle`, `lowbat`, `powerup`, `powerdown`, `hello` |
| `servo(dur=0.3, f0=380, f1=620, seed=0, wobble=0)` | mono |
| `bike_bell_ring(kind='ring' / 'double' / 'ding', seed=0)` | stereo |
| `bike_bell_clack(seed=0, double=None)` | mono |
| `temple_bell(seed=0, dist=1.0, f0=None, dur=12)` | stereo |
| `fumikiri(dur=6, seed=0, dist=1.0)` | stereo |
| `cicada_tsukutsuku(seed=0, dist=1.0)`, `higurashi(seed=0, dur=6.5, dist=1.0)`, `suzumushi(seed=0, dur=10)` | stereo |
| `kite_cry(seed=0, dist=1.0)` | stereo |
| `shutter_roll(dur=3, seed=0, dist=1.0)`, `plastic_bag(dur=2, seed=0)` | stereo / mono |
| `vending_hum(dur=10, seed=0)`, `water_channel(dur=20, seed=0)`, `wind_soft(dur=30, seed=0)`, `market_murmur(dur=30, n_voices=26, seed=0)` | stereo seamless loops |
| `slipper_step(seed, weight)`, `puddle_splash(seed)`, `metal_clatter(seed)`, `gripper_click(seed)`, `door_slide(seed, dur, kind='open' / 'close')`, `kettle_creak(seed, dur)`, `dog_shake(seed, dur)`, `dog_lick(seed, n_licks)`, `dog_sniff_synth(seed, n)`, `dog_growl(dur, seed)`, `cat_mrrp(seed)`, `cat_hiss(seed, dur)` | mono |
| `whoosh_soft(seed, dur)` | stereo (moves L→R) |
| `esc_clip(name)` | an ESC-50 pick (see `ESC_PICKS`: file, t0/t1, filters, gate) |
| helpers: `distant(x, lp, hp, wet, decay, predelay)`, `resonator_bank`, `klatt_res`, `stereo_from_mono`, `momentary_max`, `normalise`, `finish` | |

Design notes (verified on spectrograms, see demo/sfx_tour_pNN.png):
* **hum_voice**: Rosenberg glottal pulses (open quotient .58) at 2× oversampling, jitter/shimmer,
  flow-modulated breath noise (more at phrase ends), vibrato 5.1 Hz ±22 cents after ~0.2 s, scoops
  of 80 cents from below (or legato glides with a tiny overshoot when notes join), final-note fall
  of 70 cents with fade. Klatt cascade: nasal murmur resonance ~280 Hz (tracks f0 for high notes,
  BW 300), **antiformant 1020 Hz**, weak broad nasal formants 1.35/2.3/3.0 kHz, 750 Hz 1st-order
  roll-off. Measured harmonic levels re H1 at G3: H2 -6, H3 -23, 1–2.2 kHz -41…-47, >3 kHz < -65 dB;
  at D4: H2 -16, H3 -38 (antiformant), 1.2–2 kHz -36…-44. The natural register for an older woman
  is G3–A4; the requested D5 phrase works (demo/hum.wav) but hum_low.wav (D4) is more believable.
* **bike_bell_ring** (the payoff): modal synthesis, doublet partials 2362/2367 Hz and 3508/3516 Hz
  (slow 5–8 Hz shimmer), weak 5.2/6.7 kHz and 1.18 kHz modes, T60 1.75 s → ~0.35 s (high), 10
  clapper strikes at ~21/s with slight timing/force jitter, tiny clean 'tink', stereo from two
  mode weightings. No noise.
* **temple_bell**: f0 76–86 Hz hum, 11 inharmonic partials each as a detuned doublet (0.35–3.3 Hz
  beating), T60 13 s → 1.6 s, wooden-log 'gon' thump, distant (low-pass ~1.7 kHz, predelay, reverb).
* **fumikiri**: alternating 752/694 Hz electronic bell strikes every 0.5 s, distant street reverb.
* **cicada_tsukutsuku**: intro buzz → 9–11 accelerating "tsu-ku tsu-ku boo-shi" motifs (period
  0.92 → 0.62 s) → two "ui-oos" glides → fading buzz; tymbal-pulsed noise/tone band 5.4–7.7 kHz.
* **higurashi**: pulsed tone 5.45 → 4.55 kHz, pulse rate 11 → 7 /s, swell and fade.

### Catalogue (lib/)

| name | description | s | ch | kind | source |
|---|---|---|---|---|---|
| `bike_bell_clack_1` | broken bell: single dull muted tick | 0.071 | mono | oneshot | synth `bike_bell_clack` |
| `bike_bell_clack_2` | broken bell: double tick (clapper bounce) | 0.116 | mono | oneshot | synth `bike_bell_clack` |
| `bike_bell_clack_3` | broken bell: single tick, variation | 0.071 | mono | oneshot | synth `bike_bell_clack` |
| `bike_bell_ding` | single clean bell strike 'ding', ~1.9 s | 1.91 | st | oneshot | synth `bike_bell_ring` |
| `bike_bell_ring` | THE bell: clean bright rotary 'rrring', ~2.3 s | 2.337 | st | oneshot | synth `bike_bell_ring` |
| `bike_bell_ring_double` | bell 'ring-ring', ~2.9 s | 2.958 | st | oneshot | synth `bike_bell_ring` |
| `birds_morning` | busier chirping birds bed, stereo loop | 20.0 | st | loop | ESC-50 3-155583-A-14.wav @0.0-5.0s (Freesound 155583) |
| `cat_hiss` | cat hiss (synth) | 0.9 | mono | oneshot | synth `cat_hiss` |
| `cat_meow_1` | meow, falling contour, ~1 s | 0.85 | mono | oneshot | ESC-50 4-161303-A-5.wav @0.07-0.92s (Freesound 161303) |
| `cat_meow_2` | meow, same cat, shorter | 0.6 | mono | oneshot | ESC-50 4-161303-A-5.wav @2.14-2.74s (Freesound 161303) |
| `cat_meow_3` | meow, same cat, higher | 0.62 | mono | oneshot | ESC-50 4-161303-A-5.wav @3.9-4.52s (Freesound 161303) |
| `cat_meow_long` | long insistent meow (other cat) | 1.742 | mono | oneshot | ESC-50 1-56380-A-5.wav @2.6-4.4s (Freesound 56380) |
| `cat_mrrp_1` | cat 'mrrp' greeting trill (synth) | 0.361 | mono | oneshot | synth `cat_mrrp` |
| `cat_mrrp_2` | cat 'mrrp', variation | 0.331 | mono | oneshot | synth `cat_mrrp` |
| `church_bell_distant` | distant tolling bell (western), extra distance treatment; see temple_bell for a bonsho | 7.205 | st | oneshot | ESC-50 3-87936-B-46.wav @0.0-5.0s (Freesound 87936) |
| `cicada_tsukutsuku_1` | tsukutsukuboushi cicada phrase ~9.5 s, distant | 11.404 | st | oneshot | synth `cicada_tsukutsuku` |
| `cicada_tsukutsuku_2` | tsukutsukuboushi, variation, further | 12.181 | st | oneshot | synth `cicada_tsukutsuku` |
| `cicada_tsukutsuku_3` | tsukutsukuboushi, variation, nearer | 12.055 | st | oneshot | synth `cicada_tsukutsuku` |
| `crickets_night` | night crickets, steady ~7 kHz trill + 3 kHz pulses, stereo loop | 30.0 | st | loop | ESC-50 5-215172-A-13.wav @0.0-5.0s (Freesound 215172) |
| `crickets_night_b` | night insects chorus (3.5 + 6.5 kHz bands), stereo loop | 30.0 | st | loop | ESC-50 3-129678-A-13.wav @0.0-5.0s (Freesound 129678) |
| `crow_caw_1` | single crow caw (slightly distant) | 0.736 | mono | oneshot | ESC-50 4-188287-A-9.wav @3.06-3.82s (Freesound 188287) |
| `crow_caw_2` | single caw, other crow | 0.653 | mono | oneshot | ESC-50 1-96950-B-9.wav @4.06-4.72s (Freesound 96950) |
| `crow_caws` | crow 'kaa kaa kaa' series (6 caws) | 3.793 | mono | oneshot | ESC-50 4-188287-A-9.wav @0.0-3.85s (Freesound 188287) |
| `dog_bark_1` | single bark, medium-small dog (f0~445 Hz) | 0.582 | mono | oneshot | ESC-50 4-191687-A-0.wav @1.745-2.4s (Freesound 191687) |
| `dog_bark_2` | single bark, same dog, variation | 0.486 | mono | oneshot | ESC-50 4-191687-A-0.wav @2.815-3.46s (Freesound 191687) |
| `dog_bark_3` | single bark, same dog, bigger | 0.439 | mono | oneshot | ESC-50 4-191687-A-0.wav @4.295-4.985s (Freesound 191687) |
| `dog_growl` | soft low growl (synth), 1.6 s | 1.6 | mono | oneshot | synth `dog_growl` |
| `dog_lick_1` | dog licks (2-3 slurps) | 0.371 | mono | oneshot | synth `dog_lick` |
| `dog_lick_2` | dog licks, variation | 0.544 | mono | oneshot | synth `dog_lick` |
| `dog_pant` | rhythmic panting breaths (~2.8/s), loop (breathing category) | 8.0 | st | loop | ESC-50 3-112557-A-23.wav @2.53-5.0s (Freesound 112557) |
| `dog_shake` | wet dog shaking off water, 1.3 s | 1.3 | mono | oneshot | synth `dog_shake` |
| `dog_sniff_1` | quick sniffing bursts | 0.73 | mono | oneshot | ESC-50 5-234335-A-23.wav @1.64-2.37s (Freesound 234335) |
| `dog_sniff_2` | sniffing, longer | 1.04 | mono | oneshot | ESC-50 5-234335-A-23.wav @2.42-3.46s (Freesound 234335) |
| `dog_sniff_synth_1` | quick sniffing (synth, ~6.5 sniffs/s) | 0.781 | mono | oneshot | synth `dog_sniff_synth` |
| `dog_sniff_synth_2` | quick sniffing, 6 sniffs (synth) | 1.18 | mono | oneshot | synth `dog_sniff_synth` |
| `dog_whine` | pleading whine/whimper (f0~600 Hz), ~3.4 s | 3.38 | mono | oneshot | ESC-50 5-217158-A-0.wav @0.22-3.6s (Freesound 217158) |
| `dog_yip_1` | short excited yip, small dog (f0~550 Hz) | 0.209 | mono | oneshot | ESC-50 3-157695-A-0.wav @2.425-2.66s (Freesound 157695) |
| `dog_yip_2` | short yip, variation | 0.196 | mono | oneshot | ESC-50 3-157695-A-0.wav @3.73-3.96s (Freesound 157695) |
| `dog_yip_3` | short yip, variation | 0.205 | mono | oneshot | ESC-50 3-157695-A-0.wav @4.03-4.26s (Freesound 157695) |
| `door_creak_1` | wooden door creak, rising pitch, 1 s | 1.034 | mono | oneshot | ESC-50 5-173568-A-33.wav @0.0-1.06s (Freesound 173568) |
| `door_creak_2` | slow tonal door creak, 1.5 s | 1.52 | mono | oneshot | ESC-50 1-51805-B-33.wav @0.38-1.9s (Freesound 51805) |
| `door_creak_3` | low wooden creak with knocks, 2.7 s | 2.732 | mono | oneshot | ESC-50 2-87780-A-33.wav @0.0-2.75s (Freesound 87780) |
| `door_slide_close` | wooden lattice door sliding shut (bump) | 1.159 | mono | oneshot | synth `door_slide` |
| `door_slide_open` | wooden lattice door sliding open | 1.339 | mono | oneshot | synth `door_slide` |
| `footstep_1` | soft single step | 0.39 | mono | oneshot | ESC-50 4-198962-A-25.wav @0.23-0.62s (Freesound 198962) |
| `footstep_2` | soft single step | 0.39 | mono | oneshot | ESC-50 4-198962-A-25.wav @1.66-2.05s (Freesound 198962) |
| `footstep_3` | soft single step, firmer | 0.46 | mono | oneshot | ESC-50 4-198962-A-25.wav @2.34-2.8s (Freesound 198962) |
| `footstep_4` | soft single step | 0.415 | mono | oneshot | ESC-50 4-198962-A-25.wav @2.915-3.33s (Freesound 198962) |
| `fumikiri` | railway crossing 'kan-kan', distant, 6 s | 6.0 | st | oneshot | synth `fumikiri` |
| `gripper_click_1` | robot gripper whir + latch click | 0.163 | mono | oneshot | synth `gripper_click` |
| `gripper_click_2` | gripper, variation | 0.161 | mono | oneshot | synth `gripper_click` |
| `higurashi_1` | higurashi evening 'kana-kana' ~6.5 s, distant | 6.793 | st | oneshot | synth `higurashi` |
| `higurashi_2` | higurashi, longer, further | 7.852 | st | oneshot | synth `higurashi` |
| `higurashi_3` | higurashi, shorter, nearer | 5.423 | st | oneshot | synth `higurashi` |
| `hum_phrase_demo` | hum voice, D4 E4 F#4 A4 F#4 E4 D4 (natural register) | 5.3 | mono | oneshot | synth `<lambda>` |
| `insects_buzz` | fly buzzing past (daytime insect) | 5.0 | mono | oneshot | ESC-50 3-110913-B-7.wav @0.0-5.0s (Freesound 110913) |
| `kettle_creak_1` | kettle handle/lid metal creak | 0.788 | mono | oneshot | synth `kettle_creak` |
| `kettle_creak_2` | kettle creak, short | 0.488 | mono | oneshot | synth `kettle_creak` |
| `kite_cry_1` | black kite 'piii-hyororo', distant | 4.696 | st | oneshot | synth `kite_cry` |
| `kite_cry_2` | black kite, further | 4.815 | st | oneshot | synth `kite_cry` |
| `kite_cry_3` | black kite, nearer | 4.774 | st | oneshot | synth `kite_cry` |
| `market_murmur` | wordless market crowd murmur, seamless 30 s stereo loop | 30.0 | st | loop | synth `market_murmur` |
| `metal_clatter_1` | small bell dropped on stone, bounces | 0.893 | mono | oneshot | synth `metal_clatter` |
| `metal_clatter_2` | metal clatter, variation | 0.883 | mono | oneshot | synth `metal_clatter` |
| `motor_roll_loop` | motor + wheels at constant speed 0.7 (use sfx.motor_roll for envelopes) | 8.0 | mono | loop | synth `motor_roll` |
| `motor_roll_start_stop` | motor roll: starts, cruises, stops (5 s) | 5.0 | mono | oneshot | synth `motor_roll` |
| `plastic_bag` | plastic bag crinkle 2 s | 1.991 | mono | oneshot | synth `plastic_bag` |
| `plastic_bag_2` | plastic bag crinkle 1.2 s | 1.197 | mono | oneshot | synth `plastic_bag` |
| `pouring_water` | steady splashing pour into water, stereo loop (stone channel bed) | 20.0 | st | loop | ESC-50 3-161500-A-17.wav @0.0-5.0s (Freesound 161500) |
| `puddle_splash_1` | wheel into puddle: soft puff splash | 0.651 | mono | oneshot | synth `puddle_splash` |
| `puddle_splash_2` | puddle splash, variation | 0.644 | mono | oneshot | synth `puddle_splash` |
| `rain_heavy` | heavier dense rain, no thunder, stereo loop | 30.0 | st | loop | ESC-50 1-50060-A-10.wav @0.0-5.0s (Freesound 50060) |
| `rain_light` | light steady rain, fine droplets, no thunder, stereo loop | 30.0 | st | loop | ESC-50 5-198321-A-10.wav @0.0-5.0s (Freesound 198321), 4-164206-A-10.wav @0.0-5.0s (Freesound 164206) |
| `robot_beep_curious` | robot beep: rise - dip - rise with a tiny trill | 0.549 | mono | oneshot | synth `robot_beep` |
| `robot_beep_curious_b` | robot beep: rise - dip - rise with a tiny trill (variation) | 0.55 | mono | oneshot | synth `robot_beep` |
| `robot_beep_happy` | robot beep: little trill ending high | 0.444 | mono | oneshot | synth `robot_beep` |
| `robot_beep_happy_b` | robot beep: little trill ending high (variation) | 0.444 | mono | oneshot | synth `robot_beep` |
| `robot_beep_hello` | robot beep: three-note greeting | 0.429 | mono | oneshot | synth `robot_beep` |
| `robot_beep_lowbat` | robot beep: three soft descending blips | 0.608 | mono | oneshot | synth `robot_beep` |
| `robot_beep_no` | robot beep: two-note down, soft | 0.369 | mono | oneshot | synth `robot_beep` |
| `robot_beep_powerdown` | robot beep: descending glide that fades (~2 s) | 1.959 | mono | oneshot | synth `robot_beep` |
| `robot_beep_powerup` | robot beep: four rising ticks + soft chime (~1.5 s) | 1.541 | mono | oneshot | synth `robot_beep` |
| `robot_beep_query` | robot beep: rising two-note question | 0.339 | mono | oneshot | synth `robot_beep` |
| `robot_beep_query_b` | robot beep: rising two-note question (variation) | 0.339 | mono | oneshot | synth `robot_beep` |
| `robot_beep_sad` | robot beep: slow falling glide | 0.756 | mono | oneshot | synth `robot_beep` |
| `robot_beep_sad_b` | robot beep: slow falling glide (variation) | 0.756 | mono | oneshot | synth `robot_beep` |
| `robot_beep_startle` | robot beep: quick upward chirp + blip | 0.159 | mono | oneshot | synth `robot_beep` |
| `robot_beep_tired` | robot beep: slow falling wobble | 1.153 | mono | oneshot | synth `robot_beep` |
| `robot_beep_yes` | robot beep: bright two-note up | 0.244 | mono | oneshot | synth `robot_beep` |
| `robot_beep_yes_b` | robot beep: bright two-note up (variation) | 0.244 | mono | oneshot | synth `robot_beep` |
| `servo_long` | servo whine 0.9 s (arm) | 0.9 | mono | oneshot | synth `servo` |
| `servo_long_2` | servo whine 1.3 s, falling | 1.3 | mono | oneshot | synth `servo` |
| `servo_short` | small head servo whine, 0.28 s, rising | 0.28 | mono | oneshot | synth `servo` |
| `servo_short_down` | small servo whine, falling | 0.28 | mono | oneshot | synth `servo` |
| `shutter_roll` | metal shop shutter rolling up, distant, 3 s | 4.47 | st | oneshot | synth `shutter_roll` |
| `shutter_roll_2` | shutter, further | 4.478 | st | oneshot | synth `shutter_roll` |
| `slipper_step_1` | soft slipper step on stone (synth) | 0.138 | mono | oneshot | synth `slipper_step` |
| `slipper_step_2` | slipper step, variation | 0.093 | mono | oneshot | synth `slipper_step` |
| `slipper_step_3` | slipper step, variation | 0.142 | mono | oneshot | synth `slipper_step` |
| `slipper_step_4` | slipper step, lighter | 0.152 | mono | oneshot | synth `slipper_step` |
| `sparrows` | morning small-bird chirps (sparrow-like 5-9 kHz), stereo loop | 20.0 | st | loop | ESC-50 2-108761-A-14.wav @0.0-5.0s (Freesound 108761) |
| `suzumushi` | bell cricket 'riiin' chirps ~4.3 kHz, 10 s | 10.088 | st | oneshot | synth `suzumushi` |
| `suzumushi_2` | bell cricket, variation | 8.908 | st | oneshot | synth `suzumushi` |
| `temple_bell` | bonsho temple bell, distant, 12 s | 12.0 | st | oneshot | synth `temple_bell` |
| `temple_bell_far` | bonsho, further away | 12.0 | st | oneshot | synth `temple_bell` |
| `train_distant` | distant train passing: rumble swells in and out over 14 s | 14.0 | st | pass | ESC-50 2-262579-A-45.wav @0.0-5.0s (Freesound 262579) |
| `vending_hum` | vending machine hum (60 Hz), seamless 10 s loop | 10.0 | st | loop | synth `vending_hum` |
| `water_channel` | water trickling in a stone channel, seamless 20 s stereo loop | 20.0 | st | loop | synth `water_channel` |
| `water_drop_1` | single water drop 'plink' | 0.173 | mono | oneshot | ESC-50 3-156907-A-15.wav @0.335-0.62s (Freesound 156907) |
| `water_drop_2` | single water drop | 0.176 | mono | oneshot | ESC-50 3-156907-A-15.wav @1.305-1.6s (Freesound 156907) |
| `water_drop_3` | single water drop | 0.275 | mono | oneshot | ESC-50 3-156907-A-15.wav @2.145-2.47s (Freesound 156907) |
| `whoosh_soft_1` | soft whoosh L->R 0.9 s | 0.9 | st | oneshot | synth `whoosh_soft` |
| `whoosh_soft_2` | soft whoosh, slower | 1.4 | st | oneshot | synth `whoosh_soft` |
| `wind_soft` | soft wind, seamless 30 s stereo loop | 30.0 | st | loop | synth `wind_soft` |

### How the ESC-50 clips were chosen
`tools/esc50_survey.py` (per-clip RMS, peak, noise floor, onset count, spectral centroid,
spectral flatness, clipping + contact-sheet spectrograms), `tools/esc50_events.py` (splits clips
into isolated events: duration, SNR vs clip floor, gaps, centroid, autocorrelation f0 and
harmonicity, clipping) and `tools/esc50_view.py` (full-clip spectrograms) were used; picks were
then confirmed by eye. Dogs: one medium-small dog (f0 ≈ 445–520 Hz, clean isolated barks) for
`dog_bark_*`, a small yappy dog (f0 ≈ 550 Hz) for `dog_yip_*`; no clean growl exists in ESC-50
(the low-f0 candidates are soft 'boofs'), so `dog_growl` is synthesised. Cats: three meows from one
cat with natural pitch contours; no clean 'mrrp'/hiss exists, so both are synthesised. Rain:
stationary clips without low-frequency bursts (thunder-free), MP3-damaged ones rejected. Footsteps:
the softest isolated steps in a quiet room; ESC-50 has no slippers-on-stone, so `slipper_step_*`
are synthesised. Church bells in ESC-50 are all Western peals/tolls; the temple bell is synthesised.

---------------------------------------------------------------------------------------------

## mix.py

| function | notes |
|---|---|
| `place(buf, clip, t, gain_db=0, pan=0, sr=48000, width=1.0)` | mixes into stereo `buf` in place (mono clips: constant-power pan; stereo: balance); crops outside |
| `pan_stereo(x, pan=0, width=1)`, `pan_gains(pan)`, `as_stereo`, `as_mono`, `silence(dur, sr, stereo=True)` | |
| `fade_in(x, dur_s, sr, shape='cos' / 'lin' / 'exp' / 'sqrt')`, `fade_out(...)`, `fades(x, fin, fout)` | |
| `crossfade_concat(a, b, xf_s, power=True)`, `make_loopable(x, xf_s)`, `loop_to(clip, dur_s, crossfade=0.25, fade_edges=True)` | equal-power seams |
| `lowpass(x, f, sr, order=4, zero_phase=True)`, `highpass(...)`, `bandpass(x, lo, hi, sr, order=2)` | Butterworth SOS, `sosfiltfilt` |
| `peaking_eq(x, f, gain_db, q)`, `shelf(x, f, gain_db, kind='high' / 'low')`, `remove_dc(x)` | RBJ biquads |
| `compress(x, threshold_db=-18, ratio=2, attack_ms=10, release_ms=150, knee_db=6, makeup_db=0)` | RMS, stereo-linked, soft knee |
| `limit(x, ceiling_db=-1, lookahead_ms=3, release_ms=80)` | look-ahead brickwall; guarantees sample peak ≤ ceiling |
| `lufs(x, sr=48000)` | ITU-R BS.1770-4 integrated: K-weighting, 400 ms / 75 % blocks, -70 LUFS abs. and -10 LU rel. gates (verified: 997 Hz 0 dBFS sine in one channel = -3.01 LUFS) |
| `short_term_max(x)`, `normalise_to(buf, lufs=-23, peak_ceiling_db=-1, use_limiter=True)` (alias `normalize_to`), `peak_normalise(x, peak_db)` | |
| `check(x) -> dict` | peak, DC, LUFS, max step, HF peak, edge value |
| `write_wav(path, x, sr=48000, subtype='PCM_24')`, `read_wav(path, sr=48000)` (resamples) | |

## spectro.py
`spectrogram_png(x, path, title='', fmax=16000, sr=48000, db_range=90, log_freq=False, marks=[(t,label)], nfft=None, width=14, height=None)`
(waveform peak envelope + spectrogram, LUFS/peak in the title) and
`spectrum_png(x, path, title, fmax, t0, t1, marks_hz=[(f,label)])` (Welch long-term spectrum).

## demo/
* `instruments.wav` (+ `.png`, `instruments_p1..4.png`, `instruments_cues.json`): every instrument
  plays D5 E5 F#5 A5 then a low D chord (D3 A3 D4 F#4), shifted up by octaves where the sampled
  range requires it (glock +1/+3 oct., ocarina/chimes/tubular chord +1/+2 oct.; see cues), hall 0.22.
* `sfx_tour.wav` (+ `sfx_tour_p01..10.png` with labels, `sfx_tour_cues.json`): every catalogue
  entry in alphabetical order with 0.5 s gaps; loops are shown as 6 s excerpts.
* `hum.wav` (D5 E5 F#5 A5 F#5 E5 D5, 0.6 s each) + `hum.png`, `hum_spectrum.png`;
  `hum_low.wav` (same an octave lower), `hum_low_room.wav` (in a small room).
* `reverb.wav` (dry | room | hall | temple), `ir_hall.png`.

## Credits / licences
* **VCSL, Versilian Community Sample Library** (CC0), Versilian Studios / Sam Gossner et al.
* **VSCO 2 Community Edition** (CC0), Versilian Studios / Sam Gossner; Ivy Audio / Simon Dalzell.
* **ESC-50** (K. J. Piczak, "ESC: Dataset for Environmental Sound Classification", ACM MM 2015),
  clips from Freesound.org, **CC BY-NC 3.0** – fine for this non-commercial film with credit.
  Clips used (Freesound ids):
- Freesound #50060, ESC-50 `1-50060-A-10.wav` (rain), https://freesound.org/s/50060/
- Freesound #51805, ESC-50 `1-51805-B-33.wav` (door_wood_creaks), https://freesound.org/s/51805/
- Freesound #56380, ESC-50 `1-56380-A-5.wav` (cat), https://freesound.org/s/56380/
- Freesound #87780, ESC-50 `2-87780-A-33.wav` (door_wood_creaks), https://freesound.org/s/87780/
- Freesound #87936, ESC-50 `3-87936-B-46.wav` (church_bells), https://freesound.org/s/87936/
- Freesound #96950, ESC-50 `1-96950-B-9.wav` (crow), https://freesound.org/s/96950/
- Freesound #108761, ESC-50 `2-108761-A-14.wav` (chirping_birds), https://freesound.org/s/108761/
- Freesound #110913, ESC-50 `3-110913-B-7.wav` (insects), https://freesound.org/s/110913/
- Freesound #112557, ESC-50 `3-112557-A-23.wav` (breathing), https://freesound.org/s/112557/
- Freesound #129678, ESC-50 `3-129678-A-13.wav` (crickets), https://freesound.org/s/129678/
- Freesound #155583, ESC-50 `3-155583-A-14.wav` (chirping_birds), https://freesound.org/s/155583/
- Freesound #156907, ESC-50 `3-156907-A-15.wav` (water_drops), https://freesound.org/s/156907/
- Freesound #157695, ESC-50 `3-157695-A-0.wav` (dog), https://freesound.org/s/157695/
- Freesound #161303, ESC-50 `4-161303-A-5.wav` (cat), https://freesound.org/s/161303/
- Freesound #161500, ESC-50 `3-161500-A-17.wav` (pouring_water), https://freesound.org/s/161500/
- Freesound #164206, ESC-50 `4-164206-A-10.wav` (rain), https://freesound.org/s/164206/
- Freesound #173568, ESC-50 `5-173568-A-33.wav` (door_wood_creaks), https://freesound.org/s/173568/
- Freesound #188287, ESC-50 `4-188287-A-9.wav` (crow), https://freesound.org/s/188287/
- Freesound #191687, ESC-50 `4-191687-A-0.wav` (dog), https://freesound.org/s/191687/
- Freesound #198321, ESC-50 `5-198321-A-10.wav` (rain), https://freesound.org/s/198321/
- Freesound #198962, ESC-50 `4-198962-A-25.wav` (footsteps), https://freesound.org/s/198962/
- Freesound #215172, ESC-50 `5-215172-A-13.wav` (crickets), https://freesound.org/s/215172/
- Freesound #217158, ESC-50 `5-217158-A-0.wav` (dog), https://freesound.org/s/217158/
- Freesound #234335, ESC-50 `5-234335-A-23.wav` (breathing), https://freesound.org/s/234335/
- Freesound #262579, ESC-50 `2-262579-A-45.wav` (train), https://freesound.org/s/262579/
* All other sounds are synthesised in `sfx.py` (no third-party material).

## Known gaps / notes
* No heron. No clean real growl, cat 'mrrp'/hiss or slipper steps in ESC-50 → synthesised versions.
* Instrument ranges are those of the sources: glock sounds G5–C8, ocarina A4–C#6, tubular bells
  C4–F5, chimes C4–C7, hand-harp C2–G#6, cellos to F5; notes outside are still rendered by
  resampling from the nearest sample (quality drops beyond ~±5 semitones).
* String sections carry some ensemble intonation drift (±5–12 cents on a few samples); soft layers
  of the sections swell slowly (good for pads, less for short notes).
* `market_murmur` is fully synthetic babble (no words by construction); treat it as a distant bed.
* The QA click detector (`tools/qa.py`) flags every sharp intended transient (drops, clicks,
  mallets) – those were checked by eye; no seam/boundary clicks remain (loop seams verified).
