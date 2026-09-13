import { Count, GhostPill, Kicker, PrimaryPill, Screen, Spacer } from '../components/ui'
import { crop, representative, squareRegion } from '../lib/detect'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * Where a real page runs out.
 *
 * Everything up to here was true: those tiles are cut from the photograph, at
 * the places ink was actually found. Naming the marks is the part that needs
 * the reader this app doesn't have, and a font built without it would be
 * fifty-two invented shapes sold as someone's hand. So the flow stops, says
 * why, and offers the sample — the same refusal the unsupported-script screen
 * makes.
 */
export function OwnPage() {
  const { photo, read, setPhoto, go } = useStore()
  if (!photo || !read) return null

  const marks = read.marks
  const shown = representative(marks, 12)
  const coverage = Math.round(read.coverage * 1000) / 10

  const showSample = () => {
    setPhoto(null)
    go('reading')
  }

  return (
    <Screen>
      <Kicker>Your page</Kicker>

      <Count value={marks.length} tone={acid.lime}>
        marks lifted
        <br />
        off your photo
      </Count>

      <div style={{ padding: '0 18px 16px', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
        {shown.map((mark, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1',
              borderRadius: 11,
              overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.14)',
              ...crop(photo, squareRegion(mark, read.aspect)),
            }}
          />
        ))}
      </div>

      <div
        style={{
          margin: '0 18px 14px',
          background: 'rgba(155,139,255,.16)',
          boxShadow: 'inset 0 0 0 1.5px rgba(155,139,255,.45)',
          borderRadius: 22,
          padding: '16px 18px',
        }}
      >
        <div style={{ font: `400 18px/1.15 ${font.heading}`, color: '#c9bfff' }}>
          We can't tell you which letters these are
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.5,
            color: 'rgba(242,244,234,.72)',
            marginTop: 6,
          }}
        >
          Finding the ink is arithmetic; naming it is a reader we haven't built. Making the font
          from here would mean inventing fifty-two shapes and calling them yours — so we won't
          pretend. The tiles above are the honest part: real marks, cut from your photograph.
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(242,244,234,.5)', marginTop: 10 }}>
          {marks.length} marks · {coverage}% of the page is ink
        </div>
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <PrimaryPill onClick={showSample}>See the whole flow on the sample page</PrimaryPill>
        <GhostPill onClick={() => go('camera')}>Photograph another page</GhostPill>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'rgba(242,244,234,.42)',
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          Your photo stays on this device. Nothing was uploaded.
        </div>
      </div>
    </Screen>
  )
}
