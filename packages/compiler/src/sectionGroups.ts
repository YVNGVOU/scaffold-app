/**
 * Canonical prompt-architecture groups, per the full desktop-app UI/UX spec's
 * Architecture Panel tree (Objective / Role / Context / Constraints /
 * Process / Requirements / Examples / Output Format / Evaluation).
 *
 * This is the single source of truth for section ORDER, shared by both the
 * desktop app's on-screen Architecture Panel/CompiledOutput and
 * `formatAsMarkdown`'s export — reordering in the UI genuinely changes the
 * exported prompt text, not just the screen. `examples`/`evaluation` have no
 * backing CompiledPrompt field yet (no specialist ever populates them), so
 * they're listed honestly as always-empty rather than faked.
 */
export type SectionGroupKey =
  | 'objective'
  | 'role'
  | 'context'
  | 'constraints'
  | 'process'
  | 'requirements'
  | 'examples'
  | 'outputFormat'
  | 'evaluation';

export interface SectionGroupMeta {
  key: SectionGroupKey;
  label: string;
  /** Whether any CompiledPrompt field currently ever populates this group. */
  hasBackingData: boolean;
}

export const SECTION_GROUPS: SectionGroupMeta[] = [
  { key: 'objective', label: 'Objective', hasBackingData: true },
  { key: 'role', label: 'Role', hasBackingData: true },
  { key: 'context', label: 'Context', hasBackingData: true },
  { key: 'constraints', label: 'Constraints', hasBackingData: true },
  { key: 'process', label: 'Process', hasBackingData: true },
  { key: 'requirements', label: 'Requirements', hasBackingData: true },
  { key: 'examples', label: 'Examples', hasBackingData: false },
  { key: 'outputFormat', label: 'Output Format', hasBackingData: true },
  { key: 'evaluation', label: 'Evaluation', hasBackingData: false },
];

export const DEFAULT_SECTION_GROUP_ORDER: SectionGroupKey[] = SECTION_GROUPS.map((g) => g.key);

/** Validates and completes a possibly-stale persisted order (e.g. from an
 * older app version with fewer groups) — unknown keys are dropped, missing
 * known keys are appended in default order, so a corrupt/partial saved order
 * can never hide a whole section. */
export function normalizeSectionGroupOrder(order: string[] | null | undefined): SectionGroupKey[] {
  const known = new Set(DEFAULT_SECTION_GROUP_ORDER);
  const seen = new Set<string>();
  const result: SectionGroupKey[] = [];
  for (const key of order ?? []) {
    if (known.has(key as SectionGroupKey) && !seen.has(key)) {
      result.push(key as SectionGroupKey);
      seen.add(key);
    }
  }
  for (const key of DEFAULT_SECTION_GROUP_ORDER) {
    if (!seen.has(key)) result.push(key);
  }
  return result;
}
