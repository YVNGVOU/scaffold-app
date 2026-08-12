import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here. With substring matching, the bare keyword 'player' would also match
// inside unrelated words like "multiplayer" (as a substring of the raw
// input), silently double-counting a single mention as two hits. That
// inflated score is what let non-game inputs like "Build a horror-themed
// multiplayer chat website" outscore the web domain (game scored 2 —
// 'multiplayer' + a substring hit for 'player' — against web's 1 for
// 'website'). See TASK-006.
const KEYWORDS = [
  'game', 'gameplay', 'level design', 'unity', 'unreal', 'godot', 'roblox',
  'player', 'npc', 'boss fight', 'rpg', 'fps', 'platformer', 'horror game',
  'game engine', 'sprite', 'game jam',
];

// 'multiplayer' alone is not a reliable game signal — plenty of non-game
// software (chat apps, collaboration tools) describes itself as
// "multiplayer"/"multi-user" without being a game. It only counts toward the
// game score when it co-occurs with at least one other game-signal keyword,
// mirroring the TASK-002 fix pattern of removing/narrowing an
// insufficiently-specific bare keyword (PLATFORM_LEXICON's web bucket) rather
// than dropping the signal entirely.
const MULTIPLAYER_SIGNAL = /\bmultiplayer\b/i;

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => ({ kw, pattern: wordBoundaryRegex(kw) }));

export const gameDomain: DomainModule = {
  id: 'game',
  label: 'Game Development',
  score(input: string): number {
    let score = 0;
    let otherHits = 0;
    for (const { pattern } of KEYWORD_PATTERNS) {
      if (pattern.test(input)) {
        score += 1;
        otherHits += 1;
      }
    }
    if (MULTIPLAYER_SIGNAL.test(input) && otherHits > 0) {
      score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define core gameplay loop', category: 'functional' },
    { text: 'Target platform(s) must support chosen engine', category: 'constraint' },
    { text: 'Basic input handling (keyboard/mouse/controller as applicable)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform (PC, console, mobile, web) is unspecified',
      isResolved: (input) => /(pc|console|mobile|web|steam|playstation|xbox|switch|ios|android)/i.test(input),
    },
    {
      field: 'genre',
      description: 'Game genre is unspecified',
      isResolved: (input) => /(horror|platformer|rpg|fps|puzzle|strategy|racing|shooter|adventure|sandbox|simulation|roguelike)/i.test(input),
    },
    {
      field: 'engine',
      description: 'Game engine is unspecified',
      isResolved: (input) => /(unity|unreal|godot|roblox|gamemaker|custom engine)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'engine', dependsOn: [], note: 'Game engine / runtime choice' },
    { component: 'core loop', dependsOn: ['engine'], note: 'Primary gameplay loop and state machine' },
    { component: 'assets', dependsOn: ['engine'], note: 'Art, audio, and animation pipeline' },
    { component: 'platform target', dependsOn: ['engine', 'core loop'], note: 'Build/ship target(s)' },
  ],
  technicalConsiderations: [
    { aspect: 'engine', note: 'Select a game engine (Unity, Unreal, Godot, etc.) matching genre and platform needs', category: 'functionalRequirements' },
    { aspect: 'platform', note: 'Confirm target platform(s) (PC/console/mobile) support the chosen engine and hardware budget', category: 'constraints' },
    { aspect: 'performance', note: 'Define a frame-rate/performance target (e.g. 60fps) for the intended platform(s)', category: 'preferences' },
    { aspect: 'asset pipeline', note: 'Establish an asset pipeline for art/audio/animation import and optimization', category: 'functionalRequirements' },
    { aspect: 'save system', note: 'Consider save/checkpoint system requirements if the game has persistent progress', category: 'preferences' },
    { aspect: 'multiplayer networking', note: 'If multiplayer, define networking model (peer-to-peer vs. dedicated server) and latency tolerance', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'control scheme', note: 'Define the control scheme/input mapping and ensure it is remappable or clearly onboarded to the player', category: 'functionalRequirements' },
    { aspect: 'onboarding flow', note: 'Design a tutorial/onboarding flow that teaches core mechanics without a wall of text', category: 'preferences' },
    { aspect: 'pacing and tension curve', note: 'Plan the pacing/tension curve (difficulty ramp, rest beats between challenges) as an information-architecture concern across levels', category: 'preferences' },
    { aspect: 'accessibility', note: 'Consider accessibility options: colorblind-safe cues, subtitles/captions for audio cues, adjustable difficulty', category: 'constraints' },
    { aspect: 'HUD and feedback', note: 'Define UI/HUD hierarchy so critical state (health, objectives, prompts) is legible at a glance', category: 'functionalRequirements' },
    { aspect: 'failure and retry flow', note: 'Handle the edge case of player failure/death: retry flow, checkpoint clarity, and avoiding frustrating loss of progress', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'account authentication', note: 'If the game has player accounts/profiles, define how login/authentication is handled and how credentials are protected', category: 'constraints' },
    { aspect: 'anti-cheat', note: 'For competitive/networked play, consider anti-cheat and server-authoritative validation of gameplay-affecting actions', category: 'constraints' },
    { aspect: 'player data exposure', note: 'Audit what player data (profile info, chat logs, telemetry) is collected and ensure it is not exposed to other players or third parties without consent', category: 'constraints' },
    { aspect: 'network security', note: 'For multiplayer, secure client-server communication against tampering and validate all client input server-side rather than trusting the client', category: 'functionalRequirements' },
    { aspect: 'in-game purchases', note: 'If monetized, secure purchase/transaction flows and avoid trusting client-reported entitlements', category: 'preferences' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that all players/clients are trustworthy (e.g. client-authoritative state) that has not been explicitly confirmed as intentional', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual direction', note: 'Establish an art direction (palette, silhouette language, lighting mood) matching the genre and tone before production assets are built', category: 'preferences' },
    { aspect: 'originality', note: 'Identify what distinguishes this game\'s world/mechanics/aesthetic from genre-standard references so it is not a generic reskin', category: 'preferences' },
    { aspect: 'visual consistency', note: 'Define an art bible/style guide so environments, characters, and UI share a consistent visual language across the whole game', category: 'constraints' },
    { aspect: 'level composition', note: 'Use framing, lighting, and spatial composition within levels to guide the player\'s eye toward objectives and points of interest', category: 'functionalRequirements' },
    { aspect: 'audio-visual style', note: 'Pair the visual style with a matching audio identity (music/SFX tone) so presentation feels unified, not just visuals alone', category: 'preferences' },
    { aspect: 'creative opportunity', note: 'Look for a signature moment or mechanic-driven visual set piece that becomes the game\'s memorable identity', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "single-player only" alongside "multiplayer leaderboards")', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. a save system implying corruption/recovery handling)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria for core mechanics (e.g. "the player can complete the tutorial level without dying on a first attempt")', category: 'functionalRequirements' },
    { aspect: 'test cases', note: 'Generate test cases for key mechanics: normal play, edge-of-map/out-of-bounds movement, and boundary states (0 health, max inventory, last enemy defeated)', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: disconnect mid-match, save corruption, controller disconnect, softlock scenarios', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: what happens if the player skips a required tutorial step, exploits collision to leave the level, or triggers two win conditions at once', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs scope',
      note: 'A near-zero/shoestring budget stated alongside an open-world, MMO, AAA, or photorealistic scope is a known-infeasible combination — that scope requires a proportionally large art/engineering budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(open[- ]world|mmo|aaa|photorealistic)\b/i,
    },
    {
      aspect: 'timeline vs complexity',
      note: 'An extremely short delivery timeline (days or less) alongside open-world, multiplayer, or procedurally-generated scope is high-risk — those systems typically require weeks-to-months of iteration regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) (?:day|week)|overnight|asap)\b/i,
      triggerB: /\b(open[- ]world|multiplayer|procedural generation|full campaign)\b/i,
    },
    {
      aspect: 'platform vs feature availability',
      note: 'Mobile as the target platform alongside 4K/ray-tracing/photorealistic fidelity or large-scale (100+ player) multiplayer is a known-infeasible combination for typical mobile hardware and battery/thermal budgets.',
      category: 'constraints',
      triggerA: /\bmobile\b/i,
      triggerB: /\b(4k|ray[- ]tracing|photorealistic|100\+?\s*player)\b/i,
    },
  ],
};
