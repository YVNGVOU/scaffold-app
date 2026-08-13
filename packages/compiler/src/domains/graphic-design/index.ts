import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let short keywords
// like 'dpi' or 'ad' collide with unrelated words. This domain is scoped to
// general graphic design (posters, print, digital graphics, layout,
// typography, color theory, print specs) and deliberately distinct from
// branding/logo work (see domains/branding/index.ts).
const KEYWORDS = [
  'graphic design', 'poster', 'flyer', 'brochure', 'infographic', 'print design',
  'print-ready', 'print ready', 'layout design', 'typography', 'typeface',
  'color theory', 'cmyk', 'pantone', 'bleed', 'magazine layout', 'packaging design',
  'billboard', 'banner design', 'zine', 'editorial layout', 'grid system',
  'postcard', 'business card', 'letterhead', 'signage', 'trade show booth',
  'die-cut', 'die cut', 'vector illustration', 'mockup design', 'annual report design',
  'book cover design', 'album cover', 'kerning', 'leading', 'whitespace layout',
  'visual identity collateral', 'rack card', 'table tent', 'yard sign', 'vinyl banner',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const graphicDesignDomain: DomainModule = {
  id: 'graphic-design',
  label: 'Graphic Design',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define final output dimensions and orientation', category: 'functional' },
    { text: 'Specify color mode (CMYK for print, RGB for digital)', category: 'constraint' },
    { text: 'Deliver source files in an editable format alongside export-ready files', category: 'preference' },
    { text: 'Establish a consistent type scale and grid across all pieces', category: 'preference' },
    { text: 'Confirm print quantity/run size and turnaround timeline before finalizing production specs', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'output medium',
      description: 'Whether the design is for print, digital/screen, or both is unspecified',
      isResolved: (input) => /\b(print|digital|screen|web|social media|pdf|paper|physical|online)\b/i.test(input),
    },
    {
      field: 'dimensions',
      description: 'Final size/dimensions or aspect ratio of the piece is unspecified',
      isResolved: (input) => /\b(size|dimensions?|inches|cm|mm|a4|a3|letter size|\d+\s*x\s*\d+|aspect ratio|portrait orientation|landscape orientation)\b/i.test(input),
    },
    {
      field: 'color mode',
      description: 'Target color mode (CMYK for print vs. RGB for screen) is unspecified',
      isResolved: (input) => /\b(cmyk|rgb|color mode|pantone|spot color|full color|grayscale|black and white|four[- ]color)\b/i.test(input),
    },
    {
      field: 'file format',
      description: 'Required deliverable file format(s) (e.g. PDF, AI, PNG, EPS) are unspecified',
      isResolved: (input) => /\b(pdf|ai file|\.ai\b|eps|png|svg|tiff|jpe?g|editable file|source file)\b/i.test(input),
    },
    {
      field: 'print quantity',
      description: 'Print run quantity or number of copies needed is unspecified',
      isResolved: (input) => /\b(print run|quantity|copies|how many|\d+\s*(units|copies|pieces)|bulk order|one[- ]off)\b/i.test(input),
    },
    {
      field: 'target audience and purpose',
      description: 'The intended audience or purpose the piece needs to persuade/inform/promote is unspecified',
      isResolved: (input) => /\b(target audience|intended for|aimed at|purpose is|promot(?:e|ing)|inform(?:s|ing)?|announce|advertis(?:e|ing))\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'concept and moodboard', dependsOn: [], note: 'Initial visual direction, reference gathering, and mood exploration' },
    { component: 'layout grid', dependsOn: ['concept and moodboard'], note: 'Grid system and composition structure for the piece' },
    { component: 'typography system', dependsOn: ['layout grid'], note: 'Typeface selection, hierarchy, and type scale' },
    { component: 'color palette', dependsOn: ['concept and moodboard'], note: 'Color selection appropriate to the output medium (CMYK/RGB)' },
    { component: 'production files', dependsOn: ['layout grid', 'typography system', 'color palette'], note: 'Print-ready or export-ready final files with correct specs (bleed, resolution, format)' },
    { component: 'proofing', dependsOn: ['production files'], note: 'Proof review (digital or physical print proof) before final delivery' },
  ],
  technicalConsiderations: [
    { aspect: 'resolution', note: 'Set appropriate resolution for the output medium (300 DPI for print, 72-150 DPI for screen) to avoid pixelation or oversized files', category: 'constraints' },
    { aspect: 'color mode', note: 'Work in the correct color mode (CMYK for print, RGB for digital/screen) to avoid color shifts on output', category: 'constraints' },
    { aspect: 'bleed and safe area', note: 'Define bleed margins and safe area for any print piece to prevent content being trimmed or misaligned', category: 'functionalRequirements' },
    { aspect: 'font licensing', note: 'Confirm licensing/embedding rights for any commercial typefaces used, especially for print or redistributed files', category: 'constraints' },
    { aspect: 'file format', note: 'Determine required deliverable formats (print-ready PDF/EPS, editable native file, web-optimized raster) up front', category: 'functionalRequirements' },
    { aspect: 'print vendor specs', note: 'Confirm the print vendor\'s exact spec requirements (paper stock, trim size, color profile) before finalizing files', category: 'preferences' },
    { aspect: 'die line and finishing', note: 'For die-cut, folded, or special-finish pieces (foil, embossing, spot UV), supply a separate die/fold-line vector layer clearly labeled as non-printing', category: 'functionalRequirements' },
    { aspect: 'image resolution source', note: 'Verify supplied raster images meet minimum resolution at final print size — upscaling a low-res web image for a large-format piece will visibly degrade', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'visual hierarchy', note: 'Establish a clear reading order (headline, subhead, body, call-to-action) so the eye moves through the piece as intended', category: 'functionalRequirements' },
    { aspect: 'legibility', note: 'Ensure type size, contrast, and line length remain legible at the intended viewing distance and medium', category: 'constraints' },
    { aspect: 'audience context', note: 'Consider where and how the piece will be encountered (handed out, viewed on a feed, posted at a distance) and design for that context', category: 'preferences' },
    { aspect: 'accessibility', note: 'Meet minimum color contrast for readability and avoid conveying information by color alone', category: 'constraints' },
    { aspect: 'call to action clarity', note: 'If the piece requires a response (attend, buy, scan a code), make the call to action visually unambiguous', category: 'functionalRequirements' },
    { aspect: 'scan-to-action reliability', note: 'If a QR code or short URL is included, test it at the printed size and viewing distance — codes that are too small or too close to the trim edge fail to scan', category: 'constraints' },
    { aspect: 'multi-language layout', note: 'If the piece needs bilingual/multilingual copy, plan layout space up front since translated text often runs 20-30% longer and can break the grid', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'licensed asset usage', note: 'Confirm all stock imagery, fonts, and icons used are properly licensed for the intended distribution (print run size, commercial use)', category: 'constraints' },
    { aspect: 'client-supplied assets', note: 'Verify the client has rights to any photos/logos/copy they supply for inclusion in the design', category: 'constraints' },
    { aspect: 'file metadata', note: 'Strip sensitive metadata (author info, revision history, embedded comments) from final delivered files', category: 'preferences' },
    { aspect: 'proof approval trail', note: 'Keep a clear record of client-approved proofs before sending files to print, to avoid disputes over unauthorized changes', category: 'preferences' },
    { aspect: 'trademark and brand-mark usage', note: 'Confirm any third-party logos, brand marks, or sponsor marks included in the layout are used with permission and current usage guidelines', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual concept', note: 'Ground the piece in a single clear visual concept or big idea rather than assembling disconnected decorative elements', category: 'preferences' },
    { aspect: 'typography as design', note: 'Treat typography as a primary design element (weight, scale, spacing) rather than a default afterthought', category: 'preferences' },
    { aspect: 'color harmony', note: 'Apply color theory (complementary, analogous, or brand-driven palettes) deliberately rather than defaulting to arbitrary colors', category: 'preferences' },
    { aspect: 'composition balance', note: 'Balance whitespace, imagery, and text so the layout feels intentional rather than cluttered or sparse', category: 'functionalRequirements' },
    { aspect: 'originality', note: 'Avoid generic stock-template layouts; push for a composition or visual device distinct from competitors in the same space', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'proofreading', note: 'Proofread all copy in the final layout for typos, widows/orphans, and inconsistent punctuation before production', category: 'constraints' },
    { aspect: 'print preflight', note: 'Preflight the file for missing fonts, low-resolution images, incorrect color mode, and bleed/trim errors before sending to print', category: 'constraints' },
    { aspect: 'consistency check', note: 'Check that colors, fonts, and spacing are consistent across all pieces in a multi-piece deliverable (e.g. poster + flyer + social set)', category: 'functionalRequirements' },
    { aspect: 'test print', note: 'Recommend a physical test print or color proof before a large print run to catch color/resolution issues early', category: 'preferences' },
    { aspect: 'file completeness', note: 'Verify all deliverable formats and required file variants (print, web, editable source) are present before handoff', category: 'functionalRequirements' },
    { aspect: 'grayscale/one-color check', note: 'Verify the design still reads clearly when printed in grayscale or a single spot color, in case the final press run drops to fewer colors than proofed', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs print production',
      note: 'An extremely short deadline (same day/overnight) alongside a physical print run is high-risk — commercial printing and shipping typically require days of lead time regardless of design speed.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|same[- ]day|in (?:a|one) day|asap)\b/i,
      triggerB: /\b(print run|printed|printing|ship(?:ped|ping)? to (?:a )?printer)\b/i,
    },
    {
      aspect: 'budget vs print quality',
      note: 'A near-zero/shoestring budget stated alongside premium print specs (large format, specialty stock, spot color, foil) is a known-infeasible combination — those production methods carry proportional material and press costs.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(large[- ]format|specialty stock|spot color|foil( stamping)?|premium print)\b/i,
    },
    {
      aspect: 'single designer vs many piece deliverable',
      note: 'A "one person" / freelance-scale team stated alongside a large multi-piece deliverable set (full campaign, dozens of variants) is a high-risk timeline combination even before print production time is added.',
      category: 'constraints',
      triggerA: /\b(one person|just me|solo designer|single designer|freelanc(e|er))\b/i,
      triggerB: /\b(full campaign|dozens of|\d{2,}\s*(variants|pieces|versions)|entire collateral suite)\b/i,
    },
  ],
};
