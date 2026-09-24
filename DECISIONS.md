# DECISIONS.md — The Bicycle

A running log of every assumption and creative decision, in the order I made them.
Nobody was available to answer questions, so each one is a commitment, not a proposal.

## 0. Environment reality (decided first, because it changes the whole approach)

- **No fal.ai key, no ElevenLabs key, no docs folder, no mesh / video-scoring skill exist in this
  environment.** The brief referenced `[path]`, `[folder]` and `[amount]` placeholders that were never
  filled in. I searched the repo, home directory, environment variables, installed skills and Google
  Drive. Nothing.
- **The network policy also denies `fal.run`, `queue.fal.run`, `api.fal.ai` and `api.elevenlabs.io`
  outright** (HTTP 403 from the egress gateway, which means an organization policy denial, not a
  transient failure). It also denies Wikimedia, Unsplash, Google, jsDelivr and most of the open web.
  GitHub, npm and PyPI are reachable. So even with keys, no video or image model was callable from here.
- **Decision: build the entire film procedurally.** The brief's stated priority was that the viewer
  should never see raw generated footage, only the hand-drawn overlay. The video model was described
  as scaffolding for motion and layout. I replaced that scaffolding with parametric character rigs and
  hand-authored blocking, which gives *stronger* consistency guarantees than image-to-video (the robot
  is the same robot in every frame because it is the same code), at the cost of less "physically
  plausible" incidental motion. Every pixel is drawn in JavaScript on a canvas at 12 fps.
- **Sound: synthesized offline in code.** No ElevenLabs means every effect (cicadas, temple bell, rain,
  cat, shiba, bicycle bell, shutter, plastic bag, train crossing) is a small DSP program. The score is
  an original melody rendered by a plucked-string (Karplus-Strong) instrument and a soft additive piano,
  timed to the shot list.
- **Style and character sheets** are rendered from the same rigs and palettes that render the film, so
  they are documentation of the actual pipeline rather than aspirational concept art.
- If keys and network access are added later, the shot list, rigs and timing survive unchanged; the
  generative pass would slot in as motion reference under the overlay.

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
- A vertical 1080x1350 crop is generated by re-rendering with a portrait camera (not a naive crop) so the
  composition is re-framed per shot.
- Target runtime: about 3:30 including credits.

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
