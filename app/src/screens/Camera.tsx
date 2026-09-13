import type { ReactNode } from 'react'
import { usePhotoPicker } from '../components/PhotoPicker'
import { useCamera } from '../lib/camera'
import { Hand, Screen } from '../components/ui'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

export type Condition = 'clear' | 'glare' | 'blur'

/**
 * Catch it in the camera, not after — a warning before the shutter costs a
 * second, a failure after the read costs the whole attempt. So every advisory
 * here is advisory: the shutter never locks, because someone photographing a
 * fragile letter under bad light may have no better option.
 */
export function Camera({ condition = 'clear' }: { condition?: Condition }) {
  const { go, photo, setPhoto } = useStore()
  const usePage = (file: File) => {
    setPhoto(file)
    go('reading')
  }
  const { inputs, openCamera, openLibrary } = usePhotoPicker(usePage)

  // The live feed runs on the real capture screen only — the glare and blur
  // frames are drawn demonstrations of the advisories.
  const camera = useCamera(condition === 'clear' && !photo)
  const live = camera.state === 'live'

  const shoot = async () => {
    if (!live) {
      // No feed: hand off to the OS camera instead.
      openCamera()
      return
    }
    const frame = await camera.capture()
    if (frame) usePage(frame)
  }

  return (
    <Screen background={condition === 'clear' ? acid.ground : acid.camera}>
      <div
        style={{
          padding: '6px 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: 'rgba(242,244,234,.7)',
        }}
      >
        <button onClick={() => go('purpose')}>Cancel</button>
        <span style={{ color: acid.lime }}>Guides on</span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          margin: '16px 18px',
          borderRadius: 26,
          position: 'relative',
          overflow: 'hidden',
          background:
            condition === 'glare'
              ? 'linear-gradient(150deg,#3a3524,#221f18 55%,#171612)'
              : condition === 'blur'
                ? '#1a1a17'
                : acid.stage,
        }}
      >
        {condition === 'clear' ? (
          photo ? (
            <PhotoFrame url={photo} />
          ) : (
            <LiveFrame videoRef={camera.videoRef} live={live} />
          )
        ) : null}
        {condition === 'glare' ? <GlareFrame /> : null}
        {condition === 'blur' ? <BlurFrame /> : null}
      </div>

      {condition === 'clear' ? (
        camera.state === 'denied' || camera.state === 'unsupported' ? (
          <CameraAdvisory state={camera.state} onRetry={() => void camera.start()} />
        ) : (
          <SteadyHint />
        )
      ) : null}
      {condition === 'glare' ? <GlareAdvisory /> : null}
      {condition === 'blur' ? <BlurAdvisory /> : null}

      <div
        style={{
          padding: '0 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ width: 96, display: 'flex', justifyContent: 'flex-start' }}>
          {condition === 'blur' ? (
            <SideButton onClick={openLibrary}>Photos</SideButton>
          ) : condition === 'glare' ? (
            <SideButton onClick={() => go('reading')}>Shoot anyway</SideButton>
          ) : photo ? (
            <button
              onClick={() => go('reading')}
              aria-label="Use the last shot"
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.3)',
              }}
            >
              <img
                src={photo}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ) : (
            <SideButton onClick={() => go('reading')}>Sample page</SideButton>
          )}
        </div>
        <button
          onClick={() => void shoot()}
          aria-label="Take the photo"
          style={{
            width: 70,
            height: 70,
            borderRadius: 999,
            boxShadow: `inset 0 0 0 3px ${condition === 'blur' ? 'rgba(242,244,234,.35)' : 'rgba(242,244,234,.5)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background:
                condition === 'clear'
                  ? acid.lime
                  : condition === 'blur'
                    ? 'rgba(242,244,234,.35)'
                    : 'rgba(242,244,234,.55)',
              transition: 'background 120ms cubic-bezier(.22,1,.36,1)',
            }}
          />
        </button>
        <div style={{ width: 96, display: 'flex', justifyContent: 'flex-end' }}>
          {condition === 'clear' ? (
            <SideButton onClick={openLibrary}>Photo roll</SideButton>
          ) : (
            <span style={{ fontSize: 12.5, color: 'rgba(242,244,234,.5)' }}>Flash off</span>
          )}
        </div>
      </div>
      {inputs}
    </Screen>
  )
}

function SideButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12.5,
        color: 'rgba(242,244,234,.7)',
        padding: '6px 0',
        transition: 'color 120ms cubic-bezier(.22,1,.36,1)',
      }}
    >
      {children}
    </button>
  )
}

/** What the lens sees, with the framing guide over it. */
function LiveFrame({
  videoRef,
  live,
}: {
  videoRef: React.RefObject<HTMLVideoElement>
  live: boolean
}) {
  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: live ? 1 : 0,
          transition: 'opacity 220ms cubic-bezier(.22,1,.36,1)',
        }}
      />
      {live ? (
        <div
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: 18,
            boxShadow: `0 0 0 2px ${acid.lime}`,
            pointerEvents: 'none',
          }}
        />
      ) : (
        // Until the feed arrives, the drawn page stands in rather than a void.
        <div style={{ position: 'absolute', inset: 0 }}>
          <ClearFrame />
        </div>
      )}
    </>
  )
}

/** Same pattern as the glare and blur advisories: name it, offer the way on. */
function CameraAdvisory({
  state,
  onRetry,
}: {
  state: 'denied' | 'unsupported'
  onRetry: () => void
}) {
  const denied = state === 'denied'
  return (
    <div
      style={{
        margin: '0 18px 14px',
        background: 'rgba(155,139,255,.16)',
        boxShadow: 'inset 0 0 0 1.5px rgba(155,139,255,.5)',
        borderRadius: 22,
        padding: '14px 16px',
      }}
    >
      <div style={{ font: `400 17px/1.15 ${font.heading}`, color: acid.ink }}>
        {denied ? 'No camera access here' : 'No camera on this device'}
      </div>
      <div
        style={{ fontSize: 12.5, lineHeight: 1.45, marginTop: 4, color: 'rgba(242,244,234,.72)' }}
      >
        {denied
          ? 'Allow the camera in your browser settings and try again — or shoot with the phone camera and come back.'
          : 'Take the photo with your phone camera, or pick a page you have already photographed.'}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {denied ? (
          <button
            className="pill pill-primary"
            onClick={onRetry}
            style={{
              background: acid.ink,
              color: acid.onAccent,
              font: `600 12px/1 ${font.body}`,
              padding: '9px 14px',
              borderRadius: 999,
            }}
          >
            Try again
          </button>
        ) : null}
        <div
          style={{
            font: `600 12px/1 ${font.body}`,
            padding: '9px 0',
            color: 'rgba(242,244,234,.55)',
          }}
        >
          The shutter still works — it opens your camera app.
        </div>
      </div>
    </div>
  )
}

/** The page they actually photographed or chose, framed by the guide. */
function PhotoFrame({ url }: { url: string }) {
  return (
    <>
      <img
        src={url}
        alt="The page you photographed"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 14,
          borderRadius: 18,
          boxShadow: `0 0 0 2px ${acid.lime}`,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

const NOTE = (
  <>
    Dearest Ellen,
    <br />
    the pears came in early
    <br />
    this year and the jars
    <br />
    are all full again.
  </>
)

function ClearFrame() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', transform: 'rotate(-1.6deg)' }}>
        <div
          style={{
            width: 270,
            background: '#efe6d2',
            borderRadius: 14,
            padding: '26px 24px',
            boxShadow: '0 18px 40px rgba(0,0,0,.35)',
          }}
        >
          <Hand size={23} style={{ color: 'rgba(27,29,24,.85)', lineHeight: 1.62, display: 'block' }}>
            Grandma's apple cake
            <br />4 apples, peeled &amp; sliced
            <br />a cup of brown sugar
            <br />
            bake until the kitchen
            <br />
            smells like autumn
          </Hand>
        </div>
        {/* the guide is anchored to the card, not to the frame */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 18,
            boxShadow: `0 0 0 2px ${acid.lime}`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -8,
            top: -34,
            background: acid.lime,
            color: acid.onAccent,
            fontSize: 11.5,
            fontWeight: 600,
            padding: '5px 11px',
            borderRadius: 999,
          }}
        >
          5 lines · sharp
        </div>
      </div>
    </div>
  )
}

function GlareFrame() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: '34px 26px',
          background: '#efe6d2',
          borderRadius: 6,
          transform: 'rotate(-1.5deg)',
          boxShadow: '0 18px 40px rgba(0,0,0,.5)',
        }}
      >
        <Hand
          size={21}
          style={{
            display: 'block',
            padding: '26px 22px',
            lineHeight: 1.65,
            color: 'rgba(27,29,24,.82)',
          }}
        >
          {NOTE}
        </Hand>
      </div>
      {/* the window washing out the top-left */}
      <div
        style={{
          position: 'absolute',
          left: -40,
          top: -60,
          width: 300,
          height: 260,
          background: 'radial-gradient(closest-side,rgba(255,255,255,.72),rgba(255,255,255,0))',
          filter: 'blur(6px)',
        }}
      />
      {/* located on the page, not announced in the abstract */}
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 34,
          width: 150,
          height: 118,
          borderRadius: 20,
          boxShadow: `inset 0 0 0 2.5px ${acid.lime}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 44,
          top: 160,
          background: acid.lime,
          color: acid.onAccent,
          font: `600 11px/1 ${font.body}`,
          padding: '6px 10px',
          borderRadius: 999,
        }}
      >
        glare here
      </div>
    </>
  )
}

function BlurFrame() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: '30px 24px',
          background: '#e6ddca',
          borderRadius: 6,
          filter: 'blur(3.4px)',
          transform: 'rotate(1deg)',
        }}
      >
        <Hand
          size={22}
          style={{
            display: 'block',
            padding: '24px 20px',
            lineHeight: 1.6,
            color: 'rgba(27,29,24,.8)',
          }}
        >
          shopping — Tuesday
          <br />
          flour, yeast, two lemons
          <br />
          ring the butcher back
        </Hand>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '16px 18px',
          background: 'linear-gradient(transparent,rgba(0,0,0,.8))',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            fontSize: 12,
            color: 'rgba(242,244,234,.75)',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: acid.violet }} />
          Hold still — focus hunting
        </div>
      </div>
    </>
  )
}

function SteadyHint() {
  return (
    <div
      style={{
        margin: '0 18px 14px',
        background: 'rgba(242,244,234,.08)',
        boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.16)',
        borderRadius: 22,
        padding: '13px 16px',
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 3 }}>
        Hold steady — flatten the page
      </div>
      <div style={{ fontSize: 12, color: 'rgba(242,244,234,.62)' }}>
        Daylight, no flash. Cursive is fine; we separate joined letters.
      </div>
    </div>
  )
}

function GlareAdvisory() {
  return (
    <div
      style={{
        margin: '0 18px 14px',
        background: acid.lime,
        color: acid.onAccent,
        borderRadius: 22,
        padding: '14px 16px',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          flex: 'none',
          borderRadius: 999,
          background: acid.onAccent,
          color: acid.lime,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          font: `600 15px ${font.body}`,
        }}
      >
        !
      </div>
      <div>
        <div style={{ font: `400 17px/1.1 ${font.heading}` }}>
          A window is washing out the top-left
        </div>
        <div
          style={{
            fontSize: 12.5,
            lineHeight: 1.45,
            marginTop: 4,
            color: 'rgba(17,19,16,.78)',
          }}
        >
          Four lines are unreadable in there. Turn the page 90° or step out of the light — we'll
          tell you when it clears.
        </div>
      </div>
    </div>
  )
}

function BlurAdvisory() {
  return (
    <div
      style={{
        margin: '0 18px 14px',
        background: 'rgba(155,139,255,.16)',
        boxShadow: 'inset 0 0 0 1.5px rgba(155,139,255,.5)',
        borderRadius: 22,
        padding: '14px 16px',
      }}
    >
      <div style={{ font: `400 17px/1.15 ${font.heading}`, color: acid.ink }}>
        Too soft to trace strokes
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.45,
          marginTop: 4,
          color: 'rgba(242,244,234,.72)',
        }}
      >
        Pull back to about a forearm's length and let the focus settle. Thin pen lines need the
        sharpness more than print does.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          className="pill pill-primary"
          style={{
            background: acid.ink,
            color: acid.onAccent,
            font: `600 12px/1 ${font.body}`,
            padding: '9px 14px',
            borderRadius: 999,
          }}
        >
          Steady me — 3s timer
        </button>
        <button
          className="pill pill-ghost"
          style={{
            boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.28)',
            font: `600 12px/1 ${font.body}`,
            padding: '9px 14px',
            borderRadius: 999,
          }}
        >
          Prop-up tips
        </button>
      </div>
    </div>
  )
}
