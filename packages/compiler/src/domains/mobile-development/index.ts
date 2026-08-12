import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/web/index.ts and
// domains/game/index.ts (TASK-006). Plain substring matching would let bare
// keywords like 'ios' match inside unrelated words, or 'app' match inside
// 'happy'/'apparel' — silently inflating scores on unrelated inputs.
const KEYWORDS = [
  'ios', 'android', 'mobile app', 'mobile application', 'swift', 'swiftui',
  'kotlin', 'react native', 'flutter', 'app store', 'play store',
  'push notification', 'push notifications', 'objective-c', 'xcode',
  'android studio', 'native app', 'cross-platform app', 'iphone', 'ipad',
  'apk', 'testflight',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const mobileDevelopmentDomain: DomainModule = {
  id: 'mobile-development',
  label: 'Mobile Development',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target platform(s): iOS, Android, or both', category: 'constraint' },
    { text: 'App must handle offline/poor-connectivity scenarios gracefully', category: 'functional' },
    { text: 'Respect platform-native UI/UX conventions (Human Interface Guidelines / Material Design)', category: 'preference' },
    { text: 'Define device permissions required and their justification', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform target',
      description: 'Whether the app targets iOS, Android, or both (native vs. cross-platform) is unspecified',
      isResolved: (input) => /\b(ios|android|iphone|ipad|cross-platform|react native|flutter|both platforms)\b/i.test(input),
    },
    {
      field: 'distribution',
      description: 'Distribution channel (App Store / Play Store public release vs. internal/enterprise distribution) is unspecified',
      isResolved: (input) => /\b(app store|play store|testflight|enterprise distribution|internal (?:app|release)|sideload)\b/i.test(input),
    },
    {
      field: 'offline behavior',
      description: 'Expected offline/connectivity behavior (fully offline-capable vs. requires constant connection) is unspecified',
      isResolved: (input) => /\b(offline|no (?:internet|connection|network)|sync when|cached data|airplane mode)\b/i.test(input),
    },
    {
      field: 'device permissions',
      description: 'Which device permissions (camera, location, contacts, notifications, etc.) the app needs is unspecified',
      isResolved: (input) => /\b(permission|camera access|location access|contacts access|push notification|microphone access)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'app shell / navigation', dependsOn: [], note: 'Core app structure, screen navigation, and state management' },
    { component: 'UI layer', dependsOn: ['app shell / navigation'], note: 'Platform-native or cross-platform UI components and screens' },
    { component: 'local storage / offline cache', dependsOn: ['app shell / navigation'], note: 'On-device persistence for offline access and sync' },
    { component: 'backend/API integration', dependsOn: ['UI layer'], note: 'Networking layer for remote data and services' },
    { component: 'push notification service', dependsOn: ['backend/API integration'], note: 'Device token registration and notification handling' },
    { component: 'app store release pipeline', dependsOn: ['UI layer', 'local storage / offline cache'], note: 'Build signing, store listing assets, and submission process' },
  ],
  technicalConsiderations: [
    { aspect: 'platform choice', note: 'Decide between native (Swift/Kotlin) and cross-platform (React Native/Flutter) based on team skillset, performance needs, and shared-code goals', category: 'constraints' },
    { aspect: 'offline sync strategy', note: 'Define a local caching/sync strategy (e.g. queue-and-retry, conflict resolution) for actions taken without connectivity', category: 'functionalRequirements' },
    { aspect: 'push notifications', note: 'Set up device token registration and a push notification service (APNs/FCM) with clear opt-in handling', category: 'functionalRequirements' },
    { aspect: 'app size and performance', note: 'Monitor app bundle size, cold-start time, and memory usage against platform-typical benchmarks', category: 'preferences' },
    { aspect: 'OS version support', note: 'Define minimum supported iOS/Android OS versions and the resulting feature/API constraints', category: 'constraints' },
    { aspect: 'device fragmentation', note: 'Account for varying screen sizes, aspect ratios, and hardware capabilities across the target device range', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'platform conventions', note: 'Follow platform-native interaction patterns (iOS Human Interface Guidelines vs. Android Material Design) rather than a one-size-fits-all UI', category: 'functionalRequirements' },
    { aspect: 'onboarding and permission prompts', note: 'Request device permissions contextually (just-in-time) rather than all at first launch, with clear rationale shown to the user', category: 'preferences' },
    { aspect: 'gesture and touch targets', note: 'Ensure touch targets meet platform minimum sizes and gestures do not conflict with system-level gestures (back-swipe, notification pull-down)', category: 'constraints' },
    { aspect: 'offline UX', note: 'Clearly communicate offline/degraded-connectivity state to the user rather than silently failing or spinning indefinitely', category: 'functionalRequirements' },
    { aspect: 'notification tone', note: 'Design push notification frequency and content to avoid feeling spammy, with an easy way to manage preferences', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'secure local storage', note: 'Store sensitive data (tokens, credentials, PII) in platform-secure storage (Keychain/Keystore), never in plain-text local files or shared preferences', category: 'constraints' },
    { aspect: 'device permissions scope', note: 'Request only the minimum device permissions needed, and handle denial/revocation gracefully rather than assuming they are always granted', category: 'constraints' },
    { aspect: 'API/network security', note: 'Use certificate pinning or at minimum enforced TLS for all backend API traffic, and avoid embedding API secrets directly in the client binary', category: 'constraints' },
    { aspect: 'app store review compliance', note: 'Ensure data collection, tracking, and permission usage comply with App Store/Play Store privacy policies (e.g. App Tracking Transparency, Data Safety section)', category: 'constraints' },
    { aspect: 'jailbreak/root detection', note: 'Consider whether the app needs jailbreak/root detection for sensitive functionality (e.g. payments, health data)', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'app icon and branding', note: 'Design an app icon and splash screen that reads clearly at small sizes across both platforms\' icon shapes/masks', category: 'preferences' },
    { aspect: 'platform-appropriate visual language', note: 'Adapt visual style (iconography, motion, depth) to feel native on each platform rather than an identical cross-platform skin', category: 'preferences' },
    { aspect: 'store listing assets', note: 'Plan screenshots, preview video, and store description copy as part of the creative deliverables, not an afterthought', category: 'preferences' },
    { aspect: 'micro-interactions', note: 'Use platform-native motion and haptic feedback tastefully to reinforce actions (e.g. pull-to-refresh, swipe-to-delete)', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'device/OS matrix testing', note: 'Test across a representative matrix of device sizes and OS versions, not just the latest flagship device', category: 'constraints' },
    { aspect: 'offline/connectivity edge cases', note: 'Test behavior across connectivity transitions: airplane mode mid-action, flaky/slow network, and sync-on-reconnect', category: 'functionalRequirements' },
    { aspect: 'permission denial paths', note: 'Test the app\'s behavior when a requested permission is denied or later revoked in system settings', category: 'functionalRequirements' },
    { aspect: 'app store rejection risk', note: 'Check for common App Store/Play Store rejection triggers (missing privacy disclosures, broken links, placeholder content) before submission', category: 'constraints' },
    { aspect: 'background/lifecycle states', note: 'Test app behavior across backgrounding, force-quit, low-memory termination, and push notification while backgrounded', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs app store review',
      note: 'An extremely short delivery timeline combined with a public App Store/Play Store launch is high-risk — store review can add days of unpredictable delay outside the team\'s control, on top of build time.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(app store|play store)\b/i,
    },
    {
      aspect: 'offline requirement vs real-time sync',
      note: 'Requiring the app to be fully functional offline alongside real-time multi-user sync (e.g. live chat, live collaboration) is a known-difficult combination requiring nontrivial conflict-resolution engineering.',
      category: 'constraints',
      triggerA: /\b(fully offline|works offline|no (?:internet|connection) required)\b/i,
      triggerB: /\b(real-time sync|real-time collaboration|live chat|live updates)\b/i,
    },
  ],
};
