import type { CSSProperties, ReactNode } from 'react'
import { acid, font } from '../lib/theme'

/** The ground every screen stands on. */
export function Screen({
  children,
  background = acid.ground,
  color = acid.ink,
  style,
}: {
  children: ReactNode
  background?: string
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        height: '100%',
        background,
        color,
        display: 'flex',
        flexDirection: 'column',
        padding: '62px 0 34px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Pushes everything after it to the bottom of the screen. */
export const Spacer = () => <div style={{ flex: 1, minHeight: 0 }} />

type PillProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: CSSProperties
  title?: string
}

/** Lime carries every action. */
export function PrimaryPill({ children, onClick, disabled, style, title }: PillProps) {
  return (
    <button
      className="pill pill-primary"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: acid.lime,
        color: acid.onAccent,
        textAlign: 'center',
        font: `400 15px ${font.heading}`,
        padding: '16px 0',
        borderRadius: 999,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function GhostPill({ children, onClick, disabled, style, title }: PillProps) {
  return (
    <button
      className="pill pill-ghost"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        boxShadow: 'inset 0 0 0 1.5px rgba(242,244,234,.22)',
        borderRadius: 999,
        padding: '13px 0',
        fontSize: 13,
        textAlign: 'center',
        width: '100%',
        color: acid.ink,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/** A screen's own title block. */
export function Title({
  children,
  size = 27,
  style,
}: {
  children: ReactNode
  size?: number
  style?: CSSProperties
}) {
  return <div style={{ font: `400 ${size}px/1.06 ${font.heading}`, ...style }}>{children}</div>
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: '6px 22px 0', fontSize: 12.5, color: 'rgba(242,244,234,.5)' }}>
      {children}
    </div>
  )
}

export function Sub({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(242,244,234,.62)', marginTop: 8, ...style }}
    >
      {children}
    </div>
  )
}

/** Warm white is always the artifact. */
export function Paper({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: acid.paper,
        color: acid.noteInk,
        borderRadius: 22,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Handwriting — a script face standing in for the extracted glyphs. */
export function Hand({
  children,
  size = 26,
  style,
}: {
  children: ReactNode
  size?: number
  style?: CSSProperties
}) {
  return (
    <span style={{ fontFamily: font.hand, fontSize: size, lineHeight: 1.5, ...style }}>
      {children}
    </span>
  )
}

export function ProgressBar({ value, tone = acid.lime }: { value: number; tone?: string }) {
  return (
    <div
      style={{
        margin: '0 18px 16px',
        height: 8,
        borderRadius: 999,
        background: 'rgba(242,244,234,.14)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: '100%',
          background: tone,
          transition: 'width 220ms cubic-bezier(.22,1,.36,1)',
        }}
      />
    </div>
  )
}

/** The big number a read reports back with. */
export function Count({
  value,
  tone = acid.lime,
  children,
}: {
  value: ReactNode
  tone?: string
  children: ReactNode
}) {
  return (
    <div style={{ padding: '10px 22px 16px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
      <div style={{ font: `400 64px/0.88 ${font.heading}`, color: tone }}>{value}</div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.35,
          color: 'rgba(242,244,234,.7)',
          paddingBottom: 8,
        }}
      >
        {children}
      </div>
    </div>
  )
}
