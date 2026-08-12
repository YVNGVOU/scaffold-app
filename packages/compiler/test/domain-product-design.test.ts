import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('product-design domain', () => {
  it('product-design domain detected on canonical product design example', () => {
    const compiled = compileArchitect(
      'We need user research and wireframes for a new onboarding flow, followed by a clickable prototype and usability testing'
    );
    expect(compiled.domain).toBe('product-design');
  });

  it('negative control: unrelated web request does not misclassify as product-design', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('product-design');
  });

  it('negative control: game request does not misclassify as product-design', () => {
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    expect(compiled.domain).not.toBe('product-design');
  });

  it('technical specialist produces product-design-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Run user interviews and build a design system with wireframes and a prototype for our checkout redesign'
    );
    expect(state.domain).toBe('product-design');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDomainConcept = technicalItems.some((r) =>
      /(design tool|figma|handoff|design system|prototype|redlines|tokens)/i.test(r.text)
    );
    expect(mentionsDomainConcept).toBe(true);
  });

  it('architect stage includes product-design architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('We need a usability testing plan and prototype for our new mobile app concept');
    expect(state.domain).toBe('product-design');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
  });
});
