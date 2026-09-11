/**
 * The keyboard under the write-on screen.
 *
 * Drawn as the design draws it — three rows, flat keys on a warm grey deck —
 * but the keys are live, because in a browser a phone mock with a dead
 * keyboard is a picture of typing rather than typing.
 */
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export function Keyboard({
  onKey,
  onDelete,
}: {
  onKey: (ch: string) => void
  onDelete: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--keyboard)',
        padding: '9px 5px 26px',
        borderRadius: '0 0 30px 30px',
      }}
    >
      {ROWS.map((row, i) => (
        <div
          key={row}
          style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 7 }}
        >
          {i === 2 ? <button className="key key-wide" aria-label="Shift" /> : null}
          {row.split('').map((ch) => (
            <button key={ch} className="key" onClick={() => onKey(ch)}>
              {ch}
            </button>
          ))}
          {i === 2 ? (
            <button className="key key-wide" aria-label="Delete" onClick={onDelete}>
              ⌫
            </button>
          ) : null}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
        <button
          className="key"
          aria-label="Space"
          onClick={() => onKey(' ')}
          style={{ width: 196 }}
        />
      </div>
    </div>
  )
}
