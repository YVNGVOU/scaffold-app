import type { CompiledPrompt, RequirementItem } from '@lucid/schema';

/**
 * TASK-082: pure, UI-independent summary of a single mode's `CompiledPrompt`
 * for the side-by-side "Compare Modes" view. Deliberately produces counts
 * only, not the full requirement text — the comparison view exists to show
 * relative depth across QUICK/ARCHITECT/MASTER at a glance, not to duplicate
 * `CompiledOutput`'s full per-item rendering (three of those side by side
 * would be far too dense, per the brief).
 */
export interface ComparisonRow {
  /** Count of items in each CompiledPrompt requirement-category array. */
  categoryCounts: {
    userRequirements: number;
    nonNegotiables: number;
    preferences: number;
    constraints: number;
    assumptions: number;
    functionalRequirements: number;
  };
  /** Total requirement items across all six categories above. */
  totalRequirements: number;
  /** Whether `compiled.architecture` has any notes, and how many. */
  architectureNoteCount: number;
  hasArchitectureNotes: boolean;
  /**
   * Count of items whose `source` is `'critique-engine'` or
   * `'conflict-engine'` (see `pipeline/stages/critique.ts` /
   * `conflict.ts`) across all six category arrays — QUICK/ARCHITECT never
   * run those stages so this is honestly 0 for them, not fabricated; MASTER
   * is the only mode where this is normally nonzero, but the same real scan
   * is run for all three modes rather than special-casing MASTER.
   */
  critiqueConflictFindingCount: number;
  hasCritiqueConflictFindings: boolean;
  /** Count of items with `kind: 'unresolved'` across all six categories. */
  unresolvedCount: number;
}

const CATEGORY_KEYS = [
  'userRequirements',
  'nonNegotiables',
  'preferences',
  'constraints',
  'assumptions',
  'functionalRequirements',
] as const;

function allRequirementItems(compiled: CompiledPrompt): RequirementItem[] {
  return CATEGORY_KEYS.flatMap((key) => compiled[key]);
}

/** Summarizes one mode's `CompiledPrompt` into `ComparisonRow` data for the comparison table. Pure — no I/O, no pipeline calls. */
export function summarizeForComparison(compiled: CompiledPrompt): ComparisonRow {
  const categoryCounts = {
    userRequirements: compiled.userRequirements.length,
    nonNegotiables: compiled.nonNegotiables.length,
    preferences: compiled.preferences.length,
    constraints: compiled.constraints.length,
    assumptions: compiled.assumptions.length,
    functionalRequirements: compiled.functionalRequirements.length,
  };
  const totalRequirements = CATEGORY_KEYS.reduce((sum, key) => sum + categoryCounts[key], 0);

  const architectureNoteCount = compiled.architecture?.length ?? 0;

  const allItems = allRequirementItems(compiled);
  const critiqueConflictFindingCount = allItems.filter(
    (it) => it.source === 'critique-engine' || it.source === 'conflict-engine'
  ).length;
  const unresolvedCount = allItems.filter((it) => it.kind === 'unresolved').length;

  return {
    categoryCounts,
    totalRequirements,
    architectureNoteCount,
    hasArchitectureNotes: architectureNoteCount > 0,
    critiqueConflictFindingCount,
    hasCritiqueConflictFindings: critiqueConflictFindingCount > 0,
    unresolvedCount,
  };
}
