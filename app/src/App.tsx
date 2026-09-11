import { useEffect, type ReactNode } from 'react'
import { IOSDevice } from './ios/IOSDevice'
import { StoreProvider, useStore, type ScreenId } from './state/store'
import { Camera } from './screens/Camera'
import { Gaps } from './screens/Gaps'
import { Library } from './screens/Library'
import { Onboarding } from './screens/Onboarding'
import { PartialRead } from './screens/PartialRead'
import { Paywall } from './screens/Paywall'
import { Preview } from './screens/Preview'
import { Purpose } from './screens/Purpose'
import { Reading } from './screens/Reading'
import { Resnap } from './screens/Resnap'
import { Review } from './screens/Review'
import { NoHandwriting, PrintedType, UnsupportedScript } from './screens/errors/AfterTheRead'

interface Entry {
  id: ScreenId
  label: string
  /** Which frame in the design bundle this screen comes from. */
  ref: string
  group: string
  caption: string
  /** Screens on a warm-white ground need the dark status bar and indicator. */
  light?: boolean
  render: () => ReactNode
}

const SCREENS: Entry[] = [
  {
    id: 'onboarding',
    label: 'Value prop',
    ref: '6a',
    group: 'Onboarding',
    caption: 'The value prop leads on the artifact, not on the technology.',
    render: () => <Onboarding />,
  },
  {
    id: 'purpose',
    label: 'What are you turning into a font?',
    ref: '6a',
    group: 'Onboarding',
    caption: 'Sets which review mode opens by default. It never asks anyone to pick a persona.',
    render: () => <Purpose />,
  },
  {
    id: 'camera',
    label: 'Capture',
    ref: '4b · 7a',
    group: 'Capture',
    caption: 'Guidance before the shutter, anchored to the page rather than announced in the abstract.',
    render: () => <Camera condition="clear" />,
  },
  {
    id: 'camera-glare',
    label: 'Capture · glare',
    ref: '7a',
    group: 'Capture',
    caption: 'Glare is located on the page. The shutter stays live — "Shoot anyway" is always there.',
    render: () => <Camera condition="glare" />,
  },
  {
    id: 'camera-blur',
    label: 'Capture · blur',
    ref: '7a',
    group: 'Capture',
    caption: 'Blur names the fix and offers a timer. Advisory, never blocking.',
    render: () => <Camera condition="blur" />,
  },
  {
    id: 'reading',
    label: 'Reading your page',
    ref: '8a',
    group: 'Read & review',
    caption:
      'The lift, live: sheen → pluck → arc → springy landing, confidence colour after the glyph. Tap to skip.',
    render: () => <Reading />,
  },
  {
    id: 'review',
    label: 'Review · three modes',
    ref: '5a–5c',
    group: 'Read & review',
    caption:
      'One screen, three modes. Switching is free and never loses a correction — they all write to the same glyph table.',
    render: () => <Review />,
  },
  {
    id: 'gaps',
    label: 'Fill the gaps',
    ref: '6b',
    group: 'Read & review',
    caption: 'The missing letters use the lime "needs you" state, because here they are an instruction.',
    render: () => <Gaps />,
  },
  {
    id: 'resnap',
    label: 'Re-snap',
    ref: '6b',
    group: 'Read & review',
    caption: 'The set closes — and the letters that came back shaky are flagged, not celebrated.',
    render: () => <Resnap />,
  },
  {
    id: 'preview',
    label: 'Type-to-test',
    ref: '8b · 4b',
    group: 'Finish',
    light: true,
    caption:
      'The write-on is pen-paced, not UI-paced. It dies at the first keystroke — type on the keys or your own keyboard.',
    render: () => <Preview />,
  },
  {
    id: 'paywall',
    label: 'Paywall',
    ref: '6a',
    group: 'Finish',
    caption: 'Pricing at the moment of export, one-off by default.',
    render: () => <Paywall />,
  },
  {
    id: 'library',
    label: 'Library & export',
    ref: '4b · 7c',
    group: 'Finish',
    caption: 'The partial badge follows the font in here, so it can never be sold as complete.',
    render: () => <Library />,
  },
  {
    id: 'partial-read',
    label: 'Partial read',
    ref: '7c',
    group: "When the photo doesn't work",
    caption: 'Nine letters is a decision screen, not an error.',
    render: () => <PartialRead />,
  },
  {
    id: 'no-handwriting',
    label: 'No handwriting found',
    ref: '7b',
    group: "When the photo doesn't work",
    caption: 'Three named causes, one of which needs no new photo.',
    render: () => <NoHandwriting />,
  },
  {
    id: 'printed-type',
    label: 'Printed type',
    ref: '7b',
    group: "When the photo doesn't work",
    caption: 'Refused with the evidence shown — and an override, because very even hands trip it.',
    render: () => <PrintedType />,
  },
  {
    id: 'unsupported-script',
    label: 'Unsupported script',
    ref: '7b',
    group: "When the photo doesn't work",
    caption: 'Declined honestly rather than half-made. Nothing was charged.',
    render: () => <UnsupportedScript />,
  },
]

const GROUPS = [...new Set(SCREENS.map((s) => s.group))]

function isScreenId(value: string): value is ScreenId {
  return SCREENS.some((s) => s.id === value)
}

export default function App() {
  const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  const initial: ScreenId = isScreenId(hash) ? hash : 'onboarding'

  return (
    <StoreProvider initialScreen={initial}>
      <Workbench />
    </StoreProvider>
  )
}

/**
 * The bench around the phone is not part of the app — it is here so the flow
 * can be walked screen by screen the way the design bundle laid it out.
 */
function Workbench() {
  const { screen, go, back, canGoBack, reset } = useStore()
  const entry = SCREENS.find((s) => s.id === screen) ?? SCREENS[0]

  useEffect(() => {
    window.location.hash = screen
  }, [screen])

  // So the browser's own back button, and a pasted link, move the phone.
  useEffect(() => {
    const onHashChange = () => {
      const id = window.location.hash.slice(1)
      if (isScreenId(id) && id !== screen) go(id)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [screen, go])

  return (
    <div className="bench">
      <div className="bench-rail">
        <h1 className="bench-title">Inkling</h1>
        <p className="bench-note">
          A photo of your handwriting becomes a real typeface. Acid Bloom: lime means <em>needs
          you</em>, violet means <em>machine confidence</em>, warm white is always the artifact.
        </p>

        {GROUPS.map((group) => (
          <div key={group}>
            <div className="bench-group">{group}</div>
            <div className="bench-links">
              {SCREENS.filter((s) => s.group === group).map((s) => (
                <button
                  key={s.id}
                  className="bench-link"
                  aria-current={s.id === screen}
                  onClick={() => go(s.id)}
                >
                  {s.label}
                  <small>{s.ref}</small>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button
            className="bench-link"
            onClick={back}
            disabled={!canGoBack}
            style={{ opacity: canGoBack ? 1 : 0.4, width: 'auto' }}
          >
            ← Back
          </button>
          <button className="bench-link" onClick={reset} style={{ width: 'auto' }}>
            Start over
          </button>
        </div>
      </div>

      <div className="bench-stage">
        <div className="bench-slot">
          <div className="bench-device">
            <IOSDevice dark={!entry.light}>
              {/* Remounting per screen keeps each screen's own motion honest:
                  the lift plays once per page, not once per app. */}
              <div key={entry.id} style={{ height: '100%' }}>
                {entry.render()}
              </div>
            </IOSDevice>
          </div>
        </div>
        <p className="bench-caption">{entry.caption}</p>
      </div>
    </div>
  )
}
