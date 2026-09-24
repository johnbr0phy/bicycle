"""Builds the complete soundtrack for The Bicycle: ambience beds, spot effects keyed to the animation, her hum, and
the score. Writes out/audio/soundtrack.wav (48 kHz stereo) plus stems."""
import os, sys, numpy as np
HERE = os.path.dirname(__file__); sys.path.insert(0, os.path.join(HERE, '..'))
import sampler, sfx, mix
import score as SC
SR = 48000; T = SC.T; TOTAL = SC.TOTAL + 1.0
OUT = os.path.join(HERE, '../../out/audio'); os.makedirs(OUT, exist_ok=True)

def st(x):
    x = np.asarray(x, dtype=np.float32)
    return np.stack([x, x], 1) if x.ndim == 1 else x
def bed(bus, name, t0, t1, g, fin=0.6, fout=0.6, lp=None, hp=None, clip=None):
    c = st(clip if clip is not None else sfx.get(name)); d = t1 - t0
    c = mix.loop_to(c, d, 0.5) if len(c) < d * SR else c[: int(d * SR)]
    if lp: c = mix.lowpass(c, lp)
    if hp: c = mix.highpass(c, hp)
    c = mix.fades(c, fin, fout); mix.place(bus, c, t0, gain_db=g)
def hit(bus, name, t, g=0.0, pan=0.0, lp=None, clip=None, rate=None):
    c = clip if clip is not None else sfx.get(name)
    if rate:
        import scipy.signal as ss; c = np.asarray(c); n = int(len(c) / rate); c = ss.resample(c, n, axis=0).astype(np.float32)
    if lp: c = mix.lowpass(c, lp)
    mix.place(bus, c, t, gain_db=g, pan=pan)
def motor(bus, t0, t1, g=-14.0, pan=0.0, spd=0.8, lp=None):
    d = t1 - t0; c = sfx.motor_roll(d, speed=lambda t: spd * min(1, t / 0.3, max(0, (d - t) / 0.3)))
    if lp: c = mix.lowpass(c, lp)
    mix.place(bus, c, t0, gain_db=g, pan=pan)
def squeak(dur=0.09, f0=1900, f1=2500, seed=0):
    n = int(dur * SR); t = np.arange(n) / SR; f = np.linspace(f0, f1, n) * (1 + 0.02 * np.sin(2 * np.pi * 30 * t)); ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.15 * np.random.RandomState(seed).randn(n)) * np.hanning(n) ** 0.7
    return mix.bandpass(y.astype(np.float32) * 0.25, 900, 6000)
def ticks(dur, rate=11, g=1.0, seed=1):  # freewheel ratchet
    n = int(dur * SR); y = np.zeros(n, np.float32); R = np.random.RandomState(seed); k = 0.0
    while k < dur:
        i = int(k * SR); L = 90
        if i + L < n: y[i:i + L] += (R.randn(L) * np.exp(-np.arange(L) / 14)).astype(np.float32) * 0.35
        k += 1.0 / rate * (1 + R.uniform(-0.08, 0.08))
    return mix.bandpass(y, 2500, 9000) * g
def cloth(dur=0.6, seed=2):
    n = int(dur * SR); R = np.random.RandomState(seed); y = R.randn(n).astype(np.float32) * np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return mix.bandpass(y * 0.2, 300, 3500)
def steps(bus, name_base, times, g=-16.0, pan=0.0, lp=None):
    for i, t in enumerate(times): hit(bus, f'{name_base}_{1 + i % 4}', t, g + (i % 2) * -1.5, pan, lp=lp)

amb = mix.silence(TOTAL); fx = mix.silence(TOTAL); voice = mix.silence(TOTAL)
# ---------------------------------------------------------------- AMBIENCE (beds, with overlaps at the cuts)
L0, L1 = T('S01', 0.4), T('S07', 0.0)          # the lane at dawn, one continuous space
bed(amb, 'sparrows', L0, L1 + 0.4, -20, 2.0, 0.4)
bed(amb, 'water_channel', T('S02', 0), L1 + 0.4, -22, 0.8, 0.4)
bed(amb, 'wind_soft', L0, L1, -30, 2.0, 0.4)
hit(amb, 'cicada_tsukutsuku_2', T('S01', 1.0), -20, 0.4)
hit(amb, 'temple_bell_far', T('S02', 0.3), -12, -0.2)
bed(amb, 'wind_soft', T('S03', 0), T('S03', 4.9), -26, 0.3, 0.3, lp=900)                  # the dim genkan: room tone
bed(amb, 'sparrows', T('S03', 4.9), T('S03', 6.0), -16, 0.4, 0.2)                          # door opens: morning floods in
bed(amb, 'sparrows', T('S07', 0), T('S09', 7.0), -22, 0.3, 0.6); bed(amb, 'water_channel', T('S07', 0), T('S07', 7.2), -20, 0.3, 0.4)
hit(amb, 'cicada_tsukutsuku_1', T('S08', 0.0), -18, 0.3); hit(amb, 'cicada_tsukutsuku_3', T('S09', 0.5), -16, -0.2)
bed(amb, 'wind_soft', T('S07', 0), T('S09', 7), -28, 0.4, 0.4)
bed(amb, 'pouring_water', T('S10', 0), T('S11', 7.2), -26, 0.3, 0.4, lp=2500); bed(amb, 'water_channel', T('S10', 0), T('S11', 7.2), -21, 0.3, 0.4)
bed(amb, 'wind_soft', T('S10', 0), T('S11', 7), -24, 0.3, 0.3); bed(amb, 'sparrows', T('S10', 0), T('S11', 7), -26, 0.3, 0.3)
bed(amb, 'market_murmur', T('S12', 0), T('S12', 8.2), -12, 0.25, 0.3); bed(amb, 'market_murmur', T('S13', 0), T('S13', 7.2), -18, 0.1, 0.4, lp=4000)
bed(amb, 'pouring_water', T('S14', 0), T('S15', 7.2), -24, 0.4, 0.5, lp=1800); bed(amb, 'wind_soft', T('S14', 0), T('S15', 7.2), -20, 0.4, 0.5)
bed(amb, 'water_channel', T('S15', 0), T('S15', 7.2), -20, 0.2, 0.4)
hit(amb, 'kite_cry_2', T('S14', 1.4), -14, 0.3); hit(amb, 'kite_cry_1', T('S15', 2.0), -20, -0.3)
hit(amb, 'higurashi_1', T('S16', 0.4), -17, -0.3); hit(amb, 'fumikiri', T('S16', 1.0), -22, 0.4)
rain_l = sfx.get('rain_light'); bed(amb, None, T('S16', 1.8), T('S16', 7.2), -20, 2.5, 0.2, clip=rain_l)
bed(amb, 'rain_heavy', T('S17', 0), T('S18', 5.6), -16, 0.1, 1.5); bed(amb, None, T('S18', 5.0), T('S18', 9.2), -20, 1.0, 1.4, clip=rain_l)
hit(amb, 'higurashi_2', T('S17', 0.2), -22, 0.3)
bed(amb, 'vending_hum', T('S18', 0), T('S18', 9.0), -18, 0.2, 0.5)
bed(amb, 'crickets_night_b', T('S19', 0), T('S19', 9.1), -26, 1.0, 0.3)
for i in range(14): hit(amb, f'water_drop_{1 + i % 3}', T('S19', 0.3 + i * 0.63 + (i % 3) * 0.17), -24, -0.6 + 0.1 * (i % 12))
for i in range(12): hit(amb, f'water_drop_{1 + i % 3}', T('S20', 0.4 + i * 0.72), -20, -0.3 + 0.05 * i)
bed(amb, 'vending_hum', T('S20', 0), T('S21', 8.1), -30, 0.3, 0.5, lp=500)          # the bare bulb's hum
hit(amb, 'higurashi_3', T('S20', 0.5), -28, 0.4)
bed(amb, 'crickets_night', T('S21', 0), T('S21', 8.1), -30, 0.4, 0.4)
bed(amb, 'crickets_night', T('S22', 0), T('S26', 9.1), -24, 0.8, 0.8); bed(amb, 'suzumushi', T('S23', 0), T('S26', 9.0), -22, 1.5, 1.0)
bed(amb, 'wind_soft', T('S22', 0), T('S26', 9.0), -32, 1.0, 1.0)
bed(amb, 'wind_soft', T('S25', 0), T('S25', 6.1), -30, 0.3, 0.3, lp=700)
bed(amb, 'sparrows', T('S27', 0), T('S27', 8.5), -18, 0.4, 2.0); bed(amb, 'water_channel', T('S27', 0), T('S27', 8.5), -22, 0.4, 2.0)
hit(amb, 'temple_bell_far', T('S27', 0.3), -12, -0.2)
# ---------------------------------------------------------------- SPOT EFFECTS (times from the animation code)
# S03 the robot wakes
hit(fx, 'robot_beep_powerup', T('S03', 0.55), -10, 0.0)
hit(fx, 'servo_short', T('S03', 2.25), -18, 0.1); hit(fx, 'servo_short', T('S03', 2.6), -19, -0.1)
motor(fx, T('S03', 3.5), T('S03', 4.75), -13); hit(fx, 'door_slide_open', T('S03', 4.85), -8, 0.2)
# S04 he sees it
motor(fx, T('S04', 0), T('S04', 1.2), -14, 0.3); hit(fx, 'robot_beep_query', T('S04', 2.45), -11, 0.1)
motor(fx, T('S04', 3.0), T('S04', 4.1), -15, 0.1); hit(fx, 'servo_short', T('S04', 4.35), -20); hit(fx, 'servo_short', T('S04', 4.95), -20, -0.2); hit(fx, 'servo_short', T('S04', 5.45), -20, 0.2)
# S05 she looks at it
steps(fx, 'slipper_step', [T('S05', x) for x in (0.15, 0.5, 0.85, 1.2)], -17, 0.2); hit(fx, 'kettle_creak_1', T('S05', 0.45), -18, 0.2)
steps(fx, 'slipper_step', [T('S05', x) for x in (5.7, 6.05, 6.4)], -18, 0.3); hit(fx, 'door_slide_close', T('S05', 6.55), -8, 0.3)
hit(fx, 'robot_beep_sad', T('S05', 7.35), -17, -0.3)
# S06 the decision
hit(fx, 'shutter_roll_2', T('S06', 0.8), -22, 0.5)
hit(fx, 'robot_beep_curious', T('S06', 2.6), -12); hit(fx, 'servo_long', T('S06', 2.95), -18); hit(fx, 'gripper_click_1', T('S06', 3.5), -18)
motor(fx, T('S06', 4.3), T('S06', 7.0), -13, 0.0, 0.9)
# S07 past the shiba
motor(fx, T('S07', 0), T('S07', 7.0), -15, 0.0, 0.8)
hit(fx, None, T('S07', 2.6), -24, 0.3, clip=sampler.render([dict(t=0, inst='glock', note=96, vel=0.3)], 1.5))   # collar tag
hit(fx, 'bike_bell_ding', T('S07', 4.8), -26, 0.6, lp=2500)                                                         # somebody else's bell, far away
# S08 the wall of cats
motor(fx, T('S08', 0), T('S08', 2.2), -15, -0.3); hit(fx, 'crow_caw_1', T('S08', 1.0), -18, 0.5); hit(fx, 'robot_beep_query_b', T('S08', 2.95), -12, -0.2)
hit(fx, 'cat_mrrp_2', T('S08', 5.4), -18, 0.2, rate=0.8); hit(fx, 'crow_caws', T('S08', 5.6), -24, -0.5, lp=3000)
# S09 east
hit(fx, 'cat_mrrp_1', T('S09', 5.5), -19, 0.0)
# S10 standoff
motor(fx, T('S10', 0), T('S10', 2.7), -14, -0.2); hit(fx, 'robot_beep_startle', T('S10', 3.72), -11, -0.2); hit(fx, 'dog_growl', T('S10', 3.8), -8, 0.3)
hit(fx, 'dog_growl', T('S10', 5.3), -11, 0.3)
# S11 the shiba remembers
hit(fx, 'dog_sniff_1', T('S11', 0.9), -16, 0.3); hit(fx, 'dog_bark_1', T('S11', 4.3), -6, 0.3); hit(fx, 'robot_beep_happy', T('S11', 4.95), -12, -0.2)
hit(fx, 'whoosh_soft_1', T('S11', 5.2), -14); motor(fx, T('S11', 5.2), T('S11', 7.0), -14, -0.2, 1.0)
# S12 Nishiki
motor(fx, T('S12', 0), T('S12', 8.0), -18, 0, 0.7); hit(fx, 'plastic_bag', T('S12', 1.4), -14, 0.4); hit(fx, 'plastic_bag_2', T('S12', 5.6), -14, -0.4)
steps(fx, 'footstep', [T('S12', 0.3 + i * 0.47) for i in range(16)], -22, 0.1)
# S13 the cap
hit(fx, 'robot_beep_query', T('S13', 1.6), -12, -0.3); hit(fx, 'dog_bark_2', T('S13', 3.35), -6, -0.4); hit(fx, 'cat_hiss', T('S13', 3.55), -6, 0.3)
hit(fx, 'servo_long', T('S13', 4.7), -17, -0.2); hit(fx, 'gripper_click_2', T('S13', 5.05), -14); hit(fx, 'robot_beep_curious_b', T('S13', 5.95), -13)
# S14 the river
motor(fx, T('S14', 0), T('S14', 7.5), -24, 0, 0.6, lp=2500); hit(fx, 'robot_beep_tired', T('S14', 6.2), -18)
# S15 the elder cat
hit(fx, 'robot_beep_curious', T('S15', 3.9), -14); hit(fx, 'dog_sniff_2', T('S15', 4.6), -9, 0.2); hit(fx, 'dog_sniff_synth_1', T('S15', 5.3), -10, 0.2)
hit(fx, 'whoosh_soft_2', T('S15', 5.6), -15); hit(fx, 'cat_mrrp_2', T('S15', 3.7), -24, 0.4, rate=0.75)
# S16 lanterns
motor(fx, T('S16', 0), T('S16', 7.0), -17, 0, 0.8); hit(fx, 'puddle_splash_1', T('S16', 3.55), -10, 0.1)
# S17 one bar
motor(fx, T('S17', 0), T('S17', 3.2), -16, 0.2, 0.6); hit(fx, 'robot_beep_lowbat', T('S17', 3.4), -10, 0.2); hit(fx, 'gripper_click_1', T('S17', 4.95), -16, 0.2); hit(fx, 'robot_beep_tired', T('S17', 6.2), -14, 0.2)
# S18 the low point
hit(fx, 'robot_beep_powerdown', T('S18', 0.7), -11, 0.1)
steps(fx, 'footstep', [T('S18', 3.7 + i * 0.3) for i in range(5)], -26, -0.3, lp=2500)
hit(fx, 'metal_clatter_1', T('S18', 5.2), -9, -0.1); bed(fx, 'dog_pant', T('S18', 5.3), T('S18', 8.4), -16, 0.2, 0.3)
hit(fx, 'robot_beep_hello', T('S18', 6.0), -14, 0.1); hit(fx, 'gripper_click_2', T('S18', 7.0), -14); hit(fx, 'bike_bell_clack_1', T('S18', 7.95), -6)
hit(fx, 'dog_shake', T('S18', 8.4), -12, -0.3)
# S19 the turn
hit(fx, 'dog_shake', T('S19', 0.4), -14, 0.3); motor(fx, T('S19', 0), T('S19', 9.0), -16, 0, 0.9)
for i in range(4): hit(fx, f'puddle_splash_{1 + i % 2}', T('S19', 1.7 + i * 1.9), -21, 0.1 * i)
# S20 the alley
motor(fx, T('S20', 0), T('S20', 2.2), -15, 0.1)
# S21 the cap goes back
hit(fx, 'servo_long', T('S21', 0.8), -16, 0.3); hit(fx, 'gripper_click_1', T('S21', 2.4), -14, 0.2); hit(fx, 'robot_beep_yes', T('S21', 3.45), -14, 0.3)
hit(fx, 'robot_beep_hello', T('S21', 4.4), -13, 0.3); hit(fx, 'dog_lick_1', T('S21', 4.35), -12, -0.3); hit(fx, 'dog_lick_2', T('S21', 5.2), -12, -0.3); hit(fx, 'robot_beep_happy_b', T('S21', 7.6), -12, 0.3)
# S22 walking home: boy's steps, the rear wheel squeaks once per turn, the freewheel ticks
steps(fx, 'footstep', [T('S22', 0.2 + i * 0.53) for i in range(19)], -22, -0.1)
for i in range(10): mix.place(fx, squeak(seed=i), T('S22', 0.5 + i * 0.98), gain_db=-22, pan=0.1)
mix.place(fx, ticks(10.0, 9, 0.6), T('S22', 0), gain_db=-30); motor(fx, T('S22', 0), T('S22', 10), -21, -0.2, 0.6)
# S23 the doorstep (no music)
motor(fx, T('S23', 0.3), T('S23', 2.9), -18, 0.4, 0.7); steps(fx, 'footstep', [T('S23', 0.9 + i * 0.52) for i in range(5)], -22, 0.4)
mix.place(fx, squeak(seed=21), T('S23', 1.6), gain_db=-24, pan=0.4); mix.place(fx, squeak(seed=22), T('S23', 2.6), gain_db=-24, pan=0.3)
hit(fx, 'metal_clatter_2', T('S23', 3.5), -26, 0.1, lp=1500)                         # the kick-stand
hit(fx, None, T('S23', 2.1), -20, -0.3, clip=cloth(0.5))                           # she rises
hit(fx, 'gripper_click_2', T('S23', 6.95), -16, -0.4); hit(fx, None, T('S23', 7.2), -20, -0.3, clip=sampler.render([dict(t=0, inst='glock', note=98, vel=0.2)], 1.0))
steps(fx, 'slipper_step', [T('S23', 8.0 + i * 0.4) for i in range(3)], -20, -0.1)
# S24 she runs
steps(fx, 'slipper_step', [T('S24', 1.3 + i * 0.33) for i in range(12)] + [T('S24', 5.3 + i * 0.45) for i in range(4)], -17, 0.05)
mix.place(fx, ticks(9.0, 7, 0.5, seed=5), T('S24', 1.2), gain_db=-28)
for i in range(7): mix.place(fx, squeak(seed=30 + i), T('S24', 1.8 + i * 1.1), gain_db=-26 - i * 1.5, pan=0.05)
# S26 zero
mix.place(fx, ticks(3.8, 10, 0.6, seed=9), T('S26', 0), gain_db=-26); mix.place(fx, squeak(0.25, 2600, 2300, 40), T('S26', 3.55), gain_db=-24, pan=0.3)
hit(fx, 'robot_beep_powerdown', T('S26', 4.35), -16, -0.1); hit(fx, None, T('S26', 4.6), -18, -0.2, clip=cloth(0.9, 7))
hit(fx, 'bike_bell_clack_1', T('S26', 5.7), -5, 0.3); hit(fx, 'bike_bell_clack_2', T('S26', 6.35), -5, 0.3)
hit(fx, 'bike_bell_ring', T('S26', 7.2), -2, 0.25)
# ---------------------------------------------------------------- HER HUM
for i, (t0, notes) in enumerate(SC.hums()):
    h = sfx.hum_voice(notes, seed=3 + i)
    if i == 0: h = sampler.room(st(h), 0.18); mix.place(voice, h, t0, gain_db=-11, pan=0.2)
    else: h = sampler.preset(st(mix.lowpass(h, 2200)), 'room', 0.45); mix.place(voice, h, t0, gain_db=-14, pan=0.15)   # from inside the house
# ---------------------------------------------------------------- MUSIC
ev = SC.cues(); music = sampler.render(ev, duration=TOTAL)
music = sampler.hall(music, wet=0.3)
# ---------------------------------------------------------------- MIX
stems = dict(ambience=amb, effects=fx, voice=voice, music=music)
for k, v in stems.items(): mix.write_wav(os.path.join(OUT, f'stem_{k}.wav'), v)
bus = amb + fx + voice + music * mix.db2amp(-1.5)
bus = mix.compress(bus, threshold_db=-18, ratio=1.8, attack_ms=15, release_ms=250)
bus = mix.normalise_to(bus, -16.0); bus = mix.limit(bus, -1.0)
# fade in from silence and out at the end
bus = mix.fades(bus, 0.05, 2.5)
mix.write_wav(os.path.join(OUT, 'soundtrack.wav'), bus)
print('LUFS', round(mix.lufs(bus), 2), 'peak dB', round(20 * np.log10(np.max(np.abs(bus)) + 1e-9), 2), 'len', len(bus) / SR)
