import type { CanonicalState, RequirementItem } from '@lucid/schema';

/**
 * Extracts the `domainId::fieldKey` canonical-state key from an unresolved
 * RequirementItem's `source`, which ambiguityDetection.ts always writes as
 * `domain:<id>:ambiguity-checklist:<field>` (see that file). Returns null
 * for anything else (e.g. an item not sourced from a domain's ambiguity
 * checklist) — canonical state only ever tracks checklist-backed fields.
 */
export function parseCanonicalFieldKey(unresolvedItemSource: string): string | null {
  const match = /^domain:(.+):ambiguity-checklist:(.+)$/.exec(unresolvedItemSource);
  if (!match) return null;
  const [, domainId, field] = match;
  return `${domainId}::${field}`;
}

/**
 * Locks a canonical fact for the field `unresolvedItem` answers, using the
 * LITERAL answer text as the value — verbatim, never paraphrased. Pure —
 * returns a new CanonicalState object, never mutates the input. If
 * `unresolvedItem` isn't checklist-sourced (parseCanonicalFieldKey returns
 * null), returns `state` unchanged rather than silently dropping the answer
 * — `mergeAnswer` still records it in `userRequirements` regardless.
 */
export function lockCanonicalFact(
  state: CanonicalState,
  unresolvedItem: RequirementItem,
  answerText: string,
): CanonicalState {
  const key = parseCanonicalFieldKey(unresolvedItem.source);
  if (!key) return state;
  return {
    ...state,
    [key]: {
      value: answerText,
      confidence: 1.0,
      source: 'user',
      evidence: [unresolvedItem.text],
    },
  };
}
