import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('unity domain', () => {
  it('detects unity domain on a realistic Unity-specific request', () => {
    const compiled = compileArchitect(
      'Build a Unity project with C# scripting, prefabs for enemies, scene management between levels, and set up the asset pipeline for build targets on PC and mobile using URP'
    );
    expect(compiled.domain).toBe('unity');
  });

  it('negative control: an unrelated web-focused request does not misclassify as unity', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('unity');
    expect(compiled.domain).toBe('web');
  });

  it('negative control: a generic game-development request without Unity-specific detail does not misclassify as unity', () => {
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    expect(compiled.domain).not.toBe('unity');
    expect(compiled.domain).toBe('game');
  });

  it('word-boundary regression: unrelated words do not falsely trigger unity keywords', () => {
    const state = runArchitectPipeline('The community must build unity and understanding to guide the ui review');
    expect(state.domain).not.toBe('unity');
  });

  it('architect specialist produces unity-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a Unity3D game with a prefab-based enemy system, MonoBehaviour scripting, scene management for multiple levels, an asset pipeline using Addressables, and build targets for Windows and WebGL with URP rendering'
    );
    expect(compiled.domain).toBe('unity');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/prefab library|scripting layer|asset pipeline|build configuration/i);
  });

  it('technical specialist surfaces a Unity-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a Unity3D game with a prefab-based enemy system, MonoBehaviour scripting, scene management for multiple levels, an asset pipeline using Addressables, and build targets for Windows and WebGL with URP rendering'
    );
    expect(compiled.domain).toBe('unity');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/render pipeline|scripting backend|build targets|unity version/i);
  });
});
