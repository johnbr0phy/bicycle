# DECISIONS.md, The Bicycle

A running log of every assumption and creative decision, in the order I made them.
Nobody was available to answer questions, so each one is a commitment, not a proposal.

## 0. Environment reality (decided first, because it changes the whole approach)

- **No fal.ai key, no ElevenLabs key, no model docs folder exist in this environment**, and the network
  policy denies `fal.run`, `api.fal.ai`, `api.elevenlabs.io`, Hugging Face, X/Twitter, Wikimedia and most
  of the open web (HTTP 403 from the egress gateway). GitHub, PyPI and npm are reachable.
- The director's follow-up instruction was: "figure out how to create the music and the video yourself.
  It should sound awesome." The reference post on X could not be fetched, so the bar I set is my own:
  it has to hold up as a festival short, not as a tech demo.
- **Picture: painted and animated entirely in code, frame by frame.** Backgrounds are built as vector
  layers and then pushed through a watercolour simulation (hand-tremor edge displacement, pigment
  pooling at edges, granulation, uneven wash density, paper grain). Characters are cel-shaded with
  variable-width brush lines that "boil" like hand-traced cels. A compositing pass does what an anime
  photography department does: soft diffusion glow, rim light, cast shadows, depth blur, light leaks.
  12 drawings per second on 24 fps.
- **Music: real recorded instruments, composed by me.** Samples come from two CC0 libraries cloned from
  GitHub: the Versilian Community Sample Library (Yamaha upright piano, Vietnamese dan tranh zither,
  ocarina, hand chimes, gong, folk harp) and VSCO-2 Community Edition (strings, harp, glockenspiel). I
  write the score as note events against the shot timecodes and render it with a small sampler,
  velocity layers, humanised timing and convolution reverb.
- **Sound effects: real recordings where it matters, synthesis where it is better.** Dogs, cats, rain,
  crickets, crows, footsteps, water and wood come from the ESC-50 dataset (Freesound clips, CC BY-NC,
  credited). Cicadas, the bicycle bell, the robot's voice and servos, the vending machine hum and the
  temple bell are synthesised. The old woman's hum is a synthesised closed-mouth voice.
- I cannot hear. Every audio decision is verified with spectrograms, loudness measurements and sync
  checks against picture instead of by ear. That is a real limitation and I have designed around it:
  real instrument samples and real recordings carry most of the timbre.

## 1. Story commitments

- **Season: late September in Kyoto.** Persimmons ripening over walls, red spider lilies (higanbana)
  along the canal, the last cicadas (tsukutsukuboushi by day, higurashi at dusk), bell crickets
  (suzumushi) at night, a brief evening shower. Nothing in bloom that would read as spring.
- **The bicycle's sentimental weight: she taught her daughter to ride on it, on this same lane, thirty
  years ago.** The daughter is grown and gone. This is revealed only at the very end, through a framed
  photograph that we see out of focus in the morning and in focus after the climax. Nobody explains it.
- **Who took it: a boy, about eight, from a few lanes over.** He wanted to learn to ride. Hers was the
  only bicycle on the lane with no lock and a step-through frame he could actually mount. He got as far
  as the river, fell in the rain, scraped his knee, lost his school cap and the bell, and was too
  ashamed and too far from home to move. Human, forgivable, and it gives the ending a second child on the
  same bicycle. I rejected the city impound (bureaucratic, no one to forgive) and the "never stolen"
  option (deflates the search).
- **The bell.** It has been broken for years and only makes a dull *clack*. It is knocked off in the
  boy's fall, retrieved by the shiba, carried home by the robot, screwed back on by the old woman. In the
  last shot the boy rings it and it rings clean for the first time. This is the film's only "miracle"
  and it is a mechanical one: a jammed clapper shaken loose. Nothing supernatural.
- **The robot decides alone.** She never asks. She looks at the empty spot, stops humming mid-phrase,
  and goes inside. He goes.
- **No words, ever.** Humming, beeps, barks, meows, ambience, music. Signs and the credits are
  hand-lettered as part of the drawing.

## 2. How the robot talks to animals

- The robot has a small round screen for a face. Normally it shows two eye-dots. He can push simple
  glyphs onto it: a bicycle, a question mark, a house. That is his entire vocabulary.
- Animals answer with the body: a cat's gaze held in one direction, a yawn, a refusal to move off a
  clue; the shiba's nose, a leash-tug, a fetch.
- Communication is unreliable by design. The black cat leads him to fish. The old river cat falls
  asleep mid-answer. Only the shiba actually knows anything, and it takes a bark to get the cats to
  cooperate.

## 3. Cast

- **Robot ("Tetsu" in the docs, never named on screen).** Waist-high. Cream body like an old rice
  cooker, faded teal stripe, dented left shoulder, rust flecks. Two-wheeled with a rear caster; two
  short arms with two-finger grippers; a dome head with a round screen; one bent antenna. A four-bar
  battery indicator on his chest that drains visibly across the day (this is the film's clock).
- **The old woman ("Fumiko" in the docs).** About seventy, small, grey hair in a bun, round glasses,
  mustard cardigan, apron, slippers. Eyes drawn as two lines when she smiles. She hums.
- **The shiba ("Kotaro").** Red shiba, cream underside, tail curled over the back to the dog's LEFT.
  Blue collar, trailing leash after he escapes. Moves like a spring: crouch, launch, land, freeze.
- **Four cats, deliberately unalike:**
  1. **Grey tabby, torn left ear, heavy.** Shrine wall boss. Opens the film staring into camera.
  2. **Skinny black cat, yellow eyes.** Lives under a vending machine. Unreliable. Wants fish.
  3. **Japanese bobtail, white with a black cap and black pom tail.** Nishiki market cat. Sits on the clue.
  4. **Cream long-haired elder, half-closed eyes.** Kamo river steps. Falls asleep mid-answer.
- **The boy.** About eight, yellow school cap (通学帽), navy shorts, scraped knee. Never speaks.
- **The bicycle.** Step-through mamachari, faded dark green, rusted wire basket bent on one side, rear
  child seat long removed leaving two bolt holes, a bell on the left grip, dynamo lamp. The silhouette
  rule: the basket's bent corner and the high swept-back handlebars make it readable across a street.

## 4. Camera and format

- Master framing height is about one metre off the ground, the robot's eye line. Adults are cropped at
  the waist unless the shot is about her face. Cats are peers.
- 1920x1080, 12 drawings per second, encoded at 24 fps with each drawing held for two frames.
  Line "boil" (the hand-drawn wobble) re-rolls every second drawing, so lines shimmer at 6 Hz, not 12.
- A vertical 1080x1350 (4:5) cut is made by pan-and-scan: every shot has its own crop centre, and some pan
  slowly across the shot to follow the action. Re-rendering every shot with a portrait camera would have doubled
  render time for a secondary deliverable.
- Runtime: 3:42 including 14 seconds of credits.

## 5. Visual style commitments (see sheets/style_sheet.png)

- Flat cel shading, one shadow tone per colour, no gradients on characters.
- Thick, slightly wobbly ink line (3 to 5 px at 1080p) on characters; thinner (1.5 to 2.5 px) on
  backgrounds; backgrounds also get softer, broken lines so characters pop.
- Backgrounds are watercolour-like: base wash, one or two translucent overlapping washes with jittered
  edges, edge darkening, paper grain multiplied over everything.
- Palette is keyed to time of day and locked per chapter, so colour cannot drift between shots.
- Do-not list: no gradients on skin, no photoreal texture, no lens flares, no motion blur, no 3D
  volumetric shading, no black outlines on distant background objects, no pure black anywhere, no pure
  white anywhere except the bell's ring flash.

## 6. Music

- Key: D major, with the low point in B minor. The melody is eleven notes long and fits inside an
  octave so it can be whistled. It appears as fragments (three notes, then five, then seven) and is only
  played complete, with harmony, from the moment she lets go of the saddle.
- Instruments: plucked string (koto-like Karplus-Strong), soft felt piano (additive sine partials),
  a low pad for the night. Tempo 76 bpm.

## 7. Decisions made during production

- **Robot turnaround is a real 2.5D rig**, so every view comes from one definition. The screen, battery, dent, ears,
  antenna, arms and wheels are placed on a cylinder by yaw. This is what "generate the robot ten times and get the
  same robot" means here, and the character sheet shows it.
- **Readability cheat.** Characters moving across frame are turned at most about 55 degrees from camera, never full
  profile, so faces stay readable. Real animators do this constantly.
- **The shiba's tail curls over its left side.** Facing right, the curl is drawn in front of the back; facing left,
  behind it. A shiba's tail direction varies from dog to dog; I chose left and held it everywhere.
- **Cats share one rig of morphable body poses** (sit, loaf, walk, lie, crouch) with a travelling-wave tail, so
  every transition is a morph (liquid). The shiba uses stiff IK legs, spring gaits and hard stops.
- **The shiba's memory** is shown as a picture-book thought bubble over the dog. It is the only moment the film
  "tells" anything, and it is wordless.
- **The photograph** uses the same camera and composition as the run, thirty years earlier, in faded summer colour.
  The match cut does the explaining.
- **The robot does not die.** He runs to zero and his screen goes dark as the cloth is laid on him. When the bell
  rings, his screen answers once, faintly, with the happy glyph. The last shot shows him charging, one bar and
  rising. Ambiguous for a beat, then safe.
- **The dedication** replaces the planned "for Fumiko": *for everyone who ever held the back of a saddle, and let
  go.* The credits name Claude as author and credit the CC0 sample libraries, ESC-50 and the fonts.
- **Her name on the door plate is 森田 (Morita).** It appears only as hand-lettering on the house.
- **The boy's hat has his name inside, かける (Kakeru).** The robot reads it when he turns the hat over.
- **A cutout of a surveyed Kyoto is not attempted.** Sets are composites: a Higashiyama lane with the Yasaka pagoda
  at its end, Shirakawa, Nishiki, the Kamo with its turtle stepping stones, Pontocho with its plover lanterns.
- **node-canvas memory leak.** Version 3.2.3 never frees a canvas that received `drawImage` from another canvas. The
  engine now registers every canvas created during a frame and shrinks it to 1×1 when the frame is written. Memory went
  from growing 43 MB per frame to flat.
