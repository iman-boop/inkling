import { GhostPill, Hand, Kicker, PrimaryPill, Screen, Spacer, Sub, Title } from '../../components/ui'
import { acid, font } from '../../lib/theme'
import { useStore } from '../../state/store'

/**
 * Straight after the read — no handwriting, printed type, unsupported script.
 *
 * Full-screen, because the run has stopped and we owe an explanation. Every
 * failure names the cause and offers the next move: no dead ends, no
 * "something went wrong". The artifact is never the thing at fault — the
 * light, the angle, the pen are. Each one keeps the photo, and each one has a
 * route that needs no new photograph where that's physically possible.
 */

/** Nothing usable came back — three named causes, one needing no new photo. */
export function NoHandwriting() {
  const { go, photo, read, setPhoto } = useStore()

  const showSample = () => {
    setPhoto(null)
    go('reading')
  }

  // Say what was actually measured, rather than one generic sentence for
  // every way a photograph can fail to be a page.
  const reason =
    read?.verdict === 'too-dark'
      ? "It's too dark in there to tell ink from paper."
      : read?.verdict === 'too-busy'
        ? "There's too much going on in this one — we can't separate strokes from everything else."
        : read && read.colour > 0.34
          ? "This doesn't look like a page at all — there are no strokes in it we could lift letters from."
          : 'There\u2019s a page in there, but no strokes we can lift letters from. Most often it\u2019s one of these three.'
  const causes = [
    <>
      The page is upside down or sideways — <span style={{ color: acid.lime }}>rotate and
      re-read</span>, no new photo needed.
    </>,
    <>Pencil this faint reads as paper texture. Shoot again with the light to one side.</>,
    <>It's a screen or a scan of a scan. Photograph the original if you have it.</>,
  ]

  return (
    <Screen>
      <Kicker>First photo read</Kicker>
      <div style={{ padding: '10px 22px 16px' }}>
        <Title size={28}>
          We couldn't find
          <br />
          any handwriting
        </Title>
        <Sub>{reason}</Sub>
      </div>

      <div
        style={{
          margin: '0 18px 14px',
          borderRadius: 22,
          overflow: 'hidden',
          background: '#20221c',
          height: 190,
          position: 'relative',
          flex: 'none',
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt="The page you photographed"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.75 }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 22,
              background: '#efe6d2',
              borderRadius: 5,
              opacity: 0.35,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '10px 14px',
            background: 'linear-gradient(transparent,rgba(0,0,0,.75))',
            font: `400 12px ${font.body}`,
            color: 'rgba(242,244,234,.8)',
          }}
        >
          {read ? `${read.marks.length} marks that could be strokes` : 'your photo'}
        </div>
      </div>

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {causes.map((cause, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(242,244,234,.06)',
              borderRadius: 18,
              padding: '13px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'baseline',
            }}
          >
            <div style={{ font: `400 15px ${font.heading}`, color: acid.lime, width: 14 }}>
              {i + 1}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'rgba(242,244,234,.75)' }}>
              {cause}
            </div>
          </div>
        ))}
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <PrimaryPill onClick={() => go('camera')}>Take another photo</PrimaryPill>
        {/* Only offer routes that exist: with a real photograph there is no
            re-read to run and no letters to mark, so don't draw those doors. */}
        {photo ? (
          <GhostPill onClick={showSample}>See the flow on the sample page</GhostPill>
        ) : (
          <div style={{ display: 'flex', gap: 9 }}>
            <GhostPill onClick={() => go('reading')}>Rotate &amp; re-read</GhostPill>
            <GhostPill onClick={() => go('review')}>Mark letters myself</GhostPill>
          </div>
        )}
      </div>
    </Screen>
  )
}

/** Refused with the evidence shown — and an override, because even hands trip it. */
export function PrintedType() {
  const { go } = useStore()

  return (
    <Screen>
      <Kicker>First photo read</Kicker>
      <div style={{ padding: '10px 22px 16px' }}>
        <Title size={28}>
          This looks like
          <br />
          type, not a hand
        </Title>
        <Sub>
          Every <span style={{ color: acid.violet }}>e</span> on the page is identical, down to the
          pixel. That's a printed face — we'd just be tracing someone else's font.
        </Sub>
      </div>

      <div
        style={{
          margin: '0 18px 14px',
          background: acid.paper,
          borderRadius: 22,
          padding: '18px 20px',
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
          Eight samples of “e”
        </div>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: 44,
                borderRadius: 9,
                background: 'rgba(155,139,255,.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                font: `400 24px ${font.body}`,
                color: acid.noteInk,
              }}
            >
              e
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: '1px dashed rgba(27,29,24,.3)',
            marginTop: 14,
            paddingTop: 12,
            fontSize: 11.5,
            lineHeight: 1.5,
            color: 'rgba(27,29,24,.65)',
          }}
        >
          A handwritten page gives us eight different <em>e</em>s — that variation is what makes the
          font feel alive.
        </div>
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <PrimaryPill onClick={() => go('camera')}>Photograph something handwritten</PrimaryPill>
        <GhostPill onClick={() => go('reading')}>
          It <em>is</em> handwritten — carry on anyway
        </GhostPill>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'rgba(242,244,234,.42)',
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          Very even hands do trip this. Carrying on won't cost you anything.
        </div>
      </div>
    </Screen>
  )
}

/** Declined honestly rather than half-made. */
export function UnsupportedScript() {
  const { go } = useStore()

  const row = (label: string, status: string, tone: string, background: string) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background,
        borderRadius: 16,
        padding: '12px 15px',
        fontSize: 12.5,
      }}
    >
      <span>{label}</span>
      <span style={{ color: tone, fontWeight: 600 }}>{status}</span>
    </div>
  )

  return (
    <Screen>
      <Kicker>First photo read</Kicker>
      <div style={{ padding: '10px 22px 14px' }}>
        <Title size={28}>
          Devanagari —
          <br />
          we're not there yet
        </Title>
        <Sub>
          We read this hand clearly, but joined scripts need conjunct shaping we haven't built.
          Making the font now would produce broken words, so we won't pretend.
        </Sub>
      </div>

      <div
        style={{
          margin: '0 18px 14px',
          background: acid.paper,
          borderRadius: 22,
          padding: 20,
          color: acid.noteInk,
        }}
      >
        <Hand size={30} style={{ display: 'block', lineHeight: 1.45, color: 'rgba(27,29,24,.85)' }}>
          आजी का पत्र
        </Hand>
        <div style={{ fontSize: 11.5, color: 'rgba(27,29,24,.6)', marginTop: 10 }}>
          142 strokes found · 9 base characters
        </div>
      </div>

      <div style={{ margin: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {row('Latin, Greek, Cyrillic', 'ready now', acid.lime, 'rgba(214,242,75,.13)')}
        {row('Devanagari, Arabic, Thai', 'in progress', acid.violet, 'rgba(155,139,255,.14)')}
      </div>

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <PrimaryPill onClick={() => go('library')}>Tell me when Devanagari lands</PrimaryPill>
        <GhostPill onClick={() => go('library')}>Keep the photo in my library</GhostPill>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'rgba(242,244,234,.42)',
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          Your page stays on the device. Nothing was charged.
        </div>
      </div>
    </Screen>
  )
}
