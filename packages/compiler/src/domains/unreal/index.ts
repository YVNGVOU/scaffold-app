import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Plain substring matching would let bare keywords
// match inside unrelated words — silently inflating scores on inputs that
// have nothing to do with Unreal Engine.
//
// This domain intentionally targets Unreal-specific engine/workflow
// vocabulary (Blueprints, C++ gameplay classes, level design, materials,
// Nanite/Lumen, packaging) rather than generic game-development terms,
// which are already covered by domains/game/index.ts. The generic 'game'
// domain also lists 'unreal' as one of many engine keywords, so a request
// that only says "make a game in Unreal" with no other Unreal-specific
// detail may still classify as 'game' — that is intentional; this module
// wins classification specifically when the request carries genuine
// Unreal-workflow detail (Blueprints, UMG, level streaming, etc.).
const KEYWORDS = [
  'unreal', 'unreal engine', 'ue4', 'ue5', 'unreal engine 4', 'unreal engine 5',
  'blueprint', 'blueprints', 'blueprint class', 'blueprint scripting',
  'actor component', 'game mode', 'gamemode', 'pawn class', 'character class',
  'level design', 'level streaming', 'world partition', 'material editor',
  'material graph', 'shader graph', 'nanite', 'lumen', 'landscape tool',
  'niagara', 'sequencer', 'umg', 'unreal motion graphics', 'chaos physics',
  'unreal build tool', 'unreal header tool', 'uclass', 'ustruct', 'ufunction',
  'gameplay ability system', 'unreal marketplace', 'metahuman', 'pak file',
  'unreal editor', 'packaging project', 'target platform',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const unrealDomain: DomainModule = {
  id: 'unreal',
  label: 'Unreal Engine',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Target Unreal Engine version must be pinned for the project', category: 'constraint' },
    { text: 'Decide the Blueprint vs C++ split for gameplay logic before production scales up', category: 'functional' },
    { text: 'Define target platform(s) and packaging configuration (e.g. PC, console, mobile)', category: 'constraint' },
    { text: 'Establish a level/content folder organization convention early', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'blueprintVsCpp',
      description: 'Whether gameplay logic will be implemented in Blueprints, C++, or a hybrid split is unspecified',
      isResolved: (input) => /\b(blueprint|blueprints|c\+\+|native code|hybrid (approach|workflow))\b/i.test(input),
    },
    {
      field: 'renderingFeatures',
      description: 'Which rendering features (Nanite, Lumen, ray tracing, mobile rendering) are targeted is unspecified',
      isResolved: (input) => /\b(nanite|lumen|ray[- ]tracing|mobile rendering|forward rendering|deferred rendering)\b/i.test(input),
    },
    {
      field: 'targetPlatforms',
      description: 'Target build/packaging platform(s) (PC, console, mobile) are unspecified',
      isResolved: (input) => /\b(pc|windows|mac(os)?|linux|console|playstation|xbox|switch|ios|android|standalone)\b/i.test(input),
    },
    {
      field: 'unrealVersion',
      description: 'The Unreal Engine version (UE4 vs UE5, or specific minor version) to target is unspecified',
      isResolved: (input) => /\b(unreal engine\s*\d|ue4|ue5|5\.\d|4\.2[0-7])\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'level layout', dependsOn: [], note: 'Level/world partition structure and streaming boundaries' },
    { component: 'gameplay framework', dependsOn: [], note: 'GameMode, PlayerController, Pawn/Character, and GameState class hierarchy' },
    { component: 'blueprint/C++ split', dependsOn: ['gameplay framework'], note: 'Which systems live in C++ base classes vs Blueprint subclasses' },
    { component: 'material and shader library', dependsOn: [], note: 'Master materials, material instances, and shader graph organization' },
    { component: 'content pipeline', dependsOn: [], note: 'Asset import settings, Nanite/LOD configuration, and content folder structure' },
    { component: 'packaging configuration', dependsOn: ['gameplay framework', 'content pipeline'], note: 'Per-platform packaging settings, target hardware, and build automation' },
  ],
  technicalConsiderations: [
    { aspect: 'unreal version', note: 'Pin an exact Unreal Engine version (UE4 vs UE5, specific minor release) to avoid API drift and marketplace plugin incompatibility', category: 'constraints' },
    { aspect: 'blueprint vs c++', note: 'Decide which systems belong in C++ (performance-critical, core gameplay framework) vs Blueprint (rapid iteration, designer-facing logic) before content scales', category: 'functionalRequirements' },
    { aspect: 'rendering pipeline', note: 'Select Nanite/Lumen, ray tracing, or a mobile-optimized forward renderer based on target hardware — these are not freely mixable across all platforms', category: 'constraints' },
    { aspect: 'level streaming', note: 'Define World Partition/level streaming strategy so large levels do not blow memory budgets or stall on load', category: 'functionalRequirements' },
    { aspect: 'performance profiling', note: 'Plan to profile with Unreal Insights/stat commands against a target frame budget per platform rather than optimizing blind', category: 'preferences' },
    { aspect: 'packaging and build', note: 'Confirm each target platform\'s packaging settings, cook configuration, and Unreal Build Tool toolchain requirements', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'input handling', note: 'Design the Enhanced Input System mapping contexts and action bindings so controls remain remappable across input devices', category: 'functionalRequirements' },
    { aspect: 'level transitions', note: 'Design loading-screen/level-transition UX so level streaming and asset loading never present a frozen or blank frame', category: 'preferences' },
    { aspect: 'UMG layout', note: 'Configure UMG widget anchoring/DPI scaling so HUD and menus remain legible across target platforms\' resolutions and aspect ratios', category: 'functionalRequirements' },
    { aspect: 'accessibility', note: 'Consider colorblind-safe UI palettes, remappable inputs, and subtitle/caption support surfaced through UMG', category: 'constraints' },
    { aspect: 'editor workflow', note: 'Keep designer-facing workflows (Blueprint editing, level design tools) usable by non-programmers on the team, not just engineers', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'server-authoritative state', note: 'For networked Unreal projects, validate gameplay-affecting state and RPCs server-side rather than trusting client-reported values', category: 'constraints' },
    { aspect: 'secrets in package', note: 'Ensure API keys, backend URLs, or credentials are not baked into packaged .pak files where they can be extracted from the shipped build', category: 'constraints' },
    { aspect: 'blueprint exposure', note: 'Be aware that packaged Blueprint logic can be inspected/decompiled more easily than compiled C++ — avoid placing sensitive logic purely in Blueprints', category: 'preferences' },
    { aspect: 'replication scope', note: 'Restrict replicated variables/RPCs to what clients actually need, to reduce both bandwidth and the attack surface for client-side cheating', category: 'constraints' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that a packaged build cannot be modified/cheated by end users, which is false without additional anti-cheat/hardening', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual direction', note: 'Establish an art direction (lighting mood, material style, palette) compatible with the chosen rendering features (Lumen/Nanite) before production assets are built', category: 'preferences' },
    { aspect: 'lighting approach', note: 'Decide between Lumen dynamic GI, baked lighting, or a hybrid approach early, since it drives level layout and material setup throughout production', category: 'functionalRequirements' },
    { aspect: 'material consistency', note: 'Standardize on master materials with material instances so the visual language stays consistent across levels rather than diverging one-off shaders', category: 'preferences' },
    { aspect: 'level composition', note: 'Use landscape and level-design tools to establish clear sightlines and pacing so level layouts read intentionally rather than accidentally', category: 'constraints' },
    { aspect: 'creative opportunity', note: 'Look for a signature use of Niagara VFX, Sequencer cinematics, or MetaHuman characters that becomes a memorable visual identity', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "mobile-first" alongside Nanite/Lumen rendering that mobile hardware cannot sustain)', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. level streaming implying a loading-screen/transition strategy)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria per platform build (e.g. "maintains 60fps on the minimum-spec target device")', category: 'functionalRequirements' },
    { aspect: 'test cases', note: 'Generate test cases for level-streaming edge cases: streaming level load failure, missing Blueprint references, and packaging/cook failures', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: null actor references after a level transition, replication desync in multiplayer, packaging failures on a target platform', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: what happens on a corrupted save file, a missing streaming level at runtime, or rapid level-transition spam', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'rendering features vs hardware target',
      note: 'Nanite/Lumen alongside a mobile or low-end hardware build target is a known-infeasible combination — Nanite and Lumen require desktop/console-class GPU capability and are not supported (or heavily restricted) on typical mobile targets.',
      category: 'constraints',
      triggerA: /\b(nanite|lumen)\b/i,
      triggerB: /\b(mobile|android|ios)\b/i,
    },
    {
      aspect: 'budget vs scope',
      note: 'A near-zero/shoestring budget stated alongside a large open-world Unreal project or custom gameplay ability system is a known-infeasible combination — that scope requires proportional engineering and content budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(open[- ]world|gameplay ability system|metahuman)\b/i,
    },
    {
      aspect: 'timeline vs multiplayer networking',
      note: 'An extremely short delivery timeline (days or less) alongside a networked/multiplayer Unreal project is high-risk — implementing and stabilizing server-authoritative replication typically requires weeks-to-months regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) (?:day|week)|overnight|asap)\b/i,
      triggerB: /\b(multiplayer|dedicated server|replication|online subsystem)\b/i,
    },
  ],
};
