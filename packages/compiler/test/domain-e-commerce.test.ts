import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('e-commerce domain', () => {
  it('detects e-commerce domain on a realistic online store request', () => {
    const compiled = compileArchitect(
      'Build an online store with a shopping cart, Stripe payment gateway integration, product catalog with SKU-based inventory, and shipping rate calculation at checkout'
    );
    expect(compiled.domain).toBe('e-commerce');
  });

  it('negative control: an unrelated web-focused request does not misclassify as e-commerce', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('e-commerce');
    expect(compiled.domain).toBe('web');
  });

  it('negative control: a generic business request without e-commerce-specific detail does not misclassify as e-commerce', () => {
    const compiled = compileArchitect('Write a business plan for a small consulting firm targeting local clients');
    expect(compiled.domain).not.toBe('e-commerce');
  });

  it('word-boundary regression: unrelated words do not falsely trigger e-commerce keywords', () => {
    const state = runArchitectPipeline('The forecaster must pay attention to atmospheric pressure changes this week');
    expect(state.domain).not.toBe('e-commerce');
  });

  it('architect specialist produces e-commerce-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build an e-commerce storefront with a product catalog, shopping cart, checkout flow using Stripe, order management, and inventory sync with our warehouse system, plus shipping integration with FedEx and UPS'
    );
    expect(compiled.domain).toBe('e-commerce');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/cart and checkout service|payment gateway integration|inventory sync service|order management system/i);
  });

  it('technical specialist surfaces an e-commerce-specific consideration', () => {
    const compiled = compileArchitect(
      'Build an e-commerce storefront with a product catalog, shopping cart, checkout flow using Stripe, order management, and inventory sync with our warehouse system, plus shipping integration with FedEx and UPS'
    );
    expect(compiled.domain).toBe('e-commerce');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/payment gateway|inventory consistency|tax calculation|shipping rate calculation/i);
  });
});
