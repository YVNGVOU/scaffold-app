import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/roblox/index.ts (TASK-006).
// Keywords are chosen to differentiate from neighboring domains already in
// the registry: menu-design (food/drink menus), branding (logo/identity),
// graphic-design (general visual design), hospitality-travel (venue/hotel
// operations), recipe-cookbook / print-collateral (business cards, mailers).
// This domain is specifically about the invitation/stationery suite itself.
const KEYWORDS = [
  'wedding invitation', 'save the date', 'save-the-date', 'rsvp',
  'invitation suite', 'stationery suite', 'evite', 'party invitation',
  'birthday invitation', 'bridal shower invitation', 'baby shower invitation',
  'bar mitzvah invitation', 'bat mitzvah invitation', 'quinceanera invitation',
  'thank you card', 'thank-you card', 'wedding stationery', 'invite suite',
  'digital invitation', 'e-invite', 'e-invitation', 'guest list rsvp',
  'plus-one', 'plus one rsvp', 'reception card', 'ceremony card',
  'invitation wording', 'envelope liner', 'response card', 'formality level',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const eventInvitationsDomain: DomainModule = {
  id: 'event-invitations',
  label: 'Event Invitations / Stationery',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Specify event type and formality level (casual, semi-formal, black-tie) to guide wording and design tone', category: 'functional' },
    { text: 'Include a clear RSVP mechanism with a response deadline', category: 'functional' },
    { text: 'Confirm whether the deliverable is print, digital (e.g. Evite-style), or both', category: 'functional' },
    { text: 'Design should support a matching suite (invitation, save-the-date, thank-you card) with a consistent visual identity', category: 'preference' },
    { text: 'Account for guest list variability (plus-ones, children, dietary restrictions) in the RSVP fields', category: 'constraint' },
    { text: 'Include accessible, unambiguous event logistics: date, time, venue address, dress code', category: 'functional' },
  ],
  ambiguityChecklist: [
    {
      field: 'event type and formality',
      description: 'Type of event (wedding, birthday, corporate, baby/bridal shower) and formality level is unspecified',
      isResolved: (input) => /\b(wedding|birthday|quinceanera|bar\s*mitzvah|bat\s*mitzvah|corporate\s+event|bridal\s+shower|baby\s+shower|anniversary|gala|graduation)\b/i.test(input),
    },
    {
      field: 'rsvp mechanism',
      description: 'How guests are expected to RSVP (mail-back card, phone, QR code, online form) is unspecified',
      isResolved: (input) => /\b(rsvp|response\s+card|qr\s+code|online\s+form|rsvp\s+link)\b/i.test(input),
    },
    {
      field: 'print vs digital delivery',
      description: 'Whether the invitation is printed and mailed, sent digitally (Evite-style), or both is unspecified',
      isResolved: (input) => /\b(print(?:ed)?|mail(?:ed)?|digital|e-?invite|e-?invitation|evite|text\s+invit\w*|email\s+invit\w*)\b/i.test(input),
    },
    {
      field: 'matching suite scope',
      description: 'Whether a full matching suite (save-the-date, invitation, RSVP card, thank-you card) or a single piece is needed is unspecified',
      isResolved: (input) => /\b(save[- ]the[- ]date|thank[- ]you\s+card|suite|matching\s+set|full\s+set)\b/i.test(input),
    },
    {
      field: 'guest count and list management',
      description: 'Approximate guest count and how plus-ones/children/dietary needs are tracked is unspecified',
      isResolved: (input) => /\b(\d+\s*guests?|guest\s*list|plus[- ]?one|dietary\s+restrict\w*|headcount)\b/i.test(input),
    },
    {
      field: 'timeline and mailing deadline',
      description: 'Lead time before the event and mailing/response deadlines are unspecified',
      isResolved: (input) => /\b(\d+\s*(weeks?|months?)\s+(before|ahead|out)|mailing\s+deadline|response\s+deadline|by\s+[A-Z][a-z]+\s+\d)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'save-the-date piece', dependsOn: [], note: 'Early-notice card or digital send, mailed/sent well ahead of the formal invitation' },
    { component: 'formal invitation card', dependsOn: ['save-the-date piece'], note: 'Primary invite with event details, wording tone matched to formality level' },
    { component: 'RSVP/response mechanism', dependsOn: ['formal invitation card'], note: 'Mail-back response card with stamped envelope, or a digital RSVP form/QR code with a deadline' },
    { component: 'envelope and addressing system', dependsOn: ['formal invitation card'], note: 'Outer/inner envelope design, liner, and guest addressing (calligraphy or printed) for mailed pieces' },
    { component: 'day-of ancillary stationery', dependsOn: ['formal invitation card'], note: 'Programs, place cards, menu cards, signage that extend the same visual identity to the event itself' },
    { component: 'thank-you card', dependsOn: ['formal invitation card'], note: 'Post-event card matching the suite\'s visual identity, often paired with a photo insert' },
    { component: 'digital invitation platform integration', dependsOn: [], note: 'If digital, integration with an Evite-style platform or custom RSVP microsite handling guest tracking' },
    { component: 'print production spec', dependsOn: ['formal invitation card'], note: 'Paper stock, printing method (letterpress, foil, digital), and print vendor handoff spec for physical pieces' },
    { component: 'guest list and tracking system', dependsOn: ['RSVP/response mechanism'], note: 'Spreadsheet or platform tracking invited guests, RSVP status, meal choices, and plus-ones' },
  ],
  technicalConsiderations: [
    { aspect: 'print vs digital production path', note: 'Print pieces require bleed/trim setup, paper stock selection, and a commercial printer handoff; digital pieces require responsive layout for mobile email/SMS rendering', category: 'functionalRequirements' },
    { aspect: 'mail-back RSVP mechanics', note: 'Physical response cards need a pre-addressed, pre-stamped return envelope sized to standard mail dimensions to avoid postage/delivery issues', category: 'constraints' },
    { aspect: 'guest list data management', note: 'Centralize guest names, addresses, RSVP status, and dietary/plus-one data in one source of truth to avoid mismatched mailing and headcount errors', category: 'functionalRequirements' },
    { aspect: 'digital RSVP platform choice', note: 'Evite-style platforms trade convenience for tracking/analytics; a custom RSVP form/microsite offers more branding control but more build effort', category: 'preferences' },
    { aspect: 'variable data printing', note: 'If addressing/personalizing each piece individually (guest names, table numbers), plan for variable data printing or mail-merge rather than manual per-piece editing', category: 'functionalRequirements' },
    { aspect: 'proofing and print deadlines', note: 'Build in a proofing round before the full print run, and back-calculate the mailing deadline from postal transit time plus RSVP response window', category: 'constraints' },
    { aspect: 'file format handoff', note: 'Deliver print-ready files (PDF with bleed/crop marks, CMYK color) to the print vendor, separate from RGB digital-send assets', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'wording clarity', note: 'Event details (date, time, venue, dress code) must be unambiguous and scannable at a glance, especially for guests unfamiliar with the venue', category: 'functionalRequirements' },
    { aspect: 'RSVP friction', note: 'Minimize the steps needed to RSVP — a single-tap digital link or a pre-filled, pre-stamped mail-back card outperforms multi-step forms', category: 'preferences' },
    { aspect: 'formality signaling through design', note: 'Typography, paper weight, and color choices should visually signal the event\'s formality level so guests dress/behave appropriately', category: 'preferences' },
    { aspect: 'accessibility of information hierarchy', note: 'Prioritize date/time/location as the most visually prominent elements; secondary details (registry, hashtag, dress code) should not compete for attention', category: 'functionalRequirements' },
    { aspect: 'multi-generational readability', note: 'Choose legible type sizes and high-contrast color pairings since invitation lists often span a wide age range, including older relatives', category: 'preferences' },
    { aspect: 'plus-one and children clarity', note: 'Make explicit on the invitation/RSVP whether plus-ones and children are included, to avoid awkward guest-count disputes', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'guest address/PII handling', note: 'Mailing addresses, phone numbers, and RSVP data are personal information; avoid exposing the full guest list publicly (e.g. an unauthenticated shared spreadsheet link)', category: 'constraints' },
    { aspect: 'digital RSVP link exposure', note: 'Avoid predictable/sequential RSVP links or codes that would let an uninvited person guess another guest\'s RSVP page and view/edit their response', category: 'constraints' },
    { aspect: 'public event detail exposure', note: 'Posting a home address or exact venue on a fully public digital invite/social post can expose attendees to unwanted visitors; consider a private link or registration gate', category: 'constraints' },
    { aspect: 'gift registry link trust', note: 'Only link to registries hosted on reputable, known platforms — third-party or unfamiliar registry links can be used for phishing against guests', category: 'constraints' },
    { aspect: 'RSVP data retention', note: 'Define how long guest RSVP/dietary/address data is retained after the event and how it is disposed of or handed off to the couple/host', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual identity consistency', note: 'Establish one cohesive palette, typography, and motif system that carries across save-the-date, invitation, RSVP card, and thank-you card', category: 'preferences' },
    { aspect: 'formality-appropriate typography', note: 'Match type choice to formality: formal script/serif for black-tie weddings, playful sans/hand-lettered for casual parties', category: 'preferences' },
    { aspect: 'paper and finish selection', note: 'Consider paper stock, texture, and finishing (letterpress, foil stamping, deckled edge) as part of the design language, not an afterthought', category: 'preferences' },
    { aspect: 'cultural and religious motifs', note: 'For culturally or religiously specific events (quinceañera, bar/bat mitzvah), incorporate appropriate traditional motifs and wording conventions respectfully and accurately', category: 'preferences' },
    { aspect: 'photography integration', note: 'If engagement/event photos are used (save-the-date, thank-you card), design the layout to frame photography as a focal point rather than a cramped afterthought', category: 'preferences' },
    { aspect: 'envelope and unboxing experience', note: 'Treat envelope liners, wax seals, and ribbon as part of the first-impression design, particularly for higher-formality suites', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'proofreading event details', note: 'Triple-check date, day-of-week consistency, time zone, venue name/address, and names for typos before any print run or send — these are the highest-cost errors in this domain', category: 'constraints' },
    { aspect: 'RSVP deadline math', note: 'Verify the RSVP deadline leaves enough buffer before the event for headcount-dependent vendors (caterer, venue) to receive final numbers', category: 'functionalRequirements' },
    { aspect: 'address list accuracy', note: 'Validate the mailing list for duplicate entries, missing apartment/unit numbers, and correct postage for international or oversized envelopes', category: 'functionalRequirements' },
    { aspect: 'print proof review', note: 'Review a physical print proof (not just a screen preview) for color accuracy and paper feel before committing to the full print run', category: 'preferences' },
    { aspect: 'digital rendering across clients', note: 'Test digital invitations across major email clients and phone screens for broken layouts, since guests self-select their platform', category: 'functionalRequirements' },
    { aspect: 'link/QR code testing', note: 'Test every RSVP link and QR code on both mobile and desktop before mailing/sending, since a broken link cannot be corrected after physical distribution', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'compressed timeline vs full print production',
      note: 'A very short delivery timeline combined with a full letterpress/foil print run and postal mailing is infeasible — custom print production and mail transit realistically need weeks, not days.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap|need it today)\b/i,
      triggerB: /\b(letterpress|foil\s+stamp\w*|print\s+run|mail(?:ed|ing)?\s+(?:out|invitations))\b/i,
    },
    {
      aspect: 'no budget vs premium print finishes',
      note: 'A stated low/no budget alongside premium finishes (letterpress, foil stamping, custom calligraphy addressing) is a high-risk scope mismatch — those finishes carry significant per-unit cost.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|low\s+budget|cheap(?:est)?|budget[- ]friendly)\b/i,
      triggerB: /\b(letterpress|foil\s+stamp\w*|custom\s+calligraphy|hand[- ]?lettered\s+addressing)\b/i,
    },
    {
      aspect: 'fully public digital invite vs guest privacy',
      note: 'Requesting a fully public/shareable digital invitation while also wanting RSVP guest data and venue details kept private is contradictory — a public link is inherently forwardable and indexable.',
      category: 'constraints',
      triggerA: /\b(public|shareable|post\s+(?:it\s+)?on\s+social|open\s+link)\b/i,
      triggerB: /\b(private\s+guest\s+list|keep\s+(?:the\s+)?address\s+private|confidential\s+rsvp)\b/i,
    },
  ],
};
