import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('e-commerce domain', () => {
  it('detects e-commerce domain on a realistic storefront request', () => {
    const compiled = compileArchitect(
      'Build an online store with a shopping cart, Stripe checkout, product catalog with SKUs, and shipping rate calculation'
    );
    expect(compiled.domain).toBe('e-commerce');
  });

  it('negative control: an unrelated software-development request does not misclassify as e-commerce', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('e-commerce');
  });

  it('word-boundary regression: unrelated words do not falsely trigger e-commerce keywords', () => {
    const state = runArchitectPipeline('The scavenger cartographer studied the multiplayer arcade cartel logo carefully');
    expect(state.domain).not.toBe('e-commerce');
  });

  it('word-boundary regression: new keywords do not false-positive inside unrelated words', () => {
    const state = runArchitectPipeline('The buyer is now buying nowhere near the marketplacement district');
    expect(state.domain).not.toBe('e-commerce');
  });

  it('detects e-commerce domain using newly added phrasing (multi-vendor marketplace, loyalty program)', () => {
    const compiled = compileArchitect(
      'Design a multi-vendor marketplace with dropshipping support, a loyalty program, gift cards, and product recommendations for buyers'
    );
    expect(compiled.domain).toBe('e-commerce');
  });

  it('ambiguity checklist flags vendor model and promotions when unspecified', () => {
    const compiled = compileArchitect(
      'Build an online store with checkout and a product catalog'
    );
    expect(compiled.domain).toBe('e-commerce');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/vendor model|promotions and loyalty|single-seller|multi-vendor/i);
  });

  it('ambiguity checklist resolves vendor model and promotions fields when specified', () => {
    const compiled = compileArchitect(
      'Build a multi-vendor marketplace online store with a loyalty program, Stripe checkout, and SKU-based inventory of 5000 products'
    );
    expect(compiled.domain).toBe('e-commerce');
    const unresolvedText = JSON.stringify(compiled.ambiguities ?? compiled);
    expect(unresolvedText).not.toMatch(/vendor model is unspecified/i);
    expect(unresolvedText).not.toMatch(/promotions.*loyalty.*unspecified/i);
  });

  it('constraint specialist flags small-team vs multi-vendor marketplace infeasibility', () => {
    const compiled = compileArchitect(
      'I am a solo founder building a multi-vendor marketplace with third-party sellers, Stripe checkout, and product catalog'
    );
    expect(compiled.domain).toBe('e-commerce');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/split payments|seller onboarding|multi[- ]vendor marketplace/i);
  });

  it('QA specialist surfaces an e-commerce-specific consideration', () => {
    const compiled = compileArchitect(
      'Build an online store with product variants (size/color), Stripe checkout, multi-currency pricing, and shipping integration'
    );
    expect(compiled.domain).toBe('e-commerce');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/variant\/inventory drift|multi-currency rounding|orphan existing cart items/i);
  });
});
