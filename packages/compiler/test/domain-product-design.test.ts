import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('product-design domain', () => {
  it('detects product-design domain on a realistic UX research request', () => {
    const compiled = compileArchitect(
      'Run a design sprint to redesign the onboarding flow, including user interviews, wireframes, and a clickable prototype for usability testing'
    );
    expect(compiled.domain).toBe('product-design');
  });

  it('negative control: an unrelated backend request does not misclassify as product-design', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('product-design');
  });

  it('word-boundary regression: "jtbd"/"ia" style short keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline('The media library uses trivial helper utilities in its Java IA integration layer for authentication tokens');
    expect(state.domain).not.toBe('product-design');
  });

  it('new keyword phrasing "jobs to be done" and "service blueprint" are detected', () => {
    const compiled = compileArchitect(
      'Facilitate a jobs to be done workshop and produce a service blueprint mapping the customer support journey end to end'
    );
    expect(compiled.domain).toBe('product-design');
  });

  it('ambiguity checklist flags missing platform and success metric when unspecified', () => {
    const state = runArchitectPipeline(
      'Design a new checkout flow with wireframes and a prototype for usability testing'
    );
    const unresolvedText = JSON.stringify(state);
    expect(unresolvedText).toMatch(/platform/i);
    expect(unresolvedText).toMatch(/success metric/i);
  });

  it('platform and success-metric fields resolve on short direct answers', () => {
    const compiled = compileArchitect(
      'Design a mobile app onboarding flow with wireframes and a prototype; success metric is task completion rate; usability testing with real users'
    );
    expect(compiled.domain).toBe('product-design');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/Target platform\(s\)/i);
  });

  it('surfaces new UX/security considerations for cognitive load and incentive data handling', () => {
    const compiled = compileArchitect(
      'Design a cafe finder mobile app with onboarding flow, user interviews, wireframes, prototype, and usability testing including paid research participants'
    );
    expect(compiled.domain).toBe('product-design');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/cognitive load|incentive|error prevention/i);
  });
});
