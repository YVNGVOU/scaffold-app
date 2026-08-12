import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt, type RequirementItem } from '@lucid/schema';
import { mergeAnswer } from '../src/index.js';

function unresolvedItem(text: string, field: string): RequirementItem {
  return {
    text,
    kind: 'unresolved',
    source: `domain:web:ambiguity-checklist:${field}`,
    confidence: 0.5,
    evidence: [`required field "${field}" not detected in raw input`],
    status: 'pending',
  };
}

describe('mergeAnswer', () => {
  it('adds a kind:"user" item without mutating the original unresolved item', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const original = unresolvedItem('What platform is this for?', 'platform');
    const originalSnapshot = { ...original, evidence: [...original.evidence] };

    const result = mergeAnswer(compiled, original, 'iOS and Android');

    // original object untouched
    expect(original).toEqual(originalSnapshot);
    expect(original.kind).toBe('unresolved');

    // new item appended
    const added = result.userRequirements.find((r) => r.source === 'user-answered-question');
    expect(added).toBeDefined();
    expect(added!.kind).toBe('user');
    expect(added!.text).toBe('iOS and Android');
    expect(added!.confidence).toBe(1.0);
    expect(added!.status).toBe('accepted');
    expect(added!.evidence).toEqual([original.text]);
  });

  it('does not mutate the input CompiledPrompt (returns a new object)', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const original = unresolvedItem('What platform is this for?', 'platform');

    const result = mergeAnswer(compiled, original, 'iOS');

    expect(compiled.userRequirements.length).toBe(0);
    expect(result.userRequirements.length).toBe(1);
    expect(result).not.toBe(compiled);
  });

  it('handles multiple sequential answer merges without collision', () => {
    let compiled = createEmptyCompiledPrompt('web');
    const platformItem = unresolvedItem('What platform is this for?', 'platform');
    const audienceItem = unresolvedItem('Who is the target audience?', 'audience');

    compiled = mergeAnswer(compiled, platformItem, 'iOS and Android');
    compiled = mergeAnswer(compiled, audienceItem, 'Small business owners');

    expect(compiled.userRequirements.length).toBe(2);
    expect(compiled.userRequirements[0].text).toBe('iOS and Android');
    expect(compiled.userRequirements[0].evidence).toEqual([platformItem.text]);
    expect(compiled.userRequirements[1].text).toBe('Small business owners');
    expect(compiled.userRequirements[1].evidence).toEqual([audienceItem.text]);

    // both original unresolved items remain unaffected
    expect(platformItem.kind).toBe('unresolved');
    expect(audienceItem.kind).toBe('unresolved');
  });

  it('merged item evidence references the original unresolved item text exactly', () => {
    const compiled = createEmptyCompiledPrompt('game');
    const original = unresolvedItem('What is the target platform (console/PC/mobile)?', 'platform');

    const result = mergeAnswer(compiled, original, 'PC only');

    expect(result.userRequirements[0].evidence[0]).toBe(original.text);
  });
});
