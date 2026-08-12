import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside unrelated text — do not repeat that bug here (e.g. a bare 'will'
// keyword would match inside unrelated words like "willing" if not
// word-boundary-safe).
const KEYWORDS = [
  'contract', 'nda', 'non-disclosure agreement', 'non disclosure agreement',
  'terms of service', 'terms and conditions', 'privacy policy', 'liability',
  'indemnification', 'indemnify', 'jurisdiction', 'governing law', 'compliance',
  'legal document', 'legal review', 'legal advice', 'litigation', 'lawsuit',
  'plaintiff', 'defendant', 'clause', 'contractual', 'breach of contract',
  'employment agreement', 'lease agreement', 'service agreement',
  'licensing agreement', 'intellectual property', 'trademark', 'copyright',
  'patent', 'gdpr', 'ccpa', 'hipaa', 'arbitration', 'severability',
  'force majeure', 'power of attorney', 'legal counsel', 'attorney',
  'law firm', 'statute', 'regulatory compliance', 'liability waiver',
  'terms of use', 'settlement agreement',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const legalDomain: DomainModule = {
  id: 'legal',
  label: 'Legal',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Output is not a substitute for advice from a licensed attorney and must be reviewed by qualified legal counsel before use', category: 'constraint' },
    { text: 'Specify the governing jurisdiction(s) whose law and procedural rules apply', category: 'functional' },
    { text: 'Use precise, unambiguous defined terms consistently throughout the document', category: 'functional' },
    { text: 'Identify all parties to the document by full legal name and capacity', category: 'functional' },
    { text: 'Flag any clause creating liability, indemnification, or waiver obligations for explicit user confirmation', category: 'constraint' },
    { text: 'Note applicable regulatory regimes (e.g. GDPR, CCPA, HIPAA) the document may need to satisfy', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'jurisdiction',
      description: 'Governing jurisdiction/venue (which state, country, or legal system applies) is unspecified',
      isResolved: (input) => /\b(jurisdiction|governing\s+law|state\s+of\s+\w+|venue|under\s+(?:u\.?s\.?|uk|eu|california|delaware|new\s+york)\s+law)\b/i.test(input),
    },
    {
      field: 'document type',
      description: 'The specific type of legal document needed (NDA, employment agreement, terms of service, lease, etc.) is unspecified',
      isResolved: (input) => /\b(nda|non-?disclosure|employment\s+agreement|lease|terms\s+of\s+(?:service|use)|privacy\s+policy|service\s+agreement|licensing\s+agreement|contract|settlement\s+agreement|power\s+of\s+attorney)\b/i.test(input),
    },
    {
      field: 'parties involved',
      description: 'The parties to the document (individuals, companies, roles/capacities) are unspecified',
      isResolved: (input) => /\b(part(?:y|ies)|between\s+\w+\s+and|counterparty|employer|employee|licensor|licensee|landlord|tenant)\b/i.test(input),
    },
    {
      field: 'review requirement',
      description: 'Whether the document is intended for actual execution (requiring licensed attorney review) or a draft/template/educational purpose is unspecified',
      isResolved: (input) => /\b(draft\s+only|template|educational|for\s+(?:review\s+by|my\s+)?(?:an\s+)?attorney|will\s+be\s+reviewed|not\s+for\s+execution)\b/i.test(input),
    },
    {
      field: 'liability allocation',
      description: 'How liability, indemnification, and risk are allocated between parties is unspecified',
      isResolved: (input) => /\b(liabilit\w*|indemnif\w*|limitation\s+of\s+liability|hold\s+harmless|risk\s+allocation)\b/i.test(input),
    },
    {
      field: 'regulatory scope',
      description: 'Applicable regulatory regime (data privacy, employment law, industry-specific compliance) is unspecified',
      isResolved: (input) => /\b(gdpr|ccpa|hipaa|regulatory|compliance|industry[- ]specific\s+regulation)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'intake and fact-gathering', dependsOn: [], note: 'Collect parties, jurisdiction, transaction facts, and objectives before drafting begins' },
    { component: 'document classification', dependsOn: ['intake and fact-gathering'], note: 'Determine document type/category (contract, policy, agreement, dispute filing) and applicable template family' },
    { component: 'clause library selection', dependsOn: ['document classification'], note: 'Select and assemble standard clauses (definitions, term, termination, indemnification, governing law) appropriate to the document type' },
    { component: 'party and defined-terms schedule', dependsOn: ['intake and fact-gathering'], note: 'Formal recitals, party identification block, and a consistent defined-terms schedule referenced throughout' },
    { component: 'risk allocation section', dependsOn: ['clause library selection'], note: 'Liability caps, indemnification, warranties/disclaimers, and force majeure provisions' },
    { component: 'compliance and regulatory annex', dependsOn: ['document classification'], note: 'Jurisdiction-specific regulatory language (e.g. GDPR data processing terms, state-specific employment disclosures)' },
    { component: 'execution and signature block', dependsOn: ['party and defined-terms schedule', 'risk allocation section'], note: 'Signature blocks, effective date, counterparts clause, and any notarization/witness requirements' },
    { component: 'attorney review checkpoint', dependsOn: ['execution and signature block', 'compliance and regulatory annex'], note: 'Mandatory human legal-counsel review gate before the document is executed or relied upon' },
    { component: 'version control and audit trail', dependsOn: ['document classification'], note: 'Track drafts, redlines, and approval history for accountability and future amendment reference' },
  ],
  technicalConsiderations: [
    { aspect: 'jurisdiction-specific drafting', note: 'Legal language, enforceability, and required disclosures vary materially by jurisdiction (state, country); confirm the governing jurisdiction before finalizing clause language', category: 'constraints' },
    { aspect: 'defined-terms consistency', note: 'Maintain a single defined-terms schedule and use capitalized defined terms consistently — inconsistent terminology is a common source of contract ambiguity and dispute', category: 'functionalRequirements' },
    { aspect: 'clause interdependency', note: 'Verify cross-references between clauses (e.g. indemnification referencing the liability cap section) remain accurate after any edit or reordering', category: 'functionalRequirements' },
    { aspect: 'version and amendment tracking', note: 'Maintain clear versioning and a changelog/redline history for any document subject to negotiation or repeated amendment', category: 'preferences' },
    { aspect: 'document format standards', note: 'Follow the target jurisdiction/institution\'s formatting conventions (numbered paragraphs, defined recitals, execution formalities) rather than an ad-hoc structure', category: 'preferences' },
    { aspect: 'template vs. bespoke drafting', note: 'Determine whether a standard template/clause library is sufficient or whether the transaction\'s complexity requires bespoke drafting by counsel', category: 'functionalRequirements' },
    { aspect: 'regulatory currency', note: 'Confirm cited statutes, regulations, or standard clauses (e.g. GDPR Article references, standard contractual clauses) reflect current law, since legal requirements change over time', category: 'constraints' },
    { aspect: 'accessibility of legal text', note: 'Where the document is consumer-facing (terms of service, privacy policy), balance legal precision with plain-language readability requirements some jurisdictions mandate', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'plain-language summaries', note: 'Provide a plain-language summary alongside dense legal text for consumer-facing documents (terms of service, privacy policy) to support genuine informed consent', category: 'preferences' },
    { aspect: 'clause navigability', note: 'Use a clear table of contents, numbered sections, and defined-term indexing so a long document is navigable rather than an undifferentiated wall of text', category: 'functionalRequirements' },
    { aspect: 'review and redline workflow', note: 'Support a clear redline/track-changes workflow for parties negotiating terms, so changes and their rationale are visible and attributable', category: 'preferences' },
    { aspect: 'signature and execution flow', note: 'Design an unambiguous, low-friction execution flow (e-signature fields, counterpart handling) so parties can complete signing without confusion', category: 'functionalRequirements' },
    { aspect: 'consent clarity', note: 'Present consent/opt-in mechanisms (e.g. data processing consent, arbitration opt-out) clearly and separately from bundled boilerplate acceptance', category: 'constraints' },
    { aspect: 'accessibility of disclosures', note: 'Ensure mandatory disclosures (cancellation rights, cooling-off periods, data rights) are prominent, not buried in dense fine print', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'not a substitute for legal advice', note: 'Any generated legal document or analysis must be explicitly flagged as not constituting legal advice and requiring review by a licensed attorney before reliance or execution', category: 'constraints' },
    { aspect: 'confidential information handling', note: 'Treat contract terms, party details, and case facts as confidential; avoid embedding sensitive personal or financial data in shareable drafts unless necessary', category: 'constraints' },
    { aspect: 'data privacy compliance', note: 'Where the document governs personal data handling, ensure it satisfies applicable regimes (GDPR, CCPA, HIPAA) rather than using generic boilerplate privacy language', category: 'constraints' },
    { aspect: 'unauthorized practice of law', note: 'Avoid presenting outputs in a way that could be construed as unauthorized practice of law; clearly scope outputs as drafting assistance, not legal representation', category: 'constraints' },
    { aspect: 'document authenticity and tamper-evidence', note: 'For executed documents, ensure signature/authentication mechanisms (e-signature audit trail, notarization) provide tamper-evidence appropriate to the document\'s stakes', category: 'functionalRequirements' },
    { aspect: 'privileged communication handling', note: 'Distinguish attorney-client privileged communications from general drafting work product, since the two have different confidentiality and disclosure protections', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'clarity over ornamentation', note: 'Legal drafting prioritizes precision and enforceability over stylistic flourish; avoid ambiguous or flowery language that could be construed multiple ways in a dispute', category: 'preferences' },
    { aspect: 'plain-language framing', note: 'Where the document faces consumers, favor plain-language framing and clear headings over dense legalese, without sacrificing legal precision', category: 'preferences' },
    { aspect: 'document presentation', note: 'Use consistent, professional formatting (numbering, typography, whitespace) so the document reads as authoritative and easy to reference', category: 'preferences' },
    { aspect: 'tone calibration', note: 'Calibrate tone to context — adversarial litigation correspondence, cooperative negotiation, and consumer-facing policy each call for a different register', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'internal consistency check', note: 'Check for contradictory clauses (e.g. conflicting termination notice periods stated in different sections) before the document is finalized', category: 'constraints' },
    { aspect: 'missing standard clauses', note: 'Verify the document includes clauses a document of this type customarily requires (governing law, severability, entire agreement, notices) even if not explicitly requested', category: 'functionalRequirements' },
    { aspect: 'defined-term coverage', note: 'Confirm every capitalized defined term is actually defined, and every definition is actually used, to avoid drafting errors that create ambiguity', category: 'functionalRequirements' },
    { aspect: 'jurisdiction/venue alignment', note: 'Verify the governing-law clause and venue/forum-selection clause are internally consistent and both explicitly stated', category: 'constraints' },
    { aspect: 'attorney-review disclaimer presence', note: 'Confirm the output carries a clear, unmissable "not legal advice, consult a licensed attorney" disclaimer before delivery', category: 'constraints' },
    { aspect: 'edge-case scenario testing', note: 'Test the document\'s language against edge cases: early termination, breach by either party, force majeure event, or a party becoming insolvent', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'AI-drafted document vs. immediate execution',
      note: 'Requesting a legal document be finalized and executed/signed immediately without attorney review is high-risk — AI-assisted drafting is not a substitute for licensed legal review before a document creates binding obligations.',
      category: 'constraints',
      triggerA: /\b(sign\s+(?:it\s+)?(?:today|now|immediately)|execute\s+(?:it\s+)?(?:today|now|immediately)|no\s+time\s+for\s+(?:attorney|lawyer)\s+review|skip\s+(?:attorney|legal)\s+review)\b/i,
      triggerB: /\b(contract|agreement|nda|legal\s+document|terms\s+of\s+service)\b/i,
    },
    {
      aspect: 'multi-jurisdiction conflict',
      note: 'Requesting a single document be simultaneously governed by two conflicting jurisdictions\' law is unworkable as stated — a document needs one governing-law clause, or explicit multi-jurisdiction structuring by counsel.',
      category: 'constraints',
      triggerA: /\bgoverning\s+law\s+(?:of|in)\s+\w+/i,
      triggerB: /\balso\s+governed\s+by|and\s+(?:also\s+)?under\s+\w+\s+law\b/i,
    },
    {
      aspect: 'no legal budget vs. complex multi-party deal',
      note: 'A "no budget for a lawyer" constraint alongside a complex, high-value, or multi-party transaction is high-risk — such transactions typically carry legal exposure that self-drafted documents cannot safely cover.',
      category: 'constraints',
      triggerA: /\b(no\s+budget\s+for\s+(?:a\s+)?lawyer|can'?t\s+afford\s+(?:a\s+)?(?:lawyer|attorney)|without\s+(?:a\s+)?lawyer)\b/i,
      triggerB: /\b(multi-?party|complex\s+transaction|merger|acquisition|joint\s+venture|large\s+sum|significant\s+liability)\b/i,
    },
  ],
};
