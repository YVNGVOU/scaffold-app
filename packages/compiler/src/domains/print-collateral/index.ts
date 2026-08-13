import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/branding/index.ts. Scoped specifically to general small-business
// print materials (business cards, flyers, brochures, postcards, posters)
// and their print production concerns (bleed/CMYK/paper stock, print run
// size, distribution method) — NOT logo/identity work (branding), general
// visual/editorial design principles without a print-production angle
// (graphic-design), or food-service menu layout (menu-design). Because
// graphic-design already claims bare terms like 'poster', 'flyer',
// 'brochure', 'cmyk', and 'bleed', this domain's keyword list deliberately
// favors compound, production/business-collateral-specific phrases (e.g.
// 'business card', 'print run', 'paper stock', 'direct mail') instead of
// duplicating graphic-design's territory with those bare words.
const KEYWORDS = [
  'business card', 'business cards', 'postcard', 'postcards', 'print collateral',
  'marketing collateral', 'print run', 'print quantity', 'paper stock',
  'cardstock', 'card stock', 'letterhead', 'rack card', 'door hanger',
  'trifold brochure', 'tri-fold brochure', 'bi-fold brochure', 'direct mail',
  'mailer', 'commercial printer', 'offset printing', 'digital printing',
  'foil stamping', 'spot uv', 'die-cut', 'die cut', 'print vendor',
  'print shop', 'presentation folder', 'sell sheet', 'table tent',
  'yard sign', 'vinyl banner', 'banner printing', 'large format printing',
  'notepad printing', 'print proof', 'print-ready file', 'print ready file',
  'booklet printing', 'catalog printing', 'envelope printing',
  'permit imprint', 'mailing indicia',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const printCollateralDomain: DomainModule = {
  id: 'print-collateral',
  label: 'Print Collateral',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Deliver print-ready files with correct bleed, trim, and safe-zone margins for the chosen print vendor', category: 'constraint' },
    { text: 'Specify color mode as CMYK (not RGB) for all print-destined artwork', category: 'constraint' },
    { text: 'Define the print run quantity and confirm per-unit cost scales sensibly with volume', category: 'functional' },
    { text: 'Deliver source files in an editable format alongside the print-ready export (PDF/X preferred)', category: 'constraint' },
    { text: 'Specify the intended paper stock/weight and finish (matte, gloss, uncoated) appropriate to the piece', category: 'preference' },
    { text: 'Define the distribution method (mail, in-store display, hand-to-hand, event) the piece is designed for', category: 'preference' },
    { text: 'If the piece will be mailed, confirm its dimensions and weight against postal machinable-mail size limits to avoid surcharge postage', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'collateral type',
      description: 'Which piece(s) are needed (business card, flyer, brochure, postcard, poster) is unspecified',
      isResolved: (input) => /\b(business\s*cards?|flyers?|brochures?|postcards?|posters?|rack\s*cards?|door\s*hangers?|letterhead)\b/i.test(input),
    },
    {
      field: 'print quantity',
      description: 'The print run size (e.g. 100, 500, 5000 units) is unspecified',
      isResolved: (input) => /\b(\d[\d,]*\s*(copies|units|pieces|cards)|print\s*run|print\s*quantity)\b/i.test(input),
    },
    {
      field: 'paper stock/finish',
      description: 'The desired paper stock weight and finish (matte, gloss, uncoated, cardstock) is unspecified',
      isResolved: (input) => /\b(matte|gloss\w*|uncoated|cardstock|card\s*stock|paper\s*stock|\d+\s*(lb|pt)\b)/i.test(input),
    },
    {
      field: 'distribution method',
      description: 'How the collateral will be distributed (direct mail, in-store, event handout, display rack) is unspecified',
      isResolved: (input) => /\b(direct\s*mail|mailer|in-?store|hand\w*\s*out|display\s*rack|event\s*handout|trade\s*show)\b/i.test(input),
    },
    {
      field: 'print vendor/method',
      description: 'The intended printing method or vendor (offset, digital printing, local print shop) is unspecified',
      isResolved: (input) => /\b(offset\s*print\w*|digital\s*print\w*|print\s*vendor|print\s*shop|commercial\s*printer)\b/i.test(input),
    },
    {
      field: 'turnaround/timeline',
      description: 'The needed turnaround time before the print run must ship or arrive is unspecified',
      isResolved: (input) => /\b(rush\s*order|turnaround|by\s+\w+day|need\w*\s+it\s+by|deadline)\b/i.test(input),
    },
    {
      field: 'budget/cost target',
      description: 'The budget or target cost per unit for the print run is unspecified',
      isResolved: (input) => /\b(budget|cost\s*per\s*(unit|piece|card)|price\s*point|\$\d)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'collateral piece inventory', dependsOn: [], note: 'List of distinct pieces required (business card, flyer, postcard, etc.) and their individual specs (size, orientation, sides)' },
    { component: 'brand/visual consistency pass', dependsOn: ['collateral piece inventory'], note: 'Ensure typography, color, and logo usage across all pieces match existing brand assets rather than diverging per-piece' },
    { component: 'copy and content layout', dependsOn: ['collateral piece inventory'], note: 'Final copy, contact info, and calls to action laid out per piece with appropriate hierarchy' },
    { component: 'print-production file setup', dependsOn: ['copy and content layout'], note: 'CMYK color conversion, bleed/trim/safe-zone setup, resolution check (300dpi), and export to print-ready PDF/X per piece' },
    { component: 'paper stock and finish selection', dependsOn: ['print-production file setup'], note: 'Chosen stock weight/finish per piece appropriate to its use case and durability needs (e.g. heavier stock for business cards, lighter for mass-mailed flyers)' },
    { component: 'print vendor sourcing/quoting', dependsOn: ['paper stock and finish selection'], note: 'Vendor selection (local print shop vs. online commercial printer) and quantity-based cost quoting' },
    { component: 'proof review cycle', dependsOn: ['print vendor sourcing/quoting'], note: 'Digital and/or physical proof review before committing to the full print run, to catch color/layout errors' },
    { component: 'distribution plan', dependsOn: ['proof review cycle'], note: 'Logistics for getting printed pieces to their destination (mail house, event, in-store display, hand-distribution)' },
  ],
  technicalConsiderations: [
    { aspect: 'bleed and trim setup', note: 'Set bleed (typically 0.125in/3mm) beyond the trim line for any full-bleed design element, plus safe-zone margins for text, to avoid white edges or cropped content after cutting', category: 'constraints' },
    { aspect: 'color mode conversion', note: 'Convert all artwork to CMYK before final export; screen-designed RGB colors (especially bright blues/greens) can shift noticeably when printed', category: 'constraints' },
    { aspect: 'resolution requirements', note: 'Ensure all raster images/photos are at least 300dpi at final print size to avoid visible pixelation', category: 'constraints' },
    { aspect: 'file format for print', note: 'Export a print-ready PDF/X (PDF/X-1a or PDF/X-4) with fonts embedded/outlined rather than relying on a raw design-app file being interpreted correctly by the printer', category: 'functionalRequirements' },
    { aspect: 'paper stock selection', note: 'Match stock weight and finish to the piece\'s handling and lifespan (heavier/coated stock for business cards that get handled repeatedly, lighter stock for mass-distributed flyers)', category: 'preferences' },
    { aspect: 'print quantity economics', note: 'Confirm the requested quantity against print-run cost curves — very small digital-print runs and very large offset runs have different per-unit cost breakpoints', category: 'functionalRequirements' },
    { aspect: 'vendor file specifications', note: 'Confirm the chosen print vendor\'s specific submission requirements (color profile, file size limits, template dimensions) before final export, since they vary by vendor', category: 'constraints' },
    { aspect: 'large-format output prep', note: 'For banners, yard signs, and posters, use vector artwork or very high native-resolution raster (not scaled-up small images) since large-format printers render at low viewing-distance dpi but the file still cracks visibly if upscaled from a small source', category: 'constraints' },
    { aspect: 'postal mail-piece format', note: 'If the piece is a mailer, confirm its dimensions and paper weight fall within USPS (or local postal authority) machinable-mail size and thickness limits, and that a permit imprint or indicia area is reserved in the layout if using a mail permit', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'scan/read hierarchy', note: 'Prioritize the single most important message or call to action visually, since print collateral is typically viewed for only a few seconds', category: 'preferences' },
    { aspect: 'contact info discoverability', note: 'Make contact info, QR code, or call to action easy to locate at a glance rather than buried in body copy', category: 'functionalRequirements' },
    { aspect: 'legibility at handling distance', note: 'Size body text appropriately for how the piece will actually be viewed (business card at arm\'s length vs. poster from across a room)', category: 'constraints' },
    { aspect: 'QR code/digital handoff usability', note: 'If a QR code links to a landing page or menu, verify it is large enough to scan reliably and the destination is mobile-friendly', category: 'functionalRequirements' },
    { aspect: 'stacking/holder compatibility', note: 'For rack cards, door hangers, or table tents, confirm standard sizing matches common physical holders/dispensers the venue will use', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'personal data exposure', note: 'Avoid printing sensitive personal data (full account numbers, unmasked personal identifiers) on collateral that will be mailed or handed out publicly', category: 'constraints' },
    { aspect: 'proof file access control', note: 'Control who has access to pre-release proofs/designs (e.g. unreleased promotional pricing) before the official public release', category: 'preferences' },
    { aspect: 'mailing list handling', note: 'If direct mail is used, confirm the mailing list source and handling complies with applicable data-privacy and opt-out expectations', category: 'constraints' },
    { aspect: 'ip/asset licensing', note: 'Confirm licensing covers print reproduction and the specific print quantity for any stock photography, fonts, or third-party assets used', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'brand consistency across pieces', note: 'Keep typography, color palette, and logo usage consistent across every piece in the collateral set so they read as one coordinated system, not disconnected one-offs', category: 'constraints' },
    { aspect: 'format-appropriate composition', note: 'Design composition to the piece\'s actual physical proportions and orientation (e.g. a business card\'s narrow landscape format demands different hierarchy than a poster)', category: 'functionalRequirements' },
    { aspect: 'tactile/finish choices as design elements', note: 'Consider finish techniques (spot UV, foil stamping, textured stock) as intentional design elements that reinforce brand tone, not just cost add-ons', category: 'preferences' },
    { aspect: 'concept exploration', note: 'Explore genuinely distinct layout directions before converging, rather than one layout with color/copy variations', category: 'preferences' },
    { aspect: 'visual distinctiveness', note: 'Differentiate the piece from generic print-template defaults so it doesn\'t read as an unmodified stock template', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'pre-print proof check', note: 'Verify a full proof (digital and, ideally, physical) against bleed, trim, color, and typo errors before committing to the full print run', category: 'constraints' },
    { aspect: 'contact info accuracy', note: 'Double-check every phone number, URL, email, and QR code destination for accuracy before print — these errors are expensive and often unrecoverable after printing', category: 'constraints' },
    { aspect: 'cross-piece consistency check', note: 'Verify consistent branding, contact info, and messaging across all pieces in a multi-piece collateral set', category: 'functionalRequirements' },
    { aspect: 'color accuracy test', note: 'Check printed proof colors against brand color specifications (Pantone/CMYK) since screen preview and final print output can differ', category: 'functionalRequirements' },
    { aspect: 'quantity/budget reconciliation', note: 'Verify the final quoted print run quantity and cost match what was actually approved before authorizing the full run', category: 'preferences' },
    { aspect: 'postal compliance check', note: 'For any mailed piece, verify size, weight, and aspect ratio against postal-authority machinable-mail rules before the run ships, since a non-compliant piece can incur surcharge postage or get rejected at the mail house', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no budget vs premium finishing',
      note: 'A near-zero/shoestring budget stated alongside premium finishing (foil stamping, spot UV, die-cutting, large offset print runs) is a known-infeasible combination — those techniques carry substantial per-unit and setup costs.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(foil\s*stamp\w*|spot\s*uv|die[- ]cut|premium\s*print\w*|large\s*offset\s*run)\b/i,
    },
    {
      aspect: 'timeline vs large print run',
      note: 'An extremely short turnaround (same day/next day) alongside a large offset print run is high-risk — offset printing typically requires plate setup and multi-day production lead time that digital printing does not.',
      category: 'constraints',
      triggerA: /\b(same[- ]day|next[- ]day|overnight|by tomorrow|rush\s*order|asap)\b/i,
      triggerB: /\b(offset\s*print\w*|large\s*print\s*run|\d{4,}\s*(copies|units|pieces))\b/i,
    },
    {
      aspect: 'digital-only delivery vs physical distribution',
      note: 'A digital-file-only deliverable request conflicts with a physical distribution method (direct mail, in-store display, hand-to-hand handout), which inherently requires an actual print run to fulfill.',
      category: 'constraints',
      triggerA: /\bdigital[- ]only\b/i,
      triggerB: /\b(direct\s*mail|in-?store\s*display|hand\w*\s*out|mail\s*house)\b/i,
    },
    {
      aspect: 'oversized mailer vs standard postal rate',
      note: 'An oversized or non-standard-shaped mailer (large poster-sized mailer, die-cut/irregular shape) combined with an expectation of standard first-class/postcard postage rates is infeasible — non-machinable dimensions and irregular shapes trigger postal surcharges or require a different mail class entirely.',
      category: 'constraints',
      triggerA: /\b(oversized|large[- ]format|irregular(ly)?[- ]shaped)\s*mailer\b/i,
      triggerB: /\b(standard\s*postage|first[- ]class\s*rate|postcard\s*rate)\b/i,
    },
  ],
};
