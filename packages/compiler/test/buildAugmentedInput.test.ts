import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt, type RequirementItem } from '@lucid/schema';
import { mergeAnswer, buildAugmentedInput } from '../src/index.js';

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

describe('buildAugmentedInput', () => {
  it('returns the original raw input unchanged when there are no answered items', () => {
    expect(buildAugmentedInput('build me a website', [])).toBe('build me a website');
  });

  it('appends a single answered item as a plain-English sentence', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const original = unresolvedItem('What platform is this for?', 'platform');
    const merged = mergeAnswer(compiled, original, 'iOS and Android');

    const augmented = buildAugmentedInput('build me an app', merged.userRequirements);

    expect(augmented).toBe('build me an app What platform is this for?: iOS and Android.');
  });

  it('appends multiple answered items in order', () => {
    let compiled = createEmptyCompiledPrompt('web');
    const platformItem = unresolvedItem('What platform is this for?', 'platform');
    const audienceItem = unresolvedItem('Who is the target audience?', 'audience');
    compiled = mergeAnswer(compiled, platformItem, 'iOS and Android');
    compiled = mergeAnswer(compiled, audienceItem, 'Small business owners');

    const augmented = buildAugmentedInput('build me an app', compiled.userRequirements);

    expect(augmented).toBe(
      'build me an app What platform is this for?: iOS and Android. Who is the target audience?: Small business owners.'
    );
  });

  it('ignores items that are not user-answered-question sourced', () => {
    const notAnAnswer: RequirementItem = {
      text: 'Use TypeScript',
      kind: 'user',
      source: 'raw-input',
      confidence: 1,
      evidence: [],
      status: 'accepted',
    };
    expect(buildAugmentedInput('build me a website', [notAnAnswer])).toBe('build me a website');
  });

  it('is pure — does not mutate the raw input or the answered items array', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const original = unresolvedItem('What platform is this for?', 'platform');
    const merged = mergeAnswer(compiled, original, 'iOS');
    const itemsSnapshot = JSON.stringify(merged.userRequirements);

    buildAugmentedInput('build me an app', merged.userRequirements);

    expect(JSON.stringify(merged.userRequirements)).toBe(itemsSnapshot);
  });

  it('handles an empty original raw input gracefully', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const original = unresolvedItem('What platform is this for?', 'platform');
    const merged = mergeAnswer(compiled, original, 'iOS');

    const augmented = buildAugmentedInput('', merged.userRequirements);

    expect(augmented).toBe('What platform is this for?: iOS.');
  });
});
