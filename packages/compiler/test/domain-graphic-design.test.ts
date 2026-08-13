import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { graphicDesignDomain } from '../src/domains/graphic-design/index.js';

describe('graphic-design domain', () => {
  it('detects graphic-design domain on a realistic poster/print request', () => {
    const compiled = compileArchitect(
      'Design a print-ready poster for a music festival with bold typography, a limited color palette, and CMYK output for a large-format printer'
    );
    expect(compiled.domain).toBe('graphic-design');
  });

  it('negative control: an unrelated software-development request does not misclassify as graphic-design', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('graphic-design');
  });

  it('word-boundary regression: unrelated words do not falsely trigger graphic-design keywords', () => {
    const state = runArchitectPipeline(
      'The bookshelf had a rare first edition cover and a table tenting over the corner of the room near the sign posted outside'
    );
    expect(state.domain).not.toBe('graphic-design');
  });

  it('detects new keyword phrasings: business card, letterhead, trade show booth, die-cut', () => {
    const compiled = compileArchitect(
      'Design a business card and letterhead set plus a die-cut trade show booth banner for a new consultancy'
    );
    expect(compiled.domain).toBe('graphic-design');
  });

  it('architect specialist and considerations surface new depth (die line, QR scan reliability)', () => {
    const compiled = compileArchitect(
      'Design a die-cut folded brochure with a QR code call to action for an event, print-ready in CMYK with a specified print run quantity of 5000'
    );
    expect(compiled.domain).toBe('graphic-design');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/die line|die\/fold-line|scan-to-action|QR code/i);
  });

  it('ambiguity checklist recognizes bare short answers for new fields', () => {
    const quantityField = graphicDesignDomain.ambiguityChecklist.find((f) => f.field === 'print quantity');
    const audienceField = graphicDesignDomain.ambiguityChecklist.find((f) => f.field === 'target audience and purpose');
    expect(quantityField).toBeDefined();
    expect(audienceField).toBeDefined();
    expect(quantityField!.isResolved('need 500 copies printed')).toBe(true);
    expect(audienceField!.isResolved('this is meant to promote a bakery opening')).toBe(true);
    expect(quantityField!.isResolved('just make it look nice')).toBe(false);
  });
});
