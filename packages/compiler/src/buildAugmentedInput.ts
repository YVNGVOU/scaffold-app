import type { RequirementItem } from '@lucid/schema';

/**
 * TASK-030 Part A: builds an augmented raw-input string for a full
 * "Confirm & Recompile" pipeline re-run. Takes the ORIGINAL raw input text
 * plus the answered items produced by `mergeAnswer` (kind: 'user',
 * source: 'user-answered-question', `evidence: [originalUnresolvedItem.text]`)
 * and appends each Q&A pair as a plain-English sentence, so the augmented
 * text can be fed straight back through `runArchitectPipeline` /
 * `runQuickPipeline` / `runMasterPipeline` from scratch — intentAnalysis,
 * domainDetection, requirementExtraction, and every specialist see the
 * fuller picture as real input text, not a bolted-on merged item.
 *
 * Pure, deterministic, no AI/inference involved — same input always
 * produces the same output string. Only items matching the exact shape
 * `mergeAnswer` produces (source: 'user-answered-question', a non-empty
 * `evidence[0]`) are used; anything else is ignored, since only those carry
 * both the original question text and the answer text needed to form a
 * sentence.
 */
export function buildAugmentedInput(rawInput: string, answeredItems: RequirementItem[]): string {
  const sentences: string[] = [];

  for (const item of answeredItems) {
    if (item.source !== 'user-answered-question') continue;
    const question = item.evidence[0];
    const answer = item.text.trim();
    if (!question || !answer) continue;
    sentences.push(`${question}: ${answer}.`);
  }

  if (sentences.length === 0) return rawInput;

  const base = rawInput.trimEnd();
  const separator = base.length > 0 ? ' ' : '';
  return `${base}${separator}${sentences.join(' ')}`;
}
