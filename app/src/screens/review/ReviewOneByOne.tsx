import { useMemo, useState } from 'react'
import { ModeSwitcher } from '../../components/ModeSwitcher'
import { PrimaryPill, Screen } from '../../components/ui'
import { isCore } from '../../lib/font-data'
import { variantStyle } from '../../lib/variants'
import { acid, font } from '../../lib/theme'
import { useStore } from '../../state/store'

/**
 * Mode: One by one — the default on a first font, or whenever more than eight
 * letters came back shaky. It's also the only mode where letter variants get
 * chosen: the point of the whole product is that the second *a* isn't the
 * first.
 */
export function ReviewOneByOne() {
  const { glyphs, resolve, reviewMode, setReviewMode, focusedGlyph, focusGlyph, go } = useStore()

  const queue = useMemo(
    () => glyphs.filter((g) => isCore(g) && g.state !== 'missing'),
    [glyphs],
  )

  const [index, setIndex] = useState(() => {
    const wanted = focusedGlyph ? queue.findIndex((g) => g.ch === focusedGlyph) : -1
    return wanted >= 0 ? wanted : 0
  })
  const [variant, setVariant] = useState(0)

  const current = queue[Math.min(index, queue.length - 1)]
  const samples = Math.max(1, Math.min(current?.samples ?? 1, 3))

  const move = (delta: number) => {
    focusGlyph(null)
    setVariant(0)
    setIndex((i) => {
      const next = i + delta
      if (next < 0) return 0
      if (next >= queue.length) return queue.length - 1
      return next
    })
  }

  const accept = () => {
    resolve(current.ch, 'clean')
    if (index >= queue.length - 1) {
      go('preview')
      return
    }
    move(1)
  }

  if (!current) return null

  return (
    <Screen background={acid.stage}>
      <div
        style={{
          padding: '4px 22px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12.5, color: 'rgba(242,244,234,.6)' }}>
          Letter {index + 1} of {queue.length}
        </span>
        <button style={{ fontSize: 12.5, color: acid.lime }} onClick={() => go('preview')}>
          Skip all
        </button>
      </div>

      <ModeSwitcher mode={reviewMode} onChange={setReviewMode} />

      <div style={{ padding: '0 22px', display: 'flex', gap: 4, marginBottom: 18 }}>
        {queue.map((g, i) => (
          <div
            key={g.ch}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background:
                i < index ? acid.lime : i === index ? acid.violet : 'rgba(242,244,234,.18)',
              transition: 'background 160ms cubic-bezier(.22,1,.36,1)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          {/* the rest of the stack, anchored to the real card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: acid.paper,
              borderRadius: 26,
              opacity: 0.25,
              transform: 'rotate(3deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: acid.paper,
              borderRadius: 26,
              opacity: 0.55,
              transform: 'rotate(-1.6deg)',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '100%',
              background: acid.paper,
              borderRadius: 26,
              boxShadow: '0 18px 44px rgba(0,0,0,.5)',
              padding: '24px 22px 20px',
              color: acid.noteInk,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 10,
              }}
            >
              <div style={{ font: `400 18px ${font.heading}` }}>the letter {current.ch}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: acid.violetDeep,
                  color: acid.paper,
                  padding: '3px 9px',
                  borderRadius: 999,
                }}
              >
                {samples} sample{samples === 1 ? '' : 's'}
              </div>
            </div>

            <div
              style={{
                height: 190,
                borderRadius: 16,
                background: '#fff',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 62,
                  height: 1,
                  background: 'rgba(108,92,231,.35)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 130,
                  height: 1,
                  background: 'rgba(108,92,231,.35)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 20,
                  borderTop: '1px dashed rgba(108,92,231,.5)',
                }}
              />
              <span
                style={{
                  fontFamily: font.hand,
                  fontSize: 120,
                  lineHeight: 1,
                  color: acid.noteInk,
                  position: 'relative',
                  transition: 'transform 160ms cubic-bezier(.22,1,.36,1)',
                  ...variantStyle(variant),
                }}
              >
                {current.ch}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
              {Array.from({ length: samples }, (_, i) => {
                const chosen = i === variant
                return (
                  <button
                    key={i}
                    className="pill"
                    onClick={() => setVariant(i)}
                    aria-pressed={chosen}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: chosen ? 'rgba(214,242,75,.35)' : '#eceade',
                      boxShadow: chosen ? `inset 0 0 0 2px ${acid.limeEdge}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: font.hand,
                      fontSize: 28,
                      color: chosen ? acid.noteInk : 'rgba(27,29,24,.7)',
                    }}
                  >
                    <span style={variantStyle(i)}>{current.ch}</span>
                  </button>
                )
              })}
              <button
                className="pill"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  boxShadow: 'inset 0 0 0 1.5px rgba(27,29,24,.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11.5,
                  color: 'rgba(27,29,24,.6)',
                  textAlign: 'center',
                  lineHeight: 1.25,
                }}
              >
                draw
                <br />
                my own
              </button>
            </div>

            <div
              style={{
                fontSize: 12,
                color: 'rgba(27,29,24,.7)',
                marginTop: 12,
                lineHeight: 1.45,
              }}
            >
              Pick the <strong>{current.ch}</strong> that looks most like you. We'll use the others
              for variety mid-word.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
        <RoundButton label="Previous letter" onClick={() => move(-1)}>
          ↺
        </RoundButton>
        <PrimaryPill onClick={accept} style={{ flex: 1 }}>
          Looks like me
        </PrimaryPill>
        <RoundButton label="Next letter" onClick={() => move(1)}>
          →
        </RoundButton>
      </div>
    </Screen>
  )
}

function RoundButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      className="pill pill-ghost"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 56,
        height: 56,
        flex: 'none',
        borderRadius: 999,
        boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 19,
        color: 'rgba(242,244,234,.7)',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}
