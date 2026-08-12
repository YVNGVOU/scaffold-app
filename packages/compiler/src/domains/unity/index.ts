import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Plain substring matching would let bare keywords
// match inside unrelated words (e.g. a hypothetical 'ui' keyword matching
// inside "build" or "guide") — silently inflating scores on inputs that have
// nothing to do with the Unity engine.
//
// This domain intentionally targets Unity-specific engine/workflow
// vocabulary (C# scripting, prefabs, scene management, asset pipeline, build
// targets, physics/rendering settings) rather than generic game-development
// terms, which are already covered by domains/game/index.ts. The generic
// 'game' domain also lists 'unity' as one of many engine keywords, so a
// request that only says "make a game in Unity" with no other Unity-specific
// detail may still classify as 'game' — that is intentional; this module
// wins classification specifically when the request carries genuine
// Unity-workflow detail (prefabs, MonoBehaviour, scene management, etc.).
const KEYWORDS = [
  'unity', 'unity3d', 'unity engine', 'prefab', 'prefabs', 'monobehaviour',
  'gameobject', 'scriptableobject', 'scene management', 'asset pipeline',
  'build target', 'build targets', 'unity editor', 'c# script', 'c# scripting',
  'rigidbody', 'unity physics', 'unity ui', 'ugui', 'unity package',
  'asset bundle', 'asset bundles', 'addressables', 'unity render pipeline',
  'urp', 'hdrp', 'unity animator', 'coroutine', 'nuget for unity',
  'unity asset store', 'il2cpp', 'unity cloud build',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const unityDomain: DomainModule = {
  id: 'unity',
  label: 'Unity',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Target Unity Editor/engine version must be pinned for the project', category: 'constraint' },
    { text: 'Define build target platform(s) (e.g. PC, console, mobile, WebGL)', category: 'functional' },
    { text: 'Establish a scene/prefab organization convention before content scales up', category: 'preference' },
    { text: 'Choose a render pipeline (Built-in, URP, or HDRP) appropriate to the target hardware', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'renderPipeline',
      description: 'Which Unity render pipeline (Built-in, URP, HDRP) is unspecified',
      isResolved: (input) => /\b(built-?in( render)?( pipeline)?|urp|hdrp|universal render pipeline|high definition render pipeline|scriptable render pipeline)\b/i.test(input),
    },
    {
      field: 'buildTargets',
      description: 'Target build platform(s) (PC, console, mobile, WebGL) are unspecified',
      isResolved: (input) => /\b(pc|windows|mac(os)?|linux|console|playstation|xbox|switch|ios|android|webgl|standalone)\b/i.test(input),
    },
    {
      field: 'unityVersion',
      description: 'The Unity Editor/engine version (or LTS stream) to target is unspecified',
      isResolved: (input) => /\b(unity\s*\d|202\d\.\d|lts\b|long[- ]term support)\b/i.test(input),
    },
    {
      field: 'scriptingBackend',
      description: 'Scripting backend (Mono vs IL2CPP) and .NET API compatibility level are unspecified',
      isResolved: (input) => /\b(il2cpp|mono|\.net (standard|framework))\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'scene hierarchy', dependsOn: [], note: 'Scene layout and load/unload flow (single-scene vs additive scene loading)' },
    { component: 'prefab library', dependsOn: ['scene hierarchy'], note: 'Reusable prefab structure for gameplay entities and UI' },
    { component: 'scripting layer', dependsOn: ['prefab library'], note: 'C# MonoBehaviour/ScriptableObject architecture and dependency wiring' },
    { component: 'asset pipeline', dependsOn: [], note: 'Import settings, asset bundles/Addressables, and content pipeline' },
    { component: 'physics and rendering config', dependsOn: ['scene hierarchy'], note: 'Physics layers/collision matrix and render pipeline (URP/HDRP) settings' },
    { component: 'build configuration', dependsOn: ['scripting layer', 'asset pipeline'], note: 'Per-platform build target settings, player settings, and CI build pipeline' },
  ],
  technicalConsiderations: [
    { aspect: 'unity version', note: 'Pin an exact Unity Editor/LTS version for the project to avoid API drift and cross-machine build inconsistencies', category: 'constraints' },
    { aspect: 'scripting architecture', note: 'Choose a C# architecture pattern (MonoBehaviour-driven vs. ECS/DOTS, ScriptableObject-based event channels) matching project scale', category: 'functionalRequirements' },
    { aspect: 'render pipeline', note: 'Select Built-in, URP, or HDRP based on target hardware and visual fidelity requirements — pipelines are not interchangeable mid-project without significant rework', category: 'constraints' },
    { aspect: 'asset pipeline', note: 'Define asset import settings, compression, and delivery strategy (Addressables/AssetBundles) to control build size and load times', category: 'functionalRequirements' },
    { aspect: 'build targets', note: 'Confirm each target platform\'s scripting backend (Mono vs IL2CPP), API compatibility level, and platform-specific SDK requirements', category: 'constraints' },
    { aspect: 'performance profiling', note: 'Plan to profile with the Unity Profiler/Frame Debugger against a target frame budget rather than optimizing blind', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'input handling', note: 'Decide between the legacy Input Manager and the new Input System package, and design a remappable control scheme', category: 'functionalRequirements' },
    { aspect: 'scene transitions', note: 'Design loading-screen/scene-transition UX so additive scene loads and asset streaming never present a frozen or blank frame', category: 'preferences' },
    { aspect: 'UI scaling', note: 'Configure Canvas Scaler / UI Toolkit layout so UI remains legible and correctly anchored across the target platforms\' aspect ratios and resolutions', category: 'functionalRequirements' },
    { aspect: 'accessibility', note: 'Consider colorblind-safe UI palettes, remappable inputs, and subtitle/caption support surfaced through Unity UI', category: 'constraints' },
    { aspect: 'editor workflow', note: 'Keep designer-facing workflows (prefab variants, custom inspectors) usable by non-programmers on the team, not just engineers', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'server-authoritative state', note: 'For networked Unity projects (Netcode for GameObjects, Mirror, etc.), validate gameplay-affecting state server-side rather than trusting client-reported values', category: 'constraints' },
    { aspect: 'secrets in build', note: 'Ensure API keys, backend URLs, or credentials are not baked into the compiled build/asset bundles where they can be extracted from the shipped binary', category: 'constraints' },
    { aspect: 'asset tampering', note: 'Consider integrity checks for downloadable Addressables/AssetBundles to prevent tampered content injection at runtime', category: 'preferences' },
    { aspect: 'IL2CPP obfuscation', note: 'Evaluate whether IL2CPP alone is sufficient protection against reverse-engineering, or whether additional code obfuscation is warranted for sensitive logic', category: 'preferences' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that the compiled build cannot be decompiled/modified by end users, which is false without additional hardening', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual direction', note: 'Establish an art direction (lighting mood, material/shader style, palette) compatible with the chosen render pipeline before production assets are built', category: 'preferences' },
    { aspect: 'lighting approach', note: 'Decide between baked lightmaps, real-time GI, or mixed lighting early, since it drives scene setup and shader choices throughout production', category: 'functionalRequirements' },
    { aspect: 'shader consistency', note: 'Standardize on a shader/material workflow (Shader Graph vs. hand-written shaders) so the visual language stays consistent across scenes', category: 'preferences' },
    { aspect: 'prefab variant consistency', note: 'Use prefab variants to keep visual variations (character skins, environment sets) consistent with a shared base rather than diverging copies', category: 'constraints' },
    { aspect: 'creative opportunity', note: 'Look for a signature use of Unity\'s particle/VFX Graph or post-processing stack that becomes a memorable visual identity', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "mobile-first" alongside HDRP/high-fidelity rendering that mobile hardware cannot sustain)', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. Addressables usage implying a content-update/versioning strategy)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria per platform build (e.g. "maintains 60fps on the minimum-spec target device")', category: 'functionalRequirements' },
    { aspect: 'test cases', note: 'Generate test cases for scene loading edge cases: additive scene load failure, missing prefab references, and asset bundle download failure', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: null MonoBehaviour references after a scene reload, physics tunneling at high speed, IL2CPP build failures on a target platform', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: what happens on a corrupted save file, a missing addressable asset at runtime, or rapid scene-transition spam', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'render pipeline vs hardware target',
      note: 'HDRP alongside a mobile or low-end/WebGL build target is a known-infeasible combination — HDRP requires desktop/console-class GPU capability and is not supported on typical mobile or WebGL targets.',
      category: 'constraints',
      triggerA: /\bhdrp\b|\bhigh definition render pipeline\b/i,
      triggerB: /\b(mobile|android|ios|webgl)\b/i,
    },
    {
      aspect: 'budget vs scope',
      note: 'A near-zero/shoestring budget stated alongside a large open-world Unity project or custom DOTS/ECS architecture is a known-infeasible combination — that scope requires proportional engineering and content budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(open[- ]world|dots\b|ecs\b|entity component system)\b/i,
    },
    {
      aspect: 'timeline vs multiplayer networking',
      note: 'An extremely short delivery timeline (days or less) alongside a networked/multiplayer Unity project is high-risk — implementing and stabilizing server-authoritative networking typically requires weeks-to-months regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) (?:day|week)|overnight|asap)\b/i,
      triggerB: /\b(multiplayer|netcode|mirror networking|photon|dedicated server)\b/i,
    },
  ],
};
