import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let short keywords
// like 'cv' match inside unrelated words, or 'resume' match inside words
// like "resumed"/"resuming" — silently inflating scores on inputs that have
// nothing to do with a resume/CV request.
//
// Overlap note: this domain is kept distinct from writing (prose/articles/
// fiction), branding (logo/visual identity systems), and graphic-design
// (general layout/print design) by focusing keywords tightly on job-search
// document terminology (resume, CV, cover letter, ATS, work experience,
// references) rather than generic document/writing/design terms that those
// domains already own.
const KEYWORDS = [
  'resume', 'résumé', 'cv', 'curriculum vitae', 'cover letter',
  'ats', 'ats-friendly', 'applicant tracking system', 'ats-optimized',
  'work experience', 'employment history', 'job application',
  'linkedin profile', 'professional summary', 'career objective',
  'references available', 'chronological resume', 'functional resume',
  'hybrid resume', 'skills section', 'job hunt', 'job search',
  'one-page resume', 'resume format', 'resume template',
  'resume bullet points', 'resume rewrite', 'resume review',
  'career summary', 'personal statement', 'job description keywords',
  'cover letter template', 'interview follow-up letter', 'gap in employment',
  'career change resume', 'resignation letter', 'linkedin summary',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

// BUGFIX (holistic verification pass, TASK-069 batch): a short, high-signal
// request like "polish my CV for a marketing role" only scores +1 here (on
// 'cv'), but the marketing domain's bare 'marketing' keyword also scores +1
// on the same input, and marketing wins the tie by registry order — an
// input that is unambiguously a resume/CV request loses to an unrelated
// domain because it happens to mention a target industry/role by name. This
// pattern gives a strong bonus when a resume/CV core term appears together
// with job-application context, since that combination is essentially never
// a false positive for this domain.
const CORE_TERM_WITH_JOB_CONTEXT =
  /\b(resume|résumé|cv|curriculum vitae|cover letter)\b[^.!?]{0,40}\b(role|job|position|applying|career|hire|hiring)\b/i;
const JOB_CONTEXT_WITH_CORE_TERM =
  /\b(role|job|position|applying|career|hire|hiring)\b[^.!?]{0,40}\b(resume|résumé|cv|curriculum vitae|cover letter)\b/i;

export const resumeCvDomain: DomainModule = {
  id: 'resume-cv',
  label: 'Resume / CV',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    if (CORE_TERM_WITH_JOB_CONTEXT.test(input) || JOB_CONTEXT_WITH_CORE_TERM.test(input)) {
      score += 2;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Content must be truthful and verifiable — no fabricated titles, dates, or accomplishments', category: 'constraint' },
    { text: 'Format must parse cleanly through common ATS software (no tables, text boxes, or embedded graphics in the parsed body)', category: 'constraint' },
    { text: 'Keep to a length appropriate for career stage (typically one page for <10 years experience)', category: 'preference' },
    { text: 'Quantify accomplishments with measurable results where possible (metrics, percentages, dollar amounts)', category: 'functional' },
    { text: 'Tailor keywords and emphasis to the target role/industry rather than using a generic all-purpose draft', category: 'preference' },
    { text: 'Maintain consistent formatting (dates, tense, bullet style) throughout the document', category: 'functional' },
  ],
  ambiguityChecklist: [
    {
      field: 'target role/industry',
      description: 'The specific target role or industry the resume/CV is being tailored for is unspecified',
      isResolved: (input) => /\b(target(?:ing)?\s+(role|position|job)|applying\s+for|industry|for\s+a\s+\w+\s+(role|position)|career\s+in)\b/i.test(input),
    },
    {
      field: 'format',
      description: 'Preferred structure (chronological, functional, hybrid) is unspecified',
      isResolved: (input) => /\b(chronological|functional\s+resume|hybrid\s+resume|combination\s+resume)\b/i.test(input),
    },
    {
      field: 'length',
      description: 'Desired length (one-page vs multi-page) is unspecified',
      isResolved: (input) => /\b(one[- ]page|two[- ]page|multi[- ]page|\d+\s*pages?)\b/i.test(input),
    },
    {
      field: 'ats compatibility',
      description: 'Whether the document needs to be optimized for ATS parsing (vs a purely human-reviewed/designed document) is unspecified',
      isResolved: (input) => /\b(ats|applicant\s+tracking\s+system|ats-friendly|ats-optimized)\b/i.test(input),
    },
    {
      field: 'career stage',
      description: 'Career stage (entry-level, mid-career, executive, career change) is unspecified',
      isResolved: (input) => /\b(entry[- ]level|mid[- ]career|senior|executive|career\s+chang\w*|new\s+grad(?:uate)?|first\s+job)\b/i.test(input),
    },
    {
      field: 'cover letter inclusion',
      description: 'Whether a cover letter is needed alongside the resume/CV is unspecified',
      isResolved: (input) => /\b(cover\s+letter)\b/i.test(input),
    },
    {
      field: 'employment gap handling',
      description: 'Whether there are employment gaps that need to be addressed/explained in the document is unspecified',
      isResolved: (input) => /\b(employment\s+gap|gap\s+in\s+(my\s+)?employment|career\s+break|career\s+gap|took\s+time\s+off|explain\w*\s+(a\s+)?gap)\b/i.test(input),
    },
    {
      field: 'submission channel',
      description: 'Where the document will be submitted (online portal upload, email attachment, LinkedIn, printed/in-person) is unspecified, which affects format/file-type choices',
      isResolved: (input) => /\b(job\s+portal|online\s+application|email\s+attachment|linkedin|printed|in[- ]person|upload\w*|submit\w*\s+(online|via))\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'header/contact block', dependsOn: [], note: 'Name, contact info, location, LinkedIn/portfolio links — kept in plain parseable text, not an image or text box' },
    { component: 'professional summary', dependsOn: ['header/contact block'], note: '2-3 line positioning statement tailored to the target role' },
    { component: 'work experience section', dependsOn: [], note: 'Reverse-chronological (or functional/hybrid) entries with quantified accomplishment bullets' },
    { component: 'skills section', dependsOn: [], note: 'Role-relevant hard/soft skills, keyword-matched to the target job description for ATS parsing' },
    { component: 'education section', dependsOn: [], note: 'Degrees, institutions, dates, relevant coursework/honors as appropriate to career stage' },
    { component: 'ATS formatting pass', dependsOn: ['header/contact block', 'work experience section', 'skills section'], note: 'Verify single-column layout, standard section headers, and no tables/graphics/headers-footers that break ATS parsers' },
    { component: 'cover letter (if requested)', dependsOn: ['professional summary'], note: 'Role-specific letter that complements rather than repeats the resume content' },
    { component: 'export package', dependsOn: ['ATS formatting pass'], note: 'Final PDF (human-reviewed copy) and/or .docx (ATS-submission copy), matching filename conventions' },
  ],
  technicalConsiderations: [
    { aspect: 'ats parsing compatibility', note: 'Avoid tables, text boxes, columns, headers/footers, and embedded images for body content — many ATS parsers misread or drop content in these elements', category: 'constraints' },
    { aspect: 'file format', note: 'Confirm whether the deliverable should be .docx (most ATS-safe), PDF (preserves visual layout for human reviewers), or both', category: 'functionalRequirements' },
    { aspect: 'keyword matching', note: 'Mirror exact terminology from the target job description/industry (e.g. "project management" vs "PM") since many ATS systems do literal keyword matching', category: 'functionalRequirements' },
    { aspect: 'font and layout constraints', note: 'Use standard, widely-supported fonts (Arial, Calibri, Georgia) and avoid unusual Unicode characters/icons that can render as garbled text in some parsers', category: 'preferences' },
    { aspect: 'section header naming', note: 'Use conventional section headers ("Work Experience", "Education", "Skills") rather than creative labels, since ATS parsers pattern-match on standard headers', category: 'functionalRequirements' },
    { aspect: 'file naming convention', note: 'Name exported files predictably (e.g. FirstName_LastName_Resume.pdf) since some employer portals sort/display by filename', category: 'preferences' },
    { aspect: 'employment gap framing', note: 'If gaps exist, decide up front whether to address them with a brief neutral line (e.g. "Career break — caregiving") or omit and rely on the interview, rather than leaving an unexplained date discontinuity that invites reviewer speculation', category: 'preferences' },
    { aspect: 'portal upload field limits', note: 'Some job-portal upload systems auto-parse the file into separate name/email/experience form fields — verify the source document structure survives that re-parsing without garbling dates or splitting bullet text mid-sentence', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'scannability', note: 'Structure content so a human reviewer skimming for 6-10 seconds can find role, company, dates, and top accomplishments immediately', category: 'functionalRequirements' },
    { aspect: 'visual hierarchy', note: 'Use consistent, restrained formatting (bold for role titles, consistent bullet style) so the eye is guided without looking cluttered or overdesigned', category: 'preferences' },
    { aspect: 'white space and density', note: 'Balance information density against readability — an overcrowded one-pager can hurt more than a clean two-pager for senior candidates', category: 'preferences' },
    { aspect: 'accessibility of exported PDF', note: 'Export PDFs with selectable/searchable text (not flattened images of text) so screen readers and ATS parsers alike can read the content', category: 'constraints' },
    { aspect: 'reading order', note: 'Ensure the underlying document reading order matches the visual order, especially in multi-column designs, since ATS parsers read in document order not visual position', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'personal data exposure', note: 'Avoid including unnecessary sensitive personal data (full home address, date of birth, national ID/SSN, photo where not customary) that isn\'t required and increases identity-theft exposure if the document is shared broadly', category: 'constraints' },
    { aspect: 'metadata scrubbing', note: 'Check exported file metadata (author name, prior edit history, comments) does not leak information the candidate didn\'t intend to share', category: 'preferences' },
    { aspect: 'reference contact consent', note: 'Confirm references have consented before their names/contact details are shared with prospective employers', category: 'constraints' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that a resume shared to a public link/job board is being handled discreetly, when that has not been explicitly confirmed', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual restraint vs distinction', note: 'Balance a memorable, professional visual treatment against the risk that heavy design reduces ATS compatibility and reads as unprofessional in conservative industries', category: 'preferences' },
    { aspect: 'voice and framing', note: 'Frame accomplishments in confident, active language (owned, led, built) rather than passive task descriptions', category: 'preferences' },
    { aspect: 'narrative coherence', note: 'Ensure the overall career narrative reads as a coherent story toward the target role rather than a disconnected list of past duties', category: 'constraints' },
    { aspect: 'industry-appropriate tone', note: 'Match visual and tonal conventions to the target industry — a minimal ATS-safe format for finance/law vs a more designed format for creative/design roles where a portfolio-style resume is expected', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'ats parse testing', note: 'Test the exported document against an ATS-simulation/parser check (or paste-into-plaintext test) to confirm section headers, dates, and bullets extract cleanly', category: 'functionalRequirements' },
    { aspect: 'consistency check', note: 'Verify consistent verb tense (past tense for past roles, present for current), date formatting, and bullet punctuation throughout', category: 'constraints' },
    { aspect: 'accuracy verification', note: 'Confirm every claim (title, dates, metric) is verifiable and matches what the candidate can substantiate in an interview or background check', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as overlapping employment dates or a stated "one-page resume" requirement alongside content that clearly exceeds one page', category: 'constraints' },
    { aspect: 'proofreading pass', note: 'Run a dedicated proofreading pass for typos, grammar, and formatting drift — a single typo is disproportionately costly on a document this short', category: 'functionalRequirements' },
    { aspect: 'keyword coverage test', note: 'Cross-check the resume\'s skills/experience keywords against the target job posting to confirm adequate ATS keyword coverage', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'one-page constraint vs extensive content',
      note: 'A strict one-page length requirement alongside a request to include an extensive multi-decade work history and every skill/certification is infeasible — that volume of content requires either a multi-page CV or significant prioritization/cutting.',
      category: 'constraints',
      triggerA: /\bone[- ]page\b/i,
      triggerB: /\b(\d{2}\+?\s*years?\s+(of\s+)?experience|every\s+(job|skill|certification)|entire\s+career\s+history|20\+?\s*years)\b/i,
    },
    {
      aspect: 'heavy visual design vs ats compatibility',
      note: 'A request for a heavily designed, graphics-rich, multi-column layout alongside a hard requirement for full ATS parsing compatibility is a known-infeasible combination — those visual elements are exactly what breaks ATS parsers.',
      category: 'constraints',
      triggerA: /\b(infographic|graphics?[- ]heavy|multi[- ]column|creative\s+visual\s+layout)\b/i,
      triggerB: /\b(ats[- ]friendly|ats[- ]optimized|applicant\s+tracking\s+system|ats\s+compat\w*)\b/i,
    },
    {
      aspect: 'fabricated content request',
      note: 'A request to fabricate or exaggerate credentials, titles, or accomplishments that the candidate did not actually hold is not something this system will produce, since it risks background-check failure and rescinded offers.',
      category: 'constraints',
      triggerA: /\b(make\s+up|fabricat\w*|invent\w*|pretend\s+i\s+(have|had|worked))\b/i,
      triggerB: /\b(title|degree|experience|certification|job\s+history)\b/i,
    },
    {
      aspect: 'entry-level candidate vs senior-only requirement',
      note: 'Requesting resume content pitched at entry-level/first-job career stage while also demanding extensive quantified leadership accomplishments and years of managerial experience is infeasible — that content simply does not exist yet for a candidate at that stage; the fix is emphasizing transferable skills, coursework, and internships instead.',
      category: 'constraints',
      triggerA: /\b(entry[- ]level|first\s+job|new\s+grad(?:uate)?|no\s+(prior\s+)?experience)\b/i,
      triggerB: /\b(years?\s+of\s+(managerial|leadership)\s+experience|led\s+a\s+team\s+of|managed\s+a\s+budget\s+of)\b/i,
    },
  ],
};
