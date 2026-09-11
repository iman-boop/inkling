import { useEffect } from 'react'
import { GlyphCell } from '../components/Glyphs'
import { Count, GhostPill, Hand, Kicker, PrimaryPill, ProgressBar, Screen, Spacer } from '../components/ui'
import { INITIALLY_MISSING } from '../lib/font-data'
import { acid } from '../lib/theme'
import { spell } from '../lib/words'
import { useStore } from '../state/store'

/**
 * The re-snap closes the set — and flags the letters that came back shaky
 * rather than declaring victory.
 */
export function Resnap() {
  const { glyphs, stats, go, setReviewMode, gapsFilled, fillGaps } = useStore()

  // This screen *is* the second read, so it carries it out on arrival —
  // including when it's opened straight from the screen list.
  useEffect(() => {
    if (!gapsFilled) fillGaps()
  }, [gapsFilled, fillGaps])

  const newcomers = glyphs.filter((g) => INITIALLY_MISSING.includes(g.ch))
  const shaky = newcomers.filter((g) => g.state === 'shaky')

  return (
    <Screen>
      <Kicker>Second photo read</Kicker>

      <Count value={stats.found} tone={acid.lime}>
        of {stats.total} glyphs
        <br />
        {stats.missing === 0 ? 'a complete alphabet' : `${stats.missing} still to come`}
      </Count>

      <ProgressBar value={stats.found / stats.total} />

      <div
        style={{
          margin: '0 18px 14px',
          background: acid.paper,
          borderRadius: 22,
          padding: '22px 20px',
          color: acid.noteInk,
        }}
      >
        <Hand size={40} style={{ display: 'block', lineHeight: 1.12 }}>
          quick jazzy vixen
          <br />
          boxed a zephyr
        </Hand>
        <div style={{ fontSize: 11.5, color: 'rgba(27,29,24,.65)', marginTop: 10 }}>
          The {newcomers.length} newcomers, set in the font they just completed.
        </div>
      </div>

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {newcomers.map((g) => (
            <GlyphCell key={g.ch} ch={g.ch} state={g.state} size={24} />
          ))}
        </div>
        {shaky.length > 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(242,244,234,.55)', lineHeight: 1.45 }}>
            {spell(shaky.length)} of them came out shaky — worth a look before you name it.
          </div>
        ) : null}
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', gap: 10 }}>
        <GhostPill
          onClick={() => {
            setReviewMode('one-by-one')
            go('review')
          }}
          style={{ width: 'auto', padding: '15px 18px', fontSize: 13.5 }}
        >
          Review {shaky.length}
        </GhostPill>
        <PrimaryPill onClick={() => go('preview')} style={{ flex: 1, padding: '15px 0' }}>
          Name your font
        </PrimaryPill>
      </div>
    </Screen>
  )
}
