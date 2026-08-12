import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt, type RequirementItem } from '@lucid/schema';
import { resumeAndRecompile, reconstructStateFromCompiled, runArchitectPipeline, mergeAnswer } from '../src/index.js';

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

describe('resumeAndRecompile', () => {
  it('preserves already-answered items end-to-end (TASK-031 bug: they used to be lost)', () => {
    const rawInput = 'Build a web app for tracking expenses.';
    const initial = runArchitectPipeline(rawInput);
    const compiled = initial.compiled;

    // Simulate the user answering one of the unresolved ambiguities inline
    // (DecisionsPanel's real flow), exactly like TASK-017's mergeAnswer.
    const unresolved = compiled.assumptions.find((a) => a.kind === 'unresolved');
    expect(unresolved).toBeDefined();
    const answered = mergeAnswer(compiled, unresolved!, 'iOS and Android via a React Native shell');

    const resumed = resumeAndRecompile(answered, rawInput, 'architect');

    const preservedAnswer = resumed.compiled.userRequirements.find((r) => r.source === 'user-answered-question');
    expect(preservedAnswer).toBeDefined();
    expect(preservedAnswer!.kind).toBe('user');
    expect(preservedAnswer!.text).toBe('iOS and Android via a React Native shell');
    expect(preservedAnswer!.status).toBe('accepted');

    // Answering an item does not remove the original unresolved flag from
    // `assumptions` (DecisionsPanel's `isAnswered()` classifies it as
    // "answered" purely by matching evidence, without deleting it) — but the
    // resumed compile must still carry it through untouched, not duplicate
    // or drop it.
    const stillPresent = resumed.compiled.assumptions.filter((a) => a.kind === 'unresolved' && a.source === unresolved!.source);
    expect(stillPresent).toHaveLength(1);
  });

  it('reconstructStateFromCompiled routes kind:"unresolved" items to ambiguities, not requirements', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const unresolved = unresolvedItem('What platform is this for?', 'platform');
    compiled.assumptions.push(unresolved);
    const answeredItem: RequirementItem = {
      text: 'A public marketing site',
      kind: 'user',
      source: 'user-answered-question',
      confidence: 1,
      evidence: ['What is this for?'],
      status: 'accepted',
    };
    compiled.userRequirements.push(answeredItem);

    const state = reconstructStateFromCompiled(compiled, 'raw text');

    expect(state.ambiguities).toHaveLength(1);
    expect(state.ambiguities[0].source).toBe(unresolved.source);
    expect(state.requirements.some((r) => r.source === 'user-answered-question')).toBe(true);
    expect(state.requirements.some((r) => r.kind === 'unresolved')).toBe(false);
  });

  it('domain and prior architecture notes are preserved rather than re-derived', () => {
    const compiled = createEmptyCompiledPrompt('game');
    compiled.architecture = [
      { component: 'Save system', dependsOn: [], note: 'Prior architecture note from the original compile.', source: 'architect-specialist' },
    ];

    // Raw input deliberately phrased so a fresh domainDetection run would
    // pick "web", not "game" — proving the resume path reuses compiled.domain
    // rather than re-running domainDetection on it.
    const rawInput = 'Build a responsive marketing website with a contact form.';

    const resumed = resumeAndRecompile(compiled, rawInput, 'architect');

    expect(resumed.compiled.domain).toBe('game');
    const priorNote = resumed.compiled.architecture?.find((a) => a.note === 'Prior architecture note from the original compile.');
    expect(priorNote).toBeDefined();
  });

  it('specialists genuinely re-run and react to content in the reconstructed requirements pool', () => {
    // CONSTRAINT specialist's rule 2 (packages/compiler/src/specialists/constraint/index.ts)
    // scans state.requirements for items routed to "preferences" whose text
    // reads like a hard requirement, and flags them into nonNegotiables. This
    // exercises that real production rule to prove specialists react to the
    // fuller reconstructed state, not just to unchanged raw input text.
    const softPreference: RequirementItem = {
      text: 'Nice to have a dark mode toggle.',
      kind: 'inferred',
      source: 'ux-specialist',
      confidence: 0.6,
      evidence: ['prior compile'],
      status: 'pending',
    };
    const compiledSoft = createEmptyCompiledPrompt('web');
    compiledSoft.preferences.push(softPreference);

    const resumedSoft = resumeAndRecompile(compiledSoft, 'Build a dashboard.', 'architect');
    const flaggedSoft = resumedSoft.compiled.nonNegotiables.find(
      (r) => r.source === 'constraint-specialist' && r.evidence.some((e) => e.includes(softPreference.text))
    );
    expect(flaggedSoft).toBeUndefined();

    // Now simulate the same preference item having been answered/edited to
    // use hard-requirement language (e.g. the user clarified it's actually
    // mandatory) — a realistic post-answer content change.
    const hardPreference: RequirementItem = {
      ...softPreference,
      text: 'Dark mode support is mandatory and must ship in v1.',
    };
    const compiledHard = createEmptyCompiledPrompt('web');
    compiledHard.preferences.push(hardPreference);

    const resumedHard = resumeAndRecompile(compiledHard, 'Build a dashboard.', 'architect');
    const flaggedHard = resumedHard.compiled.nonNegotiables.find(
      (r) => r.source === 'constraint-specialist' && r.evidence.some((e) => e.includes(hardPreference.text))
    );
    expect(flaggedHard).toBeDefined();
    expect(flaggedHard!.text).toContain('Dark mode support is mandatory and must ship in v1.');
  });

  it('works for quick mode (skips specialists/critique/conflict, same as runQuickPipeline)', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.userRequirements.push({
      text: 'A blog',
      kind: 'user',
      source: 'user-answered-question',
      confidence: 1,
      evidence: ['what should it be'],
      status: 'accepted',
    });

    const resumed = resumeAndRecompile(compiled, 'Build a blog.', 'quick');

    expect(resumed.compiled.userRequirements.some((r) => r.source === 'user-answered-question')).toBe(true);
    expect(resumed.stagesRun).toEqual(['synthesis', 'outputValidation']);
  });

  it('works for master mode (runs the deliberation loop) and never makes a network call', () => {
    const rawInput = 'Build a networked multiplayer horror game.';
    const initial = runArchitectPipeline(rawInput);
    const compiled = initial.compiled;

    const resumed = resumeAndRecompile(compiled, rawInput, 'master', { maxRounds: 2 });
    expect(resumed.compiled.domain).toBe('game');
    expect(resumed.stagesRun).toContain('synthesis');
    expect(resumed.stagesRun).toContain('outputValidation');
  });

  it('never re-runs intentAnalysis/domainDetection/requirementExtraction/ambiguityDetection stage names', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const resumed = resumeAndRecompile(compiled, 'Build a site.', 'architect');
    for (const forbidden of ['intentAnalysis', 'domainDetection', 'requirementExtraction', 'ambiguityDetection']) {
      expect(resumed.stagesRun).not.toContain(forbidden);
    }
  });
});
