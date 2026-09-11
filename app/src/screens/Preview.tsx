import { useCallback, useEffect, useState } from 'react'
import { Keyboard } from '../components/Keyboard'
import { PrimaryPill, Screen, Spacer } from '../components/ui'
import { WriteOn, repeatedLetter, useWriteOnDemo } from '../components/WriteOn'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * Type-to-test — the screen the whole flow is for.
 *
 * The demo writes itself out at a pen's pace on an untouched field and dies at
 * the first keystroke; after that every glyph appears on keydown with the same
 * 180ms fade. Warm white is the artifact, so here the artifact is the screen.
 */
const DEMO = 'the jars are all full again'

type Character = 'as-written' | 'tidied' | 'bolder'

export function Preview() {
  const { fontName, glyphs, go } = useStore()

  const [live, setLive] = useState(false)
  const [value, setValue] = useState('')
  const [slower, setSlower] = useState(false)
  const [panel, setPanel] = useState<'keyboard' | 'controls'>('keyboard')
  const [character, setCharacter] = useState<Character>('as-written')
  const [slant, setSlant] = useState(4)
  const [spacing, setSpacing] = useState(4)
  const [wobble, setWobble] = useState(true)

  const demo = useWriteOnDemo(DEMO, live, slower)
  const text = live ? value : demo

  /** Repeat letters cycle through the alternates captured from the page. */
  const samplesFor = useCallback(
    (ch: string) => {
      if (!wobble || character === 'tidied') return 1
      return glyphs.find((g) => g.ch === ch)?.samples ?? 1
    },
    [glyphs, wobble, character],
  )

  const type = useCallback((ch: string | null) => {
    setLive((wasLive) => {
      if (!wasLive) setValue(ch ?? '')
      else setValue((v) => (ch === null ? v.slice(0, -1) : v + ch))
      return true
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Backspace') {
        event.preventDefault()
        type(null)
        return
      }
      if (event.key.length === 1) {
        event.preventDefault()
        type(event.key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [type])

  const repeated = repeatedLetter(text, samplesFor)

  return (
    <Screen background={acid.paper} color={acid.noteInk} style={{ padding: '62px 0 0' }}>
      <div
        style={{
          padding: '6px 22px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span style={{ font: `400 19px ${font.heading}` }}>{fontName}</span>
        <button
          style={{ fontSize: 12, color: acid.violetDeep }}
          onClick={() => setPanel(panel === 'keyboard' ? 'controls' : 'keyboard')}
        >
          {panel === 'keyboard' ? 'adjust' : 'try it'}
        </button>
      </div>

      <div
        style={{
          margin: '0 18px',
          background: '#fff',
          borderRadius: 24,
          padding: 22,
          minHeight: 210,
          boxShadow: '0 10px 28px rgba(27,29,24,.09)',
        }}
      >
        <div
          style={{
            font: `600 9.5px/1 ${font.body}`,
            letterSpacing: '.11em',
            textTransform: 'uppercase',
            color: 'rgba(27,29,24,.4)',
            marginBottom: 14,
          }}
        >
          Type anything
        </div>
        <div
          style={{
            transform: `skewX(${-slant}deg)`,
            transformOrigin: 'left bottom',
            letterSpacing: `${spacing / 100}em`,
            WebkitTextStroke: character === 'bolder' ? '0.7px currentColor' : undefined,
            transition: 'transform 160ms cubic-bezier(.22,1,.36,1)',
          }}
        >
          <WriteOn text={text} samplesFor={samplesFor} />
        </div>
      </div>

      <div style={{ padding: '16px 22px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {repeated ? (
          <div className="chip chip-violet">two of the {repeated}'s differ</div>
        ) : null}
        <button
          className="chip chip-toggle"
          aria-pressed={slower}
          onClick={() => setSlower((s) => !s)}
        >
          slower
        </button>
        {live ? (
          <button
            className="chip chip-toggle"
            onClick={() => {
              setLive(false)
              setValue('')
            }}
          >
            replay
          </button>
        ) : null}
      </div>

      <Spacer />

      {panel === 'keyboard' ? (
        <Keyboard onKey={type} onDelete={() => type(null)} />
      ) : (
        <div style={{ padding: '0 18px 30px' }}>
          <div
            style={{
              padding: '4px 4px 8px',
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              color: 'rgba(27,29,24,.5)',
            }}
          >
            Character
          </div>

          <div style={{ display: 'flex', gap: 9, marginBottom: 11 }}>
            {(
              [
                ['as-written', 'As written'],
                ['tidied', 'Tidied'],
                ['bolder', 'Bolder'],
              ] as [Character, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                className="seg-light"
                aria-pressed={character === id}
                onClick={() => setCharacter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(27,29,24,.06)',
              borderRadius: 20,
              padding: '14px 16px',
              marginBottom: 11,
            }}
          >
            <Slider
              label="Slant"
              value={slant}
              min={0}
              max={12}
              onChange={setSlant}
              readout={slant === 4 ? 'as written · 4°' : `${slant}°`}
            />
            <Slider
              label="Letter spacing"
              value={spacing}
              min={-2}
              max={12}
              onChange={setSpacing}
              readout={spacing > 6 ? 'roomy' : spacing < 1 ? 'tight' : 'as written'}
              style={{ marginTop: 16 }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>Keep the wobble</span>
              <button
                className="switch"
                role="switch"
                aria-checked={wobble}
                aria-label="Keep the wobble"
                onClick={() => setWobble((w) => !w)}
                style={{ background: wobble ? acid.violetDeep : 'rgba(27,29,24,.18)' }}
              >
                <span style={{ left: wobble ? 21 : 3 }} />
              </button>
            </div>
          </div>

          <PrimaryPill onClick={() => go('paywall')}>Name &amp; save</PrimaryPill>
        </div>
      )}
    </Screen>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
  readout,
  style,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  readout: string
  style?: React.CSSProperties
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div style={style}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12.5,
          marginBottom: 5,
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'rgba(27,29,24,.55)' }}>{readout}</span>
      </div>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` }}
      />
    </div>
  )
}
