import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('video-generation domain', () => {
  it('detects video-generation domain on a realistic AI video request', () => {
    const compiled = compileArchitect(
      'Generate a 30 second AI video ad for Instagram Reels using Runway, vertical 9:16, with a fast-cut cinematic style and voiceover narration'
    );
    expect(compiled.domain).toBe('video-generation');
  });

  it('negative control: an unrelated multiplayer game request does not misclassify as video-generation', () => {
    const compiled = compileArchitect(
      'Build a multiplayer online game with matchmaking, leaderboards, and cross-platform play using Unity'
    );
    expect(compiled.domain).not.toBe('video-generation');
  });

  it('word-boundary regression: unrelated words do not falsely trigger video-generation keywords', () => {
    const state = runArchitectPipeline(
      'The multiplayer lobby had a shortcut button and a cutout graphic in the corner of the screen'
    );
    expect(state.domain).not.toBe('video-generation');
  });

  it('word-boundary regression: new keywords do not false-positive inside unrelated words', () => {
    const state = runArchitectPipeline(
      'Our generator produces electricity and the model railway loop needs a new track section near the video store'
    );
    expect(state.domain).not.toBe('video-generation');
  });

  it('detects video-generation domain using newly added phrasings (explainer video, dolly shot, camera pan)', () => {
    const compiled = compileArchitect(
      'Create an explainer video with a dolly shot opening and a slow camera pan across the product, ending with a seamless video loop'
    );
    expect(compiled.domain).toBe('video-generation');
  });

  it('ambiguity checklist recognizes bare short answers for camera work and model fields', () => {
    const compiled = compileArchitect(
      'Make an AI video of a product demo, tracking shot, using Kling, vertical for TikTok, 20 seconds, cinematic style, with voiceover and consistent character'
    );
    expect(compiled.domain).toBe('video-generation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/camera movement and shot framing.*unspecified/i);
  });

  it('constraint specialist flags exact lip sync vs generative model tension', () => {
    const compiled = compileArchitect(
      'Generate an AI text-to-video clip requiring exact lip sync to our scripted dialogue for a 60 second ad'
    );
    expect(compiled.domain).toBe('video-generation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/lip sync/i);
  });

  it('technical specialist surfaces a video-generation-specific consideration on character drift', () => {
    const compiled = compileArchitect(
      'Generate a multi-scene AI video ad with a recurring mascot character appearing consistently across 6 different shots'
    );
    expect(compiled.domain).toBe('video-generation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/drift|reference-image|seed-locking/i);
  });
});
