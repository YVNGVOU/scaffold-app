import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { wordOverlapRatio } from '../../textOverlap.js';

/**
 * Stage 8 (formerly the `critiquePassthrough` no-op): real, deterministic
 * cross-specialist review of everything ARCHITECT/TECHNICAL/UX have emitted
 * so far, plus any ambiguities that survived every specialist pass.
 *
 * Three independent, individually-testable rules. Each emits new
 * RequirementItems with source: 'critique-engine', kind: 'recommendation'
 * (critique never fabricates user intent, so it never emits kind: 'user'),
 * status: 'pending', and evidence naming the item(s)/field(s) that triggered
 * the finding. Findings are appended to the same append-only
 * requirements/requirementCategories arrays synthesis already reads, so no
 * changes to synthesis.ts are needed — verified by a dedicated test.
 */

/** Below this confidence, a still-standing recommendation is "weak" enough to flag for review. */
const LOW_CONFIDENCE_THRESHOLD = 0.65;

/**
 * TASK-009 (MASTER mode) fix: sources critique must never critique its own
 * (or another deliberation-loop stage's) prior output. Discovered while
 * building MASTER mode's loop-until-dry deliberation cycle: critique's Rule
 * 1 previously scanned the FULL `state.requirements` unconditionally,
 * including any `source: 'critique-engine'` items critique itself had
 * already appended in an earlier loop round. Every one of critique's own
 * findings is emitted at confidence 0.5/0.55 — itself below
 * LOW_CONFIDENCE_THRESHOLD (0.65) — so once MASTER mode started re-running
 * critique across loop rounds, round 2 would flag round 1's own finding as
 * ANOTHER low-confidence item, wrapping its text ("Low-confidence
 * recommendation flagged for review: \"Low-confidence recommendation
 * flagged for review: ...\""), and each further round would wrap that
 * output again — genuinely NEW text every round (so the loop's
 * seen-identity dry-check correctly saw it as new and kept looping),
 * producing unbounded string growth and, combined with Rule 2's O(n^2)
 * pairwise word-overlap comparison over the growing recommendation set,
 * caused real runaway cost (reproduced directly: a 5-round MASTER run on
 * ordinary input crashed the test worker before this fix).
 *
 * This is a genuine, minimal, necessary fix to critique.ts's existing rule
 * — not new behavior — required for critique to be safely re-runnable in
 * ANY loop, and is unconditionally correct for ARCHITECT mode too (critique
 * was never SUPPOSED to critique its own findings even in a single-pass
 * pipeline; it just never had the chance to before MASTER mode existed).
 * ARCHITECT/QUICK mode's existing 71-test suite passes unchanged after this
 * fix (critique runs exactly once in both, so this filter is a no-op there
 * — there is no prior critique/conflict/alternative-generation/
 * decision-scoring output yet for it to skip).
 */
const LOOP_STAGE_SOURCES = new Set(['critique-engine', 'conflict-engine', 'alternative-generation', 'decision-scoring']);

/**
 * Fraction of the *smaller* item's significant words (length > 2, after
 * stripping punctuation/case) that must also appear in the other item's text
 * for the pair to count as near-duplicate. Bounded pairwise comparison only
 * runs over `kind: 'recommendation'` items, whose count is fixed by the
 * (small, hand-authored) domain consideration tables, not by user input
 * length — so this stays O(n^2) over a small, bounded n regardless of how
 * long the raw input is.
 */
const DUPLICATE_WORD_OVERLAP_THRESHOLD = 0.75;

export function critique(state: PipelineState): PipelineState {
  const findings: RequirementItem[] = [];
  const findingCategories: RequirementCategory[] = [];

  // Rule 1 — low-confidence recommendation: a still-open (never accepted by
  // the user) recommendation whose confidence sits below the threshold is a
  // genuine weakness worth flagging for human review, since it means no
  // specialist found strong evidence for it and it was never confirmed.
  for (const item of state.requirements) {
    if (LOOP_STAGE_SOURCES.has(item.source)) continue; // never critique the deliberation loop's own prior output
    // Specialist-resolver bridge: a recommendation the resolver already
    // linked to a locked canonical fact (see canonicalResolver.ts) isn't a
    // genuinely open question anymore — the user already decided that field.
    // Flagging it for review would just be the same "why is this still
    // asking about something I answered" noise the resolver exists to stop.
    if (item.evidence.some((e) => e.startsWith('relates-to-locked-fact:'))) continue;
    if (item.kind === 'recommendation' && item.confidence < LOW_CONFIDENCE_THRESHOLD && item.status !== 'accepted') {
      findings.push({
        text: `Low-confidence recommendation flagged for review: "${item.text}" (confidence ${item.confidence.toFixed(2)}, source: ${item.source})`,
        kind: 'recommendation',
        source: 'critique-engine',
        confidence: 0.5,
        evidence: [`flagged-item-source:${item.source}`, `flagged-item-confidence:${item.confidence}`, `threshold:${LOW_CONFIDENCE_THRESHOLD}`],
        status: 'pending',
      });
      findingCategories.push('assumptions');
    }
  }

  // Rule 2 — near-duplicate recommendations from different sources: if two
  // independent specialists' recommendations say nearly the same thing, that
  // is real redundancy worth surfacing (either genuine reinforcing signal or
  // wasted noise), not something to silently keep as two separate items.
  const recommendationEntries = state.requirements
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item.kind === 'recommendation' && !LOOP_STAGE_SOURCES.has(entry.item.source));

  for (let a = 0; a < recommendationEntries.length; a++) {
    for (let b = a + 1; b < recommendationEntries.length; b++) {
      const itemA = recommendationEntries[a].item;
      const itemB = recommendationEntries[b].item;
      if (itemA.source === itemB.source) continue; // only cross-source duplication is interesting here
      const overlap = wordOverlapRatio(itemA.text, itemB.text);
      if (overlap >= DUPLICATE_WORD_OVERLAP_THRESHOLD) {
        findings.push({
          text: `Near-duplicate recommendations detected across specialists: "${itemA.text}" (${itemA.source}) closely overlaps "${itemB.text}" (${itemB.source})`,
          kind: 'recommendation',
          source: 'critique-engine',
          confidence: 0.55,
          evidence: [`duplicate-a:${itemA.source}:${itemA.text}`, `duplicate-b:${itemB.source}:${itemB.text}`, `word-overlap-ratio:${overlap.toFixed(2)}`],
          status: 'pending',
        });
        findingCategories.push('assumptions');
      }
    }
  }

  // Rule 3 — ambiguity checklist fields still unresolved after every
  // specialist ran: specialists only ever add recommendations/inferences on
  // top of what's already known, they never resolve an ambiguity themselves,
  // so anything still `kind: 'unresolved'` at this point in the pipeline is a
  // real, structural gap worth calling out explicitly rather than leaving it
  // to only be found by scanning the assumptions section.
  for (const amb of state.ambiguities) {
    if (amb.kind === 'unresolved') {
      findings.push({
        text: `Unresolved ambiguity survived all specialist passes: ${amb.text}`,
        kind: 'recommendation',
        source: 'critique-engine',
        confidence: 0.55,
        evidence: [`unresolved-field-source:${amb.source}`, `unresolved-field-text:${amb.text}`],
        status: 'pending',
      });
      findingCategories.push('assumptions');
    }
  }

  return {
    ...state,
    requirements: [...state.requirements, ...findings],
    requirementCategories: [...state.requirementCategories, ...findingCategories],
    stagesRun: [...state.stagesRun, 'critique'],
  };
}
