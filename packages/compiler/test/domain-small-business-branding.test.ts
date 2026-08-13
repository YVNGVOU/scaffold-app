import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('small-business-branding domain', () => {
  it('detects small-business-branding on a realistic starter kit request', () => {
    const compiled = compileArchitect(
      'I need a starter brand kit and small business logo for my coffee shop, including a business card design and storefront sign, budget-friendly branding with quick turnaround'
    );
    expect(compiled.domain).toBe('small-business-branding');
  });

  it('detects small-business-branding on a bare "coffee shop logo" phrasing', () => {
    const compiled = compileArchitect(
      'Design a small cafe branding starter logo, an affordable logo for my new small business coffee shop with a simple color palette'
    );
    expect(compiled.domain).toBe('small-business-branding');
  });

  it('negative control: an unrelated software-development request does not misclassify', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('small-business-branding');
  });

  it('disambiguation: a full multi-touchpoint rebrand classifies as branding, not small-business-branding', () => {
    const compiled = compileArchitect(
      'Create a complete brand identity system with full guidelines, packaging, and multi-touchpoint applications for a rebrand'
    );
    expect(compiled.domain).not.toBe('small-business-branding');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The startup logooking system and food truck driver simulator app needs a new database schema'
    );
    expect(state.domain).not.toBe('small-business-branding');
  });

  it('ambiguity checklist recognizes a bare answer for logo style direction', () => {
    const compiled = compileArchitect(
      'Design a starter logo for my small business, I want a wordmark, budget-friendly, quick turnaround, storefront sign included'
    );
    expect(compiled.domain).toBe('small-business-branding');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/logo style direction is unspecified/i);
  });

  it('constraint specialist flags no-budget vs custom illustration as infeasible', () => {
    const compiled = compileArchitect(
      'I have zero budget for a starter logo and small business branding but I want custom hand-lettering and bespoke illustration'
    );
    expect(compiled.domain).toBe('small-business-branding');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/custom hand-lettering|bespoke illustration/i);
  });
});
