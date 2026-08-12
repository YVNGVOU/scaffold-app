import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('roblox domain', () => {
  it('roblox domain detected on canonical roblox example', () => {
    const compiled = compileArchitect(
      'Build a Roblox obby game in Roblox Studio using Luau scripts, with game passes for monetization and DataStore progress saving'
    );
    expect(compiled.domain).toBe('roblox');
  });

  it('negative control: unrelated web request does not misclassify as roblox', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('roblox');
  });

  it('negative control: unity game request does not misclassify as roblox', () => {
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    expect(compiled.domain).not.toBe('roblox');
  });

  it('architecture template for roblox domain includes Roblox-appropriate components', () => {
    const input =
      'Build a Roblox experience in Roblox Studio using Luau, with RemoteEvents, DataStore saving, and robux game passes';
    const state = runArchitectPipeline(input);
    expect(state.domain).toBe('roblox');
    const compiled = compileArchitect(input);
    const allText = JSON.stringify(compiled);
    expect(allText.toLowerCase()).toMatch(/datastore|remoteevent|game pass|luau|roblox studio/);
  });
});
