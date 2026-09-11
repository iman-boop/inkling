import type { CSSProperties } from 'react'
import type { Glyph, GlyphState } from '../lib/font-data'
import { font } from '../lib/theme'

const stateClass: Record<GlyphState, string> = {
  clean: 'glyph-clean',
  shaky: 'glyph-shaky',
  missing: 'glyph-missing',
}

export function GlyphCell({
  ch,
  state,
  size = 17,
  selected = false,
  wanted = false,
  onClick,
  style,
}: {
  ch: string
  state: GlyphState
  size?: number
  selected?: boolean
  /** The gaps screen asks for these letters, so lime ink reads as instruction. */
  wanted?: boolean
  onClick?: () => void
  style?: CSSProperties
}) {
  const className = [
    'glyph-cell',
    wanted ? 'glyph-wanted' : stateClass[state],
    selected ? 'glyph-selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const ink = (
    <span style={{ fontFamily: font.hand, lineHeight: 1, fontSize: size }}>{ch}</span>
  )

  if (!onClick) {
    return (
      <div className={className} style={style}>
        {ink}
      </div>
    )
  }

  return (
    <button
      className={className}
      style={style}
      onClick={onClick}
      aria-label={`${ch} — ${wanted ? 'still to write' : state}`}
    >
      {ink}
    </button>
  )
}

export function GlyphGrid({
  glyphs,
  columns = 9,
  size = 17,
  gap = 5,
  selected,
  onSelect,
  style,
}: {
  glyphs: Glyph[]
  columns?: number
  size?: number
  gap?: number
  selected?: string | null
  onSelect?: (glyph: Glyph) => void
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {glyphs.map((g) => (
        <GlyphCell
          key={g.ch}
          ch={g.ch}
          state={g.state}
          size={size}
          selected={selected === g.ch}
          onClick={onSelect ? () => onSelect(g) : undefined}
        />
      ))}
    </div>
  )
}

/** clean / shaky / missing, counted off the same table the grid draws. */
export function StateLegend({
  clean,
  shaky,
  missing,
}: {
  clean: number
  shaky: number
  missing: number
}) {
  const swatch = (background: string) => (
    <i style={{ width: 9, height: 9, borderRadius: 3, background, display: 'block' }} />
  )
  const item = (node: React.ReactNode, label: string) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {node}
      {label}
    </span>
  )
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11.5 }}>
      {item(swatch('#f2f4ea'), `clean ${clean}`)}
      {item(swatch('#d6f24b'), `shaky ${shaky}`)}
      {item(swatch('rgba(242,244,234,.28)'), `missing ${missing}`)}
    </div>
  )
}
