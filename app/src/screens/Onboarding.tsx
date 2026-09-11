import { GhostPill, Hand, Screen } from '../components/ui'
import { acid, font } from '../lib/theme'
import { PrimaryPill } from '../components/ui'
import { useStore } from '../state/store'

/**
 * The value prop leads on the artifact, not on the technology: a recipe card
 * sits on the table and two glyphs have already been lifted off it.
 */
export function Onboarding() {
  const { go } = useStore()

  return (
    <Screen>
      <div style={{ padding: '8px 22px 0', font: `400 15px ${font.heading}`, color: acid.lime }}>
        Inkling
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', marginTop: 18 }}>
        <div style={{ position: 'absolute', left: 22, right: 22, top: 0 }}>
          <div style={{ font: `400 40px/1.02 ${font.heading}` }}>
            Nobody else
            <br />
            writes like
            <br />
            <span style={{ color: acid.lime }}>that.</span>
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: 'rgba(242,244,234,.65)',
              marginTop: 14,
              maxWidth: 300,
            }}
          >
            Photograph one page of handwriting — a recipe card, a letter, a founder's signature —
            and get a real font file back. Yours, installable, everywhere.
          </div>
        </div>

        <div style={{ position: 'absolute', left: 34, bottom: 24, transform: 'rotate(-4deg)' }}>
          <div
            style={{
              width: 250,
              background: acid.paper,
              borderRadius: 12,
              padding: '22px 20px',
              boxShadow: '0 20px 46px rgba(0,0,0,.6)',
            }}
          >
            <Hand size={22} style={{ color: acid.noteInk, lineHeight: 1.6, display: 'block' }}>
              Grandma's apple cake
              <br />
              4 apples, peeled
              <br />
              a cup of brown sugar
            </Hand>
          </div>
        </div>

        {/* two that already lifted off the page */}
        <div
          style={{
            position: 'absolute',
            right: 14,
            bottom: 96,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {[
            { ch: 'a', background: acid.lime, rotate: 6 },
            { ch: 'g', background: acid.violet, rotate: -5 },
          ].map((tile) => (
            <div
              key={tile.ch}
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: tile.background,
                color: acid.onAccent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: font.hand,
                fontSize: 34,
                transform: `rotate(${tile.rotate}deg)`,
              }}
            >
              {tile.ch}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '16px 22px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <PrimaryPill onClick={() => go('purpose')}>Start with a photo</PrimaryPill>
        <GhostPill
          onClick={() => go('reading')}
          style={{ boxShadow: 'none', color: 'rgba(242,244,234,.6)', padding: '2px 0' }}
        >
          See a font made from one letter
        </GhostPill>
      </div>
    </Screen>
  )
}
