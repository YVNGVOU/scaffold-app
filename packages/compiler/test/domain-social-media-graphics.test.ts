import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('social-media-graphics domain', () => {
  it('detects social-media-graphics domain on a realistic platform-post request', () => {
    const compiled = compileArchitect(
      'Design a set of Instagram feed posts and story templates for a coffee shop, sized correctly for the Instagram grid with a consistent template kit'
    );
    expect(compiled.domain).toBe('social-media-graphics');
  });

  it('negative control: an unrelated software-development request does not misclassify as social-media-graphics', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('social-media-graphics');
  });

  it('word-boundary regression: unrelated words do not falsely trigger social-media-graphics keywords', () => {
    const state = runArchitectPipeline('The story of how we posted our profile on the community board was interesting');
    expect(state.domain).not.toBe('social-media-graphics');
  });

  it('disambiguation: a full campaign strategy request classifies as marketing, not social-media-graphics', () => {
    const compiled = compileArchitect(
      'Plan a social media campaign with target audience research, ad spend budget, and KPIs across Facebook ads and Google ads'
    );
    expect(compiled.domain).toBe('marketing');
  });

  it('disambiguation: a platform-specific post/story template request classifies as social-media-graphics, not marketing', () => {
    const compiled = compileArchitect(
      'Create an Instagram carousel post template and a matching TikTok cover, keeping the feed grid visually consistent'
    );
    expect(compiled.domain).toBe('social-media-graphics');
  });

  it('disambiguation: a logo/identity system request classifies as branding, not social-media-graphics', () => {
    const compiled = compileArchitect(
      'Create a logo and brand identity system with color palette and typography guidelines for a new coffee shop'
    );
    expect(compiled.domain).toBe('branding');
  });

  it('architect specialist produces social-media-graphics-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design a batch of Instagram feed posts, story covers, and a LinkedIn banner for a monthly content calendar, all matching the brand template kit'
    );
    expect(compiled.domain).toBe('social-media-graphics');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/platform dimension|template set|content calendar|export pipeline/i);
  });

  it('technical specialist surfaces a social-media-graphics-specific consideration', () => {
    const compiled = compileArchitect(
      'Design a batch of Instagram feed posts, story covers, and a LinkedIn banner for a monthly content calendar, all matching the brand template kit'
    );
    expect(compiled.domain).toBe('social-media-graphics');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/sRGB|safe zone|dimension|platform-native/i);
  });
});
