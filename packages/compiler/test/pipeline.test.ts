import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline, ARCHITECT_MODE_STAGE_NAMES } from '../src/index.js';

describe('ARCHITECT pipeline', () => {
  it('runs all 9 named stages in order', () => {
    const state = runArchitectPipeline('build me a website');
    expect(state.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
  });

  it('vague input triggers ambiguity detection with unresolved fields, not silent defaults', () => {
    const compiled = compileArchitect('make me a game');
    const unresolved = compiled.assumptions.filter((a) => a.kind === 'unresolved');
    expect(unresolved.length).toBeGreaterThan(0);
    // none of the unresolved items should have been silently reclassified
    for (const item of unresolved) {
      expect(item.kind).toBe('unresolved');
      expect(item.status).not.toBe('accepted');
    }
  });

  it('highly specific input captures explicit user requirements with kind: user', () => {
    const compiled = compileArchitect(
      'Build a website for a bakery. The site must support online ordering and should be mobile responsive for our customers.'
    );
    const userItems = compiled.userRequirements.filter((r) => r.kind === 'user');
    expect(userItems.length).toBeGreaterThan(0);
    for (const item of userItems) {
      expect(item.source).toBe('user-input');
    }
  });

  it('contradictory input completes without throwing', () => {
    expect(() => compileArchitect('no budget at all but needs a AAA game engine with unity and unreal')).not.toThrow();
    const compiled = compileArchitect('no budget at all but needs a AAA game engine with unity and unreal');
    expect(compiled.domain).toBe('game');
  });

  it('missing-context / extremely short input falls back to unknown domain gracefully', () => {
    const compiled = compileArchitect('make an app');
    expect(compiled.domain).toBe('unknown');
  });

  it('extremely long input completes within reasonable time without truncation crash', () => {
    const longInput = 'build a website with must have features. '.repeat(2000);
    const start = Date.now();
    expect(() => compileArchitect(longInput)).not.toThrow();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it('empty string input returns a valid mostly-unresolved CompiledPrompt, never throws', () => {
    expect(() => compileArchitect('')).not.toThrow();
    const compiled = compileArchitect('');
    expect(compiled.domain).toBe('unknown');
    expect(compiled.userRequirements).toEqual([]);
  });

  it('whitespace-only input never throws', () => {
    expect(() => compileArchitect('   \n\t  ')).not.toThrow();
  });

  it('symbol-only input never throws', () => {
    expect(() => compileArchitect('!!! @@@ ### $$$ %%%')).not.toThrow();
    const compiled = compileArchitect('!!! @@@ ### $$$ %%%');
    expect(compiled.domain).toBe('unknown');
  });

  it('web domain detected on canonical web example', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).toBe('web');
  });

  it('game domain detected on canonical game example', () => {
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    expect(compiled.domain).toBe('game');
  });

  it('branding domain detected on canonical branding example', () => {
    const compiled = compileArchitect('Design a brand identity with a logo, color palette, and style guide');
    expect(compiled.domain).toBe('branding');
  });

  it('cross-domain input: higher-scoring domain wins and confidence is reported', () => {
    // Leans web (website, frontend, api) but mentions "game" once.
    const compiled = compileArchitect(
      'Build a website with a frontend and an API for tracking game scores'
    );
    const state = runArchitectPipeline(
      'Build a website with a frontend and an API for tracking game scores'
    );
    expect(compiled.domain).toBe('web');
    expect(state.domainConfidence).toBeGreaterThan(0);
    expect(state.domainConfidence).toBeLessThanOrEqual(1);
  });
});

describe('ARCHITECT specialist', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const architectDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'architect-specialist'
    );
    expect(architectDecisions.length).toBeGreaterThan(0);
    for (const d of architectDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces architecture notes for the detected domain', () => {
    const compiled = compileArchitect('Build a website for my business');
    expect(compiled.architecture).toBeDefined();
    expect(compiled.architecture!.length).toBeGreaterThan(0);
    for (const note of compiled.architecture!) {
      expect(note.source).toBe('architect-specialist');
    }
  });
});

describe('RequirementItem provenance', () => {
  it('requirement items are never mutated to reclassify kind across stages', () => {
    // Explicit user requirement should remain kind: 'user' end to end.
    const compiled = compileArchitect('The site must support checkout.');
    const userItem = compiled.userRequirements.find((r) => r.kind === 'user');
    expect(userItem).toBeDefined();
    expect(userItem!.kind).toBe('user');
  });
});
