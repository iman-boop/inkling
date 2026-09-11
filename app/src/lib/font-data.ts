/**
 * The font being made, as data.
 *
 * Every number the screens show — "41 of 52", the clean/shaky/missing legend,
 * the eleven cells on the gaps screen — is derived from this one table, so a
 * correction made in review moves the counters everywhere.
 *
 * Seeded to match the design: 33 clean, 8 shaky, 11 missing of a 52-glyph
 * alphabet. Figures and marks are tracked alongside but sit outside the 52 —
 * the promise is "a complete alphabet", and that is what the counter counts.
 */

export type GlyphState = 'clean' | 'shaky' | 'missing'

export interface Glyph {
  ch: string
  state: GlyphState
  /** How many times this shape was found on the page. Drives variant picking. */
  samples: number
  /** The model's confidence in the read, 0–1. Only meaningful when found. */
  confidence: number
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('')
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MARKS = '0123456789.,;:!?&-’“'.split('')

/** Nobody writes these in a recipe — the eleven the worksheet goes after. */
export const INITIALLY_MISSING = ['q', 'x', 'z', 'j', 'v', 'Q', 'X', 'Z', 'J', 'V', 'K']

/** Read, but not cleanly — the eight that need a human. */
const SHAKY = ['k', 'b', 'g', 'y', 'f', 'A', 'G', 'R']

const CONFIDENCE: Record<string, number> = {
  k: 0.62,
  b: 0.68,
  g: 0.71,
  y: 0.64,
  f: 0.73,
  A: 0.66,
  G: 0.59,
  R: 0.7,
}

/** How often a shape turned up on the page — a recipe card is repetitive. */
function sampleCount(ch: string, state: GlyphState): number {
  if (state === 'missing') return 0
  if ('aeionrst'.includes(ch)) return 5 + (ch.charCodeAt(0) % 4)
  if (ch === ch.toUpperCase() && /[A-Z]/.test(ch)) return 1 + (ch.charCodeAt(0) % 2)
  return 2 + (ch.charCodeAt(0) % 3)
}

function seed(chars: string[], forceState?: GlyphState): Glyph[] {
  return chars.map((ch) => {
    const state: GlyphState =
      forceState ??
      (INITIALLY_MISSING.includes(ch) ? 'missing' : SHAKY.includes(ch) ? 'shaky' : 'clean')
    return {
      ch,
      state,
      samples: sampleCount(ch, state),
      confidence: state === 'missing' ? 0 : (CONFIDENCE[ch] ?? 0.94),
    }
  })
}

/**
 * Figures and marks carry their own pattern; they are not part of the 52, and
 * none of them are missing — the worksheet asks for letters, so the outlined
 * cells and the count have to be the same set.
 */
const MARK_STATES: GlyphState[] = ['clean', 'clean', 'shaky', 'clean', 'clean', 'clean', 'clean']

/** The two the copy names — nobody writes these in a recipe. */
export const RARE_EXAMPLES = ['q', 'z']

export const seedGlyphs = (): Glyph[] => [
  ...seed(LOWER),
  ...seed(UPPER),
  ...MARKS.map((ch, i) => {
    const state = MARK_STATES[i % MARK_STATES.length]
    return { ch, state, samples: sampleCount(ch, state), confidence: state === 'missing' ? 0 : 0.9 }
  }),
]

export const isCore = (g: Glyph) => /[a-zA-Z]/.test(g.ch)

export interface FontStats {
  total: number
  found: number
  clean: number
  shaky: number
  missing: number
}

export function stats(glyphs: Glyph[]): FontStats {
  const core = glyphs.filter(isCore)
  const count = (s: GlyphState) => core.filter((g) => g.state === s).length
  const clean = count('clean')
  const shaky = count('shaky')
  const missing = count('missing')
  return { total: core.length, found: clean + shaky, clean, shaky, missing }
}

export const section = (glyphs: Glyph[], which: 'lower' | 'upper' | 'marks'): Glyph[] =>
  glyphs.filter((g) =>
    which === 'lower'
      ? /[a-z]/.test(g.ch)
      : which === 'upper'
        ? /[A-Z]/.test(g.ch)
        : !/[a-zA-Z]/.test(g.ch),
  )

/**
 * A line to copy out by hand that supplies every missing glyph at once —
 * five lowercase, six capitals. Same pen, same paper if you still have it.
 */
export const PRACTICE_LINE = [
  'a quick jazzy vixen boxed',
  "Zoe's zephyr — Jack, Quinn,",
  'Xanthe & KV @ 7:45',
]

/** The two that came back shaky on the re-snap, rather than declaring victory. */
export const RESNAP_SHAKY = ['x', 'V']

// ── The photographed artifact ────────────────────────────────────────────────

export interface Mark {
  id: string
  /** What we read it as. */
  ch: string
  confidence: number
  /** Other shapes the model considered, best first. */
  candidates: string[]
  /** Where it sits on the page, for the "Line 1, word 3" line. */
  line: number
  word: number
}

/**
 * The recipe card, split so review can highlight real letters inside real
 * words — the highlight has to enclose its glyph, never float near it.
 */
export interface NoteSegment {
  text: string
  mark?: Mark
}

export const NOTE_LINES: NoteSegment[][] = [
  [
    { text: "Grandma's apple ca" },
    {
      text: 'k',
      mark: { id: 'k1', ch: 'k', confidence: 0.62, candidates: ['k', 'h', 'lc'], line: 1, word: 3 },
    },
    { text: 'e' },
  ],
  [
    { text: '4 a' },
    {
      text: 'p',
      mark: { id: 'p1', ch: 'p', confidence: 0.91, candidates: ['p', 'f', 'n'], line: 2, word: 2 },
    },
    { text: 'ples, peeled & sliced' },
  ],
  [
    { text: 'a cup of ' },
    {
      text: 'b',
      mark: { id: 'b1', ch: 'b', confidence: 0.68, candidates: ['b', 'l', 'h'], line: 3, word: 4 },
    },
    { text: 'rown sugar' },
  ],
  [
    { text: 'a pinch of ' },
    {
      text: 's',
      mark: { id: 's1', ch: 's', confidence: 0.88, candidates: ['s', 'r', 'e'], line: 4, word: 3 },
    },
    { text: 'alt, then' },
  ],
  [{ text: 'bake until the kitchen' }],
  [{ text: 'smells like autumn —' }],
]

export const NOTE_ATTRIBUTION = "Mum's note, 1994"

/** Letters still waiting on a decision in review. */
export const OPEN_MARKS = 7

// ── The letter on the page the lift animation takes apart ────────────────────

/** A word of the letter, with the glyphs that lift out of it flagged. */
export interface LiftLine {
  parts: { text: string; lift?: boolean }[]
}

export const LIFT_LINES: LiftLine[] = [
  [
    { text: 'Dearest ' },
    { text: 'E', lift: true },
    { text: 'l', lift: true },
    { text: 'len,' },
  ],
  [{ text: 'the ' }, { text: 'p', lift: true }, { text: 'e', lift: true }, { text: 'a', lift: true }, { text: 'rs came in' }],
  [{ text: 'early and the ' }, { text: 'j', lift: true }, { text: 'a', lift: true }, { text: 'rs' }],
  [{ text: 'are all full ' }, { text: 'a', lift: true }, { text: 'g', lift: true }, { text: 'ain.' }],
].map((parts) => ({ parts }))

/** Found on the letter in 8a — a different page from the recipe card. */
export const LIFT_FOUND = 38

/** Cells drawn in the glyph bed; the rest are implied by the counter. */
export const LIFT_VISIBLE = 9
