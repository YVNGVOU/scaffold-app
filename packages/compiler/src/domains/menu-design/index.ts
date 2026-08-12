import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/branding/index.ts. A bare keyword like 'menu' collides with
// unrelated software 'menu bar'/'dropdown menu' UI terms, so the keyword
// list favors compound, food-service-specific phrases (e.g. 'menu board',
// 'prix fixe', 'menu engineering') over the bare word 'menu' to keep this
// domain from over-triggering on generic UI/software requests. Scoped
// specifically to cafe/restaurant/bar menu design (structure, pricing
// layout, dietary tagging, print/digital menu formats) — NOT logo/identity
// work (branding), general print layout (graphic-design), booking/reservation
// systems (hospitality-travel), or recipe/cooking instructions.
const KEYWORDS = [
  'cafe menu', 'coffee shop menu', 'restaurant menu', 'menu design', 'menu board',
  'menu layout', 'digital menu', 'qr menu', 'qr code menu', 'drink menu',
  'food menu', 'wine list', 'drinks list', 'bar menu', 'brunch menu',
  'dinner menu', 'lunch menu', 'prix fixe', 'tasting menu', 'menu engineering',
  'menu pricing', 'menu section', 'specials board', 'table tent',
  'dietary tag', 'dietary tags', 'allergen menu', 'allergen tagging',
  'seasonal menu', 'menu insert', 'menu item description',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const menuDesignDomain: DomainModule = {
  id: 'menu-design',
  label: 'Menu Design',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Organize items into clear sections with a consistent visual hierarchy (section headers, item names, descriptions, prices)', category: 'functional' },
    { text: 'Tag common allergens and dietary attributes (vegetarian, vegan, gluten-free, nut-free) per item', category: 'constraint' },
    { text: 'Align pricing format and placement consistently across all items (no mixed decimal/currency-symbol styles)', category: 'functional' },
    { text: 'Deliver source files in an editable format alongside print-ready and/or digital-ready export formats', category: 'constraint' },
    { text: 'Keep item descriptions concise and scannable rather than full recipe-length copy', category: 'preference' },
    { text: 'Design for the intended reprint cadence (laminated/durable for static menus vs. easily-updatable for frequently-changing specials)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'menu format',
      description: 'Whether the menu is print, digital/QR-code, or both is unspecified',
      isResolved: (input) => /\b(print(ed)?|digital|qr\s*code|qr\s*menu|tablet\s+menu|online\s+menu)\b/i.test(input),
    },
    {
      field: 'cuisine/venue type',
      description: 'Type of establishment (cafe, fine dining, bar, fast-casual, food truck) is unspecified',
      isResolved: (input) => /\b(cafe|coffee\s*shop|fine\s+dining|bar|fast[- ]casual|food\s+truck|bistro|diner|bakery)\b/i.test(input),
    },
    {
      field: 'price range/tier',
      description: 'Target price tier (budget, mid-range, premium) is unspecified',
      isResolved: (input) => /\b(budget|affordable|mid[- ]range|premium|upscale|fine\s+dining|\$\$?\$?)\b/i.test(input),
    },
    {
      field: 'update frequency',
      description: 'How often the menu changes (static, seasonal rotation, daily specials) is unspecified',
      isResolved: (input) => /\b(seasonal|daily\s+special|rotat\w*|static\s+menu|permanent\s+menu|weekly\s+special)\b/i.test(input),
    },
    {
      field: 'dietary/allergen scope',
      description: 'Whether dietary/allergen labeling is required, and to what standard, is unspecified',
      isResolved: (input) => /\b(allergen|dietary|vegan|vegetarian|gluten[- ]free|nut[- ]free|halal|kosher)\b/i.test(input),
    },
    {
      field: 'photography inclusion',
      description: 'Whether the menu includes food photography or is text-only is unspecified',
      isResolved: (input) => /\b(photo\w*|photography|images?\s+of\s+(food|dishes)|picture\s+menu)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'menu structure/section map', dependsOn: [], note: 'Category hierarchy (e.g. starters, mains, desserts, drinks) and item ordering strategy within each section' },
    { component: 'item copy and descriptions', dependsOn: ['menu structure/section map'], note: 'Concise, appetizing per-item descriptions, portion notes, and naming consistent across sections' },
    { component: 'pricing layout', dependsOn: ['menu structure/section map'], note: 'Consistent price placement/format; consider menu-engineering principles (avoiding currency symbols, price ladders) where appropriate' },
    { component: 'dietary/allergen tagging system', dependsOn: ['item copy and descriptions'], note: 'Icon or label system for common allergens and dietary attributes, applied consistently per item' },
    { component: 'visual/typographic system', dependsOn: ['menu structure/section map'], note: 'Typography, color, and layout grid consistent with the venue\'s brand identity' },
    { component: 'food photography plan', dependsOn: ['item copy and descriptions'], note: 'If photos are used, define shot list, style consistency, and which items warrant a photo (typically hero/high-margin items, not every item)' },
    { component: 'print production files', dependsOn: ['visual/typographic system', 'pricing layout'], note: 'Print-ready files (bleed, resolution, paper stock/lamination choice) for physical menus' },
    { component: 'digital/QR menu build', dependsOn: ['visual/typographic system', 'pricing layout'], note: 'Mobile-responsive digital menu page and QR code linking to it, if a digital format is required' },
    { component: 'update/versioning workflow', dependsOn: ['print production files', 'digital/QR menu build'], note: 'Process for updating prices/items (seasonal rotation, 86\'d items, daily specials) without a full reprint each time' },
  ],
  technicalConsiderations: [
    { aspect: 'print vs digital production', note: 'Confirm whether output is print (CMYK, bleed, paper stock/lamination) or digital (RGB, responsive layout, QR code generation) — the production pipeline differs substantially', category: 'constraints' },
    { aspect: 'QR menu hosting', note: 'If using a QR-code digital menu, define where the page is hosted and how quickly it can be updated versus a printed menu\'s reprint cycle', category: 'functionalRequirements' },
    { aspect: 'menu update cadence', note: 'Design the file/template so item and price changes (seasonal swaps, 86\'d items, daily specials) do not require rebuilding the whole layout from scratch', category: 'preferences' },
    { aspect: 'legibility and print size', note: 'Verify body text remains legible at the intended physical size and lighting conditions (dim restaurant/bar lighting is common)', category: 'constraints' },
    { aspect: 'accessible file formats', note: 'Deliver editable source files (e.g. InDesign/Illustrator/Figma) alongside export-ready PDF/PNG so future edits do not require rebuilding from scratch', category: 'constraints' },
    { aspect: 'multi-language support', note: 'Confirm whether the menu needs to support multiple languages, which affects layout space and text expansion planning', category: 'functionalRequirements' },
    { aspect: 'point-of-sale consistency', note: 'Confirm item names and prices match the POS system exactly to avoid till/menu price mismatches', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'scanability/eye flow', note: 'Structure sections and item placement around known menu-reading eye-flow patterns so high-margin or signature items get visual priority', category: 'preferences' },
    { aspect: 'section hierarchy clarity', note: 'Use clear, distinct visual hierarchy between section headers, item names, descriptions, and prices so the menu is scannable at a glance', category: 'functionalRequirements' },
    { aspect: 'decision fatigue', note: 'Avoid overloading any single section with too many items, which slows down ordering decisions and can reduce average order confidence', category: 'preferences' },
    { aspect: 'dietary/allergen visibility', note: 'Make dietary and allergen tags visually consistent and easy to spot per item rather than buried in a separate footnote-only key', category: 'functionalRequirements' },
    { aspect: 'digital menu usability', note: 'If digital/QR, ensure the page loads fast on mobile data and is usable one-handed (large tap targets, no horizontal scrolling)', category: 'constraints' },
    { aspect: 'lighting/venue readability', note: 'Consider ambient lighting conditions of the venue (dim bar vs. bright cafe) when choosing font size, weight, and contrast', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'pricing data integrity', note: 'Guard against outdated cached prices on a digital/QR menu showing different prices than the till charges', category: 'constraints' },
    { aspect: 'allergen information accuracy', note: 'Treat allergen/dietary labeling as safety-critical information, not just design copy — incorrect allergen labeling can cause real harm and liability exposure', category: 'constraints' },
    { aspect: 'digital menu link security', note: 'If hosting a digital menu at a public URL, ensure the page cannot be tampered with or spoofed (e.g. no user-editable public CMS access) since a fake menu could mislead customers on price or allergens', category: 'constraints' },
    { aspect: 'unreleased menu exposure', note: 'Avoid exposing draft/unreleased seasonal menus (with unfinalized pricing) via publicly accessible links before launch', category: 'preferences' },
    { aspect: 'ip/recipe exposure', note: 'Confirm how much preparation detail is safe to disclose in item descriptions without giving away proprietary recipes/techniques', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'brand consistency', note: 'Align menu typography, color, and imagery with the venue\'s existing brand identity so the menu reads as part of the same brand, not a disconnected document', category: 'constraints' },
    { aspect: 'appetite appeal', note: 'Write item descriptions and choose photography that evoke appetite and match the venue\'s tone (casual cafe vs. fine dining) without over-promising', category: 'preferences' },
    { aspect: 'visual hierarchy for margin items', note: 'Use design emphasis (boxes, photos, placement) deliberately to draw attention to signature or higher-margin items, a core menu-engineering technique', category: 'preferences' },
    { aspect: 'material/format choice', note: 'Choose paper stock, lamination, or digital styling appropriate to venue tone (e.g. rustic kraft paper for a casual cafe vs. glossy card stock for upscale dining)', category: 'preferences' },
    { aspect: 'photography style consistency', note: 'If food photography is included, keep lighting, angle, and styling consistent across all shots rather than mixing stock photos with original photography', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'price/description accuracy', note: 'Cross-check every listed price and description against the current POS/kitchen data before publishing to avoid customer-facing pricing errors', category: 'constraints' },
    { aspect: 'allergen labeling completeness', note: 'Verify every item with a common allergen (nuts, gluten, dairy, shellfish) has been reviewed and correctly tagged — missing allergen tags are a safety issue, not just a cosmetic gap', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as an item description promising an ingredient no longer used, or a "vegan" tag on an item containing dairy/honey', category: 'constraints' },
    { aspect: 'print proof review', note: 'Review a physical print proof (not just a screen preview) for color accuracy, legibility, and layout before full print production', category: 'functionalRequirements' },
    { aspect: 'digital menu link testing', note: 'Test the QR code and digital menu link on multiple real devices and network conditions before launch', category: 'functionalRequirements' },
    { aspect: 'seasonal update process test', note: 'Verify the update workflow for seasonal/rotating items actually works end-to-end (edit, re-export, reprint or re-publish) before relying on it for the first real update', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs full photography set',
      note: 'An extremely short delivery timeline alongside a request for a full original food photography shoot for every menu item is high-risk — food photography (styling, shooting, editing) for a full menu typically takes days, not hours.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|asap|by end of day)\b/i,
      triggerB: /\b(photograph\w*\s+every\s+item|full\s+photo\s+shoot|photo\s+shoot\s+for\s+(the\s+)?(entire|whole|full)\s+menu)\b/i,
    },
    {
      aspect: 'no budget vs custom photography/print production',
      note: 'A near-zero/shoestring budget stated alongside custom food photography and premium print production (lamination, heavy stock, die-cutting) is a known-infeasible combination for the stated resources.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(custom\s+food\s+photography|professional\s+photo\s*shoot|premium\s+print|die[- ]cut)\b/i,
    },
    {
      aspect: 'static print menu vs daily-changing items',
      note: 'A one-time static printed menu (laminated, no reprint plan) alongside daily-changing specials/pricing is contradictory — items that change daily require a digital, insert-based, or whiteboard-style format, not a single static print run.',
      category: 'constraints',
      triggerA: /\b(one[- ]time\s+print|laminated\s+menu|static\s+menu|no\s+reprint)\b/i,
      triggerB: /\b(daily\s+special\w*|changes?\s+daily|rotat\w*\s+daily)\b/i,
    },
  ],
};
