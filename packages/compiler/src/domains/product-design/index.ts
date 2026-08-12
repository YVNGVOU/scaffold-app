import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let short keywords
// like 'ia' or 'ux' match inside unrelated words, silently inflating scores.
const KEYWORDS = [
  'product design', 'ux research', 'user research', 'wireframe', 'wireframes',
  'wireframing', 'prototype', 'prototyping', 'usability test', 'usability testing',
  'design system', 'user persona', 'personas', 'user journey', 'journey map',
  'information architecture', 'card sort', 'card sorting', 'design critique',
  'figma', 'interaction design', 'ux', 'ui/ux', 'design thinking',
  'user interviews', 'affinity map', 'heuristic evaluation', 'usability study',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const productDesignDomain: DomainModule = {
  id: 'product-design',
  label: 'Product Design',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target user segment(s) and their primary goals', category: 'functional' },
    { text: 'Deliverables must include reviewable prototypes/artifacts (wireframes, flows, or clickable prototype)', category: 'functional' },
    { text: 'Design decisions should be traceable to research findings or stated assumptions', category: 'preference' },
    { text: 'Plan a usability validation step before final handoff', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'fidelity',
      description: 'Desired fidelity of deliverables (low-fidelity sketches, mid-fidelity wireframes, or high-fidelity prototype) is unspecified',
      isResolved: (input) => /\b(low[- ]fidelity|mid[- ]fidelity|high[- ]fidelity|wireframes?|mockups?|clickable prototype|lo-?fi|hi-?fi)\b/i.test(input),
    },
    {
      field: 'research method',
      description: 'The user research method (interviews, surveys, usability testing, analytics review) is unspecified',
      isResolved: (input) => /\b(interviews?|surveys?|usability testing|usability test|analytics|contextual inquiry|diary stud(?:y|ies))\b/i.test(input),
    },
    {
      field: 'target users',
      description: 'Target user segment or persona is unspecified',
      isResolved: (input) => /\b(persona|target users?|user segment|audience|for (?:new|existing|power) users)\b/i.test(input),
    },
    {
      field: 'existing design system',
      description: 'Whether an existing design system/component library should be reused or a new one created is unspecified',
      isResolved: (input) => /\b(design system|component librar(?:y|ies)|existing (?:design|style) guide|from scratch)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'research plan', dependsOn: [], note: 'Define research questions, method, and target participants' },
    { component: 'user research', dependsOn: ['research plan'], note: 'Conduct interviews/surveys/usability sessions and synthesize findings' },
    { component: 'wireframes', dependsOn: ['user research'], note: 'Low/mid-fidelity structural layouts of key flows' },
    { component: 'prototype', dependsOn: ['wireframes'], note: 'Interactive or high-fidelity prototype for stakeholder/user testing' },
    { component: 'design system', dependsOn: [], note: 'Reusable component and style specifications backing the prototype' },
    { component: 'usability testing', dependsOn: ['prototype'], note: 'Validate the prototype against real users before handoff' },
  ],
  technicalConsiderations: [
    { aspect: 'design tooling', note: 'Select the design/prototyping tool (e.g. Figma) and confirm file organization/versioning conventions', category: 'constraints' },
    { aspect: 'handoff format', note: 'Define how specs are handed off to engineering (redlines, tokens, component specs, dev-mode links)', category: 'functionalRequirements' },
    { aspect: 'design system integration', note: 'Determine whether new components extend an existing design system or require net-new tokens/components', category: 'constraints' },
    { aspect: 'prototype fidelity vs effort', note: 'Match prototype fidelity to the decision it needs to support — do not over-invest in visual polish for early concept validation', category: 'preferences' },
    { aspect: 'data for testing', note: 'Decide whether usability testing needs real data/content or placeholder content is acceptable', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'user flows', note: 'Map the primary end-to-end user flows before detailing individual screens, so structure is validated ahead of visual design', category: 'functionalRequirements' },
    { aspect: 'information architecture', note: 'Define navigation structure and content grouping so users can predict where things live', category: 'functionalRequirements' },
    { aspect: 'accessibility in design', note: 'Design for accessibility from wireframe stage (contrast, tap targets, focus order), not as a late-stage retrofit', category: 'constraints' },
    { aspect: 'edge-case states', note: 'Design empty, loading, error, and zero-data states for each key screen, not just the happy path', category: 'preferences' },
    { aspect: 'consistency', note: 'Reuse established interaction patterns and components rather than inventing one-off variants per screen', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'sensitive data in mockups', note: 'Avoid using real user PII or production data in prototypes/mockups shared outside the team', category: 'constraints' },
    { aspect: 'research data handling', note: 'Define how interview recordings/transcripts and participant contact info are stored, anonymized, and retained', category: 'constraints' },
    { aspect: 'prototype access control', note: 'Confirm whether shared prototype links are restricted (password/domain-limited) when they contain unreleased features', category: 'preferences' },
    { aspect: 'consent', note: 'Ensure research participants give informed consent for recording and data use before sessions begin', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual language', note: 'Establish a consistent visual language (type scale, spacing, color tokens) before scaling designs across many screens', category: 'preferences' },
    { aspect: 'differentiation', note: 'Push past generic pattern-library defaults so the product has a distinct, memorable point of view', category: 'preferences' },
    { aspect: 'narrative flow', note: 'Sequence screens/prototype states to tell a coherent story of the user\'s task, not just a set of disconnected screens', category: 'functionalRequirements' },
    { aspect: 'hierarchy', note: 'Use layout and typographic hierarchy to make the primary action on each screen unambiguous', category: 'functionalRequirements' },
  ],
  qaConsiderations: [
    { aspect: 'research-to-design traceability', note: 'Check that each major design decision maps back to a research finding or an explicitly stated assumption', category: 'constraints' },
    { aspect: 'missing flows', note: 'Identify flows implied by the spec but not designed (e.g. account deletion, error recovery, offline state)', category: 'functionalRequirements' },
    { aspect: 'usability test plan', note: 'Define concrete usability test tasks and success criteria (e.g. "80% of participants complete checkout unassisted")', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictions between stated user needs and proposed flows (e.g. "one-click purchase" alongside a five-step checkout)', category: 'constraints' },
    { aspect: 'accessibility audit', note: 'Verify wireframes/prototypes against basic accessibility heuristics before handoff (contrast, target size, reading order)', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs research depth',
      note: 'An extremely short timeline stated alongside a request for in-depth generative user research is high-risk — rigorous interviews/synthesis typically take weeks, not days.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(user research|user interviews|generative research|ethnographic|contextual inquiry)\b/i,
    },
    {
      aspect: 'no budget vs custom design system',
      note: 'A near-zero budget/timeline stated alongside a request for a brand-new, comprehensive design system is a known-infeasible combination — a full design system requires sustained design and engineering investment.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(new|comprehensive|full[- ]scale)\s+design system\b/i,
    },
  ],
};
