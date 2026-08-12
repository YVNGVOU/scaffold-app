import { describe, it, expect } from 'vitest';
import {
  compileArchitect,
  runArchitectPipeline,
  ARCHITECT_MODE_STAGE_NAMES,
  compileQuick,
  runQuickPipeline,
  QUICK_MODE_STAGE_NAMES,
  compileMaster,
  runMasterPipeline,
} from '../src/index.js';
import { critique } from '../src/pipeline/stages/critique.js';
import { requirementExpansion } from '../src/pipeline/stages/requirementExpansion.js';
import { alternativeGeneration } from '../src/pipeline/stages/alternativeGeneration.js';
import { decisionScoring } from '../src/pipeline/stages/decisionScoring.js';
import { constraintSpecialist } from '../src/specialists/constraint/index.js';

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

  it('TASK-006 regression: non-game input mentioning "multiplayer" does not misclassify as game', () => {
    // Bare 'multiplayer' keyword previously matched this as game (and the
    // bare 'player' keyword double-counted via substring match inside
    // "multiplayer"), outscoring the correct 'web' domain.
    const compiled = compileArchitect('Build a horror-themed multiplayer chat website');
    expect(compiled.domain).toBe('web');
  });

  it('TASK-006 regression: another non-game "multiplayer" input (collaboration tool) does not misclassify as game', () => {
    const compiled = compileArchitect('Build a multiplayer collaborative document editing website with a React frontend');
    expect(compiled.domain).toBe('web');
  });

  it('branding domain detected on canonical branding example', () => {
    const compiled = compileArchitect('Design a brand identity with a logo, color palette, and style guide');
    expect(compiled.domain).toBe('branding');
  });

  it('Verifier regression (TASK-006 follow-up): web domain does not misclassify on bare "api" substring match inside unrelated words', () => {
    // Plain substring matching let the bare keyword 'api' match inside
    // "rapid" and "therapist", the same class of bug fixed for 'multiplayer'
    // in the game domain. No genuine web signal is present here.
    const state = runArchitectPipeline('We need a rapid prototype for our internal therapist scheduling tool');
    expect(state.domain).not.toBe('web');
  });

  it('Verifier regression (TASK-006 follow-up): branding domain does not misclassify on bare "logo" substring match inside "logout"', () => {
    const state = runArchitectPipeline('Add a logout button to the account settings page');
    expect(state.domain).not.toBe('branding');
  });

  it('Verifier regression (TASK-006 follow-up): branding domain still recognizes the inflected form "rebranding"', () => {
    // Guards against over-correcting the word-boundary fix into missing
    // common inflected forms that don't collide with unrelated words.
    const compiled = compileArchitect('We need help with our rebranding, including a new logo and style guide');
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

describe('TASK-002: NLP-driven pipeline behavior', () => {
  it('negation: "must not include microtransactions" produces a different, excluded requirement than "must include microtransactions"', () => {
    const negativeCompiled = compileArchitect('The game must not include microtransactions.');
    const positiveCompiled = compileArchitect('The game must include microtransactions.');

    const negativeItem = [...negativeCompiled.constraints, ...negativeCompiled.userRequirements].find((r) =>
      r.text.toLowerCase().includes('must not include microtransactions')
    );
    const positiveItem = positiveCompiled.userRequirements.find((r) =>
      r.text.toLowerCase().includes('must include microtransactions')
    );

    expect(negativeItem).toBeDefined();
    expect(positiveItem).toBeDefined();
    // Negated clauses are routed to constraints (things to avoid), not
    // userRequirements — a structural difference the old regex-only
    // extractor could not produce, since it had no negation awareness.
    expect(negativeCompiled.constraints.some((r) => r.text.toLowerCase().includes('microtransactions'))).toBe(true);
    expect(negativeCompiled.userRequirements.some((r) => r.text.toLowerCase().includes('microtransactions'))).toBe(
      false
    );
    expect(positiveCompiled.userRequirements.some((r) => r.text.toLowerCase().includes('microtransactions'))).toBe(
      true
    );
    expect(negativeItem!.evidence.some((e) => e.includes('negated:true'))).toBe(true);
    expect(positiveItem!.evidence.some((e) => e.includes('negated:false'))).toBe(true);
  });

  it('synonym-only mention resolves the "platform" ambiguity field without the literal checklist string present', () => {
    const compiled = compileArchitect('Build a website for iPhone with a frontend and an API backend');
    expect(compiled.domain).toBe('web');
    const platformUnresolved = compiled.assumptions.find(
      (a) => a.kind === 'unresolved' && a.source.includes('ambiguity-checklist:platform')
    );
    // The web domain's own platform regex (/mobile|responsive|desktop|cross-platform|browser/i)
    // does not contain "iphone" — this only resolves via the PLATFORM_LEXICON synonym table.
    expect(platformUnresolved).toBeUndefined();
  });

  it('grammar-based intent classification works on a sentence with no obvious keyword hit', () => {
    // "Constructing" (gerund) is not matched by the legacy keyword regex
    // /\b(build|create|make|develop|design a|construct)\b/i, since \bconstruct\b
    // requires a word boundary immediately after "construct" and "constructing"
    // has no such boundary there. The nlp layer resolves the verb to its
    // infinitive ("construct") and classifies it correctly regardless.
    const state = runArchitectPipeline('Constructing a portfolio site for a photographer');
    expect(state.taskType).toBe('build');
  });

  it('50k+ character input completes sub-second end to end', () => {
    const longInput = 'The app must support fast checkout and should not use tracking. '.repeat(800);
    expect(longInput.length).toBeGreaterThan(50000);
    const start = Date.now();
    expect(() => compileArchitect(longInput)).not.toThrow();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
  });
});

describe('TECHNICAL specialist (TASK-003)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const technicalDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'technical-specialist'
    );
    expect(technicalDecisions.length).toBeGreaterThan(0);
    for (const d of technicalDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate technical decisions for web', () => {
    const state = runArchitectPipeline('Build a website with a frontend and an API backend');
    const technicalItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'technical-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(technicalItems.length).toBeGreaterThan(0);
    expect(technicalItems.some((t) => t.includes('hosting') || t.includes('browser') || t.includes('framework'))).toBe(
      true
    );
  });

  it('produces domain-appropriate technical decisions for game', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const technicalItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'technical-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(technicalItems.length).toBeGreaterThan(0);
    expect(technicalItems.some((t) => t.includes('engine') || t.includes('platform') || t.includes('performance'))).toBe(
      true
    );
  });

  it('produces domain-appropriate technical decisions for branding', () => {
    const state = runArchitectPipeline('Design a brand identity with a logo, color palette, and style guide');
    const technicalItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'technical-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(technicalItems.length).toBeGreaterThan(0);
    expect(
      technicalItems.some((t) => t.includes('file format') || t.includes('print') || t.includes('deliverable'))
    ).toBe(true);
  });

  it('end-to-end: a single real pipeline call produces both architect-specialist and technical-specialist sourced items together', () => {
    const compiled = compileArchitect('make me a horror game');
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);

    // Also confirm the architecture notes (architect-only output) survived
    // synthesis alongside the technical requirement items — i.e. synthesis
    // merged both specialists' output without one clobbering the other.
    expect(compiled.architecture).toBeDefined();
    expect(compiled.architecture!.length).toBeGreaterThan(0);
    expect(compiled.architecture!.every((n) => n.source === 'architect-specialist')).toBe(true);
  });
});

describe('UX specialist (TASK-004)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const uxDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'ux-specialist'
    );
    expect(uxDecisions.length).toBeGreaterThan(0);
    for (const d of uxDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate UX decisions for web', () => {
    const state = runArchitectPipeline('Build a website with a frontend and an API backend');
    const uxItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'ux-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(uxItems.length).toBeGreaterThan(0);
    expect(uxItems.some((t) => t.includes('navigation') || t.includes('accessibility') || t.includes('onboarding'))).toBe(
      true
    );
  });

  it('produces domain-appropriate UX decisions for game', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const uxItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'ux-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(uxItems.length).toBeGreaterThan(0);
    expect(
      uxItems.some((t) => t.includes('control scheme') || t.includes('pacing') || t.includes('accessibility'))
    ).toBe(true);
  });

  it('produces domain-appropriate UX decisions for branding', () => {
    const state = runArchitectPipeline('Design a brand identity with a logo, color palette, and style guide');
    const uxItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'ux-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(uxItems.length).toBeGreaterThan(0);
    expect(
      uxItems.some((t) => t.includes('touchpoint') || t.includes('legibility') || t.includes('accessibility'))
    ).toBe(true);
  });

  it('end-to-end: a single real pipeline call produces architect-specialist, technical-specialist, AND ux-specialist sourced items together', () => {
    const compiled = compileArchitect('make me a horror game');
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);

    // Confirm all three coexist in the same categories without one
    // clobbering another — a per-category breakdown of at least one category
    // containing more than one specialist's source.
    const bySourceInFunctional = new Set(compiled.functionalRequirements.map((i) => i.source));
    expect(bySourceInFunctional.size).toBeGreaterThanOrEqual(1);

    // Architecture notes (architect-only) survive synthesis alongside
    // technical + ux requirement items.
    expect(compiled.architecture).toBeDefined();
    expect(compiled.architecture!.length).toBeGreaterThan(0);
    expect(compiled.architecture!.every((n) => n.source === 'architect-specialist')).toBe(true);
  });
});

describe('SECURITY specialist (TASK-007)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const securityDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'security-specialist'
    );
    expect(securityDecisions.length).toBeGreaterThan(0);
    for (const d of securityDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate security decisions for web', () => {
    const state = runArchitectPipeline('Build a website with a frontend and an API backend');
    const securityItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'security-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(securityItems.length).toBeGreaterThan(0);
    expect(
      securityItems.some((t) => t.includes('authentication') || t.includes('authorization') || t.includes('data exposure'))
    ).toBe(true);
  });

  it('produces domain-appropriate security decisions for game', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const securityItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'security-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(securityItems.length).toBeGreaterThan(0);
    expect(
      securityItems.some((t) => t.includes('anti-cheat') || t.includes('network security') || t.includes('account authentication'))
    ).toBe(true);
  });

  it('produces domain-appropriate security decisions for branding', () => {
    const state = runArchitectPipeline('Design a brand identity with a logo, color palette, and style guide');
    const securityItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'security-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(securityItems.length).toBeGreaterThan(0);
    expect(
      securityItems.some((t) => t.includes('asset access control') || t.includes('ip and licensing') || t.includes('unreleased asset'))
    ).toBe(true);
  });

  it('end-to-end: a single real pipeline call produces architect-specialist, technical-specialist, ux-specialist, AND security-specialist sourced items together, in correct pipeline order', () => {
    const state = runArchitectPipeline('make me a horror game');
    expect(state.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
    // Confirm pipeline ordering: securitySpecialistPass runs after
    // uxSpecialistPass and before critique/conflict.
    const order = state.stagesRun;
    expect(order.indexOf('uxSpecialistPass')).toBeLessThan(order.indexOf('securitySpecialistPass'));
    expect(order.indexOf('securitySpecialistPass')).toBeLessThan(order.indexOf('critique'));
    expect(order.indexOf('securitySpecialistPass')).toBeLessThan(order.indexOf('conflict'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);

    // Architecture notes (architect-only) survive synthesis alongside the
    // other three specialists' requirement items.
    expect(compiled.architecture).toBeDefined();
    expect(compiled.architecture!.length).toBeGreaterThan(0);
    expect(compiled.architecture!.every((n) => n.source === 'architect-specialist')).toBe(true);
  });
});

describe('CREATIVE specialist (TASK-010)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const creativeDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'creative-specialist'
    );
    expect(creativeDecisions.length).toBeGreaterThan(0);
    for (const d of creativeDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate creative decisions for web', () => {
    const state = runArchitectPipeline('Build a website with a frontend and an API backend');
    const creativeItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'creative-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(creativeItems.length).toBeGreaterThan(0);
    expect(
      creativeItems.some((t) => t.includes('visual direction') || t.includes('originality') || t.includes('design consistency'))
    ).toBe(true);
  });

  it('produces domain-appropriate creative decisions for game', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const creativeItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'creative-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(creativeItems.length).toBeGreaterThan(0);
    expect(
      creativeItems.some((t) => t.includes('visual consistency') || t.includes('level composition') || t.includes('audio-visual style'))
    ).toBe(true);
  });

  it('produces domain-appropriate creative decisions for branding', () => {
    const state = runArchitectPipeline('Design a brand identity with a logo, color palette, and style guide');
    const creativeItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'creative-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(creativeItems.length).toBeGreaterThan(0);
    expect(
      creativeItems.some((t) => t.includes('originality') || t.includes('system consistency') || t.includes('concept exploration'))
    ).toBe(true);
  });

  it('end-to-end ARCHITECT mode: a single real pipeline call produces all five specialist sources together, in correct pipeline order', () => {
    const state = runArchitectPipeline('make me a horror game');
    expect(state.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
    const order = state.stagesRun;
    expect(order.indexOf('securitySpecialistPass')).toBeLessThan(order.indexOf('creativeSpecialistPass'));
    expect(order.indexOf('creativeSpecialistPass')).toBeLessThan(order.indexOf('critique'));
    expect(order.indexOf('creativeSpecialistPass')).toBeLessThan(order.indexOf('conflict'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
  });

  it('end-to-end MASTER mode: a real runMasterPipeline call produces all five specialist sources together (separate from the ARCHITECT test, per MASTER having its own runner)', () => {
    const state = runMasterPipeline('make me a horror game');
    expect(state.stagesRun).toContain('creativeSpecialistPass');
    const order = state.stagesRun;
    expect(order.indexOf('securitySpecialistPass')).toBeLessThan(order.indexOf('creativeSpecialistPass'));
    expect(order.indexOf('creativeSpecialistPass')).toBeLessThan(order.indexOf('critique'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
  });
});

describe('QA specialist (TASK-013)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business');
    const qaDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'qa-specialist'
    );
    expect(qaDecisions.length).toBeGreaterThan(0);
    for (const d of qaDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate QA decisions for web', () => {
    const state = runArchitectPipeline('Build a website with a frontend and an API backend');
    const qaItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'qa-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(qaItems.length).toBeGreaterThan(0);
    expect(
      qaItems.some((t) => t.includes('acceptance criteria') || t.includes('test cases') || t.includes('failure states'))
    ).toBe(true);
  });

  it('produces domain-appropriate QA decisions for game', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const qaItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'qa-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(qaItems.length).toBeGreaterThan(0);
    expect(
      qaItems.some((t) => t.includes('break the spec') || t.includes('contradiction check') || t.includes('failure states'))
    ).toBe(true);
  });

  it('produces domain-appropriate QA decisions for branding', () => {
    const state = runArchitectPipeline('Design a brand identity with a logo, color palette, and style guide');
    const qaItems = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'qa-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(qaItems.length).toBeGreaterThan(0);
    expect(
      qaItems.some((t) => t.includes('missing requirement') || t.includes('acceptance criteria') || t.includes('test cases'))
    ).toBe(true);
  });

  it('end-to-end ARCHITECT mode: a single real pipeline call produces all six specialist sources together, in correct pipeline order', () => {
    const state = runArchitectPipeline('make me a horror game');
    expect(state.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
    const order = state.stagesRun;
    expect(order.indexOf('creativeSpecialistPass')).toBeLessThan(order.indexOf('qaSpecialistPass'));
    expect(order.indexOf('qaSpecialistPass')).toBeLessThan(order.indexOf('critique'));
    expect(order.indexOf('qaSpecialistPass')).toBeLessThan(order.indexOf('conflict'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
    expect(sources.has('qa-specialist')).toBe(true);
  });

  it('end-to-end MASTER mode: a real runMasterPipeline call produces all six specialist sources together (separate from the ARCHITECT test, per MASTER having its own runner)', () => {
    const state = runMasterPipeline('make me a horror game');
    expect(state.stagesRun).toContain('qaSpecialistPass');
    const order = state.stagesRun;
    expect(order.indexOf('creativeSpecialistPass')).toBeLessThan(order.indexOf('qaSpecialistPass'));
    expect(order.indexOf('qaSpecialistPass')).toBeLessThan(order.indexOf('critique'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
    expect(sources.has('qa-specialist')).toBe(true);
  });

  it('MASTER-loop safety (TASK-009/010 re-verification with a 6th specialist): dry-check still stops early and maxRounds cap still holds', () => {
    // Re-confirms the pre-existing dry-round and maxRounds-cap tests still
    // mean what they're supposed to now that QA contributes a 6th
    // specialist's worth of items into the requirements pool feeding the
    // deliberation loop's seen-identity set.
    const stageLog: string[] = [];
    runMasterPipeline('build me a website', {
      maxRounds: 5,
      onStage: (name) => stageLog.push(name),
    });
    const round3Entries = stageLog.filter((n) => /\(round 3\)/.test(n));
    expect(round3Entries.length).toBe(0);

    const capStageLog: string[] = [];
    const state = runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight, no login required', {
      maxRounds: 1,
      onStage: (name) => capStageLog.push(name),
    });
    expect(capStageLog.some((n) => /\(round \d+\)/.test(n))).toBe(false);
    expect(state.stagesRun.filter((n) => n === 'critique').length).toBe(1);
    expect(state.stagesRun.filter((n) => n === 'conflict').length).toBe(1);
    expect(state.stagesRun).toContain('qaSpecialistPass');
  });
});

describe('CONSTRAINT specialist (TASK-014)', () => {
  it('never emits kind: user on anything it introduces itself', () => {
    const state = runArchitectPipeline('Build a website for my business with no budget and a custom enterprise platform');
    const constraintDecisions = state.decisions.filter(
      (d) => d.type === 'requirement' && d.item.source === 'constraint-specialist'
    );
    expect(constraintDecisions.length).toBeGreaterThan(0);
    for (const d of constraintDecisions) {
      if (d.type === 'requirement') {
        expect(d.item.kind).not.toBe('user');
        expect(['inferred', 'default', 'recommendation']).toContain(d.item.kind);
      }
    }
  });

  it('produces domain-appropriate infeasible-combination flags for web', () => {
    const state = runArchitectPipeline('Build a website with no budget and a custom enterprise platform for e-commerce');
    const items = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'constraint-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((t) => t.includes('budget vs scope'))).toBe(true);
  });

  it('produces domain-appropriate infeasible-combination flags for game', () => {
    const state = runArchitectPipeline('Make an open-world game in Unity with no budget');
    const items = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'constraint-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((t) => t.includes('budget vs scope'))).toBe(true);
  });

  it('produces domain-appropriate infeasible-combination flags for branding', () => {
    const state = runArchitectPipeline('Design a full brand kit with a logo, but we need it by tomorrow');
    const items = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'constraint-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((t) => t.includes('timeline vs complexity'))).toBe(true);
  });

  it('does not flag an infeasible combination when only one side of the tension is present', () => {
    const state = runArchitectPipeline('Build a website with no budget');
    const items = state.decisions
      .filter((d) => d.type === 'requirement' && d.item.source === 'constraint-specialist')
      .map((d) => (d.type === 'requirement' ? d.item.text.toLowerCase() : ''));
    expect(items.some((t) => t.includes('budget vs scope'))).toBe(false);
  });

  it('flags a preference-routed item that reads like a non-negotiable via a new referencing item, without mutating the original', () => {
    // requirementExtraction routes an explicit "must" clause from raw input
    // into constraints/nonNegotiables normally, so to exercise CONSTRAINT's
    // reclassification behavior directly we construct a state where a
    // preference-category item's own text contains hard-requirement
    // language, mirroring the near-duplicate-rule test's direct-stage-call
    // approach used for critique.ts (this scenario doesn't occur naturally
    // via the current domain data, since domain "preferences" considerations
    // are not authored with "must"/"required" language).
    const before = runArchitectPipeline('Build a website');
    const idx = before.requirementCategories.findIndex((c) => c === 'preferences');
    expect(idx).toBeGreaterThanOrEqual(0);
    const original = before.requirements[idx];
    const originalTextBefore = original.text;
    const originalKindBefore = original.kind;

    const fixtureState = {
      ...before,
      requirements: before.requirements.map((r, i) =>
        i === idx ? { ...r, text: 'The user interface must use a specific shade of blue' } : r
      ),
    };

    const decisions = constraintSpecialist(fixtureState);
    const reclass = decisions.find(
      (d) => d.type === 'requirement' && d.category === 'nonNegotiables' && d.item.text.includes('may need reclassification')
    );
    expect(reclass).toBeDefined();
    if (reclass?.type === 'requirement') {
      expect(reclass.item.source).toBe('constraint-specialist');
      expect(reclass.item.kind).not.toBe('user');
      expect(reclass.item.evidence.some((e) => e.includes('references:'))).toBe(true);
    }

    // The original item (in the real, unmodified pipeline state) was never
    // touched by this process.
    expect(original.text).toBe(originalTextBefore);
    expect(original.kind).toBe(originalKindBefore);
  });

  it('end-to-end ARCHITECT mode: a single real pipeline call produces all seven specialist sources together, in correct pipeline order', () => {
    const state = runArchitectPipeline('make me a horror game');
    expect(state.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
    const order = state.stagesRun;
    expect(order.indexOf('qaSpecialistPass')).toBeLessThan(order.indexOf('constraintSpecialistPass'));
    expect(order.indexOf('constraintSpecialistPass')).toBeLessThan(order.indexOf('critique'));
    expect(order.indexOf('constraintSpecialistPass')).toBeLessThan(order.indexOf('conflict'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
    expect(sources.has('qa-specialist')).toBe(true);
    expect(sources.has('constraint-specialist')).toBe(true);
  });

  it('end-to-end MASTER mode: a real runMasterPipeline call produces all seven specialist sources together (separate from the ARCHITECT test, per MASTER having its own runner)', () => {
    const state = runMasterPipeline('make me a horror game');
    expect(state.stagesRun).toContain('constraintSpecialistPass');
    const order = state.stagesRun;
    expect(order.indexOf('qaSpecialistPass')).toBeLessThan(order.indexOf('constraintSpecialistPass'));
    expect(order.indexOf('constraintSpecialistPass')).toBeLessThan(order.indexOf('critique'));

    const compiled = state.compiled;
    const allItems = [
      ...compiled.userRequirements,
      ...compiled.nonNegotiables,
      ...compiled.preferences,
      ...compiled.constraints,
      ...compiled.assumptions,
      ...compiled.functionalRequirements,
    ];
    const sources = new Set(allItems.map((i) => i.source));
    expect(sources.has('architect-specialist')).toBe(true);
    expect(sources.has('technical-specialist')).toBe(true);
    expect(sources.has('ux-specialist')).toBe(true);
    expect(sources.has('security-specialist')).toBe(true);
    expect(sources.has('creative-specialist')).toBe(true);
    expect(sources.has('qa-specialist')).toBe(true);
    expect(sources.has('constraint-specialist')).toBe(true);
  });

  it('MASTER-loop safety (TASK-009/010/013 re-verification with a 7th specialist): dry-check still stops early and maxRounds cap still holds', () => {
    // Re-confirms the pre-existing dry-round and maxRounds-cap tests still
    // mean what they're supposed to now that CONSTRAINT contributes a 7th
    // specialist's worth of items into the requirements pool feeding the
    // deliberation loop's seen-identity set.
    const stageLog: string[] = [];
    runMasterPipeline('build me a website', {
      maxRounds: 5,
      onStage: (name) => stageLog.push(name),
    });
    const round3Entries = stageLog.filter((n) => /\(round 3\)/.test(n));
    expect(round3Entries.length).toBe(0);

    const capStageLog: string[] = [];
    const state = runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight, no login required', {
      maxRounds: 1,
      onStage: (name) => capStageLog.push(name),
    });
    expect(capStageLog.some((n) => /\(round \d+\)/.test(n))).toBe(false);
    expect(state.stagesRun.filter((n) => n === 'critique').length).toBe(1);
    expect(state.stagesRun.filter((n) => n === 'conflict').length).toBe(1);
    expect(state.stagesRun).toContain('constraintSpecialistPass');
  });
});

describe('Critique engine (TASK-005)', () => {
  it('fires on a deliberately weak/unresolved scenario: vague game input leaves unresolved ambiguities and low-confidence recommendations, and critique flags both', () => {
    const state = runArchitectPipeline('make me a game');
    const critiqueItems = state.requirements.filter((r) => r.source === 'critique-engine');
    expect(critiqueItems.length).toBeGreaterThan(0);
    for (const item of critiqueItems) {
      expect(item.kind).toBe('recommendation');
      expect(item.status).toBe('pending');
      expect(item.evidence.length).toBeGreaterThan(0);
    }

    // Rule 3: at least one finding references an ambiguity that is still
    // unresolved after every specialist ran (vague "make me a game" leaves
    // platform/genre/engine all unspecified).
    const unresolvedFinding = critiqueItems.find((i) => i.text.includes('Unresolved ambiguity survived'));
    expect(unresolvedFinding).toBeDefined();

    // Rule 1: at least one finding flags a genuinely low-confidence
    // recommendation (unaddressed specialist considerations sit at
    // confidence 0.6, below the 0.65 threshold).
    const lowConfidenceFinding = critiqueItems.find((i) => i.text.includes('Low-confidence recommendation flagged'));
    expect(lowConfidenceFinding).toBeDefined();

    // Confirm synthesis picked up the critique findings for free (no
    // synthesis.ts changes were needed) — they show up in the final
    // CompiledPrompt's assumptions section.
    const compiled = compileArchitect('make me a game');
    expect(compiled.assumptions.some((a) => a.source === 'critique-engine')).toBe(true);
  });

  it('near-duplicate rule fires on two cross-source recommendations with heavily overlapping text (direct stage-level test)', () => {
    const state = runArchitectPipeline('make an app');
    const withDuplicates = {
      ...state,
      requirements: [
        ...state.requirements,
        {
          text: 'Consider adding a robust user notification system for updates',
          kind: 'recommendation' as const,
          source: 'technical-specialist',
          confidence: 0.6,
          evidence: ['test-fixture'],
          status: 'pending' as const,
        },
        {
          text: 'Consider adding a robust user notification system for alerts',
          kind: 'recommendation' as const,
          source: 'ux-specialist',
          confidence: 0.6,
          evidence: ['test-fixture'],
          status: 'pending' as const,
        },
      ],
      requirementCategories: [...state.requirementCategories, 'preferences' as const, 'preferences' as const],
    };

    // Re-run the critique stage directly over the fixture state (unit-level,
    // since near-duplicate cross-specialist recommendations this similar
    // don't currently occur naturally from the real domain data).
    const result = critique(withDuplicates);
    const dup = result.requirements.find((r) => r.source === 'critique-engine' && r.text.includes('Near-duplicate'));
    expect(dup).toBeDefined();
    expect(dup!.evidence.some((e) => e.includes('technical-specialist'))).toBe(true);
    expect(dup!.evidence.some((e) => e.includes('ux-specialist'))).toBe(true);
  });
});

describe('Conflict engine (TASK-005)', () => {
  it('fires on a real deterministic contradiction: horror game with multiplayer conflicts TECHNICAL networking vs. UX authored pacing curve', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    expect(state.domain).toBe('game');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(1);
    const finding = conflictItems[0];
    expect(finding.kind).toBe('recommendation');
    expect(finding.status).toBe('pending');
    expect(finding.evidence.some((e) => e.startsWith('technical-specialist:'))).toBe(true);
    expect(finding.evidence.some((e) => e.startsWith('ux-specialist:'))).toBe(true);

    // Never silently resolved: both sides are named, and it lands in the
    // final CompiledPrompt via the existing append-only synthesis merge.
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    const compiledFinding = compiled.constraints.find((c) => c.source === 'conflict-engine');
    expect(compiledFinding).toBeDefined();
    expect(compiledFinding!.status).toBe('pending');
  });

  it('negative control: horror game WITHOUT multiplayer does not false-positive the multiplayer/pacing conflict rule', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with a boss fight');
    expect(state.domain).toBe('game');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(0);
  });

  it('negative control: ordinary non-contradictory web-domain input never raises a conflict', () => {
    const state = runArchitectPipeline('I need a responsive website with a React frontend and an API backend');
    expect(state.domain).toBe('web');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(0);
  });

  it('negative control: multiplayer game input without horror genre does not false-positive', () => {
    const state = runArchitectPipeline('Make a multiplayer racing game in Unity with a boss fight');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(0);
  });

  it('fires on a real deterministic contradiction (TASK-007 verification pass): explicit "no login required" web input conflicts SECURITY unsafe-assumptions vs. UX onboarding', () => {
    const state = runArchitectPipeline('Build a website, no login required, just a public content browser');
    expect(state.domain).toBe('web');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(1);
    const finding = conflictItems[0];
    expect(finding.kind).toBe('recommendation');
    expect(finding.status).toBe('pending');
    expect(finding.evidence.some((e) => e.startsWith('security-specialist:'))).toBe(true);
    expect(finding.evidence.some((e) => e.startsWith('ux-specialist:'))).toBe(true);

    const compiled = compileArchitect('Build a website, no login required, just a public content browser');
    const compiledFinding = compiled.constraints.find((c) => c.source === 'conflict-engine');
    expect(compiledFinding).toBeDefined();
    expect(compiledFinding!.status).toBe('pending');
  });

  it('negative control: ordinary web input without an explicit no-auth statement does not false-positive the no-login/onboarding conflict rule', () => {
    const state = runArchitectPipeline('I need a responsive website with a React frontend and an API backend');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    expect(conflictItems.length).toBe(0);
  });

  it('negative control: "no login required" phrasing in a non-web domain does not fire the web-only no-auth conflict rule', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer, no login required though');
    expect(state.domain).toBe('game');
    const conflictItems = state.requirements.filter((r) => r.source === 'conflict-engine');
    // The horror/multiplayer rule still fires (expected), but not a second,
    // web-only no-auth finding — this domain never has a security-specialist
    // decision to match against in the first place.
    expect(conflictItems.length).toBe(1);
    expect(conflictItems[0].evidence.some((e) => e.startsWith('technical-specialist:'))).toBe(true);
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

describe('QUICK pipeline (TASK-008)', () => {
  it('runs exactly the 5 named QUICK stages in order', () => {
    const state = runQuickPipeline('build me a website');
    expect(state.stagesRun).toEqual([...QUICK_MODE_STAGE_NAMES]);
  });

  it('never throws on empty string input', () => {
    expect(() => compileQuick('')).not.toThrow();
    const compiled = compileQuick('');
    expect(compiled.domain).toBe('unknown');
    expect(compiled.userRequirements).toEqual([]);
  });

  it('never throws on whitespace-only input', () => {
    expect(() => compileQuick('   \n\t  ')).not.toThrow();
  });

  it('never throws on extremely long input and completes quickly', () => {
    const longInput = 'build a website with must have features. '.repeat(2000);
    const start = Date.now();
    expect(() => compileQuick(longInput)).not.toThrow();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it('never throws on contradictory input', () => {
    expect(() =>
      compileQuick('no budget at all but needs a AAA game engine with unity and unreal')
    ).not.toThrow();
    const compiled = compileQuick('no budget at all but needs a AAA game engine with unity and unreal');
    expect(compiled.domain).toBe('game');
  });

  it('QUICK mode output is measurably lighter than ARCHITECT mode for identical input', () => {
    const input = 'Make a horror game in Unity with multiplayer and a boss fight';
    const quick = compileQuick(input);
    const architect = compileArchitect(input);

    // QUICK never runs specialists/critique/conflict, so it has strictly
    // fewer total requirement items across all sections than ARCHITECT.
    const countAll = (c: typeof quick) =>
      c.userRequirements.length +
      c.nonNegotiables.length +
      c.preferences.length +
      c.constraints.length +
      c.assumptions.length +
      c.functionalRequirements.length;
    expect(countAll(quick)).toBeLessThan(countAll(architect));

    // No architecture notes at all in QUICK output (architectSpecialistPass never runs).
    expect(quick.architecture === undefined || quick.architecture.length === 0).toBe(true);
    expect(architect.architecture && architect.architecture.length > 0).toBe(true);

    // No critique-engine / conflict-engine sourced items in QUICK output.
    const quickSources = countAll(quick) === 0 ? [] : [
      ...quick.userRequirements, ...quick.nonNegotiables, ...quick.preferences,
      ...quick.constraints, ...quick.assumptions, ...quick.functionalRequirements,
    ].map((r) => r.source);
    expect(quickSources.some((s) => s === 'critique-engine' || s === 'conflict-engine')).toBe(false);
    expect(quickSources.some((s) => s.includes('specialist'))).toBe(false);

    // No unresolved ambiguity flags in QUICK output (ambiguityDetection never runs).
    expect(quick.assumptions.filter((a) => a.kind === 'unresolved').length).toBe(0);
    const architectUnresolved = architect.assumptions.filter((a) => a.kind === 'unresolved');
    expect(architectUnresolved.length).toBeGreaterThan(0);
  });

  it('QUICK mode fewer pipeline stages than ARCHITECT mode for the same input', () => {
    const quick = runQuickPipeline('build me a website');
    const architect = runArchitectPipeline('build me a website');
    expect(quick.stagesRun.length).toBeLessThan(architect.stagesRun.length);
  });

  it('QUICK mode never emits kind: "user" on anything it introduces itself', () => {
    // requirementExtraction (reused unchanged) legitimately emits kind:'user'
    // for explicit user-stated requirements — that's correct provenance, not
    // a fabrication. The discipline being tested is that no *other* part of
    // QUICK mode (synthesis/outputValidation, or the absence of ambiguity
    // defaults) introduces a fabricated kind:'user' item that wasn't already
    // present verbatim in requirementExtraction's own output.
    const input = 'Build a website for a bakery. The site must support online ordering.';
    const afterExtraction = (() => {
      let state = runQuickPipeline(input, {
        onStage: () => {},
      });
      return state;
    })();

    const compiled = compileQuick(input);
    const allItems = [
      ...compiled.userRequirements, ...compiled.nonNegotiables, ...compiled.preferences,
      ...compiled.constraints, ...compiled.assumptions, ...compiled.functionalRequirements,
    ];
    const userItems = allItems.filter((r) => r.kind === 'user');
    // Every kind:'user' item must be sourced from user-input (requirementExtraction's
    // own provenance tag), never from synthesis/outputValidation/QUICK-introduced logic.
    for (const item of userItems) {
      expect(item.source).toBe('user-input');
    }
    // Sanity: afterExtraction reference is used to avoid an unused-var lint issue
    // while keeping the intent of the comment above explicit.
    expect(afterExtraction.stagesRun.length).toBeGreaterThan(0);
  });

  it('QUICK mode never emits ambiguity-checklist-sourced defaults (no ambiguityDetection stage runs, per documented decision)', () => {
    const compiled = compileQuick('make me a game');
    const allItems = [
      ...compiled.userRequirements, ...compiled.nonNegotiables, ...compiled.preferences,
      ...compiled.constraints, ...compiled.assumptions, ...compiled.functionalRequirements,
    ];
    // requirementExtraction (reused unchanged) may legitimately emit kind:'default'
    // for an inferred task type — that's pre-existing, unrelated stage behavior.
    // What QUICK mode must never do is synthesize a default for an unresolved
    // ambiguity-checklist field, since ambiguityDetection never runs in QUICK.
    expect(allItems.some((r) => typeof r.source === 'string' && r.source.includes('ambiguity-checklist'))).toBe(false);
  });

  it('compileQuick mirrors compileArchitect convenience-export pattern and returns a valid CompiledPrompt', () => {
    const compiled = compileQuick('build me a website');
    expect(compiled.domain).toBe('web');
    expect(Array.isArray(compiled.userRequirements)).toBe(true);
  });
});

describe('MASTER pipeline (TASK-009)', () => {
  it('compiles successfully without throwing on the same edge cases as ARCHITECT/QUICK', () => {
    const inputs = ['', '   ', '!!!???...', 'x'.repeat(200000), '😀😀😀😀', 'must include tracking but must not include tracking'];
    for (const input of inputs) {
      expect(() => compileMaster(input)).not.toThrow();
      const compiled = compileMaster(input);
      expect(compiled.domain).toBeDefined();
      expect(Array.isArray(compiled.userRequirements)).toBe(true);
    }
  });

  it('runs the expected stage sequence for a simple input, including requirementExpansion and the deliberation loop stages', () => {
    const state = runMasterPipeline('build me a website');
    expect(state.stagesRun).toContain('requirementExpansion');
    expect(state.stagesRun).toContain('architectSpecialistPass');
    expect(state.stagesRun).toContain('critique');
    expect(state.stagesRun).toContain('conflict');
    expect(state.stagesRun).toContain('alternativeGeneration');
    expect(state.stagesRun).toContain('decisionScoring');
    expect(state.stagesRun).toContain('synthesis');
    expect(state.stagesRun[state.stagesRun.length - 1]).toBe('outputValidation');
  });

  it('onStage fires for every actual execution, with repeated deliberation rounds distinguishable in the name', () => {
    const stageLog: string[] = [];
    runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight', {
      maxRounds: 2,
      onStage: (name) => stageLog.push(name),
    });
    // round 1 keeps bare names, any round 2+ execution carries a "(round N)" suffix
    expect(stageLog.filter((n) => n === 'critique').length).toBe(1);
    const round2Entries = stageLog.filter((n) => /\(round 2\)/.test(n));
    // Whether round 2 actually ran depends on dryness, but if it did run, every
    // one of the 4 loop stage names must be distinguishable via the suffix.
    if (round2Entries.length > 0) {
      expect(stageLog).toContain('critique (round 2)');
      expect(stageLog).toContain('conflict (round 2)');
      expect(stageLog).toContain('alternativeGeneration (round 2)');
      expect(stageLog).toContain('decisionScoring (round 2)');
    }
  });

  it('MASTER output is demonstrably richer than ARCHITECT for a conflict-bearing input (horror + multiplayer game)', () => {
    const input = 'Make a horror game in Unity with multiplayer and a boss fight';
    const architectCompiled = compileArchitect(input);
    const masterCompiled = compileMaster(input);

    const flatten = (c: typeof architectCompiled) => [
      ...c.userRequirements, ...c.nonNegotiables, ...c.preferences,
      ...c.constraints, ...c.assumptions, ...c.functionalRequirements,
    ];

    const architectItems = flatten(architectCompiled);
    const masterItems = flatten(masterCompiled);

    // MASTER must be strictly richer in total item count.
    expect(masterItems.length).toBeGreaterThan(architectItems.length);

    // ARCHITECT never runs alternativeGeneration/requirementExpansion/decisionScoring — MASTER does.
    expect(architectItems.some((i) => i.source === 'alternative-generation')).toBe(false);
    expect(masterItems.some((i) => i.source === 'alternative-generation')).toBe(true);
    expect(architectItems.some((i) => i.source === 'requirement-expansion')).toBe(false);
    expect(masterItems.some((i) => i.source === 'requirement-expansion')).toBe(true);

    // The same underlying game-domain conflict must still be caught by both
    // (conflict.ts is reused unchanged), but only MASTER goes on to propose
    // an alternative resolution for it.
    expect(architectItems.some((i) => i.source === 'conflict-engine')).toBe(true);
    expect(masterItems.some((i) => i.source === 'conflict-engine')).toBe(true);
    const alt = masterItems.find((i) => i.source === 'alternative-generation');
    expect(alt).toBeDefined();
    expect(alt!.evidence.some((e) => e.startsWith('addresses-conflict:'))).toBe(true);
  });

  it('the deliberation loop stops early on a dry round rather than always running maxRounds times', () => {
    // A plain web-domain input with no genuine conflict signal: critique may
    // still fire (unresolved ambiguity / low-confidence recommendations),
    // but by round 2 every finding critique/conflict re-produces is already
    // in the seen-identity set, and alternativeGeneration/decisionScoring
    // dedupe their own output — so round 2 should find nothing new and the
    // loop should stop before reaching round 3, even though maxRounds is 5.
    const stageLog: string[] = [];
    runMasterPipeline('build me a website', {
      maxRounds: 5,
      onStage: (name) => stageLog.push(name),
    });
    const round3Entries = stageLog.filter((n) => /\(round 3\)/.test(n));
    const round2Entries = stageLog.filter((n) => /\(round 2\)/.test(n));
    // Fewer round-2-or-later entries than maxRounds would imply proves the
    // loop did not run all 5 rounds unconditionally.
    expect(round3Entries.length).toBe(0);
    // round 2 stage count (0 or 4) must be strictly less than what 5 full
    // rounds would have produced (4 stages * 4 extra rounds = 16 round-N entries).
    const allRoundNEntries = stageLog.filter((n) => /\(round \d+\)/.test(n));
    expect(allRoundNEntries.length).toBeLessThan(4 * 4);
    // Document the observed behavior directly: round 2 ran at most once (4 stages), never more.
    expect(round2Entries.length === 0 || round2Entries.length === 4).toBe(true);
  });

  it('maxRounds is respected as a hard cap, even forced to 1 (exactly one round runs regardless of dry-check)', () => {
    const stageLog: string[] = [];
    const state = runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight', {
      maxRounds: 1,
      onStage: (name) => stageLog.push(name),
    });
    // With maxRounds:1 there can never be a "(round 2)"+ entry, no matter how many new findings round 1 produced.
    expect(stageLog.some((n) => /\(round \d+\)/.test(n))).toBe(false);
    expect(state.stagesRun.filter((n) => n === 'critique').length).toBe(1);
    expect(state.stagesRun.filter((n) => n === 'conflict').length).toBe(1);
  });

  it('maxRounds hard cap holds even under input designed to keep finding conflicts across the two web/game conflict rules', () => {
    // Adversarial-ish input: triggers BOTH existing conflict rules (web
    // no-login-required AND game horror/multiplayer can't both trigger on
    // one domain-classified input, so this uses the strongest single-domain
    // trigger available) plus vague/ambiguous phrasing to maximize critique
    // findings across rounds. Verifies the loop never exceeds maxRounds
    // regardless of how much genuinely-new material keeps surfacing.
    const input = 'Make a horror game in Unity with multiplayer and a boss fight, no login required';
    const maxRounds = 3;
    const stageLog: string[] = [];
    runMasterPipeline(input, { maxRounds, onStage: (name) => stageLog.push(name) });
    const roundNumbers = new Set<number>([1]);
    for (const name of stageLog) {
      const m = name.match(/\(round (\d+)\)/);
      if (m) roundNumbers.add(Number(m[1]));
    }
    expect(Math.max(...roundNumbers)).toBeLessThanOrEqual(maxRounds);
  });

  it('never fabricates kind: user in any new MASTER-only stage output', () => {
    const state = runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const masterOnlySources = ['requirement-expansion', 'alternative-generation', 'decision-scoring'];
    for (const item of state.requirements) {
      if (masterOnlySources.includes(item.source)) {
        expect(item.kind).not.toBe('user');
      }
    }
  });

  it('alternativeGeneration only acts on status:pending conflicts and never flips a conflict to accepted/rejected itself', () => {
    const state = runMasterPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const conflicts = state.requirements.filter((i) => i.source === 'conflict-engine');
    for (const c of conflicts) {
      expect(c.status).toBe('pending'); // never auto-resolved by alternativeGeneration
    }
    const alternatives = state.requirements.filter((i) => i.source === 'alternative-generation');
    expect(alternatives.length).toBeGreaterThan(0);
    for (const a of alternatives) {
      expect(a.status).toBe('pending');
    }
  });

  it('compileMaster mirrors compileArchitect/compileQuick convenience-export pattern and returns a valid CompiledPrompt', () => {
    const compiled = compileMaster('build me a website');
    expect(compiled.domain).toBe('web');
    expect(Array.isArray(compiled.userRequirements)).toBe(true);
  });

  it('ARCHITECT and QUICK mode stage sequences are bit-for-bit unaffected by MASTER mode existing', () => {
    const architectState = runArchitectPipeline('build me a website');
    expect(architectState.stagesRun).toEqual([...ARCHITECT_MODE_STAGE_NAMES]);
    const quickState = runQuickPipeline('build me a website');
    expect(quickState.stagesRun).toEqual([...QUICK_MODE_STAGE_NAMES]);
  });
});

describe('requirementExpansion stage (isolated)', () => {
  it('emits kind: inferred items for architecture-template components not mentioned in raw input, never kind: user', () => {
    const state = runArchitectPipeline('build me a website'); // reuse to get a real post-domain-detection state shape
    const expanded = requirementExpansion({ ...state, requirements: [], requirementCategories: [] });
    expect(expanded.stagesRun[expanded.stagesRun.length - 1]).toBe('requirementExpansion');
    for (const item of expanded.requirements) {
      expect(item.kind).toBe('inferred');
      expect(item.kind).not.toBe('user');
      expect(item.source).toBe('requirement-expansion');
    }
  });

  it('does not re-state an architecture component already mentioned in raw input', () => {
    const state = runArchitectPipeline('build a web app, with hosting on Vercel and a defined API contract');
    const expanded = requirementExpansion({ ...state, requirements: [], requirementCategories: [] });
    // web domain's architectureTemplate includes a "frontend"/"backend"/"hosting"/"data" style set —
    // whichever components literally appear in raw input should not be re-surfaced as expansion items.
    const mentionsHosting = expanded.requirements.some((i) => i.text.toLowerCase().includes('"hosting"'));
    expect(mentionsHosting).toBe(false);
  });
});

describe('alternativeGeneration stage (isolated)', () => {
  it('generates exactly one alternative per distinct pending conflict, naming both sides in evidence', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const conflictsOnly = state.requirements.filter((i) => i.source === 'conflict-engine');
    expect(conflictsOnly.length).toBeGreaterThan(0);

    const result = alternativeGeneration(state);
    const newAlternatives = result.requirements.filter((i) => i.source === 'alternative-generation');
    expect(newAlternatives.length).toBe(conflictsOnly.length);
    for (const alt of newAlternatives) {
      expect(alt.kind).toBe('recommendation');
      expect(alt.status).toBe('pending');
      expect(alt.evidence.some((e) => e.startsWith('addresses-conflict:'))).toBe(true);
    }
  });

  it('is idempotent-safe: running it twice on the same conflicts does not duplicate alternatives', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const once = alternativeGeneration(state);
    const twice = alternativeGeneration(once);
    const onceCount = once.requirements.filter((i) => i.source === 'alternative-generation').length;
    const twiceCount = twice.requirements.filter((i) => i.source === 'alternative-generation').length;
    expect(twiceCount).toBe(onceCount);
  });

  it('never flips a conflict status to accepted/rejected (no auto-resolution)', () => {
    const state = runArchitectPipeline('Make a horror game in Unity with multiplayer and a boss fight');
    const before = state.requirements.filter((i) => i.source === 'conflict-engine').map((i) => i.status);
    const result = alternativeGeneration(state);
    const after = result.requirements.filter((i) => i.source === 'conflict-engine').map((i) => i.status);
    expect(after).toEqual(before);
  });

  it('produces zero alternatives when there are zero pending conflicts', () => {
    const state = runArchitectPipeline('build me a website'); // no conflict-triggering signal
    const result = alternativeGeneration(state);
    expect(result.requirements.filter((i) => i.source === 'alternative-generation').length).toBe(0);
  });
});

describe('decisionScoring stage (isolated)', () => {
  it('flags still-pending items below the high-risk confidence floor, with risk: high and correct provenance', () => {
    const state = runArchitectPipeline('make me a game'); // vague input -> low-confidence recommendations survive
    const result = decisionScoring(state);
    const flagged = result.requirements.filter((i) => i.source === 'decision-scoring');
    expect(flagged.length).toBeGreaterThan(0);
    for (const f of flagged) {
      expect(f.risk).toBe('high');
      expect(f.kind).toBe('recommendation');
      expect(f.status).toBe('pending');
      expect(f.evidence.some((e) => e.startsWith('scores-item:'))).toBe(true);
    }
  });

  it('never mutates an existing item kind/risk in place (only appends new items)', () => {
    const state = runArchitectPipeline('make me a game');
    const beforeSnapshot = state.requirements.map((i) => ({ kind: i.kind, risk: i.risk }));
    const result = decisionScoring(state);
    const afterSnapshot = state.requirements.map((i) => ({ kind: i.kind, risk: i.risk }));
    expect(afterSnapshot).toEqual(beforeSnapshot); // original state object's array entries untouched
    expect(result.requirements.length).toBeGreaterThanOrEqual(state.requirements.length);
  });

  it('is idempotent-safe: running it twice does not re-flag the same item twice', () => {
    const state = runArchitectPipeline('make me a game');
    const once = decisionScoring(state);
    const twice = decisionScoring(once);
    const onceCount = once.requirements.filter((i) => i.source === 'decision-scoring').length;
    const twiceCount = twice.requirements.filter((i) => i.source === 'decision-scoring').length;
    expect(twiceCount).toBe(onceCount);
  });

  it('produces zero flags when there is nothing below the confidence floor among pending items', () => {
    // Construct a fixture state with only high-confidence pending items.
    const base = runArchitectPipeline('build me a website');
    const fixtureState = {
      ...base,
      requirements: [
        { text: 'high confidence item', kind: 'recommendation' as const, source: 'fixture', confidence: 0.9, evidence: [], status: 'pending' as const },
      ],
      requirementCategories: ['assumptions' as const],
    };
    const result = decisionScoring(fixtureState);
    expect(result.requirements.filter((i) => i.source === 'decision-scoring').length).toBe(0);
  });
});
