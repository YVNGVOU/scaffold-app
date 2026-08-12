import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('legal domain', () => {
  it('detects legal domain on a realistic legal document request', () => {
    const compiled = compileArchitect(
      'Draft an NDA contract between two companies, specifying governing law jurisdiction, indemnification, and a liability limitation clause, to be reviewed by legal counsel before execution'
    );
    expect(compiled.domain).toBe('legal');
  });

  it('negative control: an unrelated web-focused request does not misclassify as legal', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('legal');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger legal keywords', () => {
    const state = runArchitectPipeline('I will build a landing page and I am willing to iterate quickly');
    expect(state.domain).not.toBe('legal');
  });

  it('architect specialist produces legal-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Draft a service agreement contract for a freelance consulting arrangement, including indemnification, governing law jurisdiction in Delaware, and an attorney review checkpoint before signing'
    );
    expect(compiled.domain).toBe('legal');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/clause library|attorney review|risk allocation|document classification/i);
  });

  it('technical specialist surfaces a legal-specific consideration', () => {
    const compiled = compileArchitect(
      'Draft a service agreement contract for a freelance consulting arrangement, including indemnification, governing law jurisdiction in Delaware, and an attorney review checkpoint before signing'
    );
    expect(compiled.domain).toBe('legal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/jurisdiction-specific drafting|defined-terms consistency|not a substitute for legal advice|legal advice/i);
  });
});
