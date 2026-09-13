import { useEffect, useRef, useState, type ReactNode } from 'react'
import { WRITE, usePrefersReducedMotion } from '../lib/motion'
import { variantFor, variantStyle } from '../lib/variants'
import { acid, font } from '../lib/theme'

/**
 * 8b · Typing in your own hand — pen-paced, 55ms per glyph.
 *
 * This is the payoff, and it earns its length by mimicking a pen's pace, not a
 * UI transition's: 180ms fade-up per glyph with a 1.2px ink-blur burning off,
 * never a typewriter cut. Even cadence is the tell of a machine, so the line
 * hesitates at joins — +30ms after a space, +90ms after a comma or full stop.
 */

/** How long to wait before writing the character after this one. */
export function gapAfter(ch: string, slower = false): number {
  const base =
    ch === ' '
      ? WRITE.cadence + WRITE.afterSpace
      : ',.;:!?'.includes(ch)
        ? WRITE.cadence + WRITE.afterPunctuation
        : WRITE.cadence
  return slower ? base * 1.8 : base
}

/** Runs the demo sentence out at a pen's pace. It dies at the first keystroke. */
export function useWriteOnDemo(sentence: string, live: boolean, slower: boolean): string {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(() => (reduced ? sentence : ''))
  const timer = useRef<number>()

  useEffect(() => {
    if (live) return
    // Reduced motion prints the sentence whole — the information survives,
    // only the travel is dropped.
    if (reduced) {
      setShown(sentence)
      return
    }

    let i = 0
    setShown('')
    const step = () => {
      i += 1
      setShown(sentence.slice(0, i))
      if (i >= sentence.length) return
      timer.current = window.setTimeout(step, gapAfter(sentence[i - 1], slower))
    }
    timer.current = window.setTimeout(step, 420)

    return () => window.clearTimeout(timer.current)
  }, [sentence, live, slower, reduced])

  return shown
}

export function WriteOn({
  text,
  size = 31,
  caret = true,
  samplesFor,
  renderGlyph,
  color = acid.noteInk,
}: {
  text: string
  size?: number
  caret?: boolean
  /** How many shapes of this letter came off the page. */
  samplesFor?: (ch: string) => number
  /**
   * Draw this letter yourself — used when the glyphs are real ink cut from a
   * photograph rather than the stand-in script face. Return null to fall back.
   */
  renderGlyph?: (ch: string, occurrence: number) => ReactNode | null
  color?: string
}) {
  const seen = new Map<string, number>()

  return (
    <div
      style={{
        fontFamily: font.hand,
        fontSize: size,
        lineHeight: 1.5,
        color,
        minHeight: size * 1.5,
        wordBreak: 'break-word',
      }}
    >
      {text.split('').map((ch, i) => {
        // Word spaces are explicit spacers, so the caret keeps sitting on the
        // last glyph rather than after an empty box.
        if (ch === ' ') {
          return <span key={i} style={{ display: 'inline-block', width: '.34em' }} />
        }
        const occurrence = seen.get(ch) ?? 0
        seen.set(ch, occurrence + 1)

        const own = renderGlyph?.(ch, occurrence)
        if (own)
          return (
            <span key={i} className="ink-pen" style={{ display: 'inline-block' }}>
              {own}
            </span>
          )

        const samples = samplesFor?.(ch) ?? 1
        return (
          <span
            key={i}
            className="ink-pen"
            style={{ ...variantStyle(variantFor(occurrence, samples)) }}
          >
            {ch}
          </span>
        )
      })}
      {caret ? (
        <span
          className="ink-caret"
          style={{
            display: 'inline-block',
            width: 2,
            height: size * 0.94,
            background: acid.violetDeep,
            verticalAlign: -size * 0.16,
            marginLeft: 2,
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * "two of the a's differ" — the chip calls the alternates out once, on a
 * letter that actually repeats in what's on screen.
 */
export function repeatedLetter(text: string, samplesFor: (ch: string) => number): string | null {
  const counts = new Map<string, number>()
  for (const ch of text.toLowerCase()) {
    if (!/[a-z]/.test(ch)) continue
    counts.set(ch, (counts.get(ch) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 1
  for (const [ch, count] of counts) {
    if (count > bestCount && samplesFor(ch) > 1) {
      best = ch
      bestCount = count
    }
  }
  return best
}
