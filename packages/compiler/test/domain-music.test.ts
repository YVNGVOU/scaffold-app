import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('music domain', () => {
  it('music domain detected on canonical music example', () => {
    const compiled = compileArchitect(
      'Compose an upbeat pop song with guitar, drums, and vocals, then mix and master it for streaming release'
    );
    expect(compiled.domain).toBe('music');
  });

  it('negative control: unrelated web request does not misclassify as music', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('music');
  });

  it('negative control: bare "mix" substring inside unrelated word does not misclassify as music', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    const state = runArchitectPipeline('We need to fix the admixture calculation in our genetics research tool');
    expect(state.domain).not.toBe('music');
  });

  it('technical specialist produces music-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Compose a cinematic orchestral score for a film trailer with strings and full mixing and mastering'
    );
    expect(state.domain).toBe('music');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsMusicTech = technicalItems.some((r) => /daw|tempo|bpm|sample rate|loudness|stems|key signature/i.test(r.text));
    expect(mentionsMusicTech).toBe(true);
  });

  it('architect stage includes music architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Write and produce an indie folk song with acoustic guitar and vocals');
    expect(state.domain).toBe('music');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsMastering = architectureItems.some((r) => r.text.toLowerCase().includes('mastering'));
    expect(mentionsMastering).toBe(true);
  });
});
