import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('real-estate domain', () => {
  it('detects real-estate domain on a realistic property listing platform request', () => {
    const compiled = compileArchitect(
      'Build a real estate listing platform with MLS feed integration, map-based property search, and lead capture routed to agents'
    );
    expect(compiled.domain).toBe('real-estate');
  });

  it('negative control: an unrelated software-development request does not misclassify as real-estate', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('real-estate');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated substrings', () => {
    const state = runArchitectPipeline(
      'The handicap rate for accessibility parking was reviewed by the subfloor planning committee for the new gymnasium'
    );
    expect(state.domain).not.toBe('real-estate');
  });

  it('word-boundary regression: showings/floor plan/cap rate correctly score real-estate when used in context', () => {
    const compiled = compileArchitect(
      'Schedule showings for the listing, prepare the floor plan and CMA report, and calculate the cap rate for this commercial real estate property'
    );
    expect(compiled.domain).toBe('real-estate');
  });

  it('ambiguity checklist recognizes bare short answers for property type coverage', () => {
    const compiled = compileArchitect(
      'Build a real estate platform for condos and commercial properties with MLS integration and lead capture'
    );
    expect(compiled.domain).toBe('real-estate');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/property type coverage/i);
  });

  it('surfaces the wire fraud / BEC security consideration', () => {
    const compiled = compileArchitect(
      'Build a real estate transaction platform with escrow, earnest money handling, and closing document workflow for a single-family sales market'
    );
    expect(compiled.domain).toBe('real-estate');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/wire fraud|wiring instructions/i);
  });

  it('flags the nationwide-coverage-vs-solo-developer constraint tension', () => {
    const compiled = compileArchitect(
      'I am a solo developer building a nationwide real estate listing platform covering all 50 states with MLS integration'
    );
    expect(compiled.domain).toBe('real-estate');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/single market|near term/i);
  });
});
