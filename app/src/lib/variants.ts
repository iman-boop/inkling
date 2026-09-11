import type { CSSProperties } from 'react'

/**
 * Alternates.
 *
 * A real font built from a page carries several shapes per letter, and repeat
 * letters cycle through them — the point of the whole product is that the
 * second *a* isn't the first. Until the glyphs are really extracted, the
 * script face stands in and the alternates are these small deviations: enough
 * to read as a different stroke, never enough to read as a glitch.
 */
const VARIANTS: CSSProperties[] = [
  { display: 'inline-block' },
  { display: 'inline-block', transform: 'rotate(-2.4deg) scale(1.04) translateY(-0.5px)' },
  { display: 'inline-block', transform: 'rotate(1.8deg) scaleX(0.96) skewX(-3deg)' },
  { display: 'inline-block', transform: 'rotate(-0.8deg) scale(0.97) translateY(0.5px)' },
]

export const variantStyle = (index: number): CSSProperties =>
  VARIANTS[Math.abs(index) % VARIANTS.length]

/**
 * Which alternate a letter gets on its nth appearance in a line, given how
 * many samples of it came off the page.
 */
export const variantFor = (occurrence: number, samples: number): number =>
  samples <= 1 ? 0 : occurrence % Math.min(samples, VARIANTS.length)
