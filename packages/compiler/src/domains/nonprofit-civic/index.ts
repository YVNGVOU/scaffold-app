import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. A bare keyword like 'grant' would match inside
// unrelated words (e.g. "grantee" is fine, but "grandma" or "migrant" could
// falsely trigger a plain substring check) — word-boundary regex avoids that
// class of bug entirely.
const KEYWORDS = [
  'nonprofit', 'non-profit', '501c3', '501(c)(3)', 'donor management',
  'donor database', 'donation platform', 'volunteer management',
  'volunteer portal', 'fundraising campaign', 'fundraiser', 'grant management',
  'grant application', 'civic tech', 'government portal', 'public sector',
  'gov.uk', 'e-government', 'egovernment', 'accessibility compliance',
  'wcag', 'section 508', 'ada compliance', 'procurement process',
  'rfp process', 'public records', 'foia', 'constituent services',
  'ngo', 'charity platform', 'membership dues', 'crm for nonprofits',
  'in-kind donation', 'recurring donation', 'tax-deductible receipt',
  'board of directors portal', 'peer-to-peer fundraising', 'matching gift',
  'capital campaign', 'advocacy campaign', 'civic engagement platform',
  'public comment portal', 'town hall platform', 'open data portal',
  'case management system', 'beneficiary tracking', 'form 990',
  'giving tuesday', 'planned giving', 'endowment fund', 'ballot measure',
  'legislative tracking', 'constituent relationship management',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const nonprofitCivicDomain: DomainModule = {
  id: 'nonprofit-civic',
  label: 'Nonprofit / Civic Tech',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Meet WCAG 2.1 AA accessibility standards across all public-facing pages', category: 'constraint' },
    { text: 'Provide donor/volunteer data export in a portable, non-proprietary format', category: 'functional' },
    { text: 'Support recurring and one-time donation/contribution workflows with tax-receipt generation', category: 'functional' },
    { text: 'Maintain an audit trail for financial transactions and record changes (donations, grants, disbursements)', category: 'constraint' },
    { text: 'Define data retention and public-records disclosure policy for any government-adjacent data', category: 'constraint' },
    { text: 'Support role-based access for staff, board members, and volunteers with differing permission levels', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'organization type',
      description: 'Whether this is a registered nonprofit (501(c)(3)), government agency, or civic-tech project with different compliance obligations is unspecified',
      isResolved: (input) => /\b(501c3|501\(c\)\(3\)|nonprofit|non-profit|ngo|government agency|municipal|city government|county|federal agency|civic tech)\b/i.test(input),
    },
    {
      field: 'donation frequency model',
      description: 'Whether the platform must primarily support one-time gifts, recurring/subscription giving, or both is unspecified',
      isResolved: (input) => /\b(one-?time|recurring|subscription giving|monthly (?:giving|donor)|sustaining donor)\b/i.test(input),
    },
    {
      field: 'payment processor',
      description: 'Which donation/payment processor (Stripe, PayPal Giving Fund, Classy, GiveLively) and its associated fee structure is unspecified',
      isResolved: (input) => /\b(stripe|paypal|classy|givelively|give lively|square|donorbox|payment processor)\b/i.test(input),
    },
    {
      field: 'reporting cadence',
      description: 'How often board/grant financial reports must be generated (monthly, quarterly, annually, ad hoc) is unspecified',
      isResolved: (input) => /\b(monthly|quarterly|annually|annual report|ad hoc reporting|real-time reporting)\b/i.test(input),
    },
    {
      field: 'accessibility standard',
      description: 'The specific accessibility conformance level required (WCAG 2.1 AA, Section 508, ADA Title II/III) is unspecified',
      isResolved: (input) => /\b(wcag|section\s*508|ada\s+compliance|ada\s+title|accessibility\s+(standard|conformance|audit))\b/i.test(input),
    },
    {
      field: 'data sensitivity',
      description: 'Whether donor/constituent PII, financial data, or protected records (e.g. beneficiary case data) requiring special handling is present is unspecified',
      isResolved: (input) => /\b(pii|personally identifiable|sensitive data|confidential records|beneficiary data|case management)\b/i.test(input),
    },
    {
      field: 'procurement pathway',
      description: 'Whether the project must go through a formal public-sector procurement/RFP process with vendor requirements is unspecified',
      isResolved: (input) => /\b(rfp|procurement|vendor requirement|competitive bid|purchasing process|sole source)\b/i.test(input),
    },
    {
      field: 'scale and reach',
      description: 'Expected number of donors/volunteers/constituents served, which affects architecture and compliance scope, is unspecified',
      isResolved: (input) => /\b(\d+[,\d]*\s*(donors?|volunteers?|constituents?|members?|users?)|statewide|nationwide|county-?wide|city-?wide)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'donor/constituent database (CRM)', dependsOn: [], note: 'Central record store for donor, volunteer, or constituent profiles, interaction history, and consent/opt-in status' },
    { component: 'donation/payment processing layer', dependsOn: ['donor/constituent database (CRM)'], note: 'PCI-compliant integration with a payment processor for one-time and recurring gifts, with webhook-driven reconciliation' },
    { component: 'volunteer management module', dependsOn: ['donor/constituent database (CRM)'], note: 'Shift scheduling, hour tracking, background-check status, and volunteer-to-opportunity matching' },
    { component: 'grant/fund tracking system', dependsOn: ['donor/constituent database (CRM)'], note: 'Tracks restricted vs. unrestricted funds, grant milestones/reporting deadlines, and disbursement approvals' },
    { component: 'accessibility-compliant public frontend', dependsOn: [], note: 'WCAG 2.1 AA-conformant donation/information pages tested with screen readers and keyboard-only navigation' },
    { component: 'reporting and compliance dashboard', dependsOn: ['donor/constituent database (CRM)', 'grant/fund tracking system'], note: 'Generates IRS Form 990 supporting data, grant reports, and board financial summaries' },
    { component: 'communications/email module', dependsOn: ['donor/constituent database (CRM)'], note: 'CAN-SPAM/TCPA-compliant email and SMS outreach with unsubscribe and consent tracking' },
    { component: 'role-based admin panel', dependsOn: ['donor/constituent database (CRM)'], note: 'Staff, board, and volunteer access tiers with least-privilege permissions on sensitive donor/financial data' },
    { component: 'audit logging layer', dependsOn: ['donation/payment processing layer', 'grant/fund tracking system'], note: 'Immutable log of financial transactions and record changes for annual audit and public-records requests' },
    { component: 'public records / FOIA response tooling', dependsOn: ['audit logging layer'], note: 'For government-adjacent deployments, structured retrieval workflow for public-records/FOIA requests' },
  ],
  technicalConsiderations: [
    { aspect: 'CRM/database selection', note: 'Choose or integrate with a nonprofit-appropriate CRM (Salesforce Nonprofit Cloud, Bloomerang, Little Green Light) rather than building donor management from scratch unless justified', category: 'functionalRequirements' },
    { aspect: 'payment processor fees', note: 'Account for processor fee structure (Stripe standard rates vs. discounted nonprofit rates via PayPal Giving Fund/Stripe nonprofit program) in the funding model', category: 'constraints' },
    { aspect: 'recurring donation handling', note: 'Implement robust recurring-payment retry/dunning logic (failed card, expired card) so lapsed recurring donors are recovered rather than silently dropped', category: 'functionalRequirements' },
    { aspect: 'data migration from legacy systems', note: 'Plan for import/migration from existing spreadsheets or legacy donor databases (common in under-resourced organizations) with data-cleaning and deduplication steps', category: 'constraints' },
    { aspect: 'integration with government systems', note: 'For civic-tech/government-adjacent builds, confirm required integrations (e.g. state benefits systems, 311 systems, GIS/parcel data) and their API stability/versioning', category: 'functionalRequirements' },
    { aspect: 'low-bandwidth/legacy device support', note: 'Design for constituents and volunteers on older devices or slow connections, since public-facing civic/nonprofit tools often serve underserved populations', category: 'constraints' },
    { aspect: 'multi-language support', note: 'Support internationalization/localization for constituent-facing content when serving linguistically diverse communities, a common requirement in civic tech', category: 'preferences' },
    { aspect: 'reporting export formats', note: 'Support standard export formats (CSV, PDF, IRS Form 990 schedules) needed for board reporting, grant reporting, and annual audits', category: 'functionalRequirements' },
    { aspect: 'matching-gift lookup', note: 'If offering matching-gift discovery, integrate with a matching-gift database (Double the Donation, Millie) rather than relying on donors to self-report their employer, since self-reported match rates are very low', category: 'functionalRequirements' },
    { aspect: 'peer-to-peer fundraising infrastructure', note: 'If supporting peer-to-peer campaigns (walk/run-a-thons, birthday fundraisers), design a distinct sub-page/team-page data model tied back to the parent campaign so team totals and individual attribution both reconcile correctly', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'donation flow friction', note: 'Minimize steps in the donation checkout flow (guest checkout, saved payment methods, one-click recurring upgrade) since donor drop-off correlates strongly with form length', category: 'functionalRequirements' },
    { aspect: 'accessibility-first design', note: 'Design for screen readers, keyboard-only navigation, and sufficient color contrast from the start, not retrofitted — required for both ADA/Section 508 compliance and serving disabled constituents', category: 'constraints' },
    { aspect: 'plain-language content', note: 'Write constituent-facing content at a plain-language reading level, following civic-tech plain-language guidelines, given the wide range of literacy and digital fluency among users', category: 'preferences' },
    { aspect: 'volunteer signup simplicity', note: 'Reduce volunteer signup friction (minimal required fields, clear shift/opportunity descriptions) since complex forms are a common cause of volunteer drop-off', category: 'functionalRequirements' },
    { aspect: 'trust signals', note: 'Surface transparency/trust signals (org registration status, financial transparency badges like Charity Navigator/GuideStar ratings) near donation calls-to-action to build donor confidence', category: 'preferences' },
    { aspect: 'mobile-first constituent access', note: 'Design public-facing pages mobile-first, since many constituents and donors primarily access civic/nonprofit services via phone', category: 'functionalRequirements' },
    { aspect: 'error recovery in forms', note: 'Provide clear, specific inline error messages on donation and application forms rather than generic failures, since a failed transaction may discourage a donor from retrying', category: 'preferences' },
    { aspect: 'public-comment submission UX', note: 'For civic public-comment or town-hall tools, design a clear submission confirmation and status tracker (received, under review, responded) so constituents trust their input was actually recorded, not lost', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'PCI DSS compliance', note: 'Never store raw payment card data directly; use a PCI-compliant processor\'s tokenization/hosted-fields approach to keep the organization out of PCI DSS scope where possible', category: 'constraints' },
    { aspect: 'donor PII protection', note: 'Encrypt donor/constituent PII at rest and in transit, and restrict access to financial/PII fields to roles that genuinely need it (least privilege)', category: 'constraints' },
    { aspect: 'public records vs. privacy tension', note: 'For government-adjacent systems, explicitly define which fields are subject to public-records/FOIA disclosure vs. which are protected (e.g. beneficiary case data, minors\' information)', category: 'constraints' },
    { aspect: 'consent and opt-in tracking', note: 'Track explicit consent timestamps for email/SMS communications to comply with CAN-SPAM, TCPA, and donor-privacy expectations, and honor opt-out requests immediately', category: 'functionalRequirements' },
    { aspect: 'volunteer background-check data', note: 'If tracking background-check results for volunteers (especially those working with minors/vulnerable populations), store only the pass/fail status needed, not raw report details, unless legally required', category: 'constraints' },
    { aspect: 'account takeover protection', note: 'Protect donor and staff accounts (MFA for staff/admin accounts, especially those with financial or PII access) given the high value of donor databases to attackers', category: 'constraints' },
    { aspect: 'third-party integration scope', note: 'Limit data shared with third-party fundraising tools/marketing platforms to the minimum necessary, and confirm their own compliance posture (SOC 2, PCI) before integrating', category: 'constraints' },
    { aspect: 'anonymous public-comment identity protection', note: 'If public-comment or advocacy tools allow anonymous or pseudonymous submissions, ensure server logs, IP addresses, and metadata cannot be trivially cross-referenced to re-identify submitters, especially on politically sensitive topics', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'mission-driven visual identity', note: 'Ground the visual direction in the organization\'s mission and cause area rather than generic corporate templates, so the brand reads as authentic to the cause', category: 'preferences' },
    { aspect: 'emotional storytelling', note: 'Use authentic imagery and storytelling (beneficiary stories, impact photos, with appropriate consent) to drive donor emotional connection without resorting to exploitative "poverty porn" framing', category: 'preferences' },
    { aspect: 'impact visualization', note: 'Visualize impact metrics (funds raised, people served, outcomes) clearly and honestly, since donors and grant reviewers weigh demonstrated impact heavily', category: 'functionalRequirements' },
    { aspect: 'government/civic visual restraint', note: 'For government-adjacent civic-tech products, favor a restrained, official, trustworthy visual language over playful branding, consistent with public-sector design systems (e.g. U.S. Web Design System)', category: 'constraints' },
    { aspect: 'brand consistency across channels', note: 'Keep visual identity consistent across the website, email campaigns, and print/event materials so the organization is recognizable across touchpoints', category: 'preferences' },
    { aspect: 'inclusive imagery', note: 'Ensure imagery and representation reflect the actual diversity of the communities served, avoiding tokenism or stereotype', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'accessibility audit', note: 'Run automated (axe, Lighthouse) and manual screen-reader/keyboard-only testing against WCAG 2.1 AA before any public-facing release', category: 'constraints' },
    { aspect: 'donation flow testing', note: 'Test the full donation flow including failed payments, expired cards, refunds, and recurring-donation cancellation to ensure no donor is silently double-charged or left in a broken state', category: 'functionalRequirements' },
    { aspect: 'tax-receipt accuracy', note: 'Verify tax-deductible receipt generation matches actual donation amounts, dates, and organizational EIN/registration details exactly, since incorrect receipts create legal exposure for donors and the org', category: 'functionalRequirements' },
    { aspect: 'data reconciliation testing', note: 'Test that payment-processor records reconcile exactly with internal donor-database records after webhooks, retries, and partial failures', category: 'constraints' },
    { aspect: 'permission boundary testing', note: 'Verify role-based access controls actually prevent lower-privilege roles (volunteers, junior staff) from viewing/exporting sensitive donor financial data', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "fully anonymous donations" alongside "personalized tax receipts requiring donor identity")', category: 'constraints' },
    { aspect: 'load testing for giving events', note: 'Load-test donation infrastructure ahead of high-traffic giving events (Giving Tuesday, year-end matching campaigns) where traffic spikes far above baseline', category: 'preferences' },
    { aspect: 'peer-to-peer attribution testing', note: 'Verify that donations made through a peer-to-peer fundraiser or team page correctly attribute to both the individual fundraiser and the parent campaign total, with no double-counting or dropped records', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no budget vs custom CRM build',
      note: 'A minimal/volunteer-run budget stated alongside a request for a fully custom-built donor CRM/database is a known-infeasible combination — nonprofits with limited budgets are typically better served by configuring an existing nonprofit CRM (Salesforce NPSP, Bloomerang) than building one from scratch.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|volunteer-run|all-volunteer)\s+budget\b/i,
      triggerB: /\b(custom[- ]built|from scratch)\s+(crm|donor database|donor management system)\b/i,
    },
    {
      aspect: 'anonymous donations vs tax receipts',
      note: 'Requiring fully anonymous donations while also requiring personalized tax-deductible receipts is contradictory as stated — a legally valid tax receipt must be tied to an identifiable donor.',
      category: 'constraints',
      triggerA: /\b(anonymous|fully anonymous)\s+donations?\b/i,
      triggerB: /\b(tax[- ]deductible|tax\s+receipt)s?\b/i,
    },
    {
      aspect: 'short timeline vs formal procurement',
      note: 'An extremely short delivery timeline alongside a formal public-sector procurement/RFP process is high-risk — competitive bidding, vendor vetting, and compliance review typically take months regardless of technical build speed.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|asap|next week)\b/i,
      triggerB: /\b(rfp|procurement process|competitive bid|formal bidding)\b/i,
    },
    {
      aspect: 'anonymous public comment vs re-identification-proof',
      note: 'Requiring fully anonymous public-comment submissions while also requiring per-submitter status tracking (received/under review/responded) is in tension — a tracker that lets a submitter check their own status needs some persistent identifier, which undercuts true anonymity unless a separate token/receipt scheme is designed.',
      category: 'constraints',
      triggerA: /\b(anonymous|pseudonymous)\s+(public\s+)?comment/i,
      triggerB: /\bstatus\s+track(?:er|ing)\b/i,
    },
  ],
};
