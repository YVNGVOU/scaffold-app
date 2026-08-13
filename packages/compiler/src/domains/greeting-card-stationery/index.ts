import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/roblox/index.ts (TASK-006).
// Keywords are chosen to differentiate from neighboring domains already in
// the registry: event-invitations (event RSVP suites: weddings, showers,
// save-the-dates), menu-design (food/drink menus), branding (logo/identity
// systems), graphic-design (general visual design), recipe-cookbook, and
// print-collateral (business cards/flyers/brochures for commercial use).
// This domain is specifically personal greeting cards, custom stationery,
// and personal letterhead — not tied to a single scheduled event's RSVP flow.
const KEYWORDS = [
  'greeting card', 'greeting cards', 'holiday card', 'holiday cards',
  'christmas card', 'birthday card', 'sympathy card', 'get well card',
  'thinking of you card', 'anniversary card', 'congratulations card',
  'personal stationery', 'custom stationery', 'letterhead', 'notecard',
  'notecards', 'note card', 'personalized card', 'card front', 'card insert',
  'greeting card line', 'card verse', 'monogram stationery',
  'personal letterhead', 'folded card', 'flat card', 'card stock design',
  'card message', 'occasion card', 'a2 card', 'a7 card',
  'bifold card', 'custom greeting cards', 'card verse writing',
  'return address stationery', 'personal letterhead design',
  'engraved stationery', 'letterpress card', 'foil stamped card',
  'diy card template', 'printable greeting card', 'seasonal card line',
  'new years card', 'valentines card', 'mothers day card',
  'fathers day card', 'graduation card', 'baby shower card',
  'condolence card', 'retirement card',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const greetingCardStationeryDomain: DomainModule = {
  id: 'greeting-card-stationery',
  label: 'Greeting Card / Personal Stationery',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Specify occasion and desired tone (e.g. heartfelt, humorous, formal) to guide wording and visual style', category: 'functional' },
    { text: 'Confirm print quantity: one-off/single card versus a batch print run for a card line', category: 'functional' },
    { text: 'Provide print-ready files at correct trim size with bleed for the chosen card format (flat, folded, panel)', category: 'constraint' },
    { text: 'Include space for a personalized message or insert where applicable', category: 'functional' },
    { text: 'Confirm paper stock/finish (matte, textured, uncoated) appropriate to the occasion', category: 'preference' },
    { text: 'Ensure envelope size and color are specified and compatible with the finished card dimensions', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'occasion/tone',
      description: 'The occasion and emotional tone (celebratory, sympathetic, humorous, formal) are unspecified',
      isResolved: (input) => /\b(birthday|holiday|christmas|sympathy|get well|congratulations|anniversary|thank you|wedding|new baby|thinking of you|occasion|tone|humorous|heartfelt|formal|whimsical)\b/i.test(input),
    },
    {
      field: 'print quantity',
      description: 'Whether this is a one-off personal card or a batch print run for retail/business distribution is unspecified',
      isResolved: (input) => /\b(one[- ]?off|single card|batch|print run|\d+\s*(cards|copies|units)|retail line|wholesale)\b/i.test(input),
    },
    {
      field: 'personalization elements',
      description: 'What is personalized (recipient name, custom photo, handwritten-style message, monogram) is unspecified',
      isResolved: (input) => /\b(personaliz\w*|custom(?:ized)? (?:name|photo|message)|monogram|recipient name|handwritten)\b/i.test(input),
    },
    {
      field: 'card format',
      description: 'Card format (flat, folded/bifold, panel, pop-up) is unspecified',
      isResolved: (input) => /\b(flat card|folded card|bifold|tri-?fold|panel card|pop-?up card|a2 card|a7 card)\b/i.test(input),
    },
    {
      field: 'envelope specification',
      description: 'Envelope size, color, or liner is unspecified',
      isResolved: (input) => /\b(envelope|liner)\b/i.test(input),
    },
    {
      field: 'distribution channel',
      description: 'How the finished cards will be distributed (mailed individually, sold in retail/online shop, handed out) is unspecified',
      isResolved: (input) => /\b(mail\w*|retail|online shop|etsy|storefront|hand(ed)? out|distribut\w*)\b/i.test(input),
    },
    {
      field: 'finishing technique',
      description: 'Whether any specialty finishing (foil stamping, letterpress, embossing, die-cutting) is wanted or the card should stay standard digital print is unspecified',
      isResolved: (input) => /\b(foil stamp\w*|letterpress|emboss\w*|die-?cut\w*|standard print|digital print|no special finish\w*)\b/i.test(input),
    },
    {
      field: 'budget tier',
      description: 'The budget tier (economy digital print vs premium/specialty production) is unspecified',
      isResolved: (input) => /\b(budget|low[- ]cost|premium|high[- ]end|affordable|cheap|price point|per[- ]card cost)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'concept and occasion brief', dependsOn: [], note: 'Occasion, tone, target recipient, and sentiment the card needs to convey' },
    { component: 'card copy/verse', dependsOn: ['concept and occasion brief'], note: 'Interior/exterior wording, greeting verse, and any personalization placeholders' },
    { component: 'visual design (front panel)', dependsOn: ['concept and occasion brief'], note: 'Illustration, photography, or typographic treatment for the card face' },
    { component: 'layout and fold structure', dependsOn: ['visual design (front panel)'], note: 'Flat vs folded/bifold/panel layout, page order, and trim/bleed setup' },
    { component: 'personalization system', dependsOn: ['card copy/verse'], note: 'Mechanism for inserting recipient name, custom photo, or variable text if the card is templated for reuse' },
    { component: 'print production spec', dependsOn: ['layout and fold structure'], note: 'Paper stock, finish, trim size, bleed/CMYK setup, and print-ready file package' },
    { component: 'envelope pairing', dependsOn: ['print production spec'], note: 'Envelope size/color selection matched to the finished card dimensions' },
    { component: 'proof and approval step', dependsOn: ['print production spec', 'envelope pairing'], note: 'Digital or physical proof review before committing to a print run' },
    { component: 'distribution/fulfillment plan', dependsOn: ['proof and approval step'], note: 'Individual mailing, retail packaging, or direct handout logistics for the finished cards' },
  ],
  technicalConsiderations: [
    { aspect: 'trim size and bleed', note: 'Set up print files at standard card trim sizes (e.g. A2, A7, 5x7) with proper bleed and safe margins so no content is cut off', category: 'constraints' },
    { aspect: 'fold structure setup', note: 'Design folded/bifold cards with correct panel widths and fold-line placement so interior content aligns after folding', category: 'functionalRequirements' },
    { aspect: 'color mode', note: 'Convert artwork to CMYK for print production; RGB files will shift color when printed', category: 'constraints' },
    { aspect: 'paper stock and finish', note: 'Specify weight (e.g. 100lb-130lb cardstock) and finish (matte, uncoated, textured) appropriate to the occasion and budget', category: 'functionalRequirements' },
    { aspect: 'personalization/variable data', note: 'If producing a batch with per-recipient personalization, plan a variable-data print (VDP) or mail-merge workflow rather than manually editing each file', category: 'functionalRequirements' },
    { aspect: 'envelope compatibility', note: 'Confirm envelope inner dimensions accommodate the finished card size plus insertion clearance', category: 'constraints' },
    { aspect: 'print vendor selection', note: 'Choose a print vendor appropriate to quantity: short-run digital press for small batches, offset for large runs, or a print-on-demand service for one-off orders', category: 'preferences' },
    { aspect: 'file delivery format', note: 'Deliver print-ready PDF/X or vendor-specified file format alongside an editable source file', category: 'preferences' },
    { aspect: 'die-line for die-cut shapes', note: 'If the card uses a non-rectangular die-cut shape, supply a separate spot-color die-line layer marking the exact cut path, distinct from the printed artwork', category: 'functionalRequirements' },
    { aspect: 'foil/emboss registration', note: 'For foil stamping or embossing, create a dedicated registration layer aligned to the foil die and confirm minimum stroke width the foil press can hold', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'sentiment clarity', note: 'Ensure the visual and written tone reads clearly as the intended sentiment (celebratory vs sympathetic) at a glance', category: 'functionalRequirements' },
    { aspect: 'legible message space', note: 'Leave adequate blank interior space for a handwritten personal message, sized appropriately to the card format', category: 'preferences' },
    { aspect: 'reading order on fold', note: 'Design folded cards so the reader\'s natural fold-opening sequence matches the intended reveal of front, interior, and back content', category: 'functionalRequirements' },
    { aspect: 'recipient-first design', note: 'Keep the design accessible to the actual recipient audience (e.g. avoid overly small type on a card intended for an older relative)', category: 'preferences' },
    { aspect: 'consistent line identity', note: 'If designing a card line (multiple occasions), keep a consistent visual system so cards read as one cohesive collection', category: 'preferences' },
    { aspect: 'sympathy/grief-sensitive tone', note: 'For sympathy or condolence cards, avoid overly bright colors, exclamation points, or celebratory iconography that reads as tone-deaf to grief', category: 'functionalRequirements' },
    { aspect: 'insert vs pre-printed message balance', note: 'Decide up front whether the interior carries a pre-printed verse, stays blank for a handwritten note, or splits the space between both, since this changes layout and copy needs', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'recipient personal data handling', note: 'Handle recipient names, addresses, and photos used for personalization carefully; do not expose mailing lists or personal photos in shared proof links', category: 'constraints' },
    { aspect: 'proof link access', note: 'Restrict access to digital proofs containing personal messages or photos to the intended sender/recipient rather than public links', category: 'preferences' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that a shared batch of personalized cards is private by default, which has not been explicitly confirmed', category: 'preferences' },
    { aspect: 'ip and licensing exposure', note: 'Confirm licensing of any stock illustration, font, or photo used, since personal cards are often resold commercially in a card line', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'occasion-appropriate visual language', note: 'Match illustration style and color palette to the occasion\'s emotional register (playful for birthdays, restrained for sympathy)', category: 'preferences' },
    { aspect: 'typography and verse pairing', note: 'Pair typeface choice with the tone of the card verse — a handwritten script for warmth, clean sans for modern/minimal cards', category: 'preferences' },
    { aspect: 'originality', note: 'Avoid generic stock-greeting-card tropes; find a distinctive illustration style, phrase, or layout detail that gives the card a memorable identity', category: 'preferences' },
    { aspect: 'seasonal/collection cohesion', note: 'If part of a seasonal or themed collection, keep a consistent visual thread (palette, motif, border treatment) across the set', category: 'constraints' },
    { aspect: 'print finish as design element', note: 'Consider finishing techniques (foil stamping, letterpress, embossing, die-cut shapes) as intentional design choices, not afterthoughts', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'fold alignment check', note: 'Verify interior content aligns correctly once the card is folded, not just in the flat digital proof', category: 'functionalRequirements' },
    { aspect: 'proofreading personalized fields', note: 'Check personalization/variable-data fields for correct spelling of recipient names and correct merge-field substitution before a full print run', category: 'constraints' },
    { aspect: 'color accuracy testing', note: 'Compare a physical proof against the digital file to catch CMYK color shift before committing to the full print run', category: 'preferences' },
    { aspect: 'envelope fit test', note: 'Test-insert a finished card into the paired envelope to confirm fit and check for excessive gap or a too-tight seal', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "solemn sympathy card" alongside "bright, playful color palette")', category: 'constraints' },
    { aspect: 'boundary case testing', note: 'Test the longest expected personalized name/message against the layout to confirm text does not overflow or get clipped', category: 'preferences' },
    { aspect: 'holiday/seasonal date accuracy', note: 'For year-specific holiday cards (New Year, seasonal dates), verify any printed year or date is correct before the print run, since a wrong year cannot be corrected post-print', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'one-off order vs batch print economics',
      note: 'Requesting a single one-off card while also expecting bulk print-run per-unit pricing is inconsistent — bulk economics only apply at batch print quantities; a one-off should be quoted/produced via print-on-demand or short-run digital printing.',
      category: 'constraints',
      triggerA: /\b(one[- ]?off|single card|just one card)\b/i,
      triggerB: /\b(bulk (?:pricing|discount)|wholesale rate|per[- ]unit cost)\b/i,
    },
    {
      aspect: 'timeline vs specialty finishing',
      note: 'An extremely short delivery timeline alongside specialty finishing techniques (foil stamping, letterpress, embossing, die-cutting) is high-risk — those finishes require separate production runs/dies with longer vendor lead times than standard digital printing.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|asap|need it this week)\b/i,
      triggerB: /\b(foil stamp\w*|letterpress|emboss\w*|die-?cut\w*)\b/i,
    },
    {
      aspect: 'no budget vs premium production',
      note: 'A near-zero/minimal budget stated alongside premium stock, specialty finishing, or a large personalized batch run is a known-infeasible combination — those requirements carry proportional per-unit production costs.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(premium (?:stock|cardstock)|foil stamp\w*|letterpress|large batch|\d{3,}\s*(cards|units))\b/i,
    },
    {
      aspect: 'sympathy occasion vs bright/playful tone',
      note: 'Requesting a sympathy or condolence card alongside a bright, playful, or humorous visual tone is a contradictory brief — sympathy cards conventionally call for a restrained, muted design language; confirm the intended tone before proceeding.',
      category: 'constraints',
      triggerA: /\b(sympathy card|condolence card|sympathy note)\b/i,
      triggerB: /\b(bright(?:ly)? colou?r\w*|playful|whimsical|humorous|funny|festive)\b/i,
    },
  ],
};
