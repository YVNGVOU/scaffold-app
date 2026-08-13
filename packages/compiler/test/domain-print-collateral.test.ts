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

  it('detects print-collateral domain via large-format and mailer-specific phrasings', () => {
    const compiled = compileArchitect(
      'Need banner printing for a yard sign and a vinyl banner for our storefront, plus a sell sheet and presentation folder for a trade show'
    );
    expect(compiled.domain).toBe('print-collateral');
  });

  it('word-boundary regression: bare "banner" and "folder" alone do not trigger print-collateral keywords', () => {
    const state = runArchitectPipeline('Update the banner ad component and the file folder icon in the settings panel of the app');
    expect(state.domain).not.toBe('print-collateral');
  });

  it('ambiguity checklist recognizes a short bare answer for budget/cost target', () => {
    const compiled = compileArchitect(
      'Design business cards for a plumbing company, print run of 500, budget is around $200'
    );
    const unresolved = JSON.stringify(compiled);
    // budget field should be considered resolved and thus not appear as an outstanding "budget/cost target" gap
    expect(unresolved).not.toMatch(/budget\/cost target/i);
  });

  it('surfaces the postal mail-piece/large-format consideration for a mailer request', () => {
    const compiled = compileArchitect(
      'Design an oversized direct mail postcard mailer for a landscaping company, print run of 3000, standard postage rate'
    );
    expect(compiled.domain).toBe('print-collateral');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/postal|machinable-mail|permit imprint/i);
  });
});
