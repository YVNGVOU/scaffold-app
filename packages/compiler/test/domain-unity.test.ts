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

  it('detects unity domain via newly added keywords (Cinemachine, Shader Graph, DOTS/ECS)', () => {
    const compiled = compileArchitect(
      'Build a Unity game using Cinemachine for camera work, Shader Graph for stylized materials, and Unity DOTS/ECS with the Burst compiler for large-scale unit simulation'
    );
    expect(compiled.domain).toBe('unity');
  });

  it('word-boundary regression: new keywords do not false-positive inside unrelated words', () => {
    // "burst" inside "burst of energy", "dots" inside "connect the dots", "terrain" without "unity"
    const state = runArchitectPipeline(
      'The startup had a sudden burst of energy connecting the dots between rugged terrain photography and community art'
    );
    expect(state.domain).not.toBe('unity');
  });

  it('ambiguity checklist recognizes a bare short answer for networking framework', () => {
    const compiled = compileArchitect(
      'Build a Unity3D multiplayer game with prefabs, MonoBehaviour scripting, and scene management. Networking: Photon Fusion.'
    );
    expect(compiled.domain).toBe('unity');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/networking framework.{0,120}unspecified for a networked/i);
  });

  it('surfaces new networking and GC-related technical/security considerations', () => {
    const compiled = compileArchitect(
      'Build a Unity3D game with a prefab-based enemy system, MonoBehaviour scripting, scene management for multiple levels, an asset pipeline using Addressables, and build targets for Windows and WebGL with URP rendering'
    );
    expect(compiled.domain).toBe('unity');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/netcode for gameobjects|mirror|photon fusion|garbage collect|per-frame heap allocations|save data|playerprefs/i);
  });
});
