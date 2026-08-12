import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('greeting-card-stationery domain', () => {
  it('detects greeting-card-stationery domain on a realistic personal card request', () => {
    const compiled = compileArchitect(
      'Design a set of personalized birthday greeting cards with a folded card layout and a handwritten-style verse inside'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
  });

  it('negative control: an unrelated software-development request does not misclassify as greeting-card-stationery', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('greeting-card-stationery');
  });

  it('word-boundary regression: unrelated words do not falsely trigger greeting-card-stationery keywords', () => {
    const state = runArchitectPipeline('The cardstocking inventory system and letterheading process needs a rework of the offset table');
    expect(state.domain).not.toBe('greeting-card-stationery');
  });

  it('disambiguation: a wedding invitation suite classifies as event-invitations, not greeting-card-stationery', () => {
    const compiled = compileArchitect(
      'Design a wedding invitation suite with save-the-dates, RSVP cards, and reception cards for a formal ceremony'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('disambiguation: a personal holiday card request classifies as greeting-card-stationery, not event-invitations', () => {
    const compiled = compileArchitect(
      'Design a personal holiday card to send to family and friends, with a custom photo insert and a short greeting card verse'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
  });

  it('architect specialist produces greeting-card-stationery-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design a line of sympathy greeting cards for a retail card shop, with a card verse for each occasion card and matching envelopes'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/card copy|print production spec|envelope pairing|proof and approval|personalization system/i);
  });

  it('technical specialist surfaces a greeting-card-stationery-specific consideration', () => {
    const compiled = compileArchitect(
      'Design a line of sympathy greeting cards for a retail card shop, with a card verse for each occasion card and matching envelopes'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/trim size and bleed|fold structure|paper stock and finish|variable data|envelope compatibility/i);
  });
});
