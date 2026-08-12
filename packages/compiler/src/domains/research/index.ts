import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let 'research'
// match inside unrelated words, and short keywords like 'cite' or 'survey'
// would silently inflate scores on inputs that have nothing to do with
// research/analysis work.
const KEYWORDS = [
  'research', 'literature review', 'research report', 'analysis report',
  'market research', 'competitive analysis', 'sourcing', 'citations', 'citation',
  'methodology', 'survey', 'dataset', 'data set', 'whitepaper', 'white paper',
  'fact-find', 'fact find', 'due diligence', 'research summary', 'annotated bibliography',
  'peer-reviewed', 'peer reviewed', 'secondary research', 'primary research',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const researchDomain: DomainModule = {
  id: 'research',
  label: 'Research',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the scope and boundaries of the research question', category: 'functional' },
    { text: 'State sourcing/citation requirements (source types, recency, minimum credibility)', category: 'constraint' },
    { text: 'Specify deliverable format (report, summary, slide deck, dataset)', category: 'preference' },
    { text: 'Note any deadline or turnaround-time constraint', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'scope',
      description: 'The scope/boundaries of the research question (what is in vs. out of scope) is unspecified',
      isResolved: (input) => /(scope|focus on|limited to|exclude|out of scope|boundar(y|ies))/i.test(input),
    },
    {
      field: 'sourcing',
      description: 'Sourcing/citation requirements (source types, recency, credibility bar) are unspecified',
      isResolved: (input) => /(peer-?reviewed|primary source|secondary source|citation|cite|academic|credible source|source requirement)/i.test(input),
    },
    {
      field: 'methodology',
      description: 'The research methodology (qualitative, quantitative, systematic review, survey) is unspecified',
      isResolved: (input) => /(qualitative|quantitative|systematic review|survey method|methodology|interview|case study)/i.test(input),
    },
    {
      field: 'deliverable format',
      description: 'The expected deliverable format (report, summary, dataset, presentation) is unspecified',
      isResolved: (input) => /(report|summary|dataset|data set|slide deck|presentation|memo|brief|spreadsheet)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'scoping', dependsOn: [], note: 'Define research question, boundaries, and success criteria' },
    { component: 'source gathering', dependsOn: ['scoping'], note: 'Identify and collect primary/secondary sources' },
    { component: 'analysis', dependsOn: ['source gathering'], note: 'Synthesize findings, identify patterns and contradictions' },
    { component: 'citation management', dependsOn: ['source gathering'], note: 'Track provenance and format citations consistently' },
    { component: 'deliverable authoring', dependsOn: ['analysis'], note: 'Produce the report/summary/dataset in the required format' },
    { component: 'review pass', dependsOn: ['deliverable authoring'], note: 'Check claims against sources and verify no unsupported assertions remain' },
  ],
  technicalConsiderations: [
    { aspect: 'sourcing strategy', note: 'Define which source types are acceptable (peer-reviewed, primary data, industry reports, news) and how recency is bounded', category: 'constraints' },
    { aspect: 'methodology', note: 'Choose an appropriate methodology (systematic review, survey, comparative analysis, case study) matched to the research question', category: 'functionalRequirements' },
    { aspect: 'data collection tooling', note: 'Determine what tools/databases are needed to gather data (academic databases, market data providers, internal records)', category: 'functionalRequirements' },
    { aspect: 'citation format', note: 'Specify a citation style (APA, MLA, Chicago, or informal linked references) and apply it consistently', category: 'preferences' },
    { aspect: 'reproducibility', note: 'Document search terms, filters, and inclusion/exclusion criteria so findings can be reproduced or audited', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'readability', note: 'Structure findings with clear headings, executive summary, and progressive detail so a time-pressed reader can skim to the conclusion', category: 'functionalRequirements' },
    { aspect: 'audience calibration', note: 'Calibrate technical depth and jargon to the stated audience (executive, technical, general public)', category: 'preferences' },
    { aspect: 'navigability', note: 'For long reports, provide a table of contents or section anchors so readers can jump to relevant findings', category: 'preferences' },
    { aspect: 'visual summarization', note: 'Use tables/charts to summarize comparative or quantitative findings rather than burying them in prose', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'source credibility', note: 'Flag low-credibility or unverifiable sources rather than presenting them with the same weight as vetted ones', category: 'constraints' },
    { aspect: 'data privacy', note: 'If the research involves personal or proprietary data, confirm handling/retention rules before collection begins', category: 'constraints' },
    { aspect: 'confidentiality', note: 'Determine whether findings (e.g. competitive analysis) are confidential and restrict distribution accordingly', category: 'preferences' },
    { aspect: 'bias disclosure', note: 'Disclose conflicts of interest or funding sources behind cited studies where relevant to interpretation', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'narrative framing', note: 'Frame findings around the decision the research is meant to inform, not just a list of facts', category: 'preferences' },
    { aspect: 'data storytelling', note: 'Choose visualizations that highlight the key insight rather than defaulting to generic charts', category: 'preferences' },
    { aspect: 'clarity over jargon', note: 'Prefer plain-language explanations of technical or statistical concepts unless the audience is specialist', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'claim verification', note: 'Check that every substantive claim in the deliverable is traceable to a cited source', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictory findings across sources and surface the disagreement rather than silently picking one', category: 'constraints' },
    { aspect: 'completeness', note: 'Verify the research question as scoped has actually been answered, not just adjacent topics covered', category: 'functionalRequirements' },
    { aspect: 'recency check', note: 'Flag sources that may be outdated relative to the stated recency requirement', category: 'preferences' },
    { aspect: 'sample/evidence strength', note: 'Note where conclusions rest on thin evidence (single source, small sample) so confidence is not overstated', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs rigor',
      note: 'An extremely short turnaround (hours or same-day) alongside a demand for a systematic/peer-reviewed-only literature review is high-risk — rigorous sourcing and synthesis at that depth typically requires days, not hours.',
      category: 'constraints',
      triggerA: /\b(by (?:tomorrow|tonight|end of day)|in (?:a|one) (?:hour|day)|asap|same-day)\b/i,
      triggerB: /\b(systematic review|peer-?reviewed only|comprehensive literature review|exhaustive research)\b/i,
    },
    {
      aspect: 'source restriction vs scope',
      note: 'Restricting sources to a single provider or a "no internet access" constraint alongside a broad/comprehensive research scope is a known-infeasible combination — comprehensive coverage requires diverse, accessible sources.',
      category: 'constraints',
      triggerA: /\b(no internet access|offline only|single source only|one source only)\b/i,
      triggerB: /\b(comprehensive|exhaustive|broad|industry-wide)\s+(research|analysis|review)\b/i,
    },
  ],
};
