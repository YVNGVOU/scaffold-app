import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('business domain', () => {
  it('business domain detected on canonical business example', () => {
    const compiled = compileArchitect(
      'I need a business plan covering our business model, target market, pricing strategy, and go-to-market plan for a new startup'
    );
    expect(compiled.domain).toBe('business');
  });

  it('negative control: unrelated web request does not misclassify as business', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('business');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as business', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // Bare 'plan' or 'market' matching inside unrelated words (e.g. "planet", "supermarket")
    // must not inflate the business score.
    const state = runArchitectPipeline('The planet was visible above the supermarket at sunset during our planning walk');
    expect(state.domain).not.toBe('business');
  });

  it('architect specialist produces business-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Write a business plan for a subscription coffee delivery startup, including target market and revenue model'
    );
    expect(state.domain).toBe('business');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsBusinessModel = architectureItems.some((r) => r.text.toLowerCase().includes('business model') || r.text.toLowerCase().includes('market'));
    expect(mentionsBusinessModel).toBe(true);
  });

  it('technical specialist produces business-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Build a financial plan and go-to-market strategy for our new B2B SaaS startup targeting small businesses'
    );
    expect(state.domain).toBe('business');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsBusinessTech = technicalItems.some((r) => /unit economics|forecast|CAC|LTV|data sources/i.test(r.text));
    expect(mentionsBusinessTech).toBe(true);
  });
});
