import type { CompiledPrompt, RequirementItem } from '@lucid/schema';

/**
 * The single canonical "has this unresolved item already been answered"
 * check. An unresolved item counts as answered when some item in
 * `compiled.userRequirements` was produced by `mergeAnswer` (`source:
 * 'user-answered-question'`) and its `evidence` references this item's
 * exact text — i.e. `mergeAnswer` recorded `evidence: [unresolvedItem.text]`
 * when the answer was merged.
 *
 * Bug fix: this used to be duplicated (DecisionsPanel.tsx, resumeAndRecompile.ts)
 * and, critically, MISSING from CompiledOutput.tsx, formatAsMarkdown, and
 * getExportWarnings — so the Decisions panel correctly stopped showing an
 * item as unresolved once answered, but the actual compiled-prompt preview
 * and every export path kept showing it as unresolved anyway, directly
 * contradicting the answer that was sitting right there in
 * `userRequirements`. One shared function, used everywhere the compiled
 * output is read, closes that gap for good — a second "answered" check
 * can never quietly drift from the first again.
 */
export function isAnswered(item: RequirementItem, compiled: Pick<CompiledPrompt, 'userRequirements'>): boolean {
  return compiled.userRequirements.some(
    (r) => r.source === 'user-answered-question' && r.evidence.includes(item.text)
  );
}

/** `compiled.assumptions` filtered down to genuinely-still-unresolved items
 * (kind: 'unresolved' AND not yet answered) — the one place every consumer
 * (UI preview, markdown export, warning counts) should read from instead of
 * re-deriving this filter themselves. */
export function unresolvedUnanswered(compiled: CompiledPrompt): RequirementItem[] {
  return compiled.assumptions.filter((it) => it.kind === 'unresolved' && !isAnswered(it, compiled));
}
