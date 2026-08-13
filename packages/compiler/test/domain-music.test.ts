import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('music domain', () => {
  it('detects music domain on a realistic production request', () => {
    const compiled = compileArchitect(
      'Compose an upbeat lo-fi hip-hop instrumental track with vocal chain and mastering for a streaming release, in the style of Nujabes'
    );
    expect(compiled.domain).toBe('music');
  });

  it('negative control: an unrelated software-development request does not misclassify as music', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('music');
  });

  it('word-boundary regression: unrelated words do not falsely trigger music keywords', () => {
    const state = runArchitectPipeline(
      'The multiplayer game had an admixture of settings; commix the config files and check the songwriter credits page footer'
    );
    expect(state.domain).not.toBe('music');
  });

  it('new keyword phrasings are detected on realistic prompts', () => {
    const compiled = compileArchitect(
      'I need a music producer to write a jingle and theme song for my podcast, with a demo track and stem mastering delivered'
    );
    expect(compiled.domain).toBe('music');
  });

  it('ambiguity checklist recognizes short bare answers for new fields', () => {
    const compiled = compileArchitect(
      'Write a song for my wedding video, instrumental, inspired by a reference track, about 90 seconds long'
    );
    expect(compiled.domain).toBe('music');
    const compiledText = JSON.stringify(compiled);
    // vocals-vs-instrumental, reference-track, and track-length fields should not appear as unresolved
    expect(compiledText).not.toMatch(/vocals\/lyrics or is purely instrumental is unspecified/);
  });

  it('surfaces new technical/QA considerations for a music request', () => {
    const compiled = compileArchitect(
      'Produce a full orchestral score with mixing and mastering, deliver stems and MIDI, target streaming loudness'
    );
    expect(compiled.domain).toBe('music');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/MIDI files\/arrangement data|mono compatibility|clipping/i);
  });

  it('constraint specialist flags the acoustic-vs-remote infeasibility pair', () => {
    const compiled = compileArchitect(
      'I want a fully acoustic live band recording, but we have to work entirely in-the-box remotely with no studio access'
    );
    expect(compiled.domain).toBe('music');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/authentic acoustic instrumentation typically requires in-person tracking/i);
  });
});
