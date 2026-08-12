import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside unrelated text and 'player' double-count inside "multiplayer" — do
// not repeat that bug here (e.g. a bare 'lua' keyword would match inside
// unrelated words if not word-boundary-safe).
//
// This domain module is deliberately much deeper than the standard
// per-domain template used elsewhere in this file — it encodes real,
// specific Roblox/Luau engineering knowledge (services, APIs, patterns,
// common pitfalls) rather than the generic 4-6-entries-per-specialist
// shape most domains use. This is still 100% deterministic rule/keyword
// data, not an LLM — it's just a much larger deterministic knowledge base.
const KEYWORDS = [
  'roblox', 'luau', 'roblox studio', 'game pass', 'gamepass', 'robux',
  'developer product', 'devproduct', 'datastore', 'data store', 'obby',
  'roblox script', 'roblox game', 'roblox experience', 'roproxy',
  'roblox lua', 'humanoid', 'remoteevent', 'remotefunction',
  'bindableevent', 'bindablefunction', 'modulescript', 'localscript',
  'collectionservice', 'tweenservice', 'pathfindingservice',
  'proximityprompt', 'runservice', 'contextactionservice',
  'userinputservice', 'contentprovider', 'teleportservice',
  'memorystoreservice', 'marketplaceservice', 'messagingservice',
  'httpservice', 'profileservice', 'datastore2', 'knit framework',
  'streamingenabled', 'workspace hierarchy', 'startergui', 'starterpack',
  'serverstorage', 'serverscriptservice', 'replicatedstorage',
  'replicatedfirst', 'lighting service', 'soundservice',
  'physicsservice', 'chatservice', 'textchatservice', 'badgeservice',
  'groupservice', 'analyticsservice', 'open cloud', 'roblox open cloud',
  'egg hunt', 'admin commands', 'anti-exploit', 'anti exploit',
  'leaderstats', 'leaderboard stats',
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
    { text: 'Use typed Luau (--!strict or --!nonstrict) where practical to catch reference/type errors before runtime', category: 'preference' },
    { text: 'Disconnect all RBXScriptConnections and destroy instances the system creates to avoid memory leaks', category: 'constraint' },
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
    {
      field: 'data persistence strategy',
      description: 'Whether player data must survive server restarts/teleports (raw DataStoreService vs a session-locking wrapper like ProfileService/DataStore2) is unspecified',
      isResolved: (input) => /\b(datastore2|profileservice|session[- ]?lock|persist\w*|save\s+data|player\s+data)\b/i.test(input),
    },
    {
      field: 'multi-server architecture',
      description: 'Whether the experience needs cross-server communication (matchmaking, global leaderboards via MemoryStore/MessagingService, multi-place teleport) is unspecified',
      isResolved: (input) => /\b(cross[- ]?server|multi[- ]?place|teleport\w*|memorystore|messagingservice|global\s+leaderboard)\b/i.test(input),
    },
    {
      field: 'anti-exploit posture',
      description: 'Expected rigor of exploit/cheat resistance (basic server validation vs dedicated anti-exploit tooling/rate limiting) is unspecified',
      isResolved: (input) => /\b(anti[- ]?exploit|anti[- ]?cheat|rate[- ]?limit\w*|exploit[- ]?resistant)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'client scripts (LocalScripts)', dependsOn: [], note: 'Input handling, UI, client-side prediction/effects — never authoritative for game state' },
    { component: 'server scripts (Scripts)', dependsOn: [], note: 'Server-authoritative gameplay logic and state validation, in ServerScriptService' },
    { component: 'shared ModuleScripts', dependsOn: [], note: 'Constants, type definitions, and pure logic shared between client and server via ReplicatedStorage' },
    { component: 'RemoteEvents/RemoteFunctions folder', dependsOn: ['client scripts (LocalScripts)', 'server scripts (Scripts)'], note: 'Organized Remotes folder in ReplicatedStorage; prefer RemoteEvent + server-fired confirmation over RemoteFunction to avoid client-yield deadlock risk' },
    { component: 'DataStore/persistence layer', dependsOn: ['server scripts (Scripts)'], note: 'Player data via DataStoreService, wrapped in retry/pcall logic or a session-locking library (ProfileService/DataStore2) to prevent data loss/duplication' },
    { component: 'game passes / developer products', dependsOn: ['DataStore/persistence layer'], note: 'Monetization via MarketplaceService, with server-side ProcessReceipt validation before granting rewards' },
    { component: 'CollectionService tag system', dependsOn: [], note: 'Tag-based instance management for scalable systems (e.g. all NPCs, all interactable objects) instead of hardcoded instance references' },
    { component: 'UI controller layer', dependsOn: ['client scripts (LocalScripts)'], note: 'Scale-based GuiObjects and a central UI state controller, avoiding fixed pixel offsets so layouts adapt across devices' },
    { component: 'round/game-state manager', dependsOn: ['server scripts (Scripts)', 'shared ModuleScripts'], note: 'Server-side state machine for round/lobby/match phases, if the experience has distinct game phases' },
    { component: 'analytics/telemetry hooks', dependsOn: ['server scripts (Scripts)'], note: 'AnalyticsService or a custom event-logging module for tracking retention/engagement metrics' },
    { component: 'Roblox Studio project structure', dependsOn: ['client scripts (LocalScripts)', 'server scripts (Scripts)'], note: 'Place file, Workspace hierarchy, StarterGui/StarterPack/StarterCharacterScripts organization, and asset organization' },
  ],
  technicalConsiderations: [
    { aspect: 'client-server architecture', note: 'Keep gameplay-critical logic server-authoritative; never trust client-fired RemoteEvents for state changes like currency or inventory', category: 'constraints' },
    { aspect: 'DataStore reliability', note: 'Handle DataStoreService failures/throttling with retries and pcall wrapping to avoid silent player data loss; prefer a session-locking wrapper (ProfileService/DataStore2) over raw DataStoreService for anything beyond trivial data', category: 'functionalRequirements' },
    { aspect: 'Luau performance', note: 'Budget script execution against the Roblox engine\'s frame budget; avoid unbounded loops in Heartbeat/RenderStepped, prefer task.spawn/task.wait over deprecated spawn()/wait()', category: 'preferences' },
    { aspect: 'engine version', note: 'Confirm target Luau/Roblox engine feature set (e.g. typed Luau, parallel Luau/Actors) required for the experience', category: 'functionalRequirements' },
    { aspect: 'asset pipeline', note: 'Define how meshes, textures, and audio are imported and moderated through Roblox\'s asset upload/approval pipeline', category: 'constraints' },
    { aspect: 'RemoteEvent vs RemoteFunction choice', note: 'Prefer RemoteEvent (fire-and-forget, ack via a follow-up event) over RemoteFunction for client→server calls, since a RemoteFunction can yield the client indefinitely if the server errors or the connection drops', category: 'functionalRequirements' },
    { aspect: 'CollectionService for scalable systems', note: 'Use CollectionService tags rather than hardcoded per-instance scripts for repeated object types (NPCs, collectibles, interactables) so the system scales without per-instance boilerplate', category: 'preferences' },
    { aspect: 'StreamingEnabled memory management', note: 'If Workspace.StreamingEnabled is on, design scripts to tolerate instances streaming in/out (nil-check Workspace descendants, use StreamingTargetRadius appropriately) rather than assuming the whole map is always loaded', category: 'functionalRequirements' },
    { aspect: 'connection/instance cleanup', note: 'Every RBXScriptConnection (:Connect()) and created Instance must be disconnected/destroyed on cleanup (player leaving, round ending) to avoid memory leaks that accumulate over a long-running server', category: 'constraints' },
    { aspect: 'cross-server state', note: 'For matchmaking, global leaderboards, or cross-server events, use MemoryStoreService (low-latency, ephemeral) or MessagingService (pub/sub), not DataStoreService (too slow/rate-limited for real-time coordination)', category: 'functionalRequirements' },
    { aspect: 'ContentProvider preloading', note: 'Use ContentProvider:PreloadAsync for critical assets (UI images, key meshes) to avoid pop-in during a loading screen rather than letting assets stream in visibly mid-experience', category: 'preferences' },
    { aspect: 'attributes vs custom values', note: 'Prefer Instance:SetAttribute()/GetAttribute() over ad-hoc ObjectValue/NumberValue instances for simple per-instance data — attributes are replicated, lighter-weight, and inspectable in Studio', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'mobile-first controls', note: 'Design touch-friendly controls and UI scaling since a large share of Roblox traffic is mobile', category: 'constraints' },
    { aspect: 'onboarding flow', note: 'Provide a clear first-time-player tutorial given Roblox\'s young and highly varied audience', category: 'preferences' },
    { aspect: 'UI responsiveness', note: 'Use scale-based GuiObjects rather than fixed offsets so UI adapts across phone, tablet, and desktop resolutions', category: 'functionalRequirements' },
    { aspect: 'session length', note: 'Design loops around typical short Roblox play sessions with clear short-term goals and rewards', category: 'preferences' },
    { aspect: 'loading screen feedback', note: 'Show real loading progress (via ContentProvider:PreloadAsync progress) rather than a static splash, so players on slow connections aren\'t left guessing whether the experience has frozen', category: 'preferences' },
    { aspect: 'input method detection', note: 'Detect input type via UserInputService (touch/gamepad/keyboard-mouse) and adapt prompts/UI accordingly rather than assuming one input scheme', category: 'functionalRequirements' },
    { aspect: 'proximity prompt discoverability', note: 'If using ProximityPrompt for interactions, tune HoldDuration and visual style so prompts are discoverable without cluttering the screen', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'exploit resistance', note: 'Assume the client is fully compromised (exploiters can call any RemoteEvent with arbitrary arguments, arbitrary rate, or skip client-side checks entirely); validate all inputs and enforce all limits server-side', category: 'constraints' },
    { aspect: 'chat and moderation', note: 'Route all player-to-player text through Roblox\'s TextService/TextChatService filtering (chat and any custom UI text) to comply with content policy', category: 'constraints' },
    { aspect: 'age-appropriate content', note: 'Screen content and interactions against Roblox\'s content maturity guidelines given the platform\'s minor-heavy user base', category: 'constraints' },
    { aspect: 'purchase validation', note: 'Verify MarketplaceService purchase receipts server-side (ProcessReceipt) before granting developer product rewards, and make ProcessReceipt idempotent (a receipt can be reprocessed on retry)', category: 'functionalRequirements' },
    { aspect: 'RemoteEvent rate limiting', note: 'Rate-limit and debounce server-side handling of client-fired RemoteEvents (e.g. per-player cooldown tables) so an exploiter spamming a remote cannot flood the server or duplicate an action', category: 'constraints' },
    { aspect: 'instance reference validation', note: 'Never trust a client-supplied Instance reference (e.g. "which item to sell") without server-side verifying it actually belongs to that player and is in an expected state — a client can pass an arbitrary/spoofed reference', category: 'constraints' },
    { aspect: 'HttpService allow-list', note: 'If HttpRequests are enabled for external API calls, restrict outbound calls to known, allow-listed domains and never place third-party API keys in client-reachable scripts', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual style', note: 'Establish an art direction (low-poly, blocky, realistic) consistent with the target audience and engine performance constraints', category: 'preferences' },
    { aspect: 'thumbnail and icon', note: 'Design a distinctive game icon and thumbnail set since Roblox discovery is heavily driven by visual first impressions', category: 'preferences' },
    { aspect: 'sound design', note: 'Use audio cues and music that reinforce genre and mood without overloading the client audio channel limits', category: 'preferences' },
    { aspect: 'brand consistency', note: 'Keep UI, avatars, and environment art stylistically consistent so the experience reads as one coherent product', category: 'constraints' },
    { aspect: 'lighting and atmosphere', note: 'Tune the Lighting service (technology, ambient, atmosphere/fog) deliberately to set mood rather than leaving Studio defaults, which read as generic/unfinished', category: 'preferences' },
    { aspect: 'juice and feedback', note: 'Use TweenService for satisfying micro-animations (button presses, reward pop-ups, damage numbers) — small polish that materially affects perceived quality on Roblox', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'exploit testing', note: 'Test for common exploit vectors: firing RemoteEvents out of order, with invalid/out-of-range arguments, at abnormal rates, or with spoofed instance references', category: 'constraints' },
    { aspect: 'data persistence testing', note: 'Test DataStore save/load across server shutdowns, teleports, and simultaneous saves (e.g. two servers writing the same player\'s data) to catch data loss/duplication bugs', category: 'functionalRequirements' },
    { aspect: 'cross-device testing', note: 'Test on both mobile touch input and desktop keyboard/mouse, since control schemes differ substantially', category: 'preferences' },
    { aspect: 'moderation compliance', note: 'Verify chat filtering and asset moderation are active before any public release to avoid platform enforcement action', category: 'constraints' },
    { aspect: 'server-restart resilience', note: 'Test behavior when the server shuts down mid-action (e.g. mid-purchase, mid-round) — state should recover safely, not leave a player in a corrupted or duplicated state', category: 'functionalRequirements' },
    { aspect: 'performance profiling', note: 'Use Studio\'s MicroProfiler / Script Performance tab to check for scripts exceeding frame budget before shipping, especially anything running in Heartbeat/RenderStepped', category: 'preferences' },
    { aspect: 'nil-reference crash testing', note: 'Test edge cases where an expected Instance is missing (streamed out, destroyed, or never existed) — a common Roblox crash class is indexing a nil Instance without a guard', category: 'functionalRequirements' },
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
    {
      aspect: 'raw DataStore vs cross-server real-time state',
      note: 'DataStoreService is rate-limited and has multi-second write latency — it cannot support real-time cross-server coordination (live matchmaking counts, global live leaderboards). MemoryStoreService or MessagingService is required for that, not DataStoreService alone.',
      category: 'constraints',
      triggerA: /\b(datastore(?!\s*2)|data\s*store)\b/i,
      triggerB: /\b(real-?time|live)\s+(cross[- ]?server|global|matchmaking)\b/i,
    },
    {
      aspect: 'no budget vs full anti-exploit tooling',
      note: 'A "no budget"/solo-developer constraint alongside a request for enterprise-grade anti-exploit tooling (dedicated rate-limiting infrastructure, behavioral anomaly detection) is unrealistic scope for the stated resources — basic server-side validation and rate-limiting is achievable, a full anti-cheat system is not.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|solo\s+developer|just\s+me|one[- ]person\s+team)\b/i,
      triggerB: /\b(anti[- ]?cheat\s+system|behavioral\s+anomaly|dedicated\s+anti[- ]?exploit)\b/i,
    },
  ],
};
