import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { greetingCardStationeryDomain } from '../src/domains/greeting-card-stationery/index.js';

describe('greeting-card-stationery domain', () => {
  it('detects greeting-card-stationery domain on a realistic personal card request', () => {
    const compiled = compileArchitect(
      'Design a custom birthday greeting card with a personalized name and a heartfelt handwritten-style message inside, printed as a folded card'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
  });

  it('negative control: an unrelated software-development request does not misclassify as greeting-card-stationery', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('greeting-card-stationery');
  });

  it('disambiguation: a wedding save-the-date/invitation suite request classifies as event-invitations, not greeting-card-stationery', () => {
    const compiled = compileArchitect(
      'Design a wedding invitation suite with a save the date card, RSVP card, and thank you card in a matching visual identity'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The bifolded document and the a2b testing pipeline for the retirement fund advisory letterpress-printing analogy were unrelated to any craft project'
    );
    // sanity: none of these constructions should hit a whole-word match for
    // 'bifold card', 'a2 card', 'retirement card', or 'letterpress card'
    expect(state.domain).not.toBe('greeting-card-stationery');
  });

  it('detects new keyword phrasings (foil stamped card, condolence card, printable greeting card)', () => {
    const compiled = compileArchitect(
      'I need a printable greeting card design, possibly a foil stamped card, for a condolence card set'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
  });

  it('finishing technique ambiguity field resolves on a bare short answer', () => {
    const field = greetingCardStationeryDomain.ambiguityChecklist.find((f) => f.field === 'finishing technique');
    expect(field).toBeDefined();
    expect(field!.isResolved('letterpress')).toBe(true);
    expect(field!.isResolved('no idea, whatever you think')).toBe(false);
  });

  it('constraint specialist flags sympathy card vs playful tone contradiction', () => {
    const compiled = compileArchitect(
      'Design a sympathy card for a coworker, keep it bright and playful with festive colors'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/sympathy.*bright|contradictory brief|restrained, muted/i);
  });

  it('qa specialist surfaces the holiday/seasonal date accuracy check for a New Year card', () => {
    const compiled = compileArchitect(
      'Design a new years card line for retail distribution with a printed year on the front'
    );
    expect(compiled.domain).toBe('greeting-card-stationery');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/year|date accuracy|wrong year/i);
  });
});
