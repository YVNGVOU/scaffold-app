import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('mobile-development domain', () => {
  it('detects mobile-development domain on a realistic app-build request', () => {
    const compiled = compileArchitect(
      'Build a cross-platform mobile app in React Native for iOS and Android with push notifications, in-app purchases, and Face ID login'
    );
    expect(compiled.domain).toBe('mobile-development');
  });

  it('negative control: an unrelated web-development request does not misclassify as mobile-development', () => {
    const compiled = compileArchitect(
      'Build a server-rendered web dashboard in Node.js and Express that queries a Postgres database and renders HTML tables'
    );
    expect(compiled.domain).not.toBe('mobile-development');
  });

  it('word-boundary regression: unrelated words do not falsely trigger mobile-development keywords', () => {
    const state = runArchitectPipeline(
      'The team felt happy about the apparel store redesign and the multiplayer arcade cabinet in the lobby'
    );
    expect(state.domain).not.toBe('mobile-development');
  });

  it('detects new keyword phrasings like jetpack compose and deep linking', () => {
    const compiled = compileArchitect(
      'Build a native Android app using Jetpack Compose with deep linking support and Wear OS companion app'
    );
    expect(compiled.domain).toBe('mobile-development');
  });

  it('ambiguity checklist flags missing monetization and authentication details', () => {
    const state = runArchitectPipeline(
      'Build a mobile app for iOS and Android that lets users track workouts'
    );
    const stateText = JSON.stringify(state);
    expect(stateText).toMatch(/monetization|authentication/i);
  });

  it('ambiguity checklist recognizes short bare answers for monetization and auth', () => {
    const state = runArchitectPipeline(
      'Build a mobile app for iOS and Android with a subscription model and biometric login for returning users'
    );
    const stateText = JSON.stringify(state);
    // both fields should now be considered addressed, not left as open questions
    expect(stateText).not.toMatch(/monetization model.*unspecified/i);
  });

  it('constraint specialist flags in-app purchase vs external payment link tension', () => {
    const compiled = compileArchitect(
      'Build a mobile app with a subscription in-app purchase, but also link out to an external website for payment to avoid store fees'
    );
    expect(compiled.domain).toBe('mobile-development');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/external payment|in-app purchase/i);
  });

  it('technical specialist surfaces a mobile-development-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a native iOS and Android app with deep links from marketing emails and background sync of user data'
    );
    expect(compiled.domain).toBe('mobile-development');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/deep.link|app bundle|background execution|App Store binary/i);
  });
});
