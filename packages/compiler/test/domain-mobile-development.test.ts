import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('mobile-development domain', () => {
  it('detects mobile-development domain on a realistic native app request', () => {
    const compiled = compileArchitect(
      'Build a native iOS and Android app in Swift and Kotlin with push notifications and offline support, distributed via the App Store and Play Store'
    );
    expect(compiled.domain).toBe('mobile-development');
  });

  it('negative control: an unrelated web-focused request does not misclassify as mobile-development', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('mobile-development');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: "app" inside unrelated words and "player" do not falsely trigger mobile-development keywords', () => {
    const state = runArchitectPipeline('Design a rapid multiplayer 2D board game with a simple happy-themed color palette');
    expect(state.domain).not.toBe('mobile-development');
  });

  it('architect specialist produces mobile-development-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a cross-platform mobile app with Flutter that supports push notifications, offline caching, and App Store distribution'
    );
    expect(compiled.domain).toBe('mobile-development');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/app shell|UI layer|push notification service|app store release pipeline|local storage/i);
  });
});
