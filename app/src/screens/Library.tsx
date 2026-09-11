import { Hand, Screen } from '../components/ui'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * Library & export.
 *
 * The *partial* badge follows the font in here and onto the export rows, so a
 * font with invented letters can never be quietly sold as complete.
 */
export function Library() {
  const { fontName, stats, purchased, go, reset } = useStore()
  const partial = stats.missing > 0

  return (
    <Screen>
      <div
        style={{
          padding: '6px 22px 14px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ font: `400 27px/1.05 ${font.heading}` }}>My fonts</div>
          <div style={{ fontSize: 12.5, color: 'rgba(242,244,234,.55)', marginTop: 3 }}>
            3 faces · 1 drying
          </div>
        </div>
        <button
          onClick={reset}
          aria-label="Start another font"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: acid.lime,
            color: acid.onAccent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            lineHeight: 0,
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            background: acid.paper,
            color: acid.noteInk,
            borderRadius: 28,
            padding: '18px 20px',
            boxShadow: '0 6px 18px rgba(0,0,0,.16)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ font: `400 19px ${font.heading}` }}>{fontName}</div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                background: partial ? acid.violet : acid.lime,
                color: acid.onAccent,
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              {partial ? `Partial · ${stats.found}/${stats.total}` : purchased ? 'Installed' : 'Ready'}
            </div>
          </div>
          <Hand size={31} style={{ display: 'block', margin: '10px 0 6px', lineHeight: 1.15 }}>
            Handwritten, at last
          </Hand>
          <div style={{ fontSize: 11.5, color: 'rgba(27,29,24,.65)' }}>
            {stats.found} glyphs · from {partial ? 'one photo' : 'two photos'} · 12 Sept
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              className="pill pill-primary"
              onClick={() => go(purchased ? 'library' : 'paywall')}
              style={{
                flex: 1,
                background: acid.lime,
                color: acid.onAccent,
                textAlign: 'center',
                font: `400 13px ${font.heading}`,
                padding: '10px 0',
                borderRadius: 999,
              }}
            >
              Export .otf
            </button>
            <button
              className="pill"
              style={{
                flex: 1,
                boxShadow: 'inset 0 0 0 1px rgba(27,29,24,.22)',
                textAlign: 'center',
                font: `400 13px ${font.heading}`,
                padding: '10px 0',
                borderRadius: 999,
              }}
            >
              Share
            </button>
          </div>
        </div>

        <SubCard title="Dad's Letters" meta="41/52" specimen="still drying — 11 to go" />
        <SubCard title="Studio Signature" meta="brand kit" specimen="licensed to 4 seats" />

        <ExportRow
          chip="OTF"
          chipStyle={{ background: 'rgba(214,242,75,.18)', color: acid.lime }}
          title="Desktop font"
          meta=".otf + .ttf · Word, Figma, InDesign"
          action="Save"
        />
        <ExportRow
          chip="WEB"
          chipStyle={{ background: 'rgba(155,139,255,.2)', color: acid.violet }}
          title="Web kit"
          meta="woff2 + CSS snippet"
          action="Copy"
        />
        <ExportRow
          chip="iOS"
          chipStyle={{ background: 'rgba(242,244,234,.12)', color: acid.ink }}
          title="Install on this iPhone"
          meta="Use it in Notes, Mail, Pages"
          action={purchased ? 'Install' : 'Unlock'}
        />

        <div
          style={{
            marginTop: 6,
            background: 'rgba(214,242,75,.12)',
            boxShadow: 'inset 0 0 0 1.5px rgba(214,242,75,.35)',
            borderRadius: 24,
            padding: '16px 18px',
          }}
        >
          <div style={{ font: `400 17px ${font.heading}`, color: acid.lime, marginBottom: 5 }}>
            Brand licence
          </div>
          <div style={{ fontSize: 12, color: 'rgba(242,244,234,.65)', lineHeight: 1.5 }}>
            Founder's hand as a company face — seats for your team, plus a signed provenance sheet
            for the archive.
          </div>
        </div>
      </div>
    </Screen>
  )
}

function SubCard({ title, meta, specimen }: { title: string; meta: string; specimen: string }) {
  return (
    <div style={{ background: acid.surface, borderRadius: 24, padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ font: `400 17px ${font.heading}` }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(242,244,234,.55)' }}>{meta}</div>
      </div>
      <Hand size={24} style={{ display: 'block', marginTop: 4, color: 'rgba(242,244,234,.7)' }}>
        {specimen}
      </Hand>
    </div>
  )
}

function ExportRow({
  chip,
  chipStyle,
  title,
  meta,
  action,
}: {
  chip: string
  chipStyle: React.CSSProperties
  title: string
  meta: string
  action: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: acid.surface,
        borderRadius: 20,
        padding: '13px 16px',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          ...chipStyle,
        }}
      >
        {chip}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(242,244,234,.55)' }}>{meta}</div>
      </div>
      <button style={{ fontSize: 12.5, color: acid.lime, fontWeight: 600 }}>{action}</button>
    </div>
  )
}
