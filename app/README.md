# Inkling

A photo of your handwriting becomes a real typeface. This is the implementation of the
Claude Design handoff in `../project` — the locked **Acid Bloom** direction (turn 4b),
with every screen from turns 5–8: onboarding and paywall, camera and its advisories,
the read, review in its three modes, the fill-the-gaps loop, type-to-test, library and
export, and the four states for when the photo doesn't work.

Both signature moments are built as real motion, to the beat sheet in turn 8.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run typecheck
```

The page is a workbench: the phone sits in the middle, and the rail on the left lists
every screen with the design frame it came from. The flow also works end to end —
start at the value prop and walk through to export. Deep links work too
(`#review`, `#reading`, …).

## How it's put together

```
src/
  App.tsx              the screen registry and the workbench around the phone
  ios/IOSDevice.tsx    the device frame, ported from the prototype's ios-frame.jsx
  state/store.tsx      one store: purpose, review mode, the glyph table, plan, navigation
  lib/font-data.ts     the font being made, as data — every count derives from this
  lib/motion.ts        the two moments' timings, plus the 120/160/220ms scale
  lib/variants.ts      alternates: why the second `a` isn't the first
  components/          glyph cells, the mode switcher, the write-on, the keyboard
  screens/             one file per screen; review's three modes live in screens/review
```

**Colour has one rule throughout**: lime means *needs you*, violet means *machine
confidence*, warm white is always the artifact. The palette is declared once, as custom
properties in `app.css`, and mirrored in `lib/theme.ts` for the places that need a real
string.

**Counts are derived, never typed.** `lib/font-data.ts` seeds 52 letters as 33 clean, 8
shaky and 11 missing; the review header, the specimen legend, the worksheet cells and
the partial badge all read from that one table. Confirm a letter in review and every
number moves, in whichever mode you switch to next — the three review modes write to the
same table, so switching never loses a correction.

### The two moments

**The lift** (`screens/Reading.tsx`, design 8a). Real flight, not a loop: the source
letters and their cells are measured on screen once the handwriting face has loaded, and
each glyph is animated from where it sits on the page to where it lands in the bed —
sheen, then a 340ms pluck (13px rise, 1.14 scale), an arc, and a springy landing with a
1.05 overshoot. The confidence outline fades in *after* the glyph lands, so judgement
never precedes the object, and the gap the letter left on the page stays empty. One
haptic on the first landing; a tap anywhere jumps to the settled state; the CTA is never
gated behind the animation.

**The write-on** (`components/WriteOn.tsx`, design 8b). 180ms fade-up per glyph with a
1.2px ink-blur burning off, 55ms cadence with +30ms after a space and +90ms after a comma
or full stop. The demo runs only on an untouched field and dies at the first keystroke;
after that every glyph appears on keydown with the same fade. Repeat letters cycle
through alternates, and the chip names it once. The keyboard on screen is live, so the
moment works on a phone as well as under a real keyboard.

**Reduced motion** is honoured live in both: the lift becomes a cross-fade with the count
ticking up, the write-on prints the sentence whole. Both keep the information — letters
came from your page, this is your hand — and drop only the travel.

## Where this departs from the prototype

The design files are the spec; these are the places where a working implementation had to
decide something the mockups left open, all of them cheap to reverse.

- **Type-to-test is on the warm-white ground from 8b**, not the dark ground from the 4b
  flow. 8b is the later and more complete drawing of that screen, and the typed line is
  the artifact, so the artifact colour is the screen. The 4b character controls
  (as written / tidied / bolder, slant, letter spacing, keep the wobble) live behind
  *adjust* on the same screen, and they really do drive the specimen.
- **The status bar and home indicator follow the screen's ground.** The prototype left
  them light on that white screen, which isn't readable.
- **The keyboard gained a space bar and a working delete.** The mock only needed a
  silhouette; a live field needs the keys.
- **The eleven missing glyphs are letters** (`q x z j v Q X Z J V K`), and the line to
  copy out supplies exactly those. The prototype's cells mixed letters and punctuation
  with a line that covered neither set, so the worksheet asked for one thing and showed
  another. Figures and marks are tracked but sit outside the 52 — the promise is "a
  complete alphabet", and that is what the counter counts.
- **"An archive" starts selected** on the purpose screen, as the design draws it, so the
  Continue button is never dead on arrival.
- **Handwriting is Caveat**, exactly as in the prototype: a script face standing in for
  glyphs really lifted off a photograph. Every place it appears is content, never brand
  type.

## Not built

- Real glyph extraction. There is no model here; the app is the interface around one, and
  `lib/font-data.ts` is where the read would land.
- The desktop companion (kerning, variants, licence seats) — deferred in the design too.
- Turns 1–3 of the bundle: the paper/ink treatments and the Lapsang, Colour Sphere and
  lavender-forest palettes. Acid Bloom won; those are history, not options.
- Export actually producing a file, and payment actually taking money.
