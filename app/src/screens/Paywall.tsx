import { PrimaryPill, Screen, Sub, Title } from '../components/ui'
import { acid, font } from '../lib/theme'
import { useStore, type Plan } from '../state/store'

/**
 * Pricing at the moment of export, not before it: review and preview are free,
 * and the one-off is the default because an archive user makes two fonts, not
 * twenty.
 */
export function Paywall() {
  const { fontName, plan, setPlan, purchase, go, stats } = useStore()

  const buy = () => {
    purchase()
    go('library')
  }

  const secondary = (id: Plan, name: string, price: string, per: string | null, body: string) => (
    <button
      className="choice plan"
      aria-pressed={plan === id}
      onClick={() => setPlan(id)}
      style={{ borderRadius: 24, padding: '16px 20px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ font: `400 19px ${font.heading}` }}>{name}</div>
        <div style={{ font: `400 19px ${font.heading}`, color: acid.lime }}>
          {price}
          {per ? (
            <span style={{ fontSize: 12, color: 'rgba(242,244,234,.55)' }}>{per}</span>
          ) : null}
        </div>
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'rgba(242,244,234,.62)',
          lineHeight: 1.5,
          marginTop: 6,
        }}
      >
        {body}
      </div>
    </button>
  )

  return (
    <Screen>
      <div style={{ padding: '6px 22px 16px' }}>
        <Title>
          Your font is ready
          <br />
          to leave
        </Title>
        <Sub>Review and preview are free. Pay once when you want the file.</Sub>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: '0 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            background: acid.paper,
            color: acid.noteInk,
            borderRadius: 24,
            padding: '18px 20px',
            position: 'relative',
            boxShadow: plan === 'once' ? `0 0 0 2px ${acid.lime}` : 'none',
            transition: 'box-shadow 120ms cubic-bezier(.22,1,.36,1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 18,
              top: -10,
              background: acid.violet,
              color: acid.onAccent,
              fontSize: 10.5,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            Most pick this
          </div>
          <button
            onClick={() => setPlan('once')}
            style={{ display: 'block', width: '100%' }}
            aria-pressed={plan === 'once'}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <div style={{ font: `400 21px ${font.heading}` }}>This font</div>
              <div style={{ font: `400 26px ${font.heading}` }}>$8</div>
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'rgba(27,29,24,.7)',
                lineHeight: 1.5,
                marginTop: 6,
              }}
            >
              One-off. Full .otf, .ttf and web kit, install on all your devices, re-export forever
              after edits.
            </div>
          </button>
          <PrimaryPill
            onClick={buy}
            style={{
              background: acid.ground,
              color: acid.lime,
              font: `400 14px ${font.heading}`,
              padding: '13px 0',
              marginTop: 14,
            }}
          >
            Get {fontName}
          </PrimaryPill>
          {stats.missing > 0 ? (
            <div
              style={{
                fontSize: 11,
                color: 'rgba(27,29,24,.55)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Marked <em>partial</em> — {stats.missing} letters were never written.
            </div>
          ) : null}
        </div>

        {secondary(
          'keeper',
          'Keeper',
          '$4',
          '/mo',
          'Unlimited fonts and re-snaps while you work through a box of letters. Cancel and keep everything you made.',
        )}
        {secondary(
          'studio',
          'Studio licence',
          '$149',
          null,
          'Commercial use, 5 seats, variable weights on request, and a signed provenance sheet naming the hand.',
        )}

        <div
          style={{
            marginTop: 'auto',
            textAlign: 'center',
            fontSize: 11.5,
            color: 'rgba(242,244,234,.45)',
            lineHeight: 1.5,
          }}
        >
          No subscription needed to keep a font you've bought.
          <br />
          <button style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Restore purchases
          </button>
        </div>
      </div>
    </Screen>
  )
}
