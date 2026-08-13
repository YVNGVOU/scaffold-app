import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { writingDomain } from '../src/domains/writing/index.js';

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

  it('detects writing domain on newer keyword phrasings (white paper, case study, speech writing)', () => {
    const compiled = compileArchitect(
      'Write a white paper and case study for our SaaS product, plus speech writing for the launch keynote'
    );
    expect(compiled.domain).toBe('writing');
  });

  it('word-boundary regression: "speechless" and "resumed" do not trigger writing keywords', () => {
    const state = runArchitectPipeline('The negotiations resumed after the team was left speechless by the offer');
    expect(state.domain).not.toBe('writing');
  });

  it('ambiguity checklist recognizes a bare delivery-format answer', () => {
    const formatField = writingDomain.ambiguityChecklist.find((f) => f.field === 'format');
    expect(formatField).toBeDefined();
    expect(formatField!.isResolved('Markdown')).toBe(true);
    expect(formatField!.isResolved('No format mentioned at all')).toBe(false);
  });

  it('security specialist flags AI-assistance disclosure for writing requests', () => {
    const state = runArchitectPipeline('Write a personal essay for a literary magazine submission, reflective tone, 2000 words');
    expect(state.domain).toBe('writing');
    const compiledText = JSON.stringify(state.requirements);
    expect(compiledText).toMatch(/AI-assist|AI involvement|AI-generated/i);
  });
});
