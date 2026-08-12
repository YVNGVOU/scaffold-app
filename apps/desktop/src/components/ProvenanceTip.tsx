import type { ReactNode } from 'react';
import type { RequirementItem } from '@lucid/schema';
import { formatSource } from './format';

/**
 * Lightweight hover/focus tooltip (TASK-028) showing a one-line
 * source + confidence (+ risk) summary for a requirement item, so the
 * user gets an at-a-glance answer without clicking into the full
 * MetaDisclosure detail. Pure CSS visibility (:hover/:focus-within in
 * theme.css's .sv-tip / .sv-tip-bubble) — no JS state, no new dependency.
 * Does not replace MetaDisclosure; the two are complementary.
 */
export function ProvenanceTip({ item, children }: { item: RequirementItem; children: ReactNode }) {
  const label = `${formatSource(item.source)} · ${(item.confidence * 100).toFixed(0)}%${
    item.risk ? ` · ${item.risk} risk` : ''
  }`;
  return (
    <span className="sv-tip" tabIndex={0}>
      {children}
      <span className="sv-tip-bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}
