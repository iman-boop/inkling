import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PrimaryPill, Screen } from '../components/ui'
import { analysePage, crop, inReadingOrder, squareRegion, type Mark } from '../lib/detect'
import { EASE, LIFT, haptic, usePrefersReducedMotion } from '../lib/motion'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * The read, over a page someone actually photographed.
 *
 * The lift here is the real thing in the only sense that can be honest today:
 * the tiles that fly into the bed are cut from the photograph, at the places
 * where ink was actually found. What none of it claims is *which letter* each
 * mark is — that needs the reader this app doesn't have, so the screen says
 * marks, not letters, and the flow stops at `own-page` rather than inventing
 * a font.
 */

const BED_CELLS = 9
const PAGE_HEIGHT = 250

interface Flight {
  mark: Mark
  left: number
  top: number
  side: number
  dx: number
  dy: number
  scale: number
  delay: number
}

export function PhotoReading() {
  const { photo, read, setRead, go } = useStore()
  const reduced = usePrefersReducedMotion()

  const rootRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cellRefs = useRef<(HTMLDivElement | null)[]>([])

  const [imageReady, setImageReady] = useState(false)
  const [flights, setFlights] = useState<Flight[]>([])
  const [landed, setLanded] = useState<boolean[]>(() => Array(BED_CELLS).fill(false))
  const [skipped, setSkipped] = useState(false)

  const marks = read ? inReadingOrder(read.marks).slice(0, BED_CELLS) : []
  const aspect = read?.aspect ?? 1
  const looking = read === null

  // Look at the page. The sheen covers this the way it was always meant to.
  useEffect(() => {
    if (!photo || read) return
    let cancelled = false
    analysePage(photo)
      .then((result) => {
        if (cancelled) return
        setRead(result)
        // Nothing usable on the page is a designed screen, not a shrug.
        if (result.verdict !== 'page') go('no-handwriting')
      })
      .catch(() => {
        if (!cancelled)
          setRead({ verdict: 'unreadable', marks: [], coverage: 0, paper: 0, colour: 0, aspect: 1 })
      })
    return () => {
      cancelled = true
    }
  }, [photo, read, setRead, go])

  useLayoutEffect(() => {
    // Wait for the photograph to be laid out: measuring an image with no
    // box yet sends every mark to nowhere and nothing ever lifts.
    if (!photo || !read || read.verdict !== 'page' || reduced || !imageReady) return
    const root = rootRef.current
    const image = imageRef.current
    if (!root || !image) return

    const origin = root.getBoundingClientRect()
    const frame = image.getBoundingClientRect()
    if (!frame.width) return

    const measured: Flight[] = []
    marks.forEach((mark, i) => {
      const cell = cellRefs.current[i]
      if (!cell) return
      const target = cell.getBoundingClientRect()
      const side = Math.max(mark.width * frame.width, mark.height * frame.height) * 1.7
      const centreX = frame.left + (mark.x + mark.width / 2) * frame.width
      const centreY = frame.top + (mark.y + mark.height / 2) * frame.height
      measured.push({
        mark,
        left: centreX - side / 2 - origin.left,
        top: centreY - side / 2 - origin.top,
        side,
        dx: target.left + target.width / 2 - centreX,
        dy: target.top + target.height / 2 - centreY,
        scale: target.width / side,
        delay: LIFT.sheen + i * LIFT.stagger,
      })
    })
    setFlights(measured)
    return () => setFlights([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, read, reduced, imageReady])

  useEffect(() => {
    if (reduced && read?.verdict === 'page') setLanded(Array(BED_CELLS).fill(true))
  }, [reduced, read])

  // However this screen is reached — a fresh photo, or back into it — a page
  // that isn't a page belongs on the screen that explains why.
  useEffect(() => {
    if (read && read.verdict !== 'page') go('no-handwriting')
  }, [read, go])

  const skip = () => {
    if (skipped) return
    setSkipped(true)
    setLanded(Array(BED_CELLS).fill(true))
  }

  const done = marks.length > 0 && landed.slice(0, marks.length).every(Boolean)
  const flying = !reduced && !skipped && flights.length > 0
  const found = read?.marks.length ?? 0

  if (!photo) return null

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
        <span style={{ fontSize: 12, color: looking ? acid.violet : acid.lime }}>
          {looking ? 'looking…' : `${found} marks`}
        </span>
      </div>

      <div
        style={{
          margin: '0 18px',
          borderRadius: 22,
          overflow: 'hidden',
          background: '#20221c',
          position: 'relative',
          height: PAGE_HEIGHT,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          ref={imageRef}
          src={photo}
          alt="The page you photographed"
          onLoad={() => setImageReady(true)}
          style={{ maxWidth: '100%', maxHeight: PAGE_HEIGHT, display: 'block' }}
        />
        {looking ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(100deg,transparent 30%,rgba(214,242,75,.28) 50%,transparent 70%)',
              animation: 'ink-sheen 1100ms linear infinite',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>

      <div
        style={{
          padding: '18px 22px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          font: `600 10px/1 ${font.body}`,
          letterSpacing: '.11em',
          textTransform: 'uppercase',
          color: 'rgba(242,244,234,.45)',
        }}
      >
        <span>Glyph bed</span>
        <span style={{ color: acid.violet }}>Marks, not letters</span>
      </div>

      <div
        style={{
          margin: '0 18px',
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 9,
        }}
      >
        {Array.from({ length: BED_CELLS }, (_, i) => {
          const mark = marks[i]
          return (
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
                overflow: 'hidden',
              }}
            >
              {mark && landed[i] ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    ...crop(photo, squareRegion(mark, aspect)),
                  }}
                />
              ) : null}
            </div>
          )
        })}
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
          {found > BED_CELLS ? `+${found - BED_CELLS}` : ''}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      <div style={{ padding: '0 18px', position: 'relative' }}>
        <PrimaryPill
          onClick={() => (done ? go('own-page') : skip())}
          style={
            done
              ? undefined
              : { background: 'rgba(242,244,234,.1)', color: 'rgba(242,244,234,.5)' }
          }
        >
          {looking ? 'Looking at your page…' : done ? `What we found` : 'Lifting…'}
        </PrimaryPill>
      </div>

      {flying ? (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
          {flights.map((flight, i) => (
            <FlyingMark
              key={i}
              photo={photo}
              flight={flight}
              aspect={aspect}
              onLand={() =>
                setLanded((all) => {
                  if (!all.some(Boolean)) haptic()
                  return all.map((v, index) => (index === i ? true : v))
                })
              }
            />
          ))}
        </div>
      ) : null}
    </Screen>
  )
}

/** The same patch of photograph, travelling from the page to its cell. */
function FlyingMark({
  photo,
  flight,
  aspect,
  onLand,
}: {
  photo: string
  flight: Flight
  aspect: number
  onLand: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return

    const total = LIFT.pluck + LIFT.travel
    const pluckAt = LIFT.pluck / total
    const arc = Math.max(26, Math.abs(flight.dy) * 0.22)

    const animation = node.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0, easing: EASE.pluck },
        {
          transform: `translate(0,${-LIFT.pluckRise}px) scale(${LIFT.pluckScale})`,
          offset: pluckAt,
          easing: 'cubic-bezier(.4,0,.25,1)',
        },
        {
          transform: `translate(${flight.dx * 0.5}px,${flight.dy * 0.5 - arc}px) scale(${
            (LIFT.pluckScale + flight.scale) / 2
          })`,
          offset: pluckAt + (1 - pluckAt) * 0.55,
          easing: EASE.spring,
        },
        {
          transform: `translate(${flight.dx}px,${flight.dy}px) scale(${
            flight.scale * LIFT.landScale
          })`,
          offset: 0.94,
        },
        { transform: `translate(${flight.dx}px,${flight.dy}px) scale(${flight.scale})`, offset: 1 },
      ],
      { duration: total, delay: flight.delay, fill: 'both', easing: 'linear' },
    )

    const timer = window.setTimeout(onLand, flight.delay + total * 0.94)
    return () => {
      animation.cancel()
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: flight.left,
        top: flight.top,
        width: flight.side,
        height: flight.side,
        borderRadius: 6,
        transformOrigin: 'center',
        willChange: 'transform',
        boxShadow: '0 6px 18px rgba(0,0,0,.45)',
        ...crop(photo, squareRegion(flight.mark, aspect)),
      }}
    />
  )
}
