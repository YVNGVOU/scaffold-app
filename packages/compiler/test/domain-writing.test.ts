import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('writing domain', () => {
  it('writing domain detected on canonical writing example', () => {
    const compiled = compileArchitect(
      'Write a blog post article about remote work productivity, casual tone, aimed at young professionals, around 1000 words'
    );
    expect(compiled.domain).toBe('writing');
  });

  it('negative control: unrelated web request does not misclassify as writing', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('writing');
  });

  it('negative control: bare "script" substring inside unrelated word does not misclassify as writing', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    const state = runArchitectPipeline('We need to fix a bug in our Javascript subscription billing service');
    expect(state.domain).not.toBe('writing');
  });

  it('technical specialist produces writing-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Ghostwrite a short story for a fiction anthology submission, literary tone, around 4000 words'
    );
    expect(state.domain).toBe('writing');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsWritingTech = technicalItems.some((r) => /word count|format|style guide|revision/i.test(r.text));
    expect(mentionsWritingTech).toBe(true);
  });

  it('architect stage includes writing architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Write an essay draft on climate policy for a magazine op-ed');
    expect(state.domain).toBe('writing');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsProofreading = architectureItems.some((r) => r.text.toLowerCase().includes('proofreading'));
    expect(mentionsProofreading).toBe(true);
  });
});
