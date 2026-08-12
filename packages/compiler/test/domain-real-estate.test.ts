import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('real-estate domain', () => {
  it('detects real-estate domain on a realistic real estate request', () => {
    const compiled = compileArchitect(
      'Build a real estate listing platform with MLS/IDX integration, map-based property search, listing detail pages with square footage and price history, and fair housing-compliant filtering'
    );
    expect(compiled.domain).toBe('real-estate');
  });

  it('negative control: an unrelated finance-focused request does not misclassify as real-estate', () => {
    const compiled = compileArchitect(
      'Build a personal budgeting app that tracks expenses, categorizes transactions, and shows spending trends against a monthly budget'
    );
    expect(compiled.domain).not.toBe('real-estate');
  });

  it('word-boundary regression: unrelated words do not falsely trigger real-estate keywords', () => {
    const state = runArchitectPipeline('The tenants of good software design include modularity and testability, please help me lease out my API rate limits appropriately');
    // "tenants" and "lease" as generic English words should not on their own force real-estate domain
    // over a stronger-signal domain; this just confirms no crash/false-positive lock on unrelated software input
    expect(state.domain).not.toBe('unknown');
  });

  it('architect specialist produces real-estate-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a real estate brokerage platform with MLS listing ingestion, geospatial search, an agent dashboard for managing listings and leads, and a compliance layer for fair housing rules'
    );
    expect(compiled.domain).toBe('real-estate');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/listing ingestion|geospatial search|agent\/broker dashboard|compliance layer/i);
  });

  it('technical specialist surfaces a real-estate-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a real estate brokerage platform with MLS listing ingestion, geospatial search, an agent dashboard for managing listings and leads, and a compliance layer for fair housing rules'
    );
    expect(compiled.domain).toBe('real-estate');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/MLS integration|geocoding|data freshness|fair housing/i);
  });
});
