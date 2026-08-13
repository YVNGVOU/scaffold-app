import type { CompiledPrompt } from '@lucid/schema';

/**
 * TASK-081: export-time risk signal threshold. `domainConfidence` (see
 * `pipeline/stages/domainDetection.ts`) is a 0-1 fraction — the forced/
 * winning domain's share of total score across all domain modules. Below
 * this threshold the classification is weak enough that the user should
 * see a flag before handing the compiled prompt off. Deliberately a
 * separate constant from `DOMAIN_CONFIDENCE_FLOOR` (packages/compiler/src/
 * domains/index.ts) — that floor gates whether detection picks a NAMED domain
 * vs. falling back to the generic domain module and is measured in raw score
 * points, not a 0-1 confidence fraction, so it isn't a comparable value here.
 */
export const EXPORT_LOW_CONFIDENCE_THRESHOLD = 0.5;

/** Pure, UI-independent read of export-time risk on a compiled prompt
 * (TASK-081). Unresolved items live in `compiled.assumptions` (see
 * `CompiledOutput.tsx`'s own comment on this — synthesis.ts routes
 * `kind: 'unresolved'` items there) with `kind: 'unresolved'`; this counts
 * them without excluding already-answered ones, since "answered" status is
 * derived client-side against `userRequirements` (see `DecisionsPanel.tsx`'s
 * `isAnswered`) and export warnings are a coarser, cheaper-to-compute signal
 * — a prompt with answered-but-still-present unresolved markers is still
 * worth a glance before handoff. */
export interface ExportWarnings {
  unresolvedCount: number;
  lowDomainConfidence: boolean;
  hasWarnings: boolean;
}

export function getExportWarnings(compiled: CompiledPrompt): ExportWarnings {
  const unresolvedCount = compiled.assumptions.filter((it) => it.kind === 'unresolved').length;
  const lowDomainConfidence =
    compiled.domainConfidence !== undefined && compiled.domainConfidence < EXPORT_LOW_CONFIDENCE_THRESHOLD;

  return {
    unresolvedCount,
    lowDomainConfidence,
    hasWarnings: unresolvedCount > 0 || lowDomainConfidence,
  };
}
