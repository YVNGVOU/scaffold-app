import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching let the bare keyword 'api' match inside unrelated
// words like "rapid" or "therapist", and 'logo' would match inside e.g.
// "logout" in a different domain's keyword list — silently inflating scores
// on inputs that have nothing to do with web development.
const KEYWORDS = [
  'website', 'web app', 'webapp', 'web application', 'landing page', 'frontend',
  'backend', 'react', 'html', 'css', 'browser', 'web site', 'saas', 'dashboard',
  'api', 'web page', 'webpage',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const webDomain: DomainModule = {
  id: 'web',
  label: 'Web Development',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Site must be responsive across common device sizes', category: 'functional' },
    { text: 'Define hosting/deployment target', category: 'constraint' },
    { text: 'Basic accessibility (semantic HTML, keyboard navigation)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform (web only, or also mobile/responsive) is unspecified',
      isResolved: (input) => /mobile|responsive|desktop|cross-platform|browser/i.test(input),
    },
    {
      field: 'purpose',
      description: 'The purpose of the site/app (e.g. marketing, e-commerce, internal tool) is unspecified',
      isResolved: (input) => /(marketing|e-?commerce|shop|store|blog|portfolio|internal tool|dashboard|saas|landing)/i.test(input),
    },
    {
      field: 'audience',
      description: 'Target audience is unspecified',
      isResolved: (input) => /(audience|users?|customers?|for (my|our|a))/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'frontend', dependsOn: [], note: 'Client-side UI layer' },
    { component: 'backend', dependsOn: ['frontend'], note: 'Server-side logic / API layer' },
    { component: 'data layer', dependsOn: ['backend'], note: 'Persistence / database' },
    { component: 'deployment', dependsOn: ['frontend', 'backend'], note: 'Hosting and CI/CD target' },
  ],
  technicalConsiderations: [
    { aspect: 'hosting', note: 'Choose a hosting/deployment target (e.g. static host, serverless, VPS) suited to expected traffic', category: 'constraints' },
    { aspect: 'framework', note: 'Select a frontend/backend framework consistent with team skillset and performance needs', category: 'functionalRequirements' },
    { aspect: 'browser compatibility', note: 'Define target browser support matrix (evergreen only vs. legacy support)', category: 'constraints' },
    { aspect: 'api', note: 'Define API contract/versioning strategy between frontend and backend', category: 'functionalRequirements' },
    { aspect: 'performance budget', note: 'Set a page-load/performance budget appropriate to the audience', category: 'preferences' },
    { aspect: 'scalability', note: 'Consider scaling strategy (horizontal scaling, caching, CDN) if traffic may grow', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'navigation', note: 'Define primary navigation/information architecture so users can find key pages within a few clicks', category: 'functionalRequirements' },
    { aspect: 'onboarding', note: 'Design a first-visit / onboarding flow (signup, empty states, guided tour) appropriate to the audience', category: 'preferences' },
    { aspect: 'accessibility', note: 'Meet WCAG-level accessibility: keyboard navigation, color contrast, screen-reader-friendly semantic markup', category: 'constraints' },
    { aspect: 'responsive layout', note: 'Define interaction hierarchy and layout behavior across breakpoints (mobile, tablet, desktop)', category: 'functionalRequirements' },
    { aspect: 'form validation', note: 'Provide clear inline validation and error recovery for any forms/input flows', category: 'preferences' },
    { aspect: 'loading and error states', note: 'Handle edge cases: loading states, empty states, network/API error states, so the UI is never blank or stuck', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'authentication', note: 'Define how users are authenticated (if at all) and how credentials/sessions are stored and invalidated', category: 'constraints' },
    { aspect: 'authorization', note: 'Define access-control rules for who can view/edit which resources, especially for multi-user or admin functionality', category: 'constraints' },
    { aspect: 'data exposure', note: 'Audit which user/personal data is collected, stored, or transmitted, and ensure it is not exposed in client bundles, logs, or unauthenticated API responses', category: 'constraints' },
    { aspect: 'transport security', note: 'Require HTTPS/TLS in transit and avoid sending sensitive data over unencrypted channels', category: 'constraints' },
    { aspect: 'input validation', note: 'Validate and sanitize all user-supplied input server-side to prevent injection (SQL, XSS, command injection)', category: 'functionalRequirements' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit "no login required" or "trusted client" assumption that has not been explicitly confirmed as intentional', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual direction', note: 'Establish a visual direction (color palette, typography, imagery style) consistent with the brand/audience before high-fidelity design begins', category: 'preferences' },
    { aspect: 'originality', note: 'Differentiate the layout/visual language from generic template defaults so the site does not read as interchangeable with competitors', category: 'preferences' },
    { aspect: 'design consistency', note: 'Define a component/style system (spacing, type scale, color tokens) so pages feel like one coherent product rather than assembled fragments', category: 'constraints' },
    { aspect: 'composition and hierarchy', note: 'Use visual hierarchy (size, contrast, whitespace) on key pages so the primary action/message is unambiguous at a glance', category: 'functionalRequirements' },
    { aspect: 'micro-interactions', note: 'Consider tasteful motion/micro-interactions (hover states, transitions) that reinforce usability without becoming decorative noise', category: 'preferences' },
    { aspect: 'creative opportunity', note: 'Look for a signature visual moment (hero treatment, illustration, distinctive pattern) that makes the site memorable rather than purely functional', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "no backend" alongside "user accounts with saved data")', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. a checkout flow implying payment error handling)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria for each core user flow (e.g. "a user can complete signup in under 3 steps")', category: 'functionalRequirements' },
    { aspect: 'test cases', note: 'Generate test cases for key flows: happy path, invalid input, and empty/boundary states (empty cart, max-length field, no search results)', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: network timeout, API 5xx, session expiry mid-form, third-party service outage', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: what happens with a zero-item cart, a malformed URL, concurrent edits, or a double-submitted form', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs scope',
      note: 'A near-zero/shoestring budget stated alongside a large-scale, custom, or enterprise system is a known-infeasible combination — custom platforms require proportional budget for design, engineering, and infrastructure.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(custom|enterprise|full[- ]scale|large[- ]scale)\s+(platform|system|application|marketplace)\b/i,
    },
    {
      aspect: 'timeline vs complexity',
      note: 'An extremely short delivery timeline (days or less) alongside a complex system (e-commerce, marketplace, real-time, multi-tenant) is high-risk — that scope typically requires weeks-to-months of work regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(e-?commerce|marketplace|real-time|payment processing|multi-tenant|full[- ]stack)\b/i,
    },
    {
      aspect: 'platform vs feature availability',
      note: 'Static hosting cannot natively support server-side features like user accounts, databases, or payments without introducing additional backend infrastructure — stating both together is a common but infeasible-as-stated combination.',
      category: 'constraints',
      triggerA: /\bstatic\s+(?:site|hosting|host)\b/i,
      triggerB: /\b(user accounts?|database|server-side|logins?|payments?)\b/i,
    },
  ],
};
