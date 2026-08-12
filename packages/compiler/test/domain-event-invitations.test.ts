import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('event-invitations domain', () => {
  it('detects event-invitations domain on a realistic wedding invitation request', () => {
    const compiled = compileArchitect(
      'Design a wedding invitation suite with a save-the-date, formal invitation, and RSVP card with a response deadline'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('negative control: an unrelated software-development request does not misclassify as event-invitations', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('event-invitations');
  });

  it('word-boundary regression: unrelated words do not falsely trigger event-invitations keywords', () => {
    const state = runArchitectPipeline('The dropdown menu invites confusion when users misclick the settings button');
    expect(state.domain).not.toBe('event-invitations');
  });

  it('disambiguation: a cafe food/drink menu request classifies as menu-design, not event-invitations', () => {
    const compiled = compileArchitect(
      'Design a menu for a coffee shop with pastries and drinks, organized into sections with prices and dietary tags for vegan and gluten-free options'
    );
    expect(compiled.domain).toBe('menu-design');
  });

  it('disambiguation: a birthday party invitation with RSVP classifies as event-invitations, not menu-design', () => {
    const compiled = compileArchitect(
      'Create a birthday party invitation with RSVP details, party date, time, and venue, plus a matching thank-you card'
    );
    expect(compiled.domain).toBe('event-invitations');
  });

  it('architect specialist produces event-invitations-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design a full wedding stationery suite: save-the-date, invitation, RSVP card with envelope, and a thank-you card matching the same visual identity'
    );
    expect(compiled.domain).toBe('event-invitations');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/save-the-date|RSVP|thank-you|envelope/i);
  });

  it('technical specialist surfaces an event-invitations-specific consideration', () => {
    const compiled = compileArchitect(
      'Design a full wedding stationery suite: save-the-date, invitation, RSVP card with envelope, and a thank-you card matching the same visual identity'
    );
    expect(compiled.domain).toBe('event-invitations');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/mail-back RSVP|guest list|digital RSVP platform|variable data printing/i);
  });
});
