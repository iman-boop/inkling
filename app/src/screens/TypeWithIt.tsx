import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ink } from '../components/Ink'
import { Keyboard } from '../components/Keyboard'
import { Screen, Spacer } from '../components/ui'
import { WriteOn } from '../components/WriteOn'
import { marksForLetter, namedLetters } from '../lib/cluster'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * Typing in your own hand — for real this time.
 *
 * Every glyph on this screen is a patch of the photograph, at the place that
 * ink was found, named by the person who wrote it. Repeat letters cycle
 * through the instances the page actually contains, so the second `a` isn't
 * the first because it *isn't* — it's a different `a` off the same page.
 *
 * A letter nobody has named yet draws as an empty lime socket: the app's own
 * "needs you", rather than a substitute shape passed off as yours.
 */
const LETTERS_WITH_TAILS = 'gjpqy'

export function TypeWithIt() {
  const { photo, read, clusters, go } = useStore()
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  const named = useMemo(() => namedLetters(clusters), [clusters])

  /** The page's usual letter height, so each glyph keeps its real proportion. */
  const median = useMemo(() => {
    if (!read) return 0
    const heights = read.marks.map((mark) => mark.height).sort((a, b) => a - b)
    return heights[Math.floor(heights.length / 2)] ?? 0
  }, [read])

  const type = useCallback((ch: string | null) => {
    setTouched(true)
    setValue((current) => (ch === null ? current.slice(0, -1) : current + ch))
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

  const size = 34

  const renderGlyph = useCallback(
    (ch: string, occurrence: number) => {
      if (!photo || !read) return null
      const marks = marksForLetter(clusters, ch)
      if (!marks.length) {
        // Not named yet. Say so in the app's own colour for "needs you".
        return (
          <span
            style={{
              display: 'inline-block',
              width: size * 0.5,
              height: size * 0.7,
              borderRadius: 5,
              boxShadow: `inset 0 0 0 1.5px ${acid.lime}`,
              background: 'rgba(214,242,75,.12)',
              verticalAlign: 'baseline',
              marginRight: 2,
            }}
          />
        )
      }

      // Cycle the instances this page actually holds.
      const mark = read.marks[marks[occurrence % marks.length]]
      const scale = median > 0 ? Math.min(2.2, mark.height / median) : 1
      const drop = LETTERS_WITH_TAILS.includes(ch) ? size * 0.26 : 0

      return (
        <Ink
          mark={mark}
          photo={photo}
          aspect={read.aspect}
          height={size * 0.78 * scale}
          style={{
            display: 'inline-block',
            verticalAlign: 'baseline',
            transform: `translateY(${drop}px)`,
            marginRight: 1,
          }}
        />
      )
    },
    [clusters, median, photo, read],
  )

  if (!photo || !read) return null

  const missing = [...new Set(value.split('').filter((ch) => ch !== ' '))].filter(
    (ch) => marksForLetter(clusters, ch).length === 0,
  )

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
        <span style={{ font: `400 19px ${font.heading}` }}>Your hand</span>
        <button style={{ fontSize: 12, color: acid.violetDeep }} onClick={() => go('label')}>
          name more
        </button>
      </div>

      <div
        style={{
          margin: '0 18px',
          background: '#fff',
          borderRadius: 24,
          padding: 22,
          minHeight: 190,
          boxShadow: '0 10px 28px rgba(27,29,24,.09)',
        }}
      >
        <div
          style={{
            font: `600 9.5px/1 ${font.body}`,
            letterSpacing: '.11em',
            textTransform: 'uppercase',
            color: 'rgba(27,29,24,.4)',
            marginBottom: 16,
          }}
        >
          {named.length} letters off your page
        </div>
        {touched || value ? (
          <WriteOn text={value} size={size} renderGlyph={renderGlyph} />
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(27,29,24,.55)' }}>
            Type anything. Every letter you named comes back in the ink you wrote it in — and the
            same letter twice gives you the two you actually wrote.
          </div>
        )}
      </div>

      <div style={{ padding: '16px 22px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="chip chip-violet">{named.join(' ') || 'nothing named yet'}</div>
        {missing.length ? (
          <button
            className="chip chip-toggle"
            onClick={() => go('label')}
            style={{ boxShadow: `inset 0 0 0 1.5px ${acid.lime}`, color: acid.noteInk }}
          >
            {missing.join(' ')} — not named
          </button>
        ) : null}
        {value ? (
          <button className="chip chip-toggle" onClick={() => setValue('')}>
            clear
          </button>
        ) : null}
      </div>

      <Spacer />

      <Keyboard onKey={type} onDelete={() => type(null)} />
    </Screen>
  )
}
