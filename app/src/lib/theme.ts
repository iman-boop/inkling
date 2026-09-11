import type { CSSProperties } from 'react'

/**
 * Acid Bloom, in TypeScript.
 *
 * The palette is declared once in app.css as custom properties; these are the
 * same values for the places that need a real string (canvas-style animation,
 * colour interpolation, inline `box-shadow` composition).
 */
export const acid = {
  ground: '#111310',
  stage: '#1e2119',
  camera: '#0b0c0a',
  ink: '#f2f4ea',
  paper: '#f2f4ea',
  noteInk: '#1b1d18',
  lime: '#d6f24b',
  limeEdge: '#b4d420',
  violet: '#9b8bff',
  violetDeep: '#6c5ce7',
  violetInk: '#4c3fc0',
  onAccent: '#111310',
  keyboard: '#dcdfd4',
  sub: 'rgba(242,244,234,.55)',
  surface: 'rgba(242,244,234,.10)',
  hairline: 'rgba(242,244,234,.22)',
} as const

export const font = {
  heading: 'var(--font-heading)',
  body: 'var(--font-body)',
  hand: 'var(--font-hand)',
} as const

/** A hairline drawn as a shadow, the way the prototype draws every border. */
export const edge = (color: string, width = 1.5) => `inset 0 0 0 ${width}px ${color}`

/** Screen padding shared by every screen inside the device frame. */
export const screen: CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: '62px 0 34px',
  background: acid.ground,
  color: acid.ink,
}
