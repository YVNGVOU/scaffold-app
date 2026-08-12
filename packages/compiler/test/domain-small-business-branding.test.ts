import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('small-business-branding domain', () => {
  it('detects small-business-branding domain on a realistic starter kit request', () => {
    const compiled = compileArchitect(
      'I need a small business branding kit for my new coffee cart: a starter logo, basic colors and fonts, plus a business card design and a storefront sign, budget-friendly and quick turnaround'
    );
    expect(compiled.domain).toBe('small-business-branding');
  });

  it('negative control: an unrelated software-development request does not misclassify as small-business-branding', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('small-business-branding');
  });

  it('word-boundary regression: unrelated words do not falsely trigger small-business-branding keywords', () => {
    const state = runArchitectPipeline('The sign of a good business plan is knowing your local market and starting small');
    expect(state.domain).not.toBe('small-business-branding');
  });

  it('disambiguation: a full multi-touchpoint identity system request classifies as branding, not small-business-branding', () => {
    const compiled = compileArchitect(
      'Create a complete brand identity system with full brand guidelines, color palette, typography, and moodboard for a global rollout across all our touchpoints'
    );
    expect(compiled.domain).toBe('branding');
  });

  it('disambiguation: a starter logo + business card request for a local shop classifies as small-business-branding, not branding', () => {
    const compiled = compileArchitect(
      'I run a small shop and need small business branding: a starter logo, a business card design, and a storefront sign, budget-friendly and quick turnaround'
    );
    expect(compiled.domain).toBe('small-business-branding');
  });

  it('architect specialist produces small-business-branding-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'I need small business branding for my new bakery: a starter logo, basic color/type system, a business card design, and a storefront sign, budget-conscious and fast turnaround'
    );
    expect(compiled.domain).toBe('small-business-branding');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/business card layout|storefront|starter logo|starter usage sheet/i);
  });

  it('technical specialist surfaces a small-business-branding-specific consideration', () => {
    const compiled = compileArchitect(
      'I need small business branding for my new bakery: a starter logo, basic color/type system, a business card design, and a storefront sign, budget-conscious and fast turnaround'
    );
    expect(compiled.domain).toBe('small-business-branding');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/sign production|print vs digital|scalability across sizes|owner self-sufficiency/i);
  });
});
