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
  'api', 'web page', 'webpage', 'single page app', 'progressive web app',
  'e-commerce site', 'ecommerce site', 'web portal', 'signup form',
  'login page', 'admin panel', 'rest api', 'graphql', 'full stack', 'fullstack',
  'next.js', 'nextjs', 'node.js', 'nodejs', 'web client',
  'multi-page site', 'static site', 'checkout flow', 'user portal',
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
    { text: 'Define whether the site requires user accounts/authentication', category: 'functional' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform (web only, or also mobile/responsive) is unspecified',
      isResolved: (input) => /\b(mobile|responsive|desktop|cross-platform|browser)\b/i.test(input),
    },
    {
      field: 'purpose',
      description: 'The purpose of the site/app (e.g. marketing, e-commerce, internal tool) is unspecified',
      isResolved: (input) => /\b(marketing|e-?commerce|shop|store|blog|portfolio|internal tool|dashboard|saas|landing)\b/i.test(input),
    },
    {
      field: 'audience',
      description: 'Target audience is unspecified',
      isResolved: (input) => /\b(audience|users?|customers?|for (?:my|our|a))\b/i.test(input),
    },
    {
      field: 'authentication',
      description: 'Whether the site/app requires user accounts or login is unspecified',
      isResolved: (input) => /\b(auth(entication)?|login|log in|signup|sign up|sign[- ]?in|no accounts?|public site|guest access|user accounts?)\b/i.test(input),
    },
    {
      field: 'content management',
      description: 'How content will be updated after launch (CMS, hardcoded, manual edits) is unspecified',
      isResolved: (input) => /\b(cms|content management|headless|hardcoded|static content|self[- ]?serve|editable by|update the content)\b/i.test(input),
    },
    {
      field: 'data persistence',
      description: 'Whether the site needs a database/backend to store data is unspecified',
      isResolved: (input) => /\b(database|backend|persist|store data|no backend|no database|stateless|static)\b/i.test(input),
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
    { aspect: 'seo and rendering strategy', note: 'Decide between client-side rendering, server-side rendering, or static generation — an SPA with client-only rendering hurts SEO and first-paint time unless crawlers are otherwise addressed', category: 'constraints' },
    { aspect: 'state management', note: 'Define client-side state management approach (local component state vs. global store) before the app grows past a handful of interdependent views', category: 'functionalRequirements' },
    { aspect: 'third-party integrations', note: 'Identify third-party services (payments, email, analytics, auth providers) up front — each adds an external dependency, rate limits, and a failure mode to design around', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'navigation', note: 'Define primary navigation/information architecture so users can find key pages within a few clicks', category: 'functionalRequirements' },
    { aspect: 'onboarding', note: 'Design a first-visit / onboarding flow (signup, empty states, guided tour) appropriate to the audience', category: 'preferences' },
    { aspect: 'accessibility', note: 'Meet WCAG-level accessibility: keyboard navigation, color contrast, screen-reader-friendly semantic markup', category: 'constraints' },
    { aspect: 'responsive layout', note: 'Define interaction hierarchy and layout behavior across breakpoints (mobile, tablet, desktop)', category: 'functionalRequirements' },
    { aspect: 'form validation', note: 'Provide clear inline validation and error recovery for any forms/input flows', category: 'preferences' },
    { aspect: 'loading and error states', note: 'Handle edge cases: loading states, empty states, network/API error states, so the UI is never blank or stuck', category: 'preferences' },
    { aspect: 'back button and deep linking', note: 'Ensure browser back/forward and direct/deep links to internal views work correctly, especially in an SPA where routing must sync with the URL', category: 'functionalRequirements' },
    { aspect: 'unsaved-change protection', note: 'Warn users before navigating away from a form or multi-step flow with unsaved changes, rather than silently discarding input', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'authentication', note: 'Define how users are authenticated (if at all) and how credentials/sessions are stored and invalidated', category: 'constraints' },
    { aspect: 'authorization', note: 'Define access-control rules for who can view/edit which resources, especially for multi-user or admin functionality', category: 'constraints' },
    { aspect: 'data exposure', note: 'Audit which user/personal data is collected, stored, or transmitted, and ensure it is not exposed in client bundles, logs, or unauthenticated API responses', category: 'constraints' },
    { aspect: 'transport security', note: 'Require HTTPS/TLS in transit and avoid sending sensitive data over unencrypted channels', category: 'constraints' },
    { aspect: 'input validation', note: 'Validate and sanitize all user-supplied input server-side to prevent injection (SQL, XSS, command injection)', category: 'functionalRequirements' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit "no login required" or "trusted client" assumption that has not been explicitly confirmed as intentional', category: 'preferences' },
    { aspect: 'csrf and clickjacking', note: 'Apply CSRF tokens on state-changing requests and frame-busting/CSP headers to prevent clickjacking on any page with forms or authenticated actions', category: 'constraints' },
    { aspect: 'rate limiting and abuse', note: 'Rate-limit public-facing endpoints (login, signup, contact forms, search) to prevent brute-force, scraping, and spam abuse', category: 'functionalRequirements' },
    { aspect: 'third-party script exposure', note: 'Audit third-party scripts (analytics, chat widgets, ad tags) for the data they can read from the page — an XSS in one script can compromise the whole origin unless isolated', category: 'constraints' },
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
    { aspect: 'cross-browser and viewport matrix', note: 'Define which browser/OS/viewport combinations must be tested (not just "responsive") — a layout that works in Chrome desktop can silently break in Safari mobile', category: 'constraints' },
    { aspect: 'slow network testing', note: 'Test the app under throttled/slow-3G conditions to catch race conditions and stuck loading states that only appear when requests are slow, not absent', category: 'preferences' },
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
    {
      aspect: 'seo requirement vs client-only rendering',
      note: 'Requiring strong SEO/search-engine visibility alongside a purely client-rendered single-page app is a known tension — client-only rendering delays or hides content from crawlers unless server-side rendering, static generation, or prerendering is added.',
      category: 'constraints',
      triggerA: /\b(seo|search engine (?:ranking|visibility)|rank(?:ing)? (?:well |highly )?on google)\b/i,
      triggerB: /\b(single[- ]page app|spa|client-side rendering|client-only render(?:ing|ed)?)\b/i,
    },
    {
      aspect: 'offline requirement vs always-online architecture',
      note: 'A requirement to work fully offline alongside an architecture that assumes constant server/API connectivity (real-time sync, server-rendered pages) is infeasible without a dedicated offline-first strategy (service workers, local cache, conflict resolution).',
      category: 'constraints',
      triggerA: /\b(work(?:s)? offline|offline (?:mode|support|access|first))\b/i,
      triggerB: /\b(real-time sync|server-rendered|always online|requires (?:an? )?internet connection)\b/i,
    },
  ],
};
