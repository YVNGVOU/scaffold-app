import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { presentationDeckDomain } from '../src/domains/presentation-deck/index.js';

describe('presentation-deck domain', () => {
  it('detects presentation-deck domain on a realistic pitch deck request', () => {
    const compiled = compileArchitect(
      'Build a pitch deck for investors with a title slide, agenda slide, speaker notes, and a deck template for a 10-minute pitch presentation'
    );
    expect(compiled.domain).toBe('presentation-deck');
  });

  it('negative control: an unrelated software-development request does not misclassify as presentation-deck', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('presentation-deck');
  });

  it('word-boundary regression: new compound keywords do not falsely trigger on unrelated phrasing', () => {
    const state = runArchitectPipeline(
      'The onboard ingest pipeline handles client presentational metadata and series adecking sensor arrays for the training simulator'
    );
    expect(state.domain).not.toBe('presentation-deck');
  });

  it('detects new keyword phrasing like "demo day deck" and "pitch slides"', () => {
    const compiled = compileArchitect(
      'We need pitch slides and a demo day deck template with speaker notes and a title slide for next week'
    );
    expect(compiled.domain).toBe('presentation-deck');
  });

  it('ambiguity checklist flags visual asset sourcing and presenter identity when unaddressed, resolves on bare inline answers', () => {
    const assetField = presentationDeckDomain.ambiguityChecklist.find((f) => f.field === 'visual asset sourcing');
    const presenterField = presentationDeckDomain.ambiguityChecklist.find((f) => f.field === 'presenter identity');
    expect(assetField).toBeDefined();
    expect(presenterField).toBeDefined();

    expect(assetField!.isResolved('Design a pitch deck for our seed round')).toBe(false);
    expect(assetField!.isResolved('use our own photos throughout the deck')).toBe(true);
    expect(assetField!.isResolved('build it around a custom illustration set')).toBe(true);

    expect(presenterField!.isResolved('Design a pitch deck for our seed round')).toBe(false);
    expect(presenterField!.isResolved('I will present it myself')).toBe(true);
    expect(presenterField!.isResolved('this will run as a self-running kiosk deck')).toBe(true);
  });

  it('surfaces the new clicker/presenter-remote technical consideration', () => {
    const compiled = compileArchitect(
      'Design a board deck for our quarterly update with a deck template, agenda slide, and speaker notes for a 15-minute board meeting'
    );
    expect(compiled.domain).toBe('presentation-deck');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/presenter remote|clicker/i);
  });

  it('flags the unattended-deck vs speaker-notes constraint contradiction', () => {
    const compiled = compileArchitect(
      'Build a self-running kiosk slide deck template for the trade show booth that includes full speaker notes on every slide'
    );
    expect(compiled.domain).toBe('presentation-deck');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/unattended|self-running|kiosk/i);
  });
});
