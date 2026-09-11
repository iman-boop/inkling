import { ModeSwitcher } from '../../components/ModeSwitcher'
import { GlyphGrid, StateLegend } from '../../components/Glyphs'
import { PrimaryPill, Screen } from '../../components/ui'
import { section, type Glyph } from '../../lib/font-data'
import { font } from '../../lib/theme'
import { useStore } from '../../state/store'

/**
 * Mode: Sheet — the default when the font is heading for a brand kit and the
 * whole set has to be audited. Honest about gaps: the outlined cells are the
 * ones nobody wrote, and they lead to the worksheet rather than being quietly
 * invented.
 */
export function ReviewSheet() {
  const { glyphs, stats, reviewMode, setReviewMode, fontName, go, focusGlyph } = useStore()

  const openLetter = (glyph: Glyph) => {
    if (glyph.state === 'missing') {
      go('gaps')
      return
    }
    // Switching never loses a correction — the letter carries over.
    focusGlyph(glyph.ch)
    setReviewMode('one-by-one')
  }

  const label = (text: string) => (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: 'rgba(242,244,234,.45)',
        margin: '0 0 8px',
      }}
    >
      {text}
    </div>
  )

  return (
    <Screen>
      <div style={{ padding: '4px 20px 14px', borderBottom: '1px solid rgba(242,244,234,.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ font: `400 24px ${font.heading}` }}>Specimen</div>
          <div style={{ fontSize: 11.5, color: 'rgba(242,244,234,.55)' }}>{fontName} · v3</div>
        </div>
        <StateLegend clean={stats.clean} shaky={stats.shaky} missing={stats.missing} />
      </div>

      <div style={{ paddingTop: 14 }}>
        <ModeSwitcher mode={reviewMode} onChange={setReviewMode} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '4px 16px 0' }}>
        {label('Lowercase')}
        <GlyphGrid
          glyphs={section(glyphs, 'lower')}
          columns={9}
          size={17}
          onSelect={openLetter}
          style={{ marginBottom: 16 }}
        />
        {label('Uppercase')}
        <GlyphGrid
          glyphs={section(glyphs, 'upper')}
          columns={9}
          size={16}
          onSelect={openLetter}
          style={{ marginBottom: 16 }}
        />
        {label('Figures & marks')}
        <GlyphGrid glyphs={section(glyphs, 'marks')} columns={9} size={15} onSelect={openLetter} />
      </div>

      {stats.missing > 0 ? (
        <div
          style={{
            margin: '14px 16px 0',
            background: 'rgba(155,139,255,.16)',
            boxShadow: 'inset 0 0 0 1.5px rgba(155,139,255,.45)',
            borderRadius: 22,
            padding: '16px 18px',
          }}
        >
          <div style={{ font: `400 17px ${font.heading}`, color: '#c9bfff', marginBottom: 4 }}>
            Almost a full alphabet
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'rgba(242,244,234,.7)',
              lineHeight: 1.45,
              marginBottom: 12,
            }}
          >
            Write the {stats.missing} outlined cells anywhere and photograph it — one shot finishes
            the set.
          </div>
          <PrimaryPill
            onClick={() => go('gaps')}
            style={{ font: `400 14px ${font.heading}`, padding: '12px 0' }}
          >
            Print the worksheet
          </PrimaryPill>
        </div>
      ) : (
        <div style={{ margin: '14px 16px 0' }}>
          <PrimaryPill onClick={() => go('preview')}>Type something in it</PrimaryPill>
        </div>
      )}
    </Screen>
  )
}
