import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('desktop-development domain', () => {
  it('detects desktop-development domain on a realistic cross-platform app request', () => {
    const compiled = compileArchitect(
      'Build a cross-platform desktop app with Electron that has a system tray icon, auto-update, and a code-signed installer for Windows and macOS'
    );
    expect(compiled.domain).toBe('desktop-development');
  });

  it('negative control: an unrelated mobile-app request does not misclassify as desktop-development', () => {
    const compiled = compileArchitect(
      'Build an iOS and Android mobile app with push notifications, in-app purchases, and a swipeable onboarding flow'
    );
    expect(compiled.domain).not.toBe('desktop-development');
  });

  it('word-boundary regression: unrelated words do not falsely trigger desktop-development keywords', () => {
    const state = runArchitectPipeline(
      'The debate lasted a while and the deb package the shop sold turned out to be a debounce library, betray, and multiplayer game reference'
    );
    expect(state.domain).not.toBe('desktop-development');
  });

  it('detects desktop-development domain on new native-module/enterprise-deployment phrasings', () => {
    const compiled = compileArchitect(
      'We need a Tauri desktop app with a native module, global hotkey support, and silent install for Intune deployment on managed Windows machines'
    );
    expect(compiled.domain).toBe('desktop-development');
  });

  it('ambiguity checklist recognizes a bare offline/online answer', () => {
    const state = runArchitectPipeline(
      'Build a Tauri desktop app for Windows and macOS with an installer and auto-update. It must work fully offline.'
    );
    expect(state.domain).toBe('desktop-development');
    const stateText = JSON.stringify(state);
    expect(stateText).not.toMatch(/offline vs online requirement is unspecified/i);
  });

  it('security specialist surfaces the IPC/preload attack-surface consideration', () => {
    const compiled = compileArchitect(
      'Build an Electron desktop app for Windows and macOS with a system tray icon, auto-update, and a code-signed installer that reads local project files'
    );
    expect(compiled.domain).toBe('desktop-development');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/preload script|context bridge|native module|clipboard/i);
  });

  it('constraint specialist flags the no-admin-rights vs system-level-access contradiction', () => {
    const compiled = compileArchitect(
      'Build a Windows desktop app that must run with no admin rights but also needs to register a global hotkey that intercepts input system-level across other apps'
    );
    expect(compiled.domain).toBe('desktop-development');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/no admin rights vs system-level access/i);
  });
});
