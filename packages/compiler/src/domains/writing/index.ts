import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let short keywords
// like 'copy' match inside unrelated words (e.g. "copyright"), or 'script'
// match inside "Javascript"/"subscription" — silently inflating scores on
// inputs that have nothing to do with a writing request.
const KEYWORDS = [
  'article', 'blog post', 'blog', 'essay', 'short story', 'novel', 'novella',
  'screenplay', 'script', 'copywriting', 'copywriter', 'ad copy', 'tagline',
  'op-ed', 'press release', 'newsletter', 'ghostwrite', 'ghostwriting',
  'proofread', 'proofreading', 'editing pass', 'copyedit', 'copy-edit',
  'manuscript', 'memoir', 'poem', 'poetry', 'narrative', 'tone of voice',
  'word count', 'outline', 'draft', 'rewrite', 'prose', 'fiction', 'nonfiction',
  'white paper', 'case study', 'listicle', 'landing page copy', 'email copy',
  'sales page', 'product description', 'speech writing', 'eulogy', 'cover letter',
  'children\'s book', 'book chapter', 'song lyrics',
  'content writing', 'seo article', 'thought leadership', 'byline',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const writingDomain: DomainModule = {
  id: 'writing',
  label: 'Writing',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target tone/voice (e.g. formal, conversational, playful)', category: 'preference' },
    { text: 'Define target audience and reading level', category: 'functional' },
    { text: 'Specify target length/word count and format', category: 'constraint' },
    { text: 'Confirm whether an editing/proofreading pass is required before delivery', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'tone',
      description: 'Tone/voice (formal, casual, humorous, persuasive, etc.) is unspecified',
      isResolved: (input) => /\b(tone|voice|formal|casual|conversational|playful|persuasive|humorous|serious|professional)\b/i.test(input),
    },
    {
      field: 'audience',
      description: 'Target audience/reader is unspecified',
      isResolved: (input) => /\b(audience|readers?|for (my|our|a)|targeting|demographic)\b/i.test(input),
    },
    {
      field: 'length',
      description: 'Target length/word count/format is unspecified',
      isResolved: (input) => /\b(\d+[\s-]?(words?|pages?)|word count|short|long-form|length)\b/i.test(input),
    },
    {
      field: 'purpose',
      description: 'The purpose or publication context (marketing, personal, submission, internal) is unspecified',
      isResolved: (input) => /\b(publish|submission|marketing|personal|internal|for (a|our) (client|blog|magazine|website))\b/i.test(input),
    },
    {
      field: 'format',
      description: 'The delivery file format (plain text, Markdown, Word doc, script format) is unspecified',
      isResolved: (input) => /\b(markdown|\.docx?\b|word doc(ument)?|plain text|pdf|fountain|final draft|google doc)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'outline', dependsOn: [], note: 'Structural outline / beat sheet before drafting begins' },
    { component: 'draft', dependsOn: ['outline'], note: 'First full draft written to the outline' },
    { component: 'editing pass', dependsOn: ['draft'], note: 'Structural and line-edit revision of the draft' },
    { component: 'proofreading', dependsOn: ['editing pass'], note: 'Final grammar/spelling/consistency pass' },
    { component: 'formatting', dependsOn: ['proofreading'], note: 'Final format/layout for the target medium (manuscript, web, print)' },
  ],
  technicalConsiderations: [
    { aspect: 'format', note: 'Confirm the delivery file format (plain text, Markdown, Word doc, script format like Fountain/Final Draft)', category: 'constraints' },
    { aspect: 'word count', note: 'Set a specific target word/page count so scope is measurable', category: 'functionalRequirements' },
    { aspect: 'style guide', note: 'Confirm which style guide applies (AP, Chicago, MLA, or a house style guide)', category: 'constraints' },
    { aspect: 'research sourcing', note: 'If factual claims are involved, define what sourcing/citation standard is required', category: 'functionalRequirements' },
    { aspect: 'revision rounds', note: 'Define how many revision rounds are included before the piece is considered final', category: 'preferences' },
    { aspect: 'SEO/keyword targeting', note: 'For web-published content, confirm target keywords, meta description, and heading structure so the piece is discoverable, not just readable', category: 'functionalRequirements' },
    { aspect: 'attribution/byline', note: 'For ghostwritten or agency work, confirm whether the piece is published anonymously, under the client\'s byline, or under the writer\'s own name', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'readability', note: 'Match sentence/paragraph length and vocabulary complexity to the target reading level', category: 'functionalRequirements' },
    { aspect: 'structure and flow', note: 'Use headers, sections, or scene breaks so the piece is scannable and easy to follow', category: 'preferences' },
    { aspect: 'call to action', note: 'For copywriting/marketing pieces, define what action the reader should take after reading', category: 'functionalRequirements' },
    { aspect: 'hook and opening', note: 'Craft an opening line/paragraph strong enough to hold the reader past the first few seconds', category: 'preferences' },
    { aspect: 'skimmability', note: 'For web/online content, use short paragraphs, bullet points, and subheadings so skimming readers can extract the point without reading linearly', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'plagiarism/originality', note: 'Confirm the piece must be original and not lift phrasing from existing copyrighted sources', category: 'constraints' },
    { aspect: 'factual accuracy', note: 'Flag any factual/statistical claims that need verification before publication to avoid spreading misinformation', category: 'constraints' },
    { aspect: 'defamation and legal risk', note: 'Review any statements about real people, companies, or events for defamation or legal exposure before publishing', category: 'constraints' },
    { aspect: 'sensitive content', note: 'Flag sensitive topics (medical, legal, financial advice framed as fact) that may need disclaimers', category: 'preferences' },
    { aspect: 'AI-assistance disclosure', note: 'Check whether the target publication or platform requires disclosing AI involvement in drafting; some outlets and contests prohibit or require labeling AI-assisted writing', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'voice and style', note: 'Establish a distinct authorial voice/style rather than defaulting to generic, interchangeable prose', category: 'preferences' },
    { aspect: 'originality', note: 'Avoid clichés and overused framing devices; look for a fresh angle on the subject', category: 'preferences' },
    { aspect: 'characterization', note: 'For fiction/narrative work, ensure characters have distinct, consistent voices and motivations', category: 'functionalRequirements' },
    { aspect: 'imagery and language', note: 'Use vivid, specific language and concrete imagery over vague abstraction where the piece calls for it', category: 'preferences' },
    { aspect: 'consistency', note: 'Maintain consistent tense, point of view, and terminology throughout the piece', category: 'constraints' },
    { aspect: 'show vs tell', note: 'For narrative/fiction work, favor dramatized scenes and concrete sensory detail over summarized exposition where the moment matters', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'grammar and spelling', note: 'Perform a final grammar, spelling, and punctuation pass before delivery', category: 'constraints' },
    { aspect: 'fact-check', note: 'Verify any names, dates, statistics, or quotes cited in the piece', category: 'functionalRequirements' },
    { aspect: 'consistency check', note: 'Check for contradictions in tone, terminology, or narrative details across the piece', category: 'constraints' },
    { aspect: 'requirement coverage', note: 'Confirm the draft actually satisfies the stated brief (audience, tone, length, purpose)', category: 'functionalRequirements' },
    { aspect: 'plagiarism check', note: 'Run an originality/plagiarism check before the piece is considered final', category: 'preferences' },
    { aspect: 'read-aloud pass', note: 'Read the piece aloud (or have it read aloud) to catch awkward rhythm, run-ons, and dialogue that doesn\'t sound natural', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'length vs timeline',
      note: 'A very short delivery timeline (hours) alongside a long-form deliverable (novel, book, full manuscript) is high-risk — long-form writing at quality typically requires weeks-to-months, not hours.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|in (?:a|one) (?:hour|day)|overnight|asap|within (?:the )?hour)\b/i,
      triggerB: /\b(novel|full manuscript|book|screenplay)\b/i,
    },
    {
      aspect: 'word count vs depth',
      note: 'A very short target length (under a couple hundred words) alongside a request for deep, thoroughly researched or comprehensive coverage is an infeasible-as-stated combination — depth and brevity trade off directly.',
      category: 'constraints',
      triggerA: /\b(\d{1,2}0)\s*[- ]?word(s)?\b/i,
      triggerB: /\b(comprehensive|in-depth|thoroughly researched|deep dive|exhaustive)\b/i,
    },
    {
      aspect: 'anonymity vs attribution',
      note: 'Requesting anonymous/ghostwritten authorship alongside a requirement that the piece carry the requester\'s own byline is contradictory as stated — clarify which one applies.',
      category: 'constraints',
      triggerA: /\b(ghostwrit(e|ten|ing)|anonymous(ly)?|no byline)\b/i,
      triggerB: /\b(my byline|under my name|bylined? (to|as) me|credit(ed)? to me)\b/i,
    },
  ],
};
