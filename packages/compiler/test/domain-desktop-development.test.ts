import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('desktop-development domain', () => {
  it('detects desktop-development domain on a realistic native desktop app request', () => {
    const compiled = compileArchitect(
      'Build a cross-platform desktop application with Electron that runs on Windows and macOS, with a system tray icon and auto-updater'
    );
    expect(compiled.domain).toBe('desktop-development');
  });

  it('negative control: an unrelated web-focused request does not misclassify as desktop-development', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('desktop-development');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: "betray" and "happy" do not falsely trigger desktop-development keywords', () => {
    const state = runArchitectPipeline('Our hero must not betray the kingdom, a happy ending story game');
    expect(state.domain).not.toBe('desktop-development');
  });

  it('architect specialist produces desktop-development-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a native desktop app using Tauri for Windows and Linux with an installer, code signing, and auto-update support'
    );
    expect(compiled.domain).toBe('desktop-development');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/application shell|packaging pipeline|code signing|auto-update service/i);
  });
});
