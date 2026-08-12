import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('print-collateral domain', () => {
  it('detects print-collateral domain on a realistic small-business collateral request', () => {
    const compiled = compileArchitect(
      'Design a set of business cards and postcards for a small landscaping company, print run of 1000, on heavy cardstock with a matte finish for direct mail'
    );
    expect(compiled.domain).toBe('print-collateral');
  });

  it('negative control: an unrelated software-development request does not misclassify as print-collateral', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('print-collateral');
  });

  it('word-boundary regression: unrelated words do not falsely trigger print-collateral keywords', () => {
    const state = runArchitectPipeline('The mailerlite integration and cardstocking inventory system needs a rework of the offset table');
    expect(state.domain).not.toBe('print-collateral');
  });

  it('disambiguation: a cafe menu design request classifies as menu-design, not print-collateral', () => {
    const compiled = compileArchitect(
      'Design a restaurant menu with a food menu and drink menu section, item descriptions, and pricing layout for a bistro'
    );
    expect(compiled.domain).toBe('menu-design');
  });

  it('disambiguation: a business card print run request classifies as print-collateral, not menu-design or branding', () => {
    const compiled = compileArchitect(
      'I need business cards and rack cards printed for my new plumbing business, need a print vendor quote for 500 units on card stock'
    );
    expect(compiled.domain).toBe('print-collateral');
  });

  it('architect specialist produces print-collateral-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design business cards and a trifold brochure for a real estate agent, print-ready CMYK files, print run of 2000 for direct mail distribution'
    );
    expect(compiled.domain).toBe('print-collateral');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/bleed|paper stock|print vendor|proof review|distribution plan/i);
  });

  it('technical specialist surfaces a print-collateral-specific consideration', () => {
    const compiled = compileArchitect(
      'Design business cards and a trifold brochure for a real estate agent, print-ready CMYK files, print run of 2000 for direct mail distribution'
    );
    expect(compiled.domain).toBe('print-collateral');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/bleed and trim|color mode conversion|print quantity economics|vendor file specifications/i);
  });
});
