import { useMemo, useState } from 'react'
import { ModeSwitcher } from '../../components/ModeSwitcher'
import { GhostPill, PrimaryPill, Screen } from '../../components/ui'
import { NOTE_ATTRIBUTION, NOTE_LINES, type Mark } from '../../lib/font-data'
import { acid, font } from '../../lib/theme'
import { useStore } from '../../state/store'

/**
 * Mode: In place — the default for photographed artifacts.
 *
 * The artifact stays on screen and corrections keep their context. Highlights
 * are real spans wrapped around real letters, so a highlight always encloses
 * its glyph rather than floating near it.
 */
export function ReviewInPlace() {
  const store = useStore()
  const { glyphs, resolvedMarks, resolveMark, resolve, reviewMode, setReviewMode, stats, go } = store

  const marks = useMemo(
    () => NOTE_LINES.flatMap((line) => line.map((s) => s.mark).filter(Boolean) as Mark[]),
    [],
  )
  const open = marks.filter((m) => !resolvedMarks[m.id])
  const [selectedId, setSelectedId] = useState<string>(open[0]?.id ?? marks[0].id)
  const selected = marks.find((m) => m.id === selectedId) ?? marks[0]
  const [candidate, setCandidate] = useState(selected.candidates[0])

  const select = (mark: Mark) => {
    setSelectedId(mark.id)
    setCandidate(resolvedMarks[mark.id] ?? mark.candidates[0])
  }

  const advance = () => {
    const next = marks.find((m) => m.id !== selected.id && !resolvedMarks[m.id])
    if (next) select(next)
  }

  const confirm = () => {
    resolveMark(selected.id, candidate)
    resolve(candidate, 'clean')
    advance()
  }

  const drop = () => {
    resolveMark(selected.id, '')
    advance()
  }

  // Everything still waiting on a decision, this letter aside.
  const remaining = Math.max(stats.shaky - 1, 0)

  return (
    <Screen>
      <div
        style={{
          padding: '4px 22px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ font: `400 20px ${font.heading}` }}>Review</span>
        <span style={{ fontSize: 12.5, color: 'rgba(242,244,234,.6)' }}>
          {stats.found} of {stats.total}
        </span>
      </div>

      <ModeSwitcher mode={reviewMode} onChange={setReviewMode} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          background: acid.stage,
          overflow: 'hidden',
          padding: '16px 14px',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '100%',
            background: acid.paper,
            borderRadius: 10,
            boxShadow: '0 14px 34px rgba(0,0,0,.5)',
            padding: '46px 20px 22px',
            fontFamily: font.hand,
            fontSize: 26,
            lineHeight: 1.95,
            color: acid.noteInk,
          }}
        >
          {NOTE_LINES.map((line, li) => (
            <div key={li}>
              {line.map((segment, si) => {
                if (!segment.mark) return <span key={si}>{segment.text}</span>
                const mark = segment.mark
                const decided = resolvedMarks[mark.id]
                const glyph = glyphs.find((g) => g.ch === mark.ch)
                const isSelected = mark.id === selected.id
                const className = [
                  'note-mark',
                  decided !== undefined
                    ? 'note-mark-done'
                    : isSelected
                      ? 'note-mark-open'
                      : glyph?.state === 'shaky'
                        ? 'note-mark-needs'
                        : 'note-mark-confident',
                ].join(' ')
                return (
                  <button
                    key={si}
                    className={className}
                    onClick={() => select(mark)}
                    style={{ fontFamily: font.hand, fontSize: 26, color: acid.noteInk }}
                    aria-label={`Letter ${mark.ch}, line ${mark.line}, word ${mark.word}`}
                  >
                    {decided || segment.text}
                    {isSelected && decided === undefined ? (
                      <span
                        style={{
                          position: 'absolute',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          bottom: 'calc(100% + 10px)',
                          whiteSpace: 'nowrap',
                          background: acid.lime,
                          color: acid.onAccent,
                          fontFamily: font.body,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 9px',
                          borderRadius: 999,
                          lineHeight: 1.2,
                        }}
                      >
                        is this “{mark.ch}”?
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
          <div style={{ fontSize: 20, color: 'rgba(27,29,24,.55)' }}>{NOTE_ATTRIBUTION}</div>
        </div>
      </div>

      {/* the sheet rises over the work */}
      <div
        style={{
          background: acid.ground,
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 30px rgba(0,0,0,.5)',
          padding: '18px 20px 4px',
          marginTop: -24,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background: 'rgba(242,244,234,.28)',
            margin: '0 auto 14px',
          }}
        />

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 18,
              background: acid.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: font.hand,
              fontSize: 46,
              color: acid.noteInk,
            }}
          >
            {candidate}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: `400 18px ${font.heading}`, marginBottom: 3 }}>
              Line {selected.line}, word {selected.word}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(242,244,234,.62)', lineHeight: 1.4 }}>
              We read this as <strong style={{ color: acid.lime }}>{selected.ch}</strong> with{' '}
              {Math.round(selected.confidence * 100)}% confidence.{' '}
              {selected.candidates.length - 1} other candidate
              {selected.candidates.length - 1 === 1 ? '' : 's'} found.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {selected.candidates.map((option) => {
            const chosen = option === candidate
            return (
              <button
                key={option}
                onClick={() => setCandidate(option)}
                className="pill"
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '11px 0',
                  borderRadius: 14,
                  background: chosen ? 'rgba(214,242,75,.22)' : acid.paper,
                  boxShadow: chosen ? `inset 0 0 0 2px ${acid.lime}` : 'none',
                  fontFamily: font.hand,
                  fontSize: 26,
                  color: chosen ? acid.lime : acid.noteInk,
                }}
              >
                {option}
              </button>
            )
          })}
          <button
            className="pill"
            onClick={() => go('gaps')}
            style={{
              flex: 1,
              borderRadius: 14,
              boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.22)',
              fontSize: 12,
              color: 'rgba(242,244,234,.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Type it
          </button>
        </div>

        <div style={{ display: 'flex', gap: 9, paddingBottom: 14 }}>
          <PrimaryPill onClick={confirm} style={{ flex: 1, font: `400 14px ${font.heading}`, padding: '13px 0' }}>
            {remaining > 0 ? `Confirm · next of ${remaining}` : 'Confirm · last one'}
          </PrimaryPill>
          <GhostPill onClick={drop} style={{ width: 'auto', padding: '13px 16px' }}>
            Drop
          </GhostPill>
        </div>
      </div>
    </Screen>
  )
}
