import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('roblox domain', () => {
  it('detects roblox domain on a realistic experience-build request', () => {
    const compiled = compileArchitect(
      'Build a Roblox tycoon experience in Roblox Studio using Luau scripts, RemoteEvents, DataStore-backed player data, game passes, and leaderstats'
    );
    expect(compiled.domain).toBe('roblox');
  });

  it('negative control: an unrelated web-development request does not misclassify as roblox', () => {
    const compiled = compileArchitect(
      'Build a React dashboard that fetches sales data from a REST API and renders it in a table with filters'
    );
    expect(compiled.domain).not.toBe('roblox');
  });

  it('word-boundary regression: unrelated words do not falsely trigger new roblox keywords', () => {
    const state = runArchitectPipeline(
      'The apiary rigging crew used a wedgeworth union hall to organize the terraine survey and creator space budget'
    );
    expect(state.domain).not.toBe('roblox');
  });

  it('new keyword detection: UGC/plugin/rig phrasing is recognized', () => {
    const compiled = compileArchitect(
      'Make a Roblox Studio plugin that helps build custom UGC accessory rigs with proper welds and attribute values'
    );
    expect(compiled.domain).toBe('roblox');
  });

  it('ambiguity checklist resolves avatar customization scope on a bare short answer', () => {
    const compiled = compileArchitect(
      'Build a Roblox roleplay experience using stock R15 avatars with datastore2 persistence and mobile support'
    );
    expect(compiled.domain).toBe('roblox');
    const unresolvedFields = compiled.ambiguities?.map((a: { field: string }) => a.field) ?? [];
    expect(unresolvedFields).not.toContain('avatar/character customization scope');
  });

  it('technical specialist surfaces the new part-count/physics-cost consideration', () => {
    const compiled = compileArchitect(
      'Build a Roblox Studio physics sandbox experience with a union operation, lots of unanchored parts, RemoteEvents, and leaderstats for players to build with'
    );
    expect(compiled.domain).toBe('roblox');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/part count|physics cost|union operation/i);
  });

  it('constraint specialist flags massive concurrent player count vs single-server architecture', () => {
    const compiled = compileArchitect(
      'Build a Roblox experience that supports thousands of players all in the same server instance at once'
    );
    expect(compiled.domain).toBe('roblox');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/single[- ]server|multi-server architecture/i);
  });
});
