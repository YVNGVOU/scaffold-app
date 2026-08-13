import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let a keyword like
// 'aria' match inside unrelated words, or 'a11y' partially collide with
// stray tokens — do not repeat that bug here.
const KEYWORDS = [
  'accessibility', 'accessible', 'a11y', 'wcag', 'ada compliance',
  'section 508', 'aria', 'aria label', 'aria-label', 'screen reader',
  'screenreader', 'nvda', 'jaws', 'voiceover', 'talkback', 'keyboard nav',
  'keyboard navigation', 'keyboard-only', 'focus order', 'focus trap',
  'tab order', 'color contrast', 'alt text', 'alt-text', 'skip link',
  'assistive technology', 'accessibility audit', 'accessibility remediation',
  'conformance level', 'wcag aa', 'wcag aaa', 'accessible name',
  'accessibility statement', 'closed captions', 'captioning',
  'accessibility compliance', 'accessible design', 'inclusive design',
  'disability access', 'wheelchair accessible', 'low vision', 'colorblind',
  'color blind', 'dyslexia friendly', 'cognitive accessibility',
  'screen reader friendly', 'aria roles', 'aria attributes', 'aria-hidden',
  'focus indicator', 'focus visible', 'keyboard accessible', 'keyboard trap',
  'axe-core', 'axe core', 'lighthouse accessibility', 'pa11y', 'wave tool',
  'vpat', 'accessibility conformance report', '508 compliance',
  'euro accessibility act', 'european accessibility act', 'en 301 549',
  'aoda', 'accessible pdf', 'tagged pdf', 'transcript for video',
  'audio description',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const accessibilityDomain: DomainModule = {
  id: 'accessibility',
  label: 'Accessibility',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Meet a stated WCAG conformance level (2.1 or 2.2, Level A/AA/AAA) across all in-scope pages/screens', category: 'functional' },
    { text: 'All interactive elements must be operable via keyboard alone, with a visible focus indicator', category: 'functional' },
    { text: 'Provide programmatically-determinable accessible names/roles for all UI controls (semantic HTML or ARIA)', category: 'functional' },
    { text: 'Verify color contrast ratios meet the target conformance level for text and meaningful UI elements', category: 'constraint' },
    { text: 'Test with at least one screen reader (NVDA/JAWS on Windows, VoiceOver on macOS/iOS) before sign-off', category: 'preference' },
    { text: 'Produce a documented accessibility conformance report (e.g. VPAT) if required for procurement/legal purposes', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'conformance level',
      description: 'Target WCAG conformance level (A, AA, or AAA) and version (2.0/2.1/2.2) is unspecified',
      isResolved: (input) => /\b(wcag\s*(2\.[012])?\s*(level\s*)?(a{1,3}))\b/i.test(input) || /\bconformance\s+level\b/i.test(input) || /\blevel\s*(a{1,3})\b/i.test(input),
    },
    {
      field: 'legal/regulatory driver',
      description: 'Whether this is driven by a legal obligation (ADA, Section 508, AODA, EN 301 549) or a voluntary best-practice effort is unspecified',
      isResolved: (input) => /\b(ada\s+compliance|section\s*508|aoda|en\s*301\s*549|lawsuit|legal\s+requirement|voluntary)\b/i.test(input),
    },
    {
      field: 'assistive technology scope',
      description: 'Which assistive technologies must be explicitly supported/tested (screen readers, switch access, voice control, magnification) is unspecified',
      isResolved: (input) => /\b(screen\s*reader|nvda|jaws|voiceover|talkback|switch\s+access|voice\s+control|magnif\w*)\b/i.test(input),
    },
    {
      field: 'audit vs remediation',
      description: 'Whether the engagement is an audit/assessment only, or includes hands-on remediation of found issues, is unspecified',
      isResolved: (input) => /\b(audit|assessment|remediat\w*|fix(es|ing)?\s+the\s+issues)\b/i.test(input),
    },
    {
      field: 'platform scope',
      description: 'Which platforms are in scope (web, native iOS/Android, PDF documents, kiosk/hardware) is unspecified',
      isResolved: (input) => /\b(web|ios|android|native\s+app|pdf|kiosk|desktop\s+app)\b/i.test(input),
    },
    {
      field: 'existing baseline',
      description: 'Whether a prior audit or known list of existing accessibility issues already exists is unspecified',
      isResolved: (input) => /\b(existing\s+(audit|issues|report)|previous\s+audit|known\s+issues|baseline)\b/i.test(input),
    },
    {
      field: 'multimedia accessibility',
      description: 'Whether video/audio content requires captions, transcripts, or audio description is unspecified',
      isResolved: (input) => /\b(caption\w*|transcript\w*|audio\s+description|subtitle\w*)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'automated scan pass', dependsOn: [], note: 'Tooling pass (axe-core, WAVE, Lighthouse accessibility audit) to catch programmatically-detectable violations first' },
    { component: 'manual keyboard-only pass', dependsOn: [], note: 'Full task-flow walkthrough using only Tab/Shift+Tab/Enter/Space/Arrow keys, checking focus order and visible focus state' },
    { component: 'screen reader pass', dependsOn: ['automated scan pass'], note: 'Manual testing with NVDA/JAWS (Windows) and VoiceOver (macOS/iOS) on key user flows, not just page load' },
    { component: 'color contrast audit', dependsOn: [], note: 'Verify text, icons, and UI component contrast ratios against target WCAG level using a contrast-checking tool' },
    { component: 'semantic structure review', dependsOn: [], note: 'Validate heading hierarchy, landmark regions, list/table markup, and form label associations' },
    { component: 'ARIA usage review', dependsOn: ['semantic structure review'], note: 'Confirm ARIA roles/states/properties are used only where native semantics are insufficient, and are kept in sync with UI state' },
    { component: 'issue log / conformance matrix', dependsOn: ['automated scan pass', 'manual keyboard-only pass', 'screen reader pass', 'color contrast audit'], note: 'Consolidated findings mapped to specific WCAG success criteria, with severity and affected-user-group tags' },
    { component: 'remediation plan', dependsOn: ['issue log / conformance matrix'], note: 'Prioritized fix list (blocking vs. minor) with owners and target conformance level per item' },
    { component: 'conformance report / VPAT', dependsOn: ['remediation plan'], note: 'Formal documentation of conformance status, produced when required for procurement or legal purposes' },
    { component: 'regression test hook', dependsOn: ['remediation plan'], note: 'Automated a11y linting/CI check (e.g. axe-core in CI) to prevent previously-fixed issues from reappearing' },
  ],
  technicalConsiderations: [
    { aspect: 'semantic HTML first', note: 'Prefer native semantic elements (button, nav, table, label) over div/span-plus-ARIA reimplementations, since native elements carry correct behavior and accessibility semantics for free', category: 'functionalRequirements' },
    { aspect: 'ARIA usage discipline', note: 'Apply the "no ARIA is better than bad ARIA" rule: only add ARIA roles/states when native semantics cannot express the pattern, and keep aria-expanded/aria-selected/aria-checked in sync with actual UI state', category: 'functionalRequirements' },
    { aspect: 'focus management', note: 'Manage focus explicitly for dynamic UI: move focus into opened modals/dialogs, trap it while open, and return it to the triggering element on close', category: 'functionalRequirements' },
    { aspect: 'automated tooling', note: 'Integrate an automated scanner (axe-core, Lighthouse, WAVE, Pa11y) into the dev/CI workflow, understanding it catches roughly 30-40% of issues — manual testing is still required', category: 'constraints' },
    { aspect: 'live region announcements', note: 'Use aria-live regions (polite/assertive) for dynamic content updates (form errors, toast notifications, loading state) so screen reader users are notified without a full page refresh', category: 'functionalRequirements' },
    { aspect: 'reduced motion support', note: 'Respect prefers-reduced-motion and provide a way to pause/stop auto-playing carousels, animations, or video per WCAG 2.2.2', category: 'preferences' },
    { aspect: 'responsive reflow and zoom', note: 'Ensure content reflows to a single column at 400% zoom without horizontal scrolling (WCAG 1.4.10) and remains usable with browser text-size overrides', category: 'constraints' },
    { aspect: 'document/PDF accessibility', note: 'If PDFs or other documents are in scope, confirm they are tagged with a correct reading order, not just scanned images of text', category: 'functionalRequirements' },
    { aspect: 'accessible name computation order', note: 'Understand the accessible-name computation algorithm precedence (aria-labelledby > aria-label > native label/alt/title) so redundant or conflicting labels do not silently override a correct one', category: 'functionalRequirements' },
    { aspect: 'custom component keyboard patterns', note: 'Implement the correct WAI-ARIA Authoring Practices keyboard interaction pattern for each custom widget type (combobox, tabs, tree, menu) — a11y bugs commonly come from copying the wrong pattern (e.g. arrow-key nav on a tab list built like a menu)', category: 'functionalRequirements' },
    { aspect: 'dynamic content and SPA route changes', note: 'On client-side route changes in a single-page app, move focus to the new view and announce the page title via an aria-live region, since browser-native page-load focus reset does not happen', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'focus order', note: 'Ensure the visual reading order and the DOM/tab order match, so keyboard and screen reader users experience the same sequence sighted mouse users do', category: 'functionalRequirements' },
    { aspect: 'visible focus indicator', note: 'Provide a clearly visible, sufficiently high-contrast focus outline on every interactive element — never remove :focus styling without an equivalent replacement', category: 'constraints' },
    { aspect: 'error identification and recovery', note: 'Identify form errors in text (not color alone), associate them programmatically with their field, and describe how to fix them (WCAG 3.3.1/3.3.3)', category: 'functionalRequirements' },
    { aspect: 'skip navigation', note: 'Provide a "skip to main content" link as the first focusable element so keyboard/screen reader users can bypass repeated navigation on every page', category: 'preferences' },
    { aspect: 'target size', note: 'Size touch/click targets to at least the WCAG 2.2 minimum (24x24 CSS px, larger recommended) so users with motor impairments can activate controls reliably', category: 'constraints' },
    { aspect: 'plain language', note: 'Write instructions and error messages in plain, unambiguous language, considering users with cognitive or learning disabilities', category: 'preferences' },
    { aspect: 'consistent navigation', note: 'Keep navigation, labeling, and interaction patterns consistent across the product so users relying on memorized patterns (screen magnifier, cognitive disabilities) are not disoriented', category: 'preferences' },
    { aspect: 'timing adjustability', note: 'Allow users to turn off, adjust, or extend any time limit on content or tasks (WCAG 2.2.1), since fixed timeouts disproportionately affect users with cognitive or motor disabilities', category: 'functionalRequirements' },
    { aspect: 'orientation lock', note: 'Do not lock content to a single display orientation (portrait-only or landscape-only) unless essential, since some users mount devices in a fixed orientation (WCAG 1.3.4)', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'accessible authentication', note: 'Avoid CAPTCHA or authentication steps that rely solely on visual/cognitive puzzles without an accessible alternative (WCAG 2.2 Accessible Authentication) — screen-reader and motor-impaired users must have an equivalent path to sign in', category: 'constraints' },
    { aspect: 'session timeout warnings', note: 'Give users adequate, perceivable warning before a session times out and a way to extend it, since some assistive-technology workflows take longer than a default timeout assumes', category: 'functionalRequirements' },
    { aspect: 'PII in accessible names', note: 'Avoid exposing sensitive personal data in aria-label/aria-describedby text that might be surfaced more broadly (e.g. via browser extensions or accessibility APIs) than the visible UI', category: 'constraints' },
    { aspect: 'third-party widget vetting', note: 'Audit embedded third-party widgets (chat, payment, video) for their own accessibility conformance, since they inherit into the page and can silently break an otherwise-conformant flow', category: 'constraints' },
    { aspect: 'disability status disclosure', note: 'Treat any user-disclosed disability, assistive-technology preference, or accommodation request as sensitive personal data — do not log, share, or use it for purposes beyond delivering the accommodation', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'inclusive visual design', note: 'Do not rely on color alone to convey meaning (status, required fields, chart series) — pair color with icon, pattern, or text so colorblind users are not excluded', category: 'constraints' },
    { aspect: 'contrast-conscious palette', note: 'Choose a brand palette with contrast headroom for text-on-background pairs, so accessibility fixes do not fight the visual design after the fact', category: 'preferences' },
    { aspect: 'meaningful imagery', note: 'Design alt-text-worthy imagery: decorative images should be marked purely decorative, while informative images need concise, meaningful alt text baked into the design brief', category: 'functionalRequirements' },
    { aspect: 'typography legibility', note: 'Select typefaces and sizes that remain legible at zoom and for users with low vision or dyslexia, avoiding overly thin weights or tight letter-spacing for body text', category: 'preferences' },
    { aspect: 'motion restraint', note: 'Use parallax, autoplay, and flashing effects sparingly and provide reduced-motion alternatives, since some motion can trigger vestibular disorders or seizures', category: 'constraints' },
    { aspect: 'flash-threshold safety', note: 'Never design content that flashes more than three times per second across a large visual area, since this can trigger photosensitive seizures (WCAG 2.3.1) — a hard visual-design red line, not a preference', category: 'constraints' },
  ],
  qaConsiderations: [
    { aspect: 'WCAG success criteria mapping', note: 'Map every found issue to a specific WCAG success criterion number (e.g. 1.1.1, 2.4.7, 4.1.2), not just a vague "not accessible" note, so remediation is actionable and re-testable', category: 'functionalRequirements' },
    { aspect: 'keyboard-only test pass', note: 'Run a full task-completion test using only the keyboard (no mouse) for every critical user flow, checking focus order, visible focus, and that nothing is a keyboard trap', category: 'functionalRequirements' },
    { aspect: 'screen reader test pass', note: 'Test critical flows with at least one desktop screen reader (NVDA or JAWS) and one mobile screen reader (VoiceOver/TalkBack), since behavior differs meaningfully between them', category: 'functionalRequirements' },
    { aspect: 'automated-vs-manual gap', note: 'Do not treat a clean automated scanner report as conformance — automated tools catch a minority of WCAG criteria; manual and assistive-technology testing must also pass', category: 'constraints' },
    { aspect: 'severity triage', note: 'Triage each finding by real-world impact (blocks task completion vs. minor annoyance vs. cosmetic) rather than by WCAG level alone, so remediation prioritizes what actually excludes users', category: 'preferences' },
    { aspect: 'regression prevention', note: 'Add automated accessibility checks (axe-core/Lighthouse CI) to the build pipeline so previously-fixed issues cannot silently reappear in a later change', category: 'preferences' },
    { aspect: 'zoom and reflow testing', note: 'Test the interface at 200% and 400% browser zoom to confirm content reflows without loss of functionality or horizontal scrolling', category: 'functionalRequirements' },
    { aspect: 'assistive-tech version matrix', note: 'Test against a documented matrix of AT + browser pairings (e.g. NVDA+Chrome, VoiceOver+Safari, JAWS+Chrome), since AT/browser combinations render the same markup differently and pass/fail results are not interchangeable across pairs', category: 'functionalRequirements' },
    { aspect: 'form autocomplete and error prevention', note: 'Verify input fields expose correct autocomplete attributes (WCAG 1.3.5) and that legal/financial submissions offer a review-and-confirm step before final submission (WCAG 3.3.4)', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'AAA conformance vs unrestricted creative freedom',
      note: 'Requiring full WCAG AAA conformance while also demanding an unconstrained, purely visual/decorative design direction is a high-risk combination — AAA criteria (e.g. enhanced contrast, no background audio) meaningfully restrict color, motion, and layout choices.',
      category: 'constraints',
      triggerA: /\bwcag\s*(2\.[012])?\s*(level\s*)?aaa\b/i,
      triggerB: /\b(unrestricted|no\s+design\s+constraints|purely\s+visual|decorative[- ]first)\b/i,
    },
    {
      aspect: 'timeline vs full audit + remediation scope',
      note: 'An extremely short delivery timeline (days or less) alongside a full audit-and-remediation engagement across an entire product is high-risk — thorough manual and assistive-technology testing plus fixes typically takes weeks even for a mid-sized product.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(full\s+audit|entire\s+(site|product|app)|site-?wide\s+remediation)\b/i,
    },
    {
      aspect: 'legal deadline vs no existing baseline',
      note: 'A hard legal/regulatory compliance deadline (ADA lawsuit, Section 508 procurement) stated alongside "no existing accessibility work has been done" is high-risk — starting from zero baseline under legal time pressure often is not achievable without descoping or triage-only remediation.',
      category: 'constraints',
      triggerA: /\b(ada\s+lawsuit|legal\s+deadline|section\s*508\s+procurement|compliance\s+deadline)\b/i,
      triggerB: /\b(no\s+(existing|prior)\s+(audit|accessibility\s+work)|never\s+been\s+audited|starting\s+from\s+scratch)\b/i,
    },
    {
      aspect: 'heavy custom-widget scope vs no dev resources',
      note: 'Building extensive custom interactive widgets (custom dropdowns, drag-and-drop, canvas-based UI) while having no engineering time allocated for ARIA/keyboard implementation is high-risk — accessible custom widgets require substantially more implementation effort than native controls, not just a CSS pass.',
      category: 'constraints',
      triggerA: /\b(custom\s+(dropdown|widget|drag[- ]and[- ]drop|component)s?|canvas[- ]based\s+ui)\b/i,
      triggerB: /\b(no\s+dev(elopment)?\s+(time|resources|budget)|design[- ]only|no\s+engineering\s+support)\b/i,
    },
  ],
};
