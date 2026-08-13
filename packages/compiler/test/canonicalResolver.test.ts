import { describe, it, expect } from 'vitest';
import { runArchitectPipeline, mergeAnswer, resumeAndRecompile, annotateProposalsAgainstCanonicalState } from '../src/index.js';
import type { RequirementItem, CanonicalState } from '@lucid/schema';

function item(text: string, overrides: Partial<RequirementItem> = {}): RequirementItem {
  return {
    text,
    kind: 'recommendation',
    source: 'technical-specialist',
    confidence: 0.6,
    evidence: [],
    status: 'pending',
    ...overrides,
  };
}

describe('canonical resolver (specialist-resolver bridge)', () => {
  it('annotateProposalsAgainstCanonicalState is a no-op with no locked facts', () => {
    const items = [item('Consider digital menu usability')];
    expect(annotateProposalsAgainstCanonicalState(items, {})).toBe(items);
  });

  it('links a proposal whose text overlaps a locked field/value, never touches kind:user or kind:unresolved items, never double-tags', () => {
    const canonicalState: CanonicalState = {
      'menu-design::menu format': { value: 'digital', confidence: 1, source: 'user', evidence: ['Whether the menu is print, digital/QR-code, or both is unspecified'] },
    };
    const items: RequirementItem[] = [
      item('Consider UX aspect "digital menu usability": ensure the page loads fast on mobile'),
      item('Consider technical aspect "point-of-sale consistency"'),
      item('A user fact', { kind: 'user', source: 'user-input' }),
      item('An unresolved field', { kind: 'unresolved', source: 'domain:x:ambiguity-checklist:y' }),
    ];

    const result = annotateProposalsAgainstCanonicalState(items, canonicalState);

    expect(result[0].evidence).toContainEqual(expect.stringContaining('relates-to-locked-fact:menu format = "digital"'));
    expect(result[1].evidence.some((e) => e.startsWith('relates-to-locked-fact:'))).toBe(false);
    expect(result[2]).toBe(items[2]); // kind:'user' untouched, same reference
    expect(result[3]).toBe(items[3]); // kind:'unresolved' untouched, same reference

    // Idempotent: running it again doesn't add a second tag.
    const again = annotateProposalsAgainstCanonicalState(result, canonicalState);
    expect(again[0].evidence.filter((e) => e.startsWith('relates-to-locked-fact:')).length).toBe(1);
  });

  it('end-to-end: answering a field suppresses critique low-confidence flagging for proposals about that same field', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const unresolved = state.compiled.assumptions.find(
      (a) => a.kind === 'unresolved' && a.source.includes('menu format'),
    )!;
    const answered = mergeAnswer(state.compiled, unresolved, 'digital');
    const recompiled = resumeAndRecompile(answered, 'design a menu for my new cafe', 'architect').compiled;

    const allItems = [
      ...recompiled.functionalRequirements,
      ...recompiled.preferences,
      ...recompiled.constraints,
      ...recompiled.nonNegotiables,
    ];
    const linked = allItems.filter((it) => it.evidence.some((e) => e.startsWith('relates-to-locked-fact:')));
    expect(linked.length).toBeGreaterThan(0);

    // None of the linked items themselves generated a "low-confidence
    // recommendation flagged for review" critique finding.
    const flaggedTexts = recompiled.assumptions
      .filter((a) => a.text.startsWith('Low-confidence recommendation flagged for review:'))
      .map((a) => a.text);
    for (const linkedItem of linked) {
      expect(flaggedTexts.some((t) => t.includes(linkedItem.text))).toBe(false);
    }
  });
});
