import type { RequirementItem } from '@lucid/schema';
import { formatSource } from './format';

/**
 * Progressive disclosure for an item's confidence/risk/evidence metadata
 * (TASK-012 requirement 5). Uses a native <details>/<summary> — plain HTML,
 * no library — so the data stays fully reachable (click to reveal) without
 * rendering as three lines of small gray text under every card by default.
 */
export function MetaDisclosure({ item }: { item: RequirementItem }) {
  return (
    <details style={{ marginTop: 2 }}>
      <summary
        style={{
          fontSize: 10,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--sv-ink-soft)',
          cursor: 'pointer',
        }}
      >
        details
      </summary>
      <div
        style={{
          fontSize: 11,
          color: 'var(--sv-ink-soft)',
          marginTop: 4,
          paddingLeft: 'var(--sv-space-2)',
          borderLeft: '1px solid var(--sv-hairline)',
        }}
      >
        <div>source: {formatSource(item.source)}</div>
        <div>
          confidence: {(item.confidence * 100).toFixed(0)}%
          {item.risk ? ` · risk: ${item.risk}` : ''}
        </div>
        <div>status: {item.status}</div>
        {item.evidence.length > 0 && <div>evidence: {item.evidence.join('; ')}</div>}
      </div>
    </details>
  );
}
