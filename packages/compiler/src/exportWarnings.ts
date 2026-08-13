import type { CompiledPrompt } from '@lucid/schema';
import { unresolvedUnanswered } from './isAnswered.js';

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
 * (TASK-081). Unresolved items live in `compiled.assumptions` with
 * `kind: 'unresolved'`; `unresolvedUnanswered` (isAnswered.ts) excludes
 * ones the user has already answered inline (via `mergeAnswer`) — a
 * previous version of this function counted answered items too, which made
 * the export warning contradict the answer sitting right there in
 * `userRequirements`. Fixed: the count now means what it says. */
export interface ExportWarnings {
  unresolvedCount: number;
  lowDomainConfidence: boolean;
  hasWarnings: boolean;
}

export function getExportWarnings(compiled: CompiledPrompt): ExportWarnings {
  const unresolvedCount = unresolvedUnanswered(compiled).length;
  const lowDomainConfidence =
    compiled.domainConfidence !== undefined && compiled.domainConfidence < EXPORT_LOW_CONFIDENCE_THRESHOLD;

  return {
    unresolvedCount,
    lowDomainConfidence,
    hasWarnings: unresolvedCount > 0 || lowDomainConfidence,
  };
}
