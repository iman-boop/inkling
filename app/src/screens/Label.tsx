import { useEffect, useMemo, useState } from 'react'
import { Ink } from '../components/Ink'
import { Keyboard } from '../components/Keyboard'
import { GhostPill, PrimaryPill, Screen } from '../components/ui'
import { clusterMarks } from '../lib/cluster'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * Naming the shapes — the whole reader, and it's you.
 *
 * The marks are grouped by shape first, so one answer covers every other
 * instance on the page: name this `e` and forty of them are named. It is the
 * design's one-by-one ritual with the machine's half of the work removed —
 * there are no candidates to choose between and no confidence to report,
 * because nothing here guessed.
 */
export function Label() {
  const { photo, read, clusters, setClusters, nameCluster, skipCluster, splitAt, go } = useStore()

  // Group on arrival; the read's marks don't change under us.
  useEffect(() => {
    if (read?.verdict === 'page' && clusters.length === 0) {
      setClusters(clusterMarks(read.marks))
    }
  }, [read, clusters.length, setClusters])

  const [index, setIndex] = useState(0)
  const [justNamed, setJustNamed] = useState<string | null>(null)

  const named = clusters.filter((cluster) => cluster.letter).length
  const letters = useMemo(
    () => new Set(clusters.map((cluster) => cluster.letter).filter(Boolean)),
    [clusters],
  )

  const cluster = clusters[index]

  const advance = () => {
    const next = clusters.findIndex((c, i) => i > index && !c.letter && !c.skipped)
    setIndex(next >= 0 ? next : Math.min(index + 1, clusters.length - 1))
  }

  const name = (letter: string) => {
    if (!cluster) return
    nameCluster(index, letter)
    setJustNamed(letter)
    window.setTimeout(() => setJustNamed(null), 320)
    advance()
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'Backspace') {
        event.preventDefault()
        setIndex((i) => Math.max(0, i - 1))
        return
      }
      if (event.key.length === 1 && event.key !== ' ') {
        event.preventDefault()
        name(event.key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!photo || !read) return null
  if (!cluster) {
    return (
      <Screen background={acid.stage}>
        <div style={{ padding: '40px 22px', font: `400 20px ${font.heading}` }}>
          Nothing to name yet.
        </div>
      </Screen>
    )
  }

  const members = cluster.members
  const hero = read.marks[members[0]]

  return (
    <Screen background={acid.stage} style={{ padding: '62px 0 0' }}>
      <div
        style={{
          padding: '4px 22px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12.5, color: 'rgba(242,244,234,.6)' }}>
          Shape {index + 1} of {clusters.length}
        </span>
        <button style={{ fontSize: 12.5, color: acid.lime }} onClick={() => go('type-with-it')}>
          {named > 0 ? `Done · ${letters.size} letters` : 'Skip all'}
        </button>
      </div>

      <div style={{ padding: '0 22px', display: 'flex', gap: 3, marginBottom: 16 }}>
        {clusters.map((c, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background: c.letter
                ? acid.lime
                : i === index
                  ? acid.violet
                  : c.skipped
                    ? 'rgba(242,244,234,.08)'
                    : 'rgba(242,244,234,.18)',
              transition: 'background 160ms cubic-bezier(.22,1,.36,1)',
            }}
          />
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: '0 18px', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            background: acid.paper,
            borderRadius: 26,
            boxShadow: '0 18px 44px rgba(0,0,0,.5)',
            padding: '20px 20px 18px',
            color: acid.noteInk,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 12,
            }}
          >
            <div style={{ font: `400 18px ${font.heading}` }}>
              {cluster.letter ? `the letter ${cluster.letter}` : 'this shape'}
            </div>
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
              {members.length} on this page
            </div>
          </div>

          <div
            style={{
              height: 150,
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
                bottom: 28,
                borderTop: '1px dashed rgba(108,92,231,.45)',
              }}
            />
            <Ink mark={hero} photo={photo} aspect={read.aspect} height={96} />
            {justNamed ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(214,242,75,.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  font: `400 64px ${font.heading}`,
                  color: acid.noteInk,
                }}
              >
                {justNamed}
              </div>
            ) : null}
          </div>

          {members.length > 1 ? (
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginTop: 12,
                alignItems: 'flex-end',
                height: 42,
                overflow: 'hidden',
              }}
            >
              {members.slice(1, 8).map((member) => (
                <Ink
                  key={member}
                  mark={read.marks[member]}
                  photo={photo}
                  aspect={read.aspect}
                  height={34}
                  style={{ borderRadius: 6, backgroundColor: '#fff' }}
                />
              ))}
              {members.length > 8 ? (
                <span style={{ fontSize: 11.5, color: 'rgba(27,29,24,.5)' }}>
                  +{members.length - 8}
                </span>
              ) : null}
            </div>
          ) : null}

          <div style={{ fontSize: 12.5, color: 'rgba(27,29,24,.7)', marginTop: 12, lineHeight: 1.45 }}>
            <strong>Which letter is this?</strong> Type it and every one of them is named.
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="pill"
              onClick={() => {
                skipCluster(index)
                advance()
              }}
              style={{
                flex: 1,
                boxShadow: 'inset 0 0 0 1.5px rgba(27,29,24,.22)',
                borderRadius: 999,
                padding: '10px 0',
                fontSize: 12,
                color: 'rgba(27,29,24,.65)',
                textAlign: 'center',
              }}
            >
              Not a letter
            </button>
            <button
              className="pill"
              onClick={() => splitAt(index)}
              disabled={members.length < 2}
              style={{
                flex: 1,
                boxShadow: 'inset 0 0 0 1.5px rgba(27,29,24,.22)',
                borderRadius: 999,
                padding: '10px 0',
                fontSize: 12,
                color: 'rgba(27,29,24,.65)',
                textAlign: 'center',
              }}
            >
              These differ — split
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 18px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <GhostPill
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          style={{ width: 'auto', padding: '12px 16px' }}
        >
          ↺
        </GhostPill>
        <PrimaryPill
          onClick={() => go('type-with-it')}
          disabled={letters.size === 0}
          style={{ flex: 1, padding: '13px 0' }}
        >
          {letters.size === 0 ? 'Name one to carry on' : `Type with ${letters.size} letters`}
        </PrimaryPill>
        <GhostPill onClick={advance} style={{ width: 'auto', padding: '12px 16px' }}>
          →
        </GhostPill>
      </div>

      <Keyboard onKey={name} onDelete={() => setIndex((i) => Math.max(0, i - 1))} />
    </Screen>
  )
}
