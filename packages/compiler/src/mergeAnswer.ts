import type { CompiledPrompt, RequirementItem } from '@lucid/schema';

/**
 * TASK-017: merges a user-supplied free-text answer to an unresolved
 * (`kind: 'unresolved'`) RequirementItem into an existing CompiledPrompt.
 *
 * Pure data transformation — no AI/inference involved, no pipeline re-run.
 * Append-only per the project's provenance discipline (see
 * `packages/schema/src/index.ts` RequirementItem doc comment): the original
 * `unresolvedItem` is never mutated, only referenced via `evidence` on the
 * new item. Returns a NEW CompiledPrompt object (existing category arrays
 * are shallow-copied, not mutated in place) so callers can safely diff/rely
 * on reference identity.
 */
export function mergeAnswer(
  compiled: CompiledPrompt,
  unresolvedItem: RequirementItem,
  answerText: string
): CompiledPrompt {
  const trimmedAnswer = answerText.trim();

  const answerItem: RequirementItem = {
    text: trimmedAnswer,
    kind: 'user',
    source: 'user-answered-question',
    confidence: 1.0,
    evidence: [unresolvedItem.text],
    status: 'accepted',
  };

  return {
    ...compiled,
    userRequirements: [...compiled.userRequirements, answerItem],
  };
}
