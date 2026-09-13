import { useEffect, useRef, useState } from 'react'
import { Ink } from '../components/Ink'
import { GhostPill, Kicker, PrimaryPill, Screen, Spacer, Sub } from '../components/ui'
import { marksForLetter, namedLetters } from '../lib/cluster'
import { buildFont, saveFont, type BuiltFont } from '../lib/font-build'
import { acid, font } from '../lib/theme'
import { useStore } from '../state/store'

/**
 * The file.
 *
 * Everything before this was the app showing you your own page back. This is
 * the part that leaves: each named letter traced from the photograph into an
 * outline, set on the line it was written on, and assembled into a real .otf.
 * The specimen below the button is rendered *in the font that was just built*,
 * loaded into the page — so what you see before saving is the file itself, not
 * a picture of it.
 */
const SPECIMEN = 'the quick brown fox'

export function ExportFont() {
  const { photo, read, clusters, fontName, setFontName, go } = useStore()
  const [state, setState] = useState<'idle' | 'building' | 'ready' | 'error'>('idle')
  const [built, setBuilt] = useState<BuiltFont | null>(null)
  const [family, setFamily] = useState('')
  const loaded = useRef<FontFace | null>(null)

  const named = namedLetters(clusters)

  useEffect(
    () => () => {
      if (loaded.current) document.fonts.delete(loaded.current)
    },
    [],
  )

  const make = async () => {
    if (!photo || !read) return
    setState('building')
    try {
      const result = await buildFont(photo, read, clusters, fontName)
      const handle = `Inkling-${Date.now()}`
      const face = new FontFace(handle, result.buffer)
      await face.load()
      document.fonts.add(face)
      if (loaded.current) document.fonts.delete(loaded.current)
      loaded.current = face
      setFamily(handle)
      setBuilt(result)
      setState('ready')
    } catch {
      setState('error')
    }
  }

  if (!photo || !read) return null

  return (
    <Screen>
      <Kicker>Your font</Kicker>

      <div style={{ padding: '8px 22px 14px' }}>
        <input
          value={fontName}
          onChange={(event) => setFontName(event.target.value)}
          aria-label="Font name"
          style={{
            width: '100%',
            background: 'transparent',
            border: 0,
            outline: 'none',
            font: `400 28px/1.06 ${font.heading}`,
            color: acid.ink,
            padding: 0,
          }}
        />
        <Sub>
          {named.length} letter{named.length === 1 ? '' : 's'} named ·{' '}
          {named.length ? named.join(' ') : 'nothing yet'}
        </Sub>
      </div>

      {state === 'ready' && built ? (
        <div
          style={{
            margin: '0 18px 14px',
            background: acid.paper,
            borderRadius: 22,
            padding: '20px',
            color: acid.noteInk,
          }}
        >
          <div
            style={{
              font: `600 10.5px/1 ${font.body}`,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'rgba(27,29,24,.5)',
              marginBottom: 12,
            }}
          >
            Set in the font you just made
          </div>
          <div style={{ fontFamily: `"${family}", monospace`, fontSize: 40, lineHeight: 1.3 }}>
            {SPECIMEN}
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
            {built.letters.length} glyphs · {Math.round(built.buffer.byteLength / 1024)} KB.
            Letters you haven't named fall back to another face here, and are simply absent from
            the file.
            {built.failed.length ? ` ${built.failed.join(' ')} couldn't be traced.` : ''}
          </div>
        </div>
      ) : (
        <div
          style={{
            margin: '0 18px 14px',
            background: 'rgba(242,244,234,.06)',
            borderRadius: 22,
            padding: '18px 20px',
            minHeight: 120,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              minHeight: 44,
            }}
          >
            {named.slice(0, 14).map((letter) => {
              const marks = marksForLetter(clusters, letter)
              return (
                <Ink
                  key={letter}
                  mark={read.marks[marks[0]]}
                  photo={photo}
                  aspect={read.aspect}
                  height={36}
                  style={{ borderRadius: 5, backgroundColor: '#fff' }}
                />
              )
            })}
          </div>
          <div
            style={{
              fontSize: 12.5,
              lineHeight: 1.5,
              color: 'rgba(242,244,234,.7)',
              marginTop: 14,
            }}
          >
            Each of these gets traced into an outline and set on the line you wrote it on — so a{' '}
            <em>g</em> hangs below the line because yours did, not because a rule says so.
          </div>
        </div>
      )}

      <Spacer />

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {state === 'ready' && built ? (
          <>
            <PrimaryPill onClick={() => saveFont(built.buffer, fontName)}>
              Save {fontName || 'My Hand'}.otf
            </PrimaryPill>
            <div style={{ display: 'flex', gap: 9 }}>
              <GhostPill onClick={() => go('label')}>Name more letters</GhostPill>
              <GhostPill onClick={() => void make()}>Rebuild</GhostPill>
            </div>
          </>
        ) : (
          <>
            <PrimaryPill
              onClick={() => void make()}
              disabled={state === 'building' || named.length === 0}
            >
              {state === 'building'
                ? 'Tracing your letters…'
                : named.length === 0
                  ? 'Name a letter first'
                  : `Make the font file`}
            </PrimaryPill>
            <GhostPill onClick={() => go('label')}>Name more letters</GhostPill>
          </>
        )}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: state === 'error' ? acid.lime : 'rgba(242,244,234,.42)',
            lineHeight: 1.5,
            marginTop: 2,
          }}
        >
          {state === 'error'
            ? "That didn't work. Try rebuilding — if it keeps failing, the marks may be too small to trace."
            : 'Built on this device from your photo. Nothing was uploaded.'}
        </div>
      </div>
    </Screen>
  )
}
