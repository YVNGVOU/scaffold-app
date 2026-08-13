import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('social-media-graphics domain', () => {
  it('detects social-media-graphics domain on a realistic prompt', () => {
    const compiled = compileArchitect(
      'Design a set of Instagram post and story templates plus a TikTok cover for our weekly content calendar, using our existing brand colors'
    );
    expect(compiled.domain).toBe('social-media-graphics');
  });

  it('negative control: an unrelated backend request does not misclassify as social-media-graphics', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('social-media-graphics');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The keynote had a great launch moment and I need to post design docs to the wiki before the meeting'
    );
    expect(state.domain).not.toBe('social-media-graphics');
  });

  it('detects a new keyword phrasing (youtube thumbnail / social asset kit) without false positives', () => {
    const compiled = compileArchitect(
      'We need a full social asset kit including a youtube thumbnail and a linkedin cover photo for our rebrand launch'
    );
    expect(compiled.domain).toBe('social-media-graphics');
  });

  it('ambiguity checklist recognizes a bare production-tool answer', () => {
    const compiled = compileArchitect(
      'Design Instagram post templates for our brand. Tool: Canva'
    );
    expect(compiled.domain).toBe('social-media-graphics');
    const unresolvedFields = compiled.ambiguities?.map((a: { field: string }) => a.field) ?? [];
    expect(unresolvedFields).not.toContain('production tool');
  });

  it('surfaces the animated-vs-static tooling mismatch constraint consideration', () => {
    const compiled = compileArchitect(
      'Design a static template kit for Instagram, but also make the story covers fully animated with autoplay transitions'
    );
    expect(compiled.domain).toBe('social-media-graphics');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/motion-capable tool|tooling mismatch|animated/i);
  });
});
