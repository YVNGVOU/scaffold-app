import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('event-invitations domain', () => {
  it('detects event-invitations domain on a realistic wedding invitation request', () => {
    const compiled = compileArchitect(
      'Design a wedding invitation suite with save-the-date, RSVP card, and thank-you card, formal black-tie styling, printed and mailed to guests'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('detects event-invitations domain via bare "invite(s)" proximity phrasing', () => {
    const compiled = compileArchitect(
      "I need invites for my daughter's birthday party, digital, with an RSVP link"
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('negative control: an unrelated software-development request does not misclassify as event-invitations', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('event-invitations');
  });

  it('word-boundary regression: new keywords do not false-positive on unrelated words', () => {
    // "registry" and "website" appear inside unrelated compound/adjacent words here;
    // none of the new keyword phrases ("gift registry", "registry link", "wedding
    // website", "guest addressing", etc.) should match as bare substrings.
    const state = runArchitectPipeline(
      'The Windows registry linkage settings and the company website redesign project need review, and we should audit the guest addressing conventions used in our internal style guide document'
    );
    expect(state.domain).not.toBe('event-invitations');
  });

  it('classifies a corporate/virtual event invite request correctly', () => {
    const compiled = compileArchitect(
      'Design a corporate event invite for our virtual event invite series, with a wedding website style landing page and gift registry link section removed since this is not a wedding'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('architect specialist and considerations surface new domain-specific content', () => {
    const compiled = compileArchitect(
      'Design a formal wedding invitation suite with custom calligraphy addressing needed by tomorrow, and a wedding website for RSVP tracking'
    );
    expect(compiled.domain).toBe('event-invitations');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/calligraphy|timezone|monogram|budget and print quantity/i);
  });

  it('constraint specialist flags rush timeline vs custom calligraphy addressing as infeasible', () => {
    const compiled = compileArchitect(
      'I need custom calligraphy addressing on all the wedding invitation envelopes by tomorrow, this is due asap'
    );
    expect(compiled.domain).toBe('event-invitations');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/calligraph/i);
  });
});
