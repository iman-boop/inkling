import type { ReviewMode } from '../state/store'

const MODES: { id: ReviewMode; label: string }[] = [
  { id: 'in-place', label: 'In place' },
  { id: 'sheet', label: 'Sheet' },
  { id: 'one-by-one', label: 'One by one' },
]

/**
 * Three modes of one screen, not three candidates. Switching is free and never
 * loses a correction — every mode writes to the same glyph table.
 */
export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: ReviewMode
  onChange: (mode: ReviewMode) => void
}) {
  return (
    <div className="mode-switch" role="group" aria-label="Review mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          className="mode-opt"
          aria-pressed={mode === m.id}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
