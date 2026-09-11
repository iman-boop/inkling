import { Count, Kicker, PrimaryPill, ProgressBar, Screen, Spacer } from '../components/ui'
import { acid, font } from '../lib/theme'
import { useStore, type ScreenId } from '../state/store'

/**
 * At the review gate — a partial read.
 *
 * Not a failure: the font can be made, so this is a decision screen rather
 * than an apology, with the honest cost of continuing stated in the second
 * line. The *partial* badge follows the font into the library and the export
 * sheet, so it can never be quietly sold as complete.
 */
const FOUND = 9
const TOTAL = 52

export function PartialRead() {
  const { go } = useStore()

  const option = (
    title: string,
    body: string,
    to: ScreenId,
    { recommended = false, filled = false } = {},
  ) => (
    <button
      className={filled ? 'pill' : 'pill pill-ghost'}
      onClick={() => go(to)}
      style={{
        display: 'block',
        width: '100%',
        borderRadius: 20,
        padding: '15px 17px',
        background: filled ? acid.paper : 'transparent',
        color: filled ? acid.noteInk : acid.ink,
        boxShadow: filled ? 'none' : 'inset 0 0 0 1.5px rgba(242,244,234,.22)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ font: `400 17px ${font.heading}` }}>{title}</div>
        {recommended ? (
          <div style={{ fontSize: 12, color: 'rgba(27,29,24,.55)' }}>recommended</div>
        ) : null}
      </div>
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.45,
          color: filled ? 'rgba(27,29,24,.7)' : 'rgba(242,244,234,.62)',
          marginTop: 4,
        }}
      >
        {body}
      </div>
    </button>
  )

  return (
    <Screen>
      <Kicker>First photo read</Kicker>

      <Count value={FOUND} tone={acid.violet}>
        of {TOTAL} glyphs
        <br />a shopping list is a thin sample
      </Count>

      <ProgressBar value={FOUND / TOTAL} tone={acid.violet} />

      <div
        style={{
          margin: '0 18px 16px',
          background: 'rgba(242,244,234,.06)',
          borderRadius: 22,
          padding: '16px 18px',
        }}
      >
        <div style={{ font: `400 18px/1.15 ${font.heading}` }}>
          We can build it, but {TOTAL - FOUND} letters would be invented
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'rgba(242,244,234,.68)',
            marginTop: 6,
          }}
        >
          Guessed shapes are the reason cheap handwriting fonts look wrong. Two more pages of the
          same hand is usually all it takes.
        </div>
      </div>

      <div style={{ margin: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {option(
          'Add more pages',
          'Keep photographing the same box of letters — we merge them into one hand.',
          'camera',
          { recommended: true, filled: true },
        )}
        {option(
          'Copy out one line instead',
          'A single pangram in the same pen fills every gap at once.',
          'gaps',
        )}
        {option(
          'Make it from nine',
          'Fine for a monogram or a logo lockup. Marked partial in your library.',
          'library',
        )}
      </div>

      <Spacer />

      <div style={{ padding: '0 18px' }}>
        <PrimaryPill onClick={() => go('camera')}>Photograph another page</PrimaryPill>
      </div>
    </Screen>
  )
}
