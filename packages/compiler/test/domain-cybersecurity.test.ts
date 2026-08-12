import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('cybersecurity domain', () => {
  it('detects cybersecurity domain on a realistic penetration test request', () => {
    const compiled = compileArchitect(
      'We need a penetration test and vulnerability assessment of our external network, including a red team engagement and a security audit report mapped to CVSS scores, with responsible disclosure of any findings'
    );
    expect(compiled.domain).toBe('cybersecurity');
  });

  it('negative control: an unrelated web-focused request does not misclassify as cybersecurity', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('cybersecurity');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger cybersecurity keywords', () => {
    const state = runArchitectPipeline('Please scan the landscape of our marketing campaign and give me an overview of the plan');
    expect(state.domain).not.toBe('cybersecurity');
  });

  it('architect specialist produces cybersecurity-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Run a penetration test and vulnerability assessment against our web application, with a signed rules of engagement document, manual exploitation of confirmed findings, and a CVSS-scored findings report with remediation tracking'
    );
    expect(compiled.domain).toBe('cybersecurity');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/rules of engagement|vulnerability scanning|findings and risk-scoring|remediation tracking/i);
  });

  it('security specialist surfaces a cybersecurity-specific consideration', () => {
    const compiled = compileArchitect(
      'Run a penetration test and vulnerability assessment against our web application, with a signed rules of engagement document, manual exploitation of confirmed findings, and a CVSS-scored findings report with remediation tracking'
    );
    expect(compiled.domain).toBe('cybersecurity');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/authorization boundary|responsible disclosure|defensive vs offensive|CFAA/i);
  });
});
