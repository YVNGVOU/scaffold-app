import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('presentation-deck domain', () => {
  it('detects presentation-deck domain on a realistic pitch deck request', () => {
    const compiled = compileArchitect(
      'Build a pitch deck for investors with a title slide, problem/solution slides, market size, and speaker notes for a 10-minute pitch'
    );
    expect(compiled.domain).toBe('presentation-deck');
  });

  it('negative control: an unrelated software-development request does not misclassify as presentation-deck', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('presentation-deck');
  });

  it('word-boundary regression: unrelated words do not falsely trigger presentation-deck keywords', () => {
    const state = runArchitectPipeline('The dealer gave a great presentation of playing cards fanned across the table');
    expect(state.domain).not.toBe('presentation-deck');
  });

  it('disambiguation: a poster/print layout request classifies as graphic-design, not presentation-deck', () => {
    const compiled = compileArchitect(
      'Design a print-ready poster with bold typography and a grid system layout for a music festival'
    );
    expect(compiled.domain).toBe('graphic-design');
  });

  it('disambiguation: a slide deck request classifies as presentation-deck, not graphic-design', () => {
    const compiled = compileArchitect(
      'Create a slide deck template for our quarterly internal update with a consistent master slide design and executive summary slide'
    );
    expect(compiled.domain).toBe('presentation-deck');
  });

  it('architect specialist produces presentation-deck-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design an investor deck / pitch deck with a title slide, agenda slide, data visualizations, speaker notes, and backup slides for a 15-minute pitch presentation'
    );
    expect(compiled.domain).toBe('presentation-deck');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/narrative outline|speaker notes|data visualization|appendix/i);
  });

  it('technical specialist surfaces a presentation-deck-specific consideration', () => {
    const compiled = compileArchitect(
      'Design an investor deck / pitch deck with a title slide, agenda slide, data visualizations, speaker notes, and backup slides for a 15-minute pitch presentation'
    );
    expect(compiled.domain).toBe('presentation-deck');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/target software compatibility|font licensing|live data vs static|aspect ratio/i);
  });
});
