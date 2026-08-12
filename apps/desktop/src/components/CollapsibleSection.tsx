import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  count: number;
  defaultOpen?: boolean;
  accentColor?: string;
  children: ReactNode;
}

/**
 * A plain hairline-and-type collapsible section header, built from a
 * <button> + conditional render rather than <details>/<summary> so the
 * disclosure triangle and label can match the SINVAUX label typography
 * exactly (no default browser marker/summary styling to fight). No new
 * dependency, no rounded corners, no shadow — a toggle is the only
 * interactive affordance added.
 */
export function CollapsibleSection({ title, count, defaultOpen = true, accentColor, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div style={{ marginBottom: 'var(--sv-space-5)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sv-label"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          textAlign: 'left',
          border: 'none',
          background: 'transparent',
          padding: 0,
          marginBottom: open ? 'var(--sv-space-2)' : 0,
          color: accentColor ?? 'var(--sv-ink-soft)',
          letterSpacing: '0.12em',
        }}
      >
        <span style={{ display: 'inline-block', width: 10, fontFamily: 'var(--sv-font-mono)' }}>
          {open ? '▾' : '▸'}
        </span>
        <span>
          {title} ({count})
        </span>
      </button>
      {open && children}
    </div>
  );
}
