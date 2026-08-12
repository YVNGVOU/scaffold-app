// Shared presentation helpers for CompiledOutput/DecisionsPanel — pure
// formatting/grouping utilities, no data-flow or persistence logic (kept out
// of App.tsx per TASK-012 scope).

const SOURCE_LABELS: Record<string, string> = {
  'architect-specialist': 'Architect',
  'technical-specialist': 'Technical',
  'ux-specialist': 'UX',
  'security-specialist': 'Security',
  'creative-specialist': 'Creative',
  'qa-specialist': 'QA',
  'critique-engine': 'Critique',
  'conflict-engine': 'Conflict',
  'user-input': 'User Input',
  'ambiguity-checklist': 'Ambiguity Checklist',
};

/** Human-readable label for a RequirementItem/ArchitectureNote `source` string. */
export function formatSource(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  // Fall back to a title-cased de-hyphenation for any source not in the map
  // above, so a future specialist/source never renders as a raw slug.
  return source
    .split('-')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Groups an array of items sharing a `source` field, preserving first-seen order. */
export function groupBySource<T extends { source: string }>(items: T[]): Array<{ source: string; items: T[] }> {
  const order: string[] = [];
  const map = new Map<string, T[]>();
  for (const it of items) {
    if (!map.has(it.source)) {
      map.set(it.source, []);
      order.push(it.source);
    }
    map.get(it.source)!.push(it);
  }
  return order.map((source) => ({ source, items: map.get(source)! }));
}
