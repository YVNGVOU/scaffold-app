import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('image-generation domain', () => {
  it('image-generation domain detected on canonical AI image example', () => {
    const compiled = compileArchitect(
      'Generate an AI image of a mountain landscape at sunset, photorealistic style, 16:9 aspect ratio, with a few variations'
    );
    expect(compiled.domain).toBe('image-generation');
  });

  it('negative control: unrelated web request does not misclassify as image-generation', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('image-generation');
  });

  it('negative control: branding/logo request does not misclassify as image-generation', () => {
    const compiled = compileArchitect('Design a brand identity with a logo, color palette, and style guide');
    expect(compiled.domain).not.toBe('image-generation');
  });

  it('technical specialist produces image-generation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'I want to use Stable Diffusion to generate concept art of a cyberpunk city, need multiple image variations and a fixed seed'
    );
    expect(state.domain).toBe('image-generation');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDomainConcept = technicalItems.some((r) =>
      /(resolution|aspect ratio|seed|negative prompt|model|tool|batch|rate limit)/i.test(r.text)
    );
    expect(mentionsDomainConcept).toBe(true);
  });

  it('architect stage includes image-generation architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Generate a set of AI images for a children\'s book using text-to-image generation, consistent art style across all images');
    expect(state.domain).toBe('image-generation');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
  });
});
