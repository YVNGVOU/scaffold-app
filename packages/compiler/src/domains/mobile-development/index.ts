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
  'apk', 'testflight', 'jetpack compose', 'kotlin multiplatform',
  'expo', 'app clip', 'instant app', 'in-app purchase', 'in-app purchases',
  'deep link', 'deep linking', 'universal link', 'biometric login',
  'face id', 'touch id', 'google play', 'app bundle', 'aab',
  'mobile ui', 'mobile ux', 'tablet app', 'wear os', 'watchos',
  'app permissions', 'background fetch', 'widget extension',
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
      isResolved: (input) => /\b(ios|android|iphone|ipad|cross-platform|react native|flutter|both platforms|native app|kotlin multiplatform|expo)\b/i.test(input),
    },
    {
      field: 'distribution',
      description: 'Distribution channel (App Store / Play Store public release vs. internal/enterprise distribution) is unspecified',
      isResolved: (input) => /\b(app store|play store|testflight|enterprise distribution|internal (?:app|release)|sideload|public release|enterprise|internal only)\b/i.test(input),
    },
    {
      field: 'offline behavior',
      description: 'Expected offline/connectivity behavior (fully offline-capable vs. requires constant connection) is unspecified',
      isResolved: (input) => /\b(offline|no (?:internet|connection|network)|sync when|cached data|airplane mode|always online|requires connection)\b/i.test(input),
    },
    {
      field: 'device permissions',
      description: 'Which device permissions (camera, location, contacts, notifications, etc.) the app needs is unspecified',
      isResolved: (input) => /\b(permission|camera access|location access|contacts access|push notification|microphone access|app permissions)\b/i.test(input),
    },
    {
      field: 'monetization model',
      description: 'How the app makes money (free, paid download, in-app purchases, subscription, ads) is unspecified',
      isResolved: (input) => /\b(in-app purchase|in-app purchases|subscription|freemium|paid app|free app|ad-supported|ads|one-time purchase)\b/i.test(input),
    },
    {
      field: 'authentication approach',
      description: 'How users sign in (email/password, social login, biometric, guest mode) is unspecified',
      isResolved: (input) => /\b(sign in|sign-in|login|log in|face id|touch id|biometric|social login|guest mode|sso|oauth)\b/i.test(input),
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
    { aspect: 'app store binary format', note: 'Plan for required binary formats (Android App Bundle over raw APK for Play Store, App Store Connect signing for iOS) rather than assuming a single build artifact covers both stores', category: 'constraints' },
    { aspect: 'deep linking and universal links', note: 'Define deep-link/universal-link routes needed for notification taps, marketing campaigns, and cross-app handoff, including cold-start vs. warm-start routing behavior', category: 'functionalRequirements' },
    { aspect: 'background execution limits', note: 'Account for OS-imposed background execution limits (iOS background task budgets, Android Doze/App Standby) when relying on background fetch or long-running sync', category: 'constraints' },
    { aspect: 'in-app purchase plumbing', note: 'If monetized via in-app purchases or subscriptions, integrate StoreKit/Google Play Billing receipt validation server-side rather than trusting client-reported purchase state', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'platform conventions', note: 'Follow platform-native interaction patterns (iOS Human Interface Guidelines vs. Android Material Design) rather than a one-size-fits-all UI', category: 'functionalRequirements' },
    { aspect: 'onboarding and permission prompts', note: 'Request device permissions contextually (just-in-time) rather than all at first launch, with clear rationale shown to the user', category: 'preferences' },
    { aspect: 'gesture and touch targets', note: 'Ensure touch targets meet platform minimum sizes and gestures do not conflict with system-level gestures (back-swipe, notification pull-down)', category: 'constraints' },
    { aspect: 'offline UX', note: 'Clearly communicate offline/degraded-connectivity state to the user rather than silently failing or spinning indefinitely', category: 'functionalRequirements' },
    { aspect: 'notification tone', note: 'Design push notification frequency and content to avoid feeling spammy, with an easy way to manage preferences', category: 'preferences' },
    { aspect: 'thumb-reachability', note: 'Place primary actions within comfortable thumb reach on large-screen devices (bottom navigation/tab bars) rather than relying on top-of-screen taps for one-handed use', category: 'preferences' },
    { aspect: 'app-switch and interruption recovery', note: 'Design screens to preserve in-progress state (form input, scroll position) when the user is interrupted by a phone call, notification, or app switch', category: 'functionalRequirements' },
    { aspect: 'empty and first-run states', note: 'Design meaningful empty states and a first-run experience that demonstrates value before requiring account creation or permission grants', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'secure local storage', note: 'Store sensitive data (tokens, credentials, PII) in platform-secure storage (Keychain/Keystore), never in plain-text local files or shared preferences', category: 'constraints' },
    { aspect: 'device permissions scope', note: 'Request only the minimum device permissions needed, and handle denial/revocation gracefully rather than assuming they are always granted', category: 'constraints' },
    { aspect: 'API/network security', note: 'Use certificate pinning or at minimum enforced TLS for all backend API traffic, and avoid embedding API secrets directly in the client binary', category: 'constraints' },
    { aspect: 'app store review compliance', note: 'Ensure data collection, tracking, and permission usage comply with App Store/Play Store privacy policies (e.g. App Tracking Transparency, Data Safety section)', category: 'constraints' },
    { aspect: 'jailbreak/root detection', note: 'Consider whether the app needs jailbreak/root detection for sensitive functionality (e.g. payments, health data)', category: 'preferences' },
    { aspect: 'biometric auth fallback', note: 'If using Face ID/Touch ID/biometric login, define a secure fallback (passcode/PIN) for when biometrics are unavailable or fail repeatedly, and never store the biometric data itself', category: 'constraints' },
    { aspect: 'deep link validation', note: 'Validate and sanitize deep-link/universal-link parameters server-side before acting on them, since deep links can be crafted by any party and are not a trusted input channel', category: 'constraints' },
    { aspect: 'third-party SDK data exposure', note: 'Audit analytics/ad/crash-reporting SDKs bundled into the app for what device and user data they transmit off-device, since these are common sources of undisclosed data collection', category: 'constraints' },
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
    { aspect: 'deep link and cold-start routing', note: 'Test deep links opened while the app is fully closed (cold start), backgrounded (warm start), and already in foreground, since routing logic often only gets tested in one of those states', category: 'functionalRequirements' },
    { aspect: 'store review compliance checks', note: 'Verify in-app purchase flows follow Apple/Google purchasing rules (no external payment links for digital goods without required entitlements) before submission to avoid rejection', category: 'constraints' },
    { aspect: 'OS/device update regression', note: 'Re-test core flows after major OS point releases and on new device form factors (foldables, new screen notches) since platform updates can silently break existing UI assumptions', category: 'constraints' },
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
    {
      aspect: 'in-app purchases vs external payment links',
      note: 'Selling digital goods/subscriptions via in-app purchase while also wanting to link out to an external website for payment is restricted by App Store/Play Store policy for most digital-goods categories and risks rejection.',
      category: 'constraints',
      triggerA: /\b(in-app purchase|in-app purchases|subscription)\b/i,
      triggerB: /\b(external (?:payment|website|link)|pay (?:on|via) (?:our|the) website|link out to (?:payment|checkout))\b/i,
    },
  ],
};
