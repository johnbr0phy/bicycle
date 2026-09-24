# Production log: what worked, what didn't

Kept as I went, so later passes don't repeat mistakes.

## Picture

| Problem | Cause | Fix |
|---|---|---|
| Crescent shadows fell on the lit side | Light vector sign flipped in `celShade` | Light is now "toward the light"; shadow shape is the base shifted toward the light, subtracted |
| Watercolour looked like flat vector | Edge darkening silently disabled by a premultiplied-alpha bug | Blur buffer un-premultiplied correctly; tremor, bleed and granulation strengthened |
| Lane felt empty and dim at dawn | Harsh sun strip, over-hazed distance | Soft sheen, god rays, graded split tone, lit upper floors on the sun side |
| Dark band at the bottom of zoomed shots | The zoom showed unpainted canvas below the plate | Plates painted with an 18% margin; push-ins centre correctly |
| Reverse angles drew near buildings behind far ones | Depth slabs sorted by world z, not camera distance | Slabs and characters sorted by distance from the camera |
| Robot was a sliver in profile | True side view hides the screen face | Readability cheat: max ~55 degrees from camera while moving |
| Robot eye glow drew a hard ring | Glow was a thick stroke | Real `shadowBlur` glow |
| Robot looked oversized next to people | He was placed nearer the lens | Re-blocked at equal depth |
| Woman looked like a stick in a bell skirt | Skirt too short, torso too narrow, no hair volume | Bell-shaped cardigan, longer skirt, hair volume, finer glasses |
| Bow hidden behind the bicycle (S23) | Blocking | Solved marks numerically; boy bows in profile between her and the bike |
| Rider IK on a flipped bike was doubled | Anchors already flipped by the layer transform | Removed the second flip |
| Riding away from camera looked wrong | Side-view bike squashed to a sliver | Dedicated rear and front views of the bicycle |
| Shop counters in the lane looked like cartoon props | Too literal | Replaced with lattice |
| Market shopper walked through the lens | Crowd included near-camera oncoming walkers | Oncoming shoppers kept to the sides; near figures culled |
| Renders killed by the OOM killer | node-canvas 3.2.3 leaks every canvas that receives `drawImage` | Frame-scoped canvas registry, shrunk to 1x1 at frame end |
| S19 cats floating mid-air | Placed at fence height with no fence drawn | Folding benches (battari shogi) under them |
| S21 shiba looked headless | Drawn before the robot and facing away from the boy | Flipped to face the boy, drawn in depth order; hat raised clear |
| S10 shiba cut by frame edge | Blocking pushed too far right | Robot and shiba marks moved 0.3-0.5 m in |
| S14 bottom 40% empty sand | Wide lens, nothing in the foreground | Watercolour grass bank with tufts and swaying susuki |
| S22 shiba's head out of frame | Led the group off the left edge | Trails the robot instead |
| Vertical cut lost the robot or the bell (S07, S08, S10, S26) and clipped credit lines | Crop centres set by eye | Re-solved from contact sheets; credits letterboxed on paper colour |
| 208 MB master too big for GitHub and chat | crf 16 | Two-pass targets: 3 Mbps master (<100 MB), 820 kbps 720p preview (<30 MB) |

## Sound

| Problem | Cause | Fix |
|---|---|---|
| Can't listen | I am a language model | Level-over-time plots per stem against shot boundaries, spectrograms, LUFS measurement |
| 227 of 643 samples cancelled in mono | Spaced-pair recordings in anti-phase | Right channel time-aligned (audio agent) |
| Her hum too hot in S05 | Placed at -7 dB | -11 dB |

## Process

- Render probes (3-4 frames per shot) into contact sheets before any full render: cheap and caught most staging errors.
- Numeric camera solving (project candidate marks, read screen coordinates) beat trial and error for blocking.
