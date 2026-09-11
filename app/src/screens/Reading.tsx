import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { PrimaryPill, Screen } from '../components/ui'
import { LIFT_FOUND, LIFT_LINES } from '../lib/font-data'
import { EASE, LIFT, haptic, usePrefersReducedMotion } from '../lib/motion'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * 8a · Letters lifting off the page — 1,180ms total.
 *
 * This is the only thing that tells someone their letters were *taken from
 * their page* rather than matched to a stock font, so it has to be legibly the
 * same ink moving: the glyph that lands in the bed is the one that left the
 * photo, and the hole it left stays visibly empty. Never cross-fade the photo
 * back to whole.
 */

const SOURCE_SIZE = 25
const CELL_SIZE = 30
const BED_CELLS = 9

/** One glyph's flight, measured from the page to its cell. */
interface Flight {
  ch: string
  left: number
  top: number
  dx: number
  dy: number
  delay: number
}

export function Reading() {
  const { go } = useStore()
  const reduced = usePrefersReducedMotion()

  const rootRef = useRef<HTMLDivElement>(null)
  const sourceRefs = useRef<(HTMLSpanElement | null)[]>([])
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])

  const [flights, setFlights] = useState<Flight[]>([])
  const [landed, setLanded] = useState<boolean[]>(() => Array(BED_CELLS).fill(false))
  const [plucked, setPlucked] = useState<boolean[]>(() => Array(BED_CELLS).fill(false))
  const [skipped, setSkipped] = useState(false)
  const [counted, setCounted] = useState(reduced ? 0 : LIFT_FOUND)

  const lifted = LIFT_LINES.flatMap((line) => line.parts.filter((p) => p.lift))

  useLayoutEffect(() => {
    if (reduced) {
      // The lift becomes a 200ms cross-fade with the count ticking up. Both
      // keep the information — letters came from your page — and drop only
      // the travel.
      setLanded(Array(BED_CELLS).fill(true))
      setPlucked(Array(BED_CELLS).fill(true))
      let n = 0
      const tick = window.setInterval(() => {
        n += Math.ceil(LIFT_FOUND / 18)
        setCounted(Math.min(n, LIFT_FOUND))
        if (n >= LIFT_FOUND) window.clearInterval(tick)
      }, 26)
      return () => window.clearInterval(tick)
    }

    let cancelled = false

    // Measure only once the handwriting face is actually in place — a fallback
    // face would send every glyph to the wrong spot on the page.
    const measure = () => {
      const root = rootRef.current
      if (cancelled || !root) return
      const origin = root.getBoundingClientRect()

      const measured: Flight[] = []
      for (let i = 0; i < BED_CELLS; i += 1) {
        const source = sourceRefs.current[i]
        const cell = cellRefs.current[i]
        if (!source || !cell) continue
        const from = source.getBoundingClientRect()
        const to = cell.getBoundingClientRect()
        measured.push({
          ch: lifted[i]?.text ?? '',
          left: from.left - origin.left,
          top: from.top - origin.top,
          dx: to.left + to.width / 2 - (from.left + from.width / 2),
          dy: to.top + to.height / 2 - (from.top + from.height / 2),
          // Scan sheen first, then a 60ms stagger down the page.
          delay: LIFT.sheen + i * LIFT.stagger,
        })
      }
      setFlights(measured)
    }

    document.fonts.ready.then(measure).catch(measure)

    return () => {
      cancelled = true
      setFlights([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  const onPluck = useCallback((index: number) => {
    setPlucked((all) => all.map((v, i) => (i === index ? true : v)))
  }, [])

  const onLand = useCallback((index: number) => {
    setLanded((all) => {
      // One soft impact on the first landing only. Thirty-eight taps is a
      // vibrating brick.
      if (!all.some(Boolean)) haptic()
      return all.map((v, i) => (i === index ? true : v))
    })
  }, [])

  /** A tap anywhere jumps to the settled state. */
  const skip = () => {
    if (skipped) return
    setSkipped(true)
    setPlucked(Array(BED_CELLS).fill(true))
    setLanded(Array(BED_CELLS).fill(true))
  }

  const done = landed.every(Boolean)
  const flying = !reduced && !skipped && flights.length > 0

  let liftIndex = -1

  return (
    <Screen style={{ position: 'relative' }}>
      <div ref={rootRef} style={{ position: 'absolute', inset: 0 }} onClick={skip} />

      <div
        style={{
          padding: '6px 22px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          position: 'relative',
        }}
      >
        <span style={{ font: `400 19px ${font.heading}` }}>Reading your page</span>
        <span style={{ fontSize: 12, color: acid.lime }}>{counted} found</span>
      </div>

      {/* the page. Letters that have left it leave a gap behind. */}
      <div
        style={{
          margin: '0 18px',
          borderRadius: 22,
          overflow: 'hidden',
          background: '#efe6d2',
          position: 'relative',
          height: 250,
          flex: 'none',
        }}
      >
        <div
          style={{
            padding: '26px 24px',
            fontFamily: font.hand,
            fontSize: SOURCE_SIZE,
            lineHeight: 1.75,
            color: 'rgba(27,29,24,.85)',
          }}
        >
          {LIFT_LINES.map((line, li) => (
            <div key={li}>
              {line.parts.map((part, pi) => {
                if (!part.lift) return <span key={pi}>{part.text}</span>
                liftIndex += 1
                const index = liftIndex
                return (
                  <span
                    key={pi}
                    ref={(el) => {
                      sourceRefs.current[index] = el
                    }}
                    style={{
                      display: 'inline-block',
                      // The gap stays empty — that absence is what proves the
                      // extraction is real.
                      opacity: plucked[index] ? 0 : 1,
                      transition: 'opacity 90ms linear',
                    }}
                  >
                    {part.text}
                  </span>
                )
              })}
            </div>
          ))}
        </div>

        {flying ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(100deg,transparent 30%,rgba(214,242,75,.28) 50%,transparent 70%)',
              animation: `ink-sheen 700ms linear ${LIFT.sheen + 340}ms forwards`,
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          padding: '18px 22px 10px',
          font: `600 10px/1 ${font.body}`,
          letterSpacing: '.11em',
          textTransform: 'uppercase',
          color: 'rgba(242,244,234,.45)',
        }}
      >
        Glyph bed
      </div>

      <div
        style={{
          margin: '0 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 9,
        }}
      >
        {Array.from({ length: BED_CELLS }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el
            }}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 15,
              background: 'rgba(242,244,234,.05)',
              boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Confidence colour arrives *after* the letter lands, so
                judgement never precedes the object. */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 15,
                boxShadow: `inset 0 0 0 1.5px rgba(214,242,75,.55)`,
                opacity: landed[i] ? 1 : 0,
                transition: `opacity ${LIFT.resolve}ms linear`,
                transitionDelay: landed[i] && !skipped ? '120ms' : '0ms',
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                fontFamily: font.hand,
                fontSize: CELL_SIZE,
                lineHeight: 1,
                opacity: landed[i] ? 1 : 0,
                transition: reduced ? 'opacity 200ms linear' : 'none',
              }}
            >
              {lifted[i]?.text ?? ''}
            </span>
          </div>
        ))}
        <div
          style={{
            aspectRatio: '1',
            borderRadius: 15,
            background: 'rgba(242,244,234,.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            font: `400 13px ${font.body}`,
            color: 'rgba(242,244,234,.35)',
          }}
        >
          +{LIFT_FOUND - BED_CELLS}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      <div style={{ padding: '0 18px', position: 'relative' }}>
        {done ? (
          <PrimaryPill onClick={() => go('review')}>Review {LIFT_FOUND} letters</PrimaryPill>
        ) : (
          // Never gate the CTA behind the animation — tapping skips to the end.
          <PrimaryPill
            onClick={skip}
            style={{
              background: 'rgba(242,244,234,.1)',
              color: 'rgba(242,244,234,.5)',
            }}
          >
            Review {LIFT_FOUND} letters
          </PrimaryPill>
        )}
      </div>

      {/* the glyphs in flight, above everything */}
      {flying ? (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
          {flights.map((flight, i) => (
            <FlyingGlyph
              key={`${flight.ch}-${i}`}
              flight={flight}
              onPluck={() => onPluck(i)}
              onLand={() => onLand(i)}
            />
          ))}
        </div>
      ) : null}
    </Screen>
  )
}

/**
 * Pluck (13px rise, 1.14 scale, 340ms) → arc travel → springy landing with a
 * 1.05 overshoot. The glyph also grows from its size on the page to its size
 * in the cell, because it is the same ink either way.
 */
function FlyingGlyph({
  flight,
  onPluck,
  onLand,
}: {
  flight: Flight
  onPluck: () => void
  onLand: () => void
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const grow = CELL_SIZE / SOURCE_SIZE
    const total = LIFT.pluck + LIFT.travel
    const pluckAt = LIFT.pluck / total
    // The arc rises above the straight line between page and cell.
    const arc = Math.max(26, Math.abs(flight.dy) * 0.22)

    const animation = node.animate(
      [
        { transform: 'translate(0px,0px) scale(1)', color: acid.noteInk, offset: 0, easing: EASE.pluck },
        {
          transform: `translate(0px,${-LIFT.pluckRise}px) scale(${LIFT.pluckScale})`,
          color: acid.noteInk,
          offset: pluckAt,
          easing: 'cubic-bezier(.4,0,.25,1)',
        },
        {
          transform: `translate(${flight.dx * 0.5}px,${flight.dy * 0.5 - arc}px) scale(${
            (LIFT.pluckScale + grow) / 2
          })`,
          offset: pluckAt + (1 - pluckAt) * 0.55,
          easing: EASE.spring,
        },
        {
          transform: `translate(${flight.dx}px,${flight.dy}px) scale(${grow * LIFT.landScale})`,
          color: acid.ink,
          offset: 0.94,
        },
        {
          transform: `translate(${flight.dx}px,${flight.dy}px) scale(${grow})`,
          color: acid.ink,
          offset: 1,
        },
      ],
      { duration: total, delay: flight.delay, fill: 'both', easing: 'linear' },
    )

    const pluckTimer = window.setTimeout(onPluck, flight.delay + LIFT.pluck * 0.45)
    const landTimer = window.setTimeout(onLand, flight.delay + total * 0.94)

    return () => {
      animation.cancel()
      window.clearTimeout(pluckTimer)
      window.clearTimeout(landTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight])

  return (
    <span
      ref={ref}
      style={{
        position: 'absolute',
        left: flight.left,
        top: flight.top,
        fontFamily: font.hand,
        fontSize: SOURCE_SIZE,
        lineHeight: 1.75,
        color: acid.noteInk,
        transformOrigin: 'center',
        willChange: 'transform',
      }}
    >
      {flight.ch}
    </span>
  )
}
