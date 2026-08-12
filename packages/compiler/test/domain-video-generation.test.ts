import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('video-generation domain', () => {
  it('video-generation domain detected on canonical AI video example', () => {
    const compiled = compileArchitect(
      'Generate an AI video clip of a spaceship landing at sunset, cinematic style, 16:9 aspect ratio, 10 second duration'
    );
    expect(compiled.domain).toBe('video-generation');
  });

  it('negative control: unrelated web request does not misclassify as video-generation', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('video-generation');
  });

  it('negative control: image-generation request does not misclassify as video-generation', () => {
    const compiled = compileArchitect(
      'Generate an AI image of a mountain landscape at sunset, photorealistic style, 16:9 aspect ratio, with a few variations'
    );
    expect(compiled.domain).not.toBe('video-generation');
  });

  it('technical specialist produces video-generation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'I want to use an AI video generation tool like Runway to create a text-to-video ad, need multiple shots with consistent style and a voiceover'
    );
    expect(state.domain).toBe('video-generation');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDomainConcept = technicalItems.some((r) =>
      /(duration|frame rate|resolution|aspect ratio|shot|continuity|render|export)/i.test(r.text)
    );
    expect(mentionsDomainConcept).toBe(true);
  });

  it('architect stage includes video-generation architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Create a storyboard-driven AI video montage for a product launch, with scene transitions and background music');
    expect(state.domain).toBe('video-generation');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
  });
});
