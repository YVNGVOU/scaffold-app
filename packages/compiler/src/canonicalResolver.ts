import type { RequirementItem, CanonicalState } from '@lucid/schema';
import { wordOverlapRatio } from './textOverlap.js';

/**
 * The specialist-resolver bridge (v2 of the canonical-state architecture —
 * see schema's CanonicalFact doc comment for v1). Full semantic conflict
 * detection ("this recommendation CONTRADICTS the locked fact") would need
 * per-domain antonym/exclusion knowledge that doesn't exist across the 68
 * domain modules, and retrofitting it is its own project. What IS buildable
 * generically, with zero domain-file changes, using the same deterministic
 * word-overlap heuristic critique.ts already trusts for near-duplicate
 * detection: relatedness. If a specialist proposal's text substantially
 * overlaps a locked field's name or original description, that proposal is
 * ABOUT a decision the user already made — even without knowing whether it
 * agrees or conflicts, treating it as "not a fresh open question" and
 * saying so explicitly (rather than silently) is real, honest progress:
 * critique.ts's low-confidence-flagging rule (Rule 1) skips items tagged
 * here, and the tag itself is visible to the user via the existing
 * evidence-list UI (MetaDisclosure.tsx already renders every item's
 * evidence, so this needed no UI changes to surface).
 */
const RELATEDNESS_THRESHOLD = 0.34;

/**
 * Pure — returns a new array; items with no matching locked fact, or that
 * are already annotated, are returned by reference unchanged (so callers
 * can cheaply tell whether anything actually changed via array/item
 * identity if they need to).
 */
export function annotateProposalsAgainstCanonicalState(
  requirements: RequirementItem[],
  canonicalState: CanonicalState,
): RequirementItem[] {
  const facts = Object.entries(canonicalState);
  if (facts.length === 0) return requirements;

  return requirements.map((item) => {
    // Only specialist/analysis OUTPUT is a "proposal" in this sense — never
    // re-annotate the user's own stated facts or a still-open question.
    if (item.kind === 'user' || item.kind === 'unresolved') return item;
    if (item.evidence.some((e) => e.startsWith('relates-to-locked-fact:'))) return item;

    for (const [key, fact] of facts) {
      const field = key.includes('::') ? key.split('::')[1] : key;
      const description = fact.evidence[0] ?? '';
      const overlap = Math.max(wordOverlapRatio(item.text, field), wordOverlapRatio(item.text, description));
      if (overlap >= RELATEDNESS_THRESHOLD) {
        return {
          ...item,
          evidence: [...item.evidence, `relates-to-locked-fact:${field} = "${fact.value}"`],
        };
      }
    }
    return item;
  });
}
