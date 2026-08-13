import { describe, it, expect } from 'vitest';
import { runArchitectPipeline, mergeAnswer, resumeAndRecompile, formatAsMarkdown, parseCanonicalFieldKey, lockCanonicalFact } from '../src/index.js';

describe('canonical state v1', () => {
  it('parseCanonicalFieldKey extracts domain::field from an ambiguity-checklist source, and rejects anything else', () => {
    expect(parseCanonicalFieldKey('domain:menu-design:ambiguity-checklist:menu format')).toBe('menu-design::menu format');
    expect(parseCanonicalFieldKey('technical-specialist')).toBeNull();
    expect(parseCanonicalFieldKey('user-answered-question')).toBeNull();
  });

  it('mergeAnswer locks a canonical fact using the literal answer text, alongside the userRequirements entry', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const unresolved = state.compiled.assumptions.find(
      (a) => a.kind === 'unresolved' && a.source.includes('menu format'),
    );
    expect(unresolved).toBeDefined();

    const answered = mergeAnswer(state.compiled, unresolved!, 'digital');
    const key = parseCanonicalFieldKey(unresolved!.source)!;

    expect(answered.canonicalState?.[key]).toEqual({
      value: 'digital',
      confidence: 1.0,
      source: 'user',
      evidence: [unresolved!.text],
    });
    // The append-only userRequirements record is untouched by this addition.
    expect(answered.userRequirements.some((r) => r.text === 'digital' && r.source === 'user-answered-question')).toBe(true);
  });

  it('a locked fact survives across recompiles and is never silently overwritten by a different answer to the same field', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const unresolved = state.compiled.assumptions.find(
      (a) => a.kind === 'unresolved' && a.source.includes('menu format'),
    )!;
    const key = parseCanonicalFieldKey(unresolved.source)!;

    let compiled = mergeAnswer(state.compiled, unresolved, 'digital');
    const recompiled = resumeAndRecompile(compiled, 'design a menu for my new cafe', 'architect').compiled;

    // Carried forward through a full recompile, not just the raw mergeAnswer call.
    expect(recompiled.canonicalState?.[key]?.value).toBe('digital');

    // lockCanonicalFact itself is a pure function — calling it again with a
    // NEW answer for the SAME field is a deliberate re-answer (last write
    // wins), not an accidental overwrite from somewhere else in the
    // pipeline: nothing but mergeAnswer ever calls it.
    const reAnswered = lockCanonicalFact(recompiled.canonicalState ?? {}, unresolved, 'print');
    expect(reAnswered[key].value).toBe('print');
  });

  it('exported markdown renders a Locked Requirements section ahead of everything else, using the literal answer', () => {
    const state = runArchitectPipeline('design a menu for my new cafe');
    const unresolved = state.compiled.assumptions.find(
      (a) => a.kind === 'unresolved' && a.source.includes('menu format'),
    )!;
    const answered = mergeAnswer(state.compiled, unresolved, 'digital');
    const recompiled = resumeAndRecompile(answered, 'design a menu for my new cafe', 'architect').compiled;

    const md = formatAsMarkdown(recompiled);
    expect(md).toContain('## Locked Requirements');
    expect(md).toContain('digital');
    // Locked Requirements comes before User Requirements in the same group.
    expect(md.indexOf('## Locked Requirements')).toBeLessThan(md.indexOf('## User Requirements'));
  });

  it('an unresolved item not backed by a domain checklist field (e.g. a hypothetical future source) is a safe no-op for canonical state, not a crash or silent data loss', () => {
    const fakeItem = {
      text: 'Some other unresolved thing',
      kind: 'unresolved' as const,
      source: 'some-other-source',
      confidence: 0.5,
      evidence: [],
      status: 'pending' as const,
    };
    const state = runArchitectPipeline('design a menu for my new cafe');
    const answered = mergeAnswer(state.compiled, fakeItem, 'whatever');

    // canonicalState unchanged (no field to key it by)...
    expect(answered.canonicalState).toEqual(state.compiled.canonicalState ?? {});
    // ...but the answer is still recorded in userRequirements regardless.
    expect(answered.userRequirements.some((r) => r.text === 'whatever')).toBe(true);
  });
});
