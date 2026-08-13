import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('nonprofit-civic domain', () => {
  it('detects nonprofit-civic domain on a realistic nonprofit/civic-tech request', () => {
    const compiled = compileArchitect(
      'Build a donor management platform for our 501c3 nonprofit with a donation platform for recurring gifts, a volunteer management portal, grant management tracking, and WCAG accessibility compliance for our public-facing pages'
    );
    expect(compiled.domain).toBe('nonprofit-civic');
  });

  it('negative control: an unrelated web-focused request does not misclassify as nonprofit-civic', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('nonprofit-civic');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger nonprofit-civic keywords', () => {
    const state = runArchitectPipeline('The migrant workers grew grandmothers vegetables near the government building downtown');
    expect(state.domain).not.toBe('nonprofit-civic');
  });

  it('architect specialist produces nonprofit-civic-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a civic tech platform for a public-sector agency with a donor management CRM, volunteer management module, grant management tracking, and a public records request system compliant with Section 508 accessibility'
    );
    expect(compiled.domain).toBe('nonprofit-civic');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/donor.*(database|crm)|volunteer management|grant.*tracking|accessibility-compliant/i);
  });

  it('detects nonprofit-civic domain from newer civic-tech/advocacy phrasings', () => {
    const compiled = compileArchitect(
      'Set up a civic engagement platform with a public comment portal and legislative tracking for our advocacy campaign, plus peer-to-peer fundraising and matching gift support for our capital campaign'
    );
    expect(compiled.domain).toBe('nonprofit-civic');
  });

  it('word-boundary regression: new keywords do not false-positive on unrelated phrases', () => {
    const state = runArchitectPipeline(
      'The town hall meeting was cancelled because the open data center lost power near the capital city'
    );
    expect(state.domain).not.toBe('nonprofit-civic');
  });

  it('surfaces matching-gift and peer-to-peer fundraising considerations for those features', () => {
    const compiled = compileArchitect(
      'Build a peer-to-peer fundraising platform for our nonprofit with team pages, matching gift lookup, and recurring donations'
    );
    expect(compiled.domain).toBe('nonprofit-civic');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/matching-gift|peer-to-peer/i);
  });

  it('technical specialist surfaces a nonprofit-civic-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a civic tech platform for a public-sector agency with a donor management CRM, volunteer management module, grant management tracking, and a public records request system compliant with Section 508 accessibility'
    );
    expect(compiled.domain).toBe('nonprofit-civic');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/nonprofit CRM|payment processor|recurring donation|government systems/i);
  });
});
