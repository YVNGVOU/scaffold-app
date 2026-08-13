import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('branding domain', () => {
  it('detects branding domain on a realistic identity request', () => {
    const compiled = compileArchitect(
      'Create a brand identity system with logo, color palette, typography, and brand guidelines for a new fitness startup'
    );
    expect(compiled.domain).toBe('branding');
  });

  it('detects branding domain on newly added keyword phrasings (brand voice, tagline, brand refresh)', () => {
    const compiled = compileArchitect(
      'We need a brand refresh: new brand voice, a tagline, and an updated logotype for our company'
    );
    expect(compiled.domain).toBe('branding');
  });

  it('negative control: an unrelated software-development request does not misclassify as branding', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('branding');
  });

  it('word-boundary regression: unrelated words do not falsely trigger branding keywords', () => {
    const state = runArchitectPipeline(
      'The user tried to logout of the app, but the icon marking the settings monogrammed panel was broken'
    );
    expect(state.domain).not.toBe('branding');
  });

  it('ambiguity checklist: recognizes bare short answers for usage scope and reference brands', () => {
    const compiled = compileArchitect(
      'Create a logo for our company. Usage: digital. Inspired by Airbnb.'
    );
    expect(compiled.domain).toBe('branding');
    const compiledText = JSON.stringify(compiled);
    // usage scope and reference brands should be considered addressed, not flagged unresolved
    expect(compiledText).not.toMatch(/Where the brand will be applied/);
    expect(compiledText).not.toMatch(/No reference brands, competitors/);
  });

  it('technical specialist surfaces the trademark clearance consideration', () => {
    const compiled = compileArchitect(
      'Design a full brand identity system with a new wordmark and name for our company launching soon'
    );
    expect(compiled.domain).toBe('branding');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/trademark/i);
  });
});
