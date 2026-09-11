import { GlyphCell } from '../components/Glyphs'
import { GhostPill, Hand, PrimaryPill, Screen, Spacer, Sub, Title } from '../components/ui'
import { PRACTICE_LINE, RARE_EXAMPLES } from '../lib/font-data'
import { spell } from '../lib/words'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * The fill-the-gaps loop — the step every other screen refers to.
 *
 * The missing letters use the lime "needs you" state at full strength, because
 * here they are an instruction rather than a hole.
 */
export function Gaps() {
  const { glyphs, stats, fillGaps, go } = useStore()
  const missing = glyphs.filter((g) => g.state === 'missing')
  const stillMissing = (ch: string) => missing.some((g) => g.ch === ch)
  const rare = RARE_EXAMPLES.filter(stillMissing).concat(missing.map((g) => g.ch)).slice(0, 2)

  const snap = () => {
    fillGaps()
    go('resnap')
  }

  return (
    <Screen>
      <div style={{ padding: '6px 22px 14px' }}>
        <Title>
          {spell(stats.missing)} letters
          <br />
          never showed up
        </Title>
        <Sub>
          Nobody writes <span style={{ color: acid.lime }}>{rare[0]}</span> or{' '}
          <span style={{ color: acid.lime }}>{rare[1]}</span> in a recipe. Write the line below
          once and we'll take all {stats.missing} from it.
        </Sub>
      </div>

      <div
        style={{
          padding: '0 18px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: 8,
        }}
      >
        {missing.map((g) => (
          <GlyphCell key={g.ch} ch={g.ch} state={g.state} size={24} wanted />
        ))}
      </div>

      <div
        style={{
          margin: '0 18px',
          background: acid.paper,
          borderRadius: 20,
          padding: 20,
          color: acid.noteInk,
        }}
      >
        <div
          style={{
            font: `600 10.5px/1 ${font.body}`,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            color: 'rgba(27,29,24,.5)',
            marginBottom: 10,
          }}
        >
          Copy this out by hand
        </div>
        <Hand size={26} style={{ display: 'block', lineHeight: 1.5 }}>
          {PRACTICE_LINE.map((line, i) => (
            <span key={i}>
              {line}
              {i < PRACTICE_LINE.length - 1 ? <br /> : null}
            </span>
          ))}
        </Hand>
        <div
          style={{
            borderTop: '1px dashed rgba(27,29,24,.3)',
            marginTop: 16,
            paddingTop: 12,
            fontSize: 11.5,
            color: 'rgba(27,29,24,.6)',
            lineHeight: 1.45,
          }}
        >
          Same pen, same paper if you still have it — it keeps the weight consistent.
        </div>
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <PrimaryPill onClick={snap}>I've written it — snap</PrimaryPill>
        <div style={{ display: 'flex', gap: 9 }}>
          <GhostPill onClick={() => window.print()}>Print worksheet</GhostPill>
          <GhostPill onClick={() => go('preview')}>Skip — borrow shapes</GhostPill>
        </div>
      </div>
    </Screen>
  )
}
