import { Kicker, PrimaryPill, Screen, Sub, Title } from '../components/ui'
import { acid, font } from '../lib/theme'
import { useStore, type Purpose as PurposeId } from '../state/store'

/**
 * Addresses both audiences without asking anyone to pick a persona — the
 * answer only sets where review starts, and review can be switched for free.
 */
const OPTIONS: { id: PurposeId; title: string; body: string }[] = [
  {
    id: 'archive',
    title: 'An archive',
    body: 'Recipes, journals, letters from someone. We keep the wobble and open review on the photo.',
  },
  {
    id: 'brand',
    title: "A brand's hand",
    body: "A founder's writing as a company face. Opens the full specimen sheet and licence seats.",
  },
  {
    id: 'personal',
    title: 'My own writing',
    body: 'For fun, notes and cards. Guides you letter by letter and picks variants with you.',
  },
]

export function Purpose() {
  const { purpose, setPurpose, go } = useStore()

  return (
    <Screen>
      <Kicker>Step 1 of 2</Kicker>
      <div style={{ padding: '0 22px 18px' }}>
        <Title size={28}>
          What are you
          <br />
          turning into a font?
        </Title>
        <Sub>This only sets where we start — you can change everything later.</Sub>
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
        {OPTIONS.map((option) => {
          const chosen = purpose === option.id
          return (
            <button
              key={option.id}
              className="choice"
              aria-pressed={chosen}
              onClick={() => setPurpose(option.id)}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ font: `400 19px ${font.heading}` }}>{option.title}</div>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: chosen ? acid.lime : 'transparent',
                    boxShadow: chosen ? 'none' : 'inset 0 0 0 1.5px rgba(242,244,234,.25)',
                    color: acid.onAccent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    transition: 'background 120ms cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  {chosen ? '✓' : ''}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: chosen ? 'rgba(242,244,234,.7)' : 'rgba(242,244,234,.6)',
                  lineHeight: 1.45,
                  marginTop: 5,
                }}
              >
                {option.body}
              </div>
            </button>
          )
        })}

        <div
          style={{
            marginTop: 'auto',
            background: 'rgba(155,139,255,.14)',
            boxShadow: 'inset 0 0 0 1.5px rgba(155,139,255,.4)',
            borderRadius: 20,
            padding: '14px 16px',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'rgba(242,244,234,.72)',
          }}
        >
          Photos stay on your device unless you export. We never train on your handwriting.
        </div>
      </div>

      <div style={{ padding: '14px 18px 0' }}>
        <PrimaryPill
          onClick={() => go('camera')}
          disabled={!purpose}
          title={purpose ? undefined : 'Pick what you are turning into a font'}
        >
          Continue
        </PrimaryPill>
      </div>
    </Screen>
  )
}
