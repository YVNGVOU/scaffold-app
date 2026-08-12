import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside unrelated text and 'player' double-count inside "multiplayer" — do
// not repeat that bug here (e.g. a bare 'lua' keyword would match inside
// unrelated words if not word-boundary-safe).
const KEYWORDS = [
  'roblox', 'luau', 'roblox studio', 'game pass', 'gamepass', 'robux',
  'developer product', 'devproduct', 'datastore', 'data store', 'obby',
  'roblox script', 'roblox game', 'roblox experience', 'roproxy',
  'roblox lua', 'humanoid', 'remoteevent', 'remotefunction',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const robloxDomain: DomainModule = {
  id: 'roblox',
  label: 'Roblox',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Experience must run within Roblox client performance/memory limits on both desktop and mobile', category: 'constraint' },
    { text: 'Scripts must follow client-server model with server-authoritative game state', category: 'functional' },
    { text: 'Comply with Roblox Community Standards and content moderation policy', category: 'constraint' },
    { text: 'Support cross-device play (desktop, mobile, console) where applicable', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'monetization',
      description: 'Monetization approach (free, game passes, developer products, premium payouts) is unspecified',
      isResolved: (input) => /\b(robux|game\s*pass|gamepass|developer\s*product|devproduct|monetiz\w*|premium\s+payout)\b/i.test(input),
    },
    {
      field: 'genre',
      description: 'Experience genre/type (obby, tycoon, simulator, roleplay, FPS) is unspecified',
      isResolved: (input) => /\b(obby|tycoon|simulator|roleplay|role-play|rpg|fps|shooter|racing|survival)\b/i.test(input),
    },
    {
      field: 'platform target',
      description: 'Target device support (mobile, console, desktop, cross-platform) is unspecified',
      isResolved: (input) => /\b(mobile|console|desktop|cross-platform|xbox|tablet)\b/i.test(input),
    },
    {
      field: 'player scale',
      description: 'Expected concurrent player count / server capacity is unspecified',
      isResolved: (input) => /\b(\d+\s*players?|concurrent|server\s*size|max\s*players?)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'client scripts', dependsOn: [], note: 'LocalScripts handling input, UI, and client-side prediction' },
    { component: 'server scripts', dependsOn: [], note: 'Server-authoritative Scripts controlling gameplay state and validation' },
    { component: 'RemoteEvents/RemoteFunctions', dependsOn: ['client scripts', 'server scripts'], note: 'Client-server communication bridge' },
    { component: 'DataStore layer', dependsOn: ['server scripts'], note: 'Persistent player data (currency, inventory, progress) via DataStoreService' },
    { component: 'game passes / developer products', dependsOn: ['DataStore layer'], note: 'Monetization hooks via MarketplaceService' },
    { component: 'Roblox Studio project', dependsOn: ['client scripts', 'server scripts'], note: 'Place file, workspace hierarchy, and asset organization' },
  ],
  technicalConsiderations: [
    { aspect: 'client-server architecture', note: 'Keep gameplay-critical logic server-authoritative; never trust client-fired RemoteEvents for state changes like currency or inventory', category: 'constraints' },
    { aspect: 'DataStore reliability', note: 'Handle DataStoreService failures/throttling with retries and pcall wrapping to avoid silent player data loss', category: 'functionalRequirements' },
    { aspect: 'Luau performance', note: 'Budget script execution against the Roblox engine\'s frame budget; avoid unbounded loops in Heartbeat/RenderStepped', category: 'preferences' },
    { aspect: 'engine version', note: 'Confirm target Luau/Roblox engine feature set (e.g. typed Luau, parallel Luau/Actors) required for the experience', category: 'functionalRequirements' },
    { aspect: 'asset pipeline', note: 'Define how meshes, textures, and audio are imported and moderated through Roblox\'s asset upload/approval pipeline', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'mobile-first controls', note: 'Design touch-friendly controls and UI scaling since a large share of Roblox traffic is mobile', category: 'constraints' },
    { aspect: 'onboarding flow', note: 'Provide a clear first-time-player tutorial given Roblox\'s young and highly varied audience', category: 'preferences' },
    { aspect: 'UI responsiveness', note: 'Use scale-based GuiObjects rather than fixed offsets so UI adapts across phone, tablet, and desktop resolutions', category: 'functionalRequirements' },
    { aspect: 'session length', note: 'Design loops around typical short Roblox play sessions with clear short-term goals and rewards', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'exploit resistance', note: 'Assume the client is fully compromised (exploiters can call any RemoteEvent); validate all inputs and enforce all limits server-side', category: 'constraints' },
    { aspect: 'chat and moderation', note: 'Route all player-to-player text through Roblox\'s TextService filtering (chat and any custom UI text) to comply with content policy', category: 'constraints' },
    { aspect: 'age-appropriate content', note: 'Screen content and interactions against Roblox\'s content maturity guidelines given the platform\'s minor-heavy user base', category: 'constraints' },
    { aspect: 'purchase validation', note: 'Verify MarketplaceService purchase receipts server-side (ProcessReceipt) before granting developer product rewards', category: 'functionalRequirements' },
  ],
  creativeConsiderations: [
    { aspect: 'visual style', note: 'Establish an art direction (low-poly, blocky, realistic) consistent with the target audience and engine performance constraints', category: 'preferences' },
    { aspect: 'thumbnail and icon', note: 'Design a distinctive game icon and thumbnail set since Roblox discovery is heavily driven by visual first impressions', category: 'preferences' },
    { aspect: 'sound design', note: 'Use audio cues and music that reinforce genre and mood without overloading the client audio channel limits', category: 'preferences' },
    { aspect: 'brand consistency', note: 'Keep UI, avatars, and environment art stylistically consistent so the experience reads as one coherent product', category: 'constraints' },
  ],
  qaConsiderations: [
    { aspect: 'exploit testing', note: 'Test for common exploit vectors: firing RemoteEvents out of order, with invalid arguments, or at abnormal rates', category: 'constraints' },
    { aspect: 'data persistence testing', note: 'Test DataStore save/load across server shutdowns, teleports, and simultaneous saves to catch data loss/duplication bugs', category: 'functionalRequirements' },
    { aspect: 'cross-device testing', note: 'Test on both mobile touch input and desktop keyboard/mouse, since control schemes differ substantially', category: 'preferences' },
    { aspect: 'moderation compliance', note: 'Verify chat filtering and asset moderation are active before any public release to avoid platform enforcement action', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'client trust vs anti-exploit',
      note: 'Storing critical game state (currency, inventory) only on the client while also claiming exploit-resistance is infeasible — Roblox exploiters can freely modify client-side state, so server-authoritative validation is required.',
      category: 'constraints',
      triggerA: /\b(client-side|localscript)\s+(currency|inventory|state)\b/i,
      triggerB: /\b(exploit[- ]?proof|anti-?cheat|exploit[- ]?resistant)\b/i,
    },
    {
      aspect: 'timeline vs monetization complexity',
      note: 'An extremely short delivery timeline alongside a full monetization system (game passes, developer products, robust DataStore economy) is high-risk — a tested purchase/economy pipeline typically takes weeks to build safely.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(game\s*pass|gamepass|developer\s*product|devproduct|robux\s+economy|in-experience\s+purchases)\b/i,
    },
  ],
};
