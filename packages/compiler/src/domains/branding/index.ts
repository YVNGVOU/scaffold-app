import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching let the bare keyword 'logo' match inside
// unrelated words like "logout", silently inflating the branding score on
// inputs that have nothing to do with branding.
// 'rebranding'/'branded' are listed explicitly (rather than relying on
// substring matching against 'rebrand'/'brand') because full-word-boundary
// matching does not do suffix stemming: "We need help with our rebranding"
// would otherwise score 0 despite being a textbook branding request.
const KEYWORDS = [
  'brand', 'branding', 'branded', 'logo', 'identity', 'style guide', 'brand guidelines',
  'color palette', 'typography', 'wordmark', 'visual identity', 'rebrand', 'rebranding',
  'brand kit', 'moodboard', 'brandmark', 'monogram', 'brand identity', 'brand strategy',
  'brand voice', 'brand story', 'tagline', 'logotype', 'icon mark', 'favicon design',
  'letterhead', 'business card design', 'brand refresh', 'visual language',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const brandingDomain: DomainModule = {
  id: 'branding',
  label: 'Branding',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Deliver a coherent color and type system', category: 'functional' },
    { text: 'Deliverables must be provided in editable + exportable formats', category: 'constraint' },
    { text: 'Consider scalability of logo across sizes/media', category: 'preference' },
    { text: 'Include a monochrome/single-color version of the mark for constrained-print or embossing use cases', category: 'functional' },
    { text: 'Define minimum clear space and minimum reproduction size for the logo', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'audience',
      description: 'Target audience/market for the brand is unspecified',
      isResolved: (input) => /\b(audience|market|customers?|demographic|for (my|our|a))\b/i.test(input),
    },
    {
      field: 'deliverables',
      description: 'Expected deliverables (logo, guidelines, full kit, etc.) are unspecified',
      isResolved: (input) => /\b(logo|guideline|brand kit|style guide|wordmark|assets?)\b/i.test(input),
    },
    {
      field: 'style',
      description: 'Desired style/tone (e.g. minimal, playful, luxury) is unspecified',
      isResolved: (input) => /\b(minimal|playful|luxury|modern|retro|bold|elegant|professional|edgy|warm|corporate)\b/i.test(input),
    },
    {
      field: 'usage scope',
      description: 'Where the brand will be applied (digital-only, print, packaging, signage) is unspecified',
      isResolved: (input) => /\b(digital|print|packaging|signage|web|social media|merch(?:andise)?|app icon)\b/i.test(input),
    },
    {
      field: 'reference brands',
      description: 'No reference brands, competitors, or inspiration examples were given to anchor the visual direction',
      isResolved: (input) => /\b(competitor|inspir(?:ation|ed by)|reference|similar to|like (?:apple|nike|airbnb)|benchmark)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'logo system', dependsOn: [], note: 'Primary mark, variations, clear space rules' },
    { component: 'color/type system', dependsOn: ['logo system'], note: 'Palette and typography scale' },
    { component: 'deliverable set', dependsOn: ['logo system', 'color/type system'], note: 'Final packaged assets/guidelines' },
  ],
  technicalConsiderations: [
    { aspect: 'file formats', note: 'Deliver source files in editable vector format (e.g. SVG/AI/EPS) plus exported raster formats (PNG/JPG)', category: 'constraints' },
    { aspect: 'print vs digital', note: 'Confirm whether assets are needed for print (CMYK, bleed) versus digital-only (RGB) use', category: 'constraints' },
    { aspect: 'color specification', note: 'Specify colors precisely (Pantone/CMYK/RGB/hex) for consistent reproduction across media', category: 'functionalRequirements' },
    { aspect: 'typography licensing', note: 'Confirm font licensing covers intended usage (web embedding, print, commercial use)', category: 'constraints' },
    { aspect: 'deliverable packaging', note: 'Consider packaging a brand guidelines document alongside raw asset files', category: 'preferences' },
    { aspect: 'trademark clearance', note: 'Run a trademark/name-availability search before finalizing a wordmark or brand name to avoid legal conflicts and costly rebrands post-launch', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'brand touchpoint hierarchy', note: 'Map where the brand appears across touchpoints (packaging, web, social, print) and prioritize which matter most to the audience', category: 'functionalRequirements' },
    { aspect: 'legibility at scale', note: 'Verify logo/wordmark legibility and usability across sizes, from favicon-scale to signage-scale', category: 'constraints' },
    { aspect: 'accessibility of palette', note: 'Check color palette contrast/accessibility so brand colors remain usable in accessible UI applications', category: 'constraints' },
    { aspect: 'guideline usability', note: 'Structure the brand guidelines document itself for easy scanning by future designers/vendors (clear information architecture)', category: 'preferences' },
    { aspect: 'edge case usage', note: 'Cover edge cases: logo on busy/dark backgrounds, co-branding placement, minimum clear space violations', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'asset access control', note: 'Define who has access to editable source files/brand assets (agency, client, vendors) and how that access is granted/revoked', category: 'constraints' },
    { aspect: 'ip and licensing exposure', note: 'Confirm ownership/licensing of any stock assets, fonts, or third-party elements used, to avoid unauthorized redistribution', category: 'constraints' },
    { aspect: 'unreleased asset exposure', note: 'Avoid exposing unreleased brand assets (pre-launch logo, guidelines) via publicly accessible links or unsecured file shares', category: 'preferences' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that shared drafts/proofs are private by default, which has not been explicitly confirmed as intentional', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual direction', note: 'Establish a clear creative direction (mood, color story, typographic voice) grounded in the brand\'s positioning before exploring concepts', category: 'preferences' },
    { aspect: 'originality', note: 'Differentiate the mark/visual system from close competitors in the same category so it does not read as derivative of an existing brand', category: 'constraints' },
    { aspect: 'system consistency', note: 'Ensure the logo, color palette, and typography form one coherent, consistently-applied system rather than disconnected assets', category: 'constraints' },
    { aspect: 'composition', note: 'Define clear-space, alignment, and proportion rules for the mark so it composes well across layouts and formats', category: 'functionalRequirements' },
    { aspect: 'concept exploration', note: 'Explore multiple genuinely distinct creative directions before converging, rather than one direction with color variations', category: 'preferences' },
    { aspect: 'creative opportunity', note: 'Look for a distinctive signature element (a custom mark detail, pattern, or motion identity) that gives the brand a memorable, ownable visual hook', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "minimal, restrained palette" alongside "bold, maximalist visual identity")', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. a multi-touchpoint brand implying a favicon-scale legibility check)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria for deliverables (e.g. "logo remains legible at 16px and on a busy photographic background")', category: 'functionalRequirements' },
    { aspect: 'test cases', note: 'Generate test cases for key deliverables: standard usage, reversed/dark-background usage, and boundary states (smallest allowed size, longest wordmark translation)', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: low-resolution reproduction, unlicensed font substitution, incorrect color mode conversion (RGB to CMYK)', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: what happens when the mark is placed on a clashing background, co-branded with a competitor, or resized below its stated minimum', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs scope',
      note: 'A near-zero/shoestring budget stated alongside a full brand kit or complete identity system across a global rollout is a known-infeasible combination — that scope requires proportional design/production budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(full brand kit|complete identity system|global rollout)\b/i,
    },
    {
      aspect: 'timeline vs complexity',
      note: 'An extremely short delivery timeline (days or less) alongside a full brand kit or multiple concept directions is high-risk — exploring and refining a coherent identity system typically requires weeks of iteration.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|asap)\b/i,
      triggerB: /\b(full brand kit|complete identity system|multiple concept directions|brand guidelines)\b/i,
    },
    {
      aspect: 'platform vs feature availability',
      note: 'Digital-only asset delivery conflicts with print/signage/packaging deliverables, which require CMYK color specification and print-ready formats not produced by a digital-only workflow.',
      category: 'constraints',
      triggerA: /\bdigital[- ]only\b/i,
      triggerB: /\b(print|signage|packaging|cmyk)\b/i,
    },
    {
      aspect: 'trademark vs launch timeline',
      note: 'A name/mark that must clear trademark search and legal review conflicts with an immediate public launch — trademark clearance searches and registration filings take longer than same-week or next-week timelines.',
      category: 'constraints',
      triggerA: /\b(trademark|legal clearance|clear(?:ance)? search)\b/i,
      triggerB: /\b(launch(?:ing)? (?:this|next) week|by tomorrow|asap|immediately)\b/i,
    },
  ],
};
