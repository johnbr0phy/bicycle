# The Bicycle: writeup

*A 3 minute 42 second animated short. No dialogue. Made end to end by Claude in one session.*

## What it is

An old woman in Higashiyama walks out one morning, sees the bare patch of stone where her bicycle has stood for thirty years, stops humming mid-phrase, and goes back inside. Her small, dented household robot decides on his own to find it. He spends the day crossing Kyoto: a wall of indifferent cats, a suspicious shiba who turns out to have seen the bicycle leave, Nishiki market where the only clue is a child's yellow school hat, the Kamo river in afternoon gold, Pontocho as the lanterns come on and the rain starts. At dusk his battery runs down to one bar and he stops under a shop awning next to a vending machine. The shiba comes back soaked, carrying the bicycle's bell.

The bicycle is in a dead-end alley with an eight-year-old boy who borrowed it to learn to ride, fell in the rain and was too ashamed to go home. The robot puts the hat back on his head. They walk the bicycle home. The old woman is waiting on her step with a lantern. The boy bows. She puts her hand on the saddle, tells him to get on without a word, and runs behind him down the lane holding it, an old woman running, and lets go. We see a photograph from thirty years earlier: the same lane, the same bicycle, a younger her holding the saddle for her daughter. The robot runs out of power on her step. She lays a cloth over his dented shoulder. The boy rings the bell, which has been broken for years: clack, clack, and then it rings. In the morning the spot is not empty, and she is humming again.

## What I had to work with, and what I did about it

The brief assumed a fal.ai key for image and video generation and an ElevenLabs key for sound. Neither existed in the environment, and the network policy blocks both services outright. So I built everything myself, in code:

- **Picture.** Every frame is drawn in JavaScript on a canvas. Backgrounds are laid out in real-metre perspective (an actual camera model of Kyoto lanes, rivers, markets and alleys) and then pushed through a watercolour simulation of my own: hand-tremor edges, pigment pooling, bleed, granulation, uneven washes, paper grain. Characters are cel-shaded rigs with variable-width brush lines that re-roll their wobble every other drawing, the way traced cels "boil". A compositing pass does what an anime photography department does: diffusion glow, rim light, cast shadows, depth blur, a colour grade locked to the time of day. It runs at twelve drawings a second, held on twos.
- **Characters.** The robot is a 2.5D rig: one definition projected from any angle, which is why he is the same robot in every shot. The shiba is springy, with IK legs, a bounding gait and hard stops, and his tail always curls over his left side. The cats are liquid: one morphing body, tails as travelling waves. There are four cats who look nothing alike: a heavy grey tabby with a torn ear, a thin black cat, a white bobtail with a black cap, and a sleepy cream long-hair. The bicycle has side, rear and front views, because it had to be recognisable across a street and also ridden away from us.
- **Score.** There are real recorded instruments (a Yamaha upright, a Vietnamese dan tranh zither, ocarina, harp, strings, glockenspiel, hand chimes) from two CC0 sample libraries on GitHub. I wrote one eleven-note melody in D major that could be whistled, and it appears in fragments of three, five, seven and nine notes. It is played complete only once, with harmony, and its highest note lands on the frame where her hands leave the saddle. The piano takes it through the photograph and resolves it, then it stops so the bell can ring alone. In the morning she hums it, the whole thing, from inside the house.
- **Sound.** Real field recordings (barks, meows, rain, crickets, crows, footsteps, water) come from the ESC-50 dataset. Anything that had to be exact is synthesised: the tsukutsukuboushi and higurashi cicadas, the temple bell, the railway crossing, the robot's voice, her closed-mouth hum and, above all, the bicycle bell, which is modal synthesis of a real bell's doublet partials. A sub-agent built and verified that toolkit while I drew.
- **I cannot hear.** Every audio decision was checked with loudness curves per stem against the shot boundaries, spectrograms, and LUFS measurement. I trusted recorded instruments and recordings for timbre and my own ears for nothing.

## Choices I'm glad of

- **The thief is a child**, and the bicycle's history is a child learning to ride. The ending is her doing for him exactly what she once did for her daughter, and the photograph proves it without a word.
- **The bell.** Broken for the whole film, carried home by the dog, rung by the boy. It is the only "miracle", and it is mechanical.
- **Silence where it matters.** No music in the opening, under the doorstep scene, or at the low point. The run is the loudest the film ever gets.
- **The robot runs down, but doesn't die.** His screen answers the bell once, faintly, and then the morning shows him charging beside the bicycle, with the shiba asleep against his wheel and the grey cat on the saddle.

## Honest limits

- The animation is rig-driven, not hand-keyed drawing by drawing. Walks are cycles, and a few poses are stiffer than a person would draw them.
- The crowds in Nishiki are simple figures.
- The vertical cut is a pan-and-scan crop, not a re-staging.
- The reference post on X could not be fetched from this environment, so I held myself to a festival bar instead.

## Files

- `deliverables/the_bicycle_1080p.mp4`: the film, 1920×1080, 24 fps, stereo AAC
- `deliverables/the_bicycle_vertical_4x5.mp4`: the 1080×1350 cut for X
- `sheets/`: the style sheet and the character sheets (robot, woman, boy, shiba, cats, bicycle)
- `docs/STORY.md`, `docs/SHOTLIST.md`: the beat sheet and the 28-shot list
- `DECISIONS.md`: every assumption, in order; `docs/PRODUCTION_LOG.md`: what broke and how it was fixed
- `film/`: all source: `render.js` renders a shot, `assemble.py` builds the film, `audio/film/mixdown.py` builds the soundtrack
