import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('accessibility domain', () => {
  it('detects accessibility domain on a realistic WCAG audit request', () => {
    const compiled = compileArchitect(
      'Run a WCAG 2.1 AA accessibility audit on our web app, including a screen reader pass with NVDA and JAWS, and produce a VPAT for procurement'
    );
    expect(compiled.domain).toBe('accessibility');
  });

  it('negative control: an unrelated recipe request does not misclassify as accessibility', () => {
    const compiled = compileArchitect(
      'Write a recipe for a three-layer chocolate cake with buttercream frosting and serving suggestions'
    );
    expect(compiled.domain).not.toBe('accessibility');
  });

  it('word-boundary regression: unrelated words do not falsely trigger accessibility keywords', () => {
    const state = runArchitectPipeline(
      'The malaria vaccine trial recruited volunteers from several villages near the coast'
    );
    expect(state.domain).not.toBe('accessibility');
  });

  it('detects accessibility domain from inclusive-design and assistive-tech phrasing without formal WCAG terms', () => {
    const compiled = compileArchitect(
      'We need inclusive design for low vision and colorblind users, with keyboard accessible navigation and a focus indicator on every control'
    );
    expect(compiled.domain).toBe('accessibility');
  });

  it('architect specialist surfaces new technical considerations added for accessibility', () => {
    const compiled = compileArchitect(
      'Audit our single-page app for WCAG AA conformance, including custom tab and combobox components and route-change focus handling'
    );
    expect(compiled.domain).toBe('accessibility');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/keyboard interaction pattern|route changes|accessible-name computation/i);
  });

  it('surfaces the multimedia-accessibility ambiguity field when captions/transcripts are unaddressed', () => {
    const compiled = compileArchitect(
      'Audit our web app for WCAG AA accessibility compliance across all pages'
    );
    expect(compiled.domain).toBe('accessibility');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/multimedia accessibility|caption|transcript/i);
  });

  it('flags the custom-widget-scope vs no-dev-resources constraint combination', () => {
    const compiled = compileArchitect(
      'Design custom dropdown and drag-and-drop widgets for our accessible app, but this is design-only with no engineering support allocated'
    );
    expect(compiled.domain).toBe('accessibility');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/custom-widget scope|no\s+dev|engineering\s+support/i);
  });
});
