import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('accessibility domain', () => {
  it('detects accessibility domain on a realistic Accessibility-specific request', () => {
    const compiled = compileArchitect(
      'Run a WCAG 2.1 AA accessibility audit on our web app, checking screen reader compatibility with NVDA and VoiceOver, keyboard navigation, and color contrast, and deliver a remediation plan'
    );
    expect(compiled.domain).toBe('accessibility');
  });

  it('negative control: an unrelated web-focused request does not misclassify as accessibility', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('accessibility');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger accessibility keywords', () => {
    const state = runArchitectPipeline('The health ministry is tracking a malaria outbreak and needs a public awareness campaign for the affected region');
    expect(state.domain).not.toBe('accessibility');
  });

  it('architect specialist produces accessibility-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'We need an accessibility audit and remediation of our checkout flow: WCAG 2.1 AA conformance, screen reader testing, keyboard-only navigation testing, and a documented conformance report'
    );
    expect(compiled.domain).toBe('accessibility');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/automated scan pass|screen reader pass|issue log|remediation plan/i);
  });

  it('technical specialist surfaces an accessibility-specific consideration', () => {
    const compiled = compileArchitect(
      'We need an accessibility audit and remediation of our checkout flow: WCAG 2.1 AA conformance, screen reader testing, keyboard-only navigation testing, and a documented conformance report'
    );
    expect(compiled.domain).toBe('accessibility');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/semantic HTML|ARIA usage|focus management|automated tooling/i);
  });
});
