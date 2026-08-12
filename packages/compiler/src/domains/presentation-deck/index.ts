import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/menu-design/index.ts. Scoped specifically to business/pitch/
// conference slide-deck production (slide structure, speaker notes, template/
// brand consistency, time budgeting) — NOT general graphic-design layout work
// (graphic-design), logo/identity systems (branding), marketing campaign
// planning (marketing), or long-form written reports (business/writing).
// Keywords favor compound, deck-specific phrases ('pitch deck', 'slide deck',
// 'speaker notes') over bare words like 'slide' or 'presentation' that would
// over-trigger on unrelated software-UI or generic-writing requests.
const KEYWORDS = [
  'pitch deck', 'slide deck', 'presentation deck', 'investor deck',
  'keynote deck', 'deck template', 'slide template', 'presentation template',
  'speaker notes', 'slide layout', 'slide count', 'title slide',
  'agenda slide', 'deck outline', 'pitch presentation', 'conference presentation',
  'conference talk', 'board deck', 'sales deck', 'company deck',
  'deck design', 'slide design', 'presentation design', 'powerpoint deck',
  'google slides deck', 'keynote presentation', 'executive summary slide',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const presentationDeckDomain: DomainModule = {
  id: 'presentation-deck',
  label: 'Presentation / Slide Deck',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Structure the deck around a clear narrative arc (problem, solution, proof, ask) appropriate to the audience and purpose', category: 'functional' },
    { text: 'Fit the slide count and pacing to the allotted presentation time budget (rule-of-thumb: roughly one slide per 1-2 minutes)', category: 'constraint' },
    { text: 'Apply a consistent template/brand system (color, type, layout grid) across every slide', category: 'functional' },
    { text: 'Write speaker notes separate from on-slide text so slides stay visually light while the presenter retains full talking points', category: 'preference' },
    { text: 'Deliver source files in an editable format (e.g. Keynote/PowerPoint/Google Slides/Figma) alongside a PDF export', category: 'constraint' },
    { text: 'Keep on-slide text minimal (headline + supporting visual) rather than dense paragraphs a presenter would read aloud', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'audience and purpose',
      description: 'The intended audience/purpose (investor pitch, internal update, sales pitch, conference keynote) is unspecified',
      isResolved: (input) => /\b(investor|pitch|internal\s+update|sales\s+pitch|keynote|conference|board\s+meeting|all-hands|stakeholder)\b/i.test(input),
    },
    {
      field: 'slide count / time budget',
      description: 'The target slide count or allotted presentation time is unspecified',
      isResolved: (input) => /\b(\d+\s*slides?|\d+[\s-]?minute|\d+\s*min\b|time\s+budget|time\s+limit)\b/i.test(input),
    },
    {
      field: 'speaker notes requirement',
      description: 'Whether the deck needs written speaker notes (for a live presenter) versus being fully self-explanatory (a leave-behind/read-alone document) is unspecified',
      isResolved: (input) => /\b(speaker\s+notes|presenter\s+notes|self-?explanatory|leave-?behind|read-?alone|stand-?alone\s+document)\b/i.test(input),
    },
    {
      field: 'template/brand consistency',
      description: 'Whether the deck must follow an existing brand template/style guide or can use a new design is unspecified',
      isResolved: (input) => /\b(brand\s+template|style\s+guide|existing\s+template|brand\s+guidelines|company\s+template|master\s+slide|slide\s+master)\b/i.test(input),
    },
    {
      field: 'delivery format',
      description: 'The target software/format (PowerPoint, Keynote, Google Slides, PDF, Figma) is unspecified',
      isResolved: (input) => /\b(powerpoint|\.pptx|keynote|google\s+slides|\.pdf|figma|canva)\b/i.test(input),
    },
    {
      field: 'data/chart sourcing',
      description: 'Whether the deck requires charts/data visualizations sourced from real figures, and where those figures come from, is unspecified',
      isResolved: (input) => /\b(chart|graph|data\s+visuali[sz]ation|metrics|figures|financial\s+projections|kpi)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'narrative outline', dependsOn: [], note: 'Story arc and section order (problem, solution, market, proof, ask, etc.) mapped before any slide is designed' },
    { component: 'slide-by-slide content map', dependsOn: ['narrative outline'], note: 'One-line purpose and key takeaway defined per slide, so each slide earns its place in the time budget' },
    { component: 'template/master slide system', dependsOn: [], note: 'Reusable master slides (title, section divider, content, closing) with consistent color, type, grid, and logo placement' },
    { component: 'data visualization set', dependsOn: ['slide-by-slide content map'], note: 'Charts/graphs built from real source data, styled to match the template rather than pasted-in default chart styling' },
    { component: 'speaker notes', dependsOn: ['slide-by-slide content map'], note: 'Full talking points per slide, written separately from on-slide text so slides stay visually light' },
    { component: 'appendix/backup slides', dependsOn: ['narrative outline'], note: 'Supporting detail slides held in reserve for anticipated Q&A rather than bloating the core narrative' },
    { component: 'timing/rehearsal plan', dependsOn: ['slide-by-slide content map', 'speaker notes'], note: 'Per-section time allocation checked against the total time budget, validated with a run-through' },
    { component: 'export/delivery package', dependsOn: ['template/master slide system', 'data visualization set'], note: 'Editable source file plus a PDF export and any handout/leave-behind version' },
  ],
  technicalConsiderations: [
    { aspect: 'target software compatibility', note: 'Confirm the target application (PowerPoint, Keynote, Google Slides) since fonts, transitions, and embedded chart objects do not always convert cleanly between them', category: 'constraints' },
    { aspect: 'font licensing/embedding', note: 'Verify custom fonts are either embedded in the file or available on every machine that will present the deck, or text reflows incorrectly on the day', category: 'constraints' },
    { aspect: 'live data vs static snapshot', note: 'Decide whether charts are static images/snapshots or live-linked to a source spreadsheet, since live links can break or show stale data if the source file moves', category: 'functionalRequirements' },
    { aspect: 'aspect ratio and resolution', note: 'Confirm the target aspect ratio (16:9 standard vs 4:3 legacy) and export resolution for the venue\'s projector/screen before building slide layouts', category: 'functionalRequirements' },
    { aspect: 'file size and media weight', note: 'Keep embedded video/high-resolution images within a reasonable file size so the deck opens reliably on the day, especially on a borrowed or venue-provided laptop', category: 'preferences' },
    { aspect: 'offline reliability', note: 'Ensure the deck runs fully offline (no dependency on live internet, cloud-embedded video, or an active Google Slides connection) unless venue connectivity is confirmed', category: 'constraints' },
    { aspect: 'version control', note: 'Establish a single source of truth for the deck (avoid multiple divergent copies) especially when several contributors are editing simultaneously', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'one-idea-per-slide', note: 'Limit each slide to a single core idea/takeaway so the audience is not reading a paragraph while the presenter is talking', category: 'preferences' },
    { aspect: 'visual hierarchy', note: 'Use consistent heading/body sizing and contrast so the audience knows where to look first on every slide', category: 'functionalRequirements' },
    { aspect: 'readability at distance', note: 'Size body text and chart labels to remain legible from the back of the room/on a shared screen, not just on the editing screen', category: 'constraints' },
    { aspect: 'pacing and transitions', note: 'Structure section dividers and transitions so the audience always knows which part of the narrative they are in', category: 'preferences' },
    { aspect: 'accessible color contrast', note: 'Check text-on-background contrast and avoid color as the sole signal (e.g. red/green-only charts) for colorblind audience members', category: 'constraints' },
    { aspect: 'remote/hybrid presentation', note: 'If the deck will be presented over video call, verify screen-share legibility and layout margins that survive video-conferencing UI cropping', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'confidential data exposure', note: 'Confirm which financial figures, roadmap details, or customer data are safe to show to this specific audience before they land on a slide that could be photographed or leaked', category: 'constraints' },
    { aspect: 'metadata scrubbing', note: 'Strip hidden speaker notes, comments, and revision history from the file before distributing a leave-behind version externally', category: 'constraints' },
    { aspect: 'external sharing controls', note: 'If sharing via a cloud link (Google Slides, etc.), set the correct view/edit permissions before sending so external recipients cannot alter the deck', category: 'constraints' },
    { aspect: 'sensitive appendix content', note: 'Keep backup/appendix slides with sensitive detail out of any pre-circulated or public version of the deck', category: 'preferences' },
    { aspect: 'source data provenance', note: 'Verify chart/metric sources are current and attributable in case the audience asks where a figure came from', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'brand/template consistency', note: 'Keep color palette, typography, and logo placement consistent with the organization\'s existing brand or an intentionally chosen new template, not a mix of default software themes', category: 'constraints' },
    { aspect: 'visual storytelling over bullet lists', note: 'Favor imagery, diagrams, and a small number of well-chosen data points over dense bullet-point walls, which read as generic and disengage an audience', category: 'preferences' },
    { aspect: 'tone match to audience', note: 'Calibrate visual tone (formal investor deck vs. energetic internal all-hands vs. polished keynote) to the stated audience and purpose', category: 'preferences' },
    { aspect: 'chart styling consistency', note: 'Restyle default chart-tool output (colors, fonts, gridlines) to match the deck template rather than leaving default Excel/Sheets chart styling', category: 'preferences' },
    { aspect: 'opening and closing slide impact', note: 'Give the title slide and closing/ask slide extra design attention, since they carry disproportionate weight in first and last impressions', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'timing rehearsal', note: 'Run through the deck with a timer against the stated time budget before delivery — a deck that is too long is a common, avoidable failure', category: 'functionalRequirements' },
    { aspect: 'data accuracy cross-check', note: 'Verify every number, chart, and claim on a slide against its source before presenting, since a factual slip in a pitch or board deck is high-cost', category: 'constraints' },
    { aspect: 'consistency pass', note: 'Check for template drift (an off-brand font, misaligned logo, inconsistent color) that crept in across slides built at different times', category: 'preferences' },
    { aspect: 'cross-device rendering check', note: 'Open the exported/final file on the actual presenting device (or its OS/software version) before the event, since fonts and layouts can shift between machines', category: 'functionalRequirements' },
    { aspect: 'speaker notes completeness', note: 'Confirm every slide requiring elaboration has corresponding speaker notes, not just the slides that were easy to annotate', category: 'preferences' },
    { aspect: 'anticipated-question coverage', note: 'Verify appendix/backup slides actually cover the questions the audience is likely to ask, based on the stated purpose and audience', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs slide count/data depth',
      note: 'An extremely short delivery timeline alongside a large, data-heavy deck (dozens of slides with custom charts/financial projections) is high-risk — sourcing, verifying, and styling real data at that volume typically takes days, not hours.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|tonight|in (?:a|one) hour|overnight|asap|by end of day)\b/i,
      triggerB: /\b(\d{2,}\s*slides?|financial\s+projections|full\s+data\s+deck|custom\s+charts?\s+for\s+every)\b/i,
    },
    {
      aspect: 'strict time budget vs excessive slide count',
      note: 'A short presentation time budget stated alongside a very high slide count is contradictory — a large slide count cannot be delivered at a normal pace within a short time slot without rushing past most slides.',
      category: 'constraints',
      triggerA: /\b(\d{1,2}[\s-]?minute\s+(talk|presentation|pitch|slot))\b/i,
      triggerB: /\b(\d{2,}\s*slides?)\b/i,
    },
    {
      aspect: 'no budget vs custom illustration/animation',
      note: 'A "no budget"/DIY constraint alongside custom illustration work or complex motion/animation throughout the deck is unrealistic scope — that level of production typically requires paid design or animation resources.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|zero\s+budget|diy|do\s+it\s+myself)\b/i,
      triggerB: /\b(custom\s+illustrations?|animated\s+throughout|motion\s+graphics\s+(for\s+)?every\s+slide)\b/i,
    },
  ],
};
