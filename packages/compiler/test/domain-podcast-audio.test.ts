import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('podcast-audio domain', () => {
  it('detects podcast-audio domain on a realistic podcast production request', () => {
    const compiled = compileArchitect(
      'I need to record and edit a weekly interview podcast episode with a co-host, mix multi-track recording, master to consistent loudness, and publish show notes and an RSS feed to Spotify for Podcasters'
    );
    expect(compiled.domain).toBe('podcast-audio');
  });

  it('negative control: an unrelated business plan request does not misclassify as podcast-audio', () => {
    const compiled = compileArchitect(
      'Write a business plan for a coffee shop including market analysis, staffing plan, and a three-year revenue forecast'
    );
    expect(compiled.domain).not.toBe('podcast-audio');
  });

  it('negative control: an unrelated video generation request does not misclassify as podcast-audio', () => {
    const compiled = compileArchitect(
      'Generate a short AI text-to-video clip of a mountain landscape at sunset with a slow camera pan'
    );
    expect(compiled.domain).not.toBe('podcast-audio');
  });

  it('word-boundary regression: unrelated words do not falsely trigger podcast-audio keywords', () => {
    const state = runArchitectPipeline('The broadcaster editorial staff cast a wide forecast for the department');
    expect(state.domain).not.toBe('podcast-audio');
  });

  it('architect specialist produces podcast-audio-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Produce a solo narrative podcast episode: pre-production outline, multi-track recording, editing, mixing, mastering to -16 LUFS, and distribution to Apple Podcasts via an RSS feed'
    );
    expect(compiled.domain).toBe('podcast-audio');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/recording|editing|mixing|mastering|distribution/i);
  });

  it('technical specialist surfaces a podcast-audio-specific consideration', () => {
    const compiled = compileArchitect(
      'Produce a solo narrative podcast episode: pre-production outline, multi-track recording, editing, mixing, mastering to -16 LUFS, and distribution to Apple Podcasts via an RSS feed'
    );
    expect(compiled.domain).toBe('podcast-audio');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/loudness|LUFS|multi-track|recording format|noise/i);
  });
});
