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

  it('detects legal domain via newly added keywords like cease and desist / shareholder agreement', () => {
    const compiled = compileArchitect(
      'Draft a shareholder agreement and a cease and desist letter regarding a breach of a confidentiality agreement between two founders'
    );
    expect(compiled.domain).toBe('legal');
  });

  it('word-boundary regression: "eula" and "mediation" keywords do not false-positive on unrelated substrings', () => {
    const state = runArchitectPipeline('The nebulance of the mediational glow filled the room as sculptors worked');
    expect(state.domain).not.toBe('legal');
  });

  it('ambiguity checklist recognizes term/termination and dispute resolution when directly answered', () => {
    const compiled = compileArchitect(
      'Draft a service agreement, month-to-month term, with disputes resolved via arbitration in Delaware, between a vendor and client'
    );
    expect(compiled.domain).toBe('legal');
    const unresolvedFields = compiled.ambiguities?.map((a: { field: string }) => a.field) ?? [];
    expect(unresolvedFields).not.toContain('term and termination');
    expect(unresolvedFields).not.toContain('dispute resolution mechanism');
  });

  it('surfaces the boilerplate clause completeness consideration', () => {
    const compiled = compileArchitect(
      'Draft a licensing agreement contract between a licensor and licensee with indemnification and governing law jurisdiction in New York'
    );
    expect(compiled.domain).toBe('legal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/entire agreement|no-waiver|boilerplate/i);
  });

  it('flags the perpetual term vs. unilateral termination infeasibility pairing', () => {
    const state = runArchitectPipeline(
      'Draft a legal contract agreement with a perpetual term where only we can terminate at our sole discretion, between two companies, with governing law jurisdiction and indemnification clauses'
    );
    expect(state.domain).toBe('legal');
    const stateText = JSON.stringify(state);
    expect(stateText).toMatch(/perpetual term vs\. unilateral termination|perpetual\/non-expiring term/i);
  });
});
