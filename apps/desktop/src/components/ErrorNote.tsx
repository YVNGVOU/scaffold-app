import type { FriendlyError } from '../lib/friendlyError';

/**
 * Renders a friendly error summary with a "Details" disclosure holding the
 * raw error text (TASK-027). Dark SINVAUX/Scaffold visual language,
 * --sv-* tokens only, no rounded corners, no new UI component libraries —
 * plain <details>/<summary>, same as the rest of this app's plain-element
 * styling approach.
 */
export function ErrorNote({ error }: { error: FriendlyError }) {
  return (
    <div style={{ color: 'var(--sv-burgundy)', fontSize: 12 }}>
      <div>{error.summary}</div>
      {error.raw && error.raw !== error.summary && (
        <details style={{ marginTop: 4, color: 'var(--sv-ink-soft)' }}>
          <summary style={{ cursor: 'pointer', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Details
          </summary>
          <pre
            style={{
              margin: '4px 0 0',
              padding: 'var(--sv-space-2)',
              background: 'var(--sv-ivory-dim)',
              border: '1px solid var(--sv-hairline)',
              fontFamily: 'var(--sv-font-mono)',
              fontSize: 10,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.raw}
          </pre>
        </details>
      )}
    </div>
  );
}
