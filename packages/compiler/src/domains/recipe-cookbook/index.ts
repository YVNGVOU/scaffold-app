import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/menu-design/index.ts. Scoped specifically to recipe writing /
// cookbook compilation / food content (ingredient lists, step formatting,
// yield/serving size, dietary variations, food photography/styling for a
// recipe or cookbook) — NOT restaurant menu design/pricing/structure
// (menu-design), logo/identity work (branding), general print layout
// (graphic-design/print-collateral), or booking/reservation/venue content
// (hospitality-travel). Keywords favor compound, recipe-specific phrases
// (e.g. 'recipe card', 'ingredient list', 'yield') over bare words like
// 'menu' or 'food' that would collide with neighboring domains.
const KEYWORDS = [
  'recipe', 'cookbook', 'recipe card', 'ingredient list', 'ingredient measurements',
  'cooking instructions', 'baking instructions', 'step-by-step recipe',
  'yield', 'serving size', 'servings', 'prep time', 'cook time',
  'dietary variation', 'dietary substitution', 'recipe conversion',
  'food styling', 'food photography', 'plating instructions',
  'recipe collection', 'recipe book', 'meal plan recipes', 'recipe index',
  'nutritional information', 'measurement conversion', 'metric conversion',
  'recipe testing', 'test kitchen', 'gluten-free recipe', 'vegan recipe',
  'recipe headnote',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const recipeCookbookDomain: DomainModule = {
  id: 'recipe-cookbook',
  label: 'Recipe / Cookbook Content',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'List ingredients in order of use with precise, consistent units of measurement (volume and/or weight)', category: 'functional' },
    { text: 'Format steps as clear, numbered, sequential instructions rather than dense paragraphs', category: 'functional' },
    { text: 'State yield/serving size and prep/cook time for every recipe', category: 'constraint' },
    { text: 'Flag common allergens and note reliable dietary substitutions (vegan, gluten-free, dairy-free) where applicable', category: 'constraint' },
    { text: 'Test each recipe as written before publishing to confirm quantities, timing, and instructions actually produce the intended result', category: 'constraint' },
    { text: 'Keep tone and voice consistent across all recipes in the collection', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'measurement system',
      description: 'Whether measurements are US customary, metric, or both is unspecified',
      isResolved: (input) => /\b(metric|us\s+customary|imperial|grams?|ounces?|cups?\s+and\s+grams|dual[- ]unit)\b/i.test(input),
    },
    {
      field: 'dietary scope',
      description: 'Which dietary variations/restrictions (vegan, gluten-free, keto, allergen-free) must be covered is unspecified',
      isResolved: (input) => /\b(vegan|vegetarian|gluten[- ]free|dairy[- ]free|keto|paleo|allergen[- ]free|nut[- ]free)\b/i.test(input),
    },
    {
      field: 'skill level',
      description: 'Target cook skill level (beginner, home cook, professional/culinary) is unspecified',
      isResolved: (input) => /\b(beginner|novice|home\s+cook|professional\s+chef|culinary\s+school|advanced\s+cook)\b/i.test(input),
    },
    {
      field: 'photography/styling needs',
      description: 'Whether the recipe(s) require food photography/styling and to what standard is unspecified',
      isResolved: (input) => /\b(food\s+photography|food\s+styling|photo\s+shoot|styled\s+photo|hero\s+shot)\b/i.test(input),
    },
    {
      field: 'yield/serving size',
      description: 'Target yield or serving size per recipe is unspecified',
      isResolved: (input) => /\b(serves?\s+\d+|\d+\s+servings?|yields?\s+\d+|makes?\s+\d+)\b/i.test(input),
    },
    {
      field: 'format/output medium',
      description: 'Whether the output is a print cookbook, digital recipe cards, blog posts, or an app/database is unspecified',
      isResolved: (input) => /\b(print(ed)?\s+cookbook|ebook|pdf|recipe\s+card|blog\s+post|recipe\s+app|recipe\s+database)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'recipe concept/collection outline', dependsOn: [], note: 'List of recipes to include, organized by course/category/theme, with a consistent editorial angle' },
    { component: 'ingredient list format', dependsOn: ['recipe concept/collection outline'], note: 'Consistent per-recipe ingredient ordering (order of use), unit system, and formatting (quantity, unit, ingredient, prep note)' },
    { component: 'step-by-step instruction format', dependsOn: ['recipe concept/collection outline'], note: 'Numbered, sequential steps written at a consistent verbosity/skill-level for the target audience' },
    { component: 'yield/timing metadata block', dependsOn: ['recipe concept/collection outline'], note: 'Standardized yield, serving size, prep time, and cook/bake time shown per recipe' },
    { component: 'dietary variation notes', dependsOn: ['ingredient list format'], note: 'Reliable substitution guidance for common dietary variations (vegan, gluten-free, dairy-free) per recipe where feasible' },
    { component: 'recipe testing pass', dependsOn: ['ingredient list format', 'step-by-step instruction format'], note: 'Each recipe cooked/baked as written to confirm quantities, timing, and instructions actually produce the intended result before publishing' },
    { component: 'food photography/styling plan', dependsOn: ['recipe concept/collection outline'], note: 'Shot list, styling direction, and consistency plan if photography accompanies the recipes' },
    { component: 'layout/typographic system', dependsOn: ['ingredient list format', 'step-by-step instruction format'], note: 'Consistent page layout, typography, and visual hierarchy across all recipes in the collection' },
    { component: 'index/navigation structure', dependsOn: ['recipe concept/collection outline'], note: 'Table of contents, category index, or searchable tagging (by ingredient, course, dietary tag) for the finished collection' },
  ],
  technicalConsiderations: [
    { aspect: 'measurement consistency', note: 'Pick a single primary unit system (or commit to true dual-unit conversion, not eyeballed rounding) and apply it consistently across every recipe', category: 'constraints' },
    { aspect: 'unit conversion accuracy', note: 'Verify volume-to-weight conversions (e.g. cups of flour to grams) against a reliable reference rather than generic ratios, since ingredient density varies (packed vs. sifted flour, brown vs. granulated sugar)', category: 'functionalRequirements' },
    { aspect: 'output/publishing format', note: 'Confirm target output (print-ready PDF, ebook/EPUB, recipe-card template, blog CMS, recipe app/database) since production requirements differ substantially', category: 'functionalRequirements' },
    { aspect: 'recipe scaling logic', note: 'If recipes must scale to different serving sizes, define whether scaling is linear per-ingredient or requires special handling (leavening, spices, cook time do not scale linearly)', category: 'functionalRequirements' },
    { aspect: 'nutritional data sourcing', note: 'If nutritional information is included, specify a reliable calculation method/database rather than estimated figures presented as precise', category: 'constraints' },
    { aspect: 'searchability/tagging', note: 'For digital collections, define a tagging taxonomy (ingredient, course, dietary tag, cook time) that supports filtering/search', category: 'preferences' },
    { aspect: 'version control for recipe edits', note: 'Track recipe revisions (a tweak after testing failure) so a corrected version does not get confused with an earlier untested draft', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'scannable step formatting', note: 'Format steps so a cook can glance back at the page mid-task without losing their place (numbered steps, bolded key actions/temperatures/times)', category: 'functionalRequirements' },
    { aspect: 'ingredient-to-step mapping', note: 'Make it easy to see which ingredient is used in which step, especially for recipes with components prepared separately then combined', category: 'preferences' },
    { aspect: 'mise en place clarity', note: 'Clearly separate prep instructions (dicing, marinating ahead) from active cooking steps so a cook can prep efficiently before starting', category: 'preferences' },
    { aspect: 'kitchen-usable layout', note: 'Design for real kitchen conditions — readable at arm\'s length, resistant to smudges/spills if printed, no critical info buried in small print', category: 'preferences' },
    { aspect: 'skill-level appropriate language', note: 'Match instructional detail and technique explanation to the stated target skill level rather than assuming culinary vocabulary the audience may not have', category: 'functionalRequirements' },
    { aspect: 'visual cues for timing', note: 'Call out time-sensitive or easy-to-miss steps (do not overmix, watch closely after X minutes) rather than burying them in plain narrative text', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'allergen/dietary accuracy', note: 'Treat allergen and dietary-safety claims (gluten-free, nut-free, vegan) as safety-critical, not just descriptive copy — an incorrect claim can cause real harm', category: 'constraints' },
    { aspect: 'food safety guidance', note: 'Include correct food-safety guidance where relevant (safe internal temperatures for meat/poultry/eggs, safe cooling/storage times) rather than omitting or guessing at figures', category: 'constraints' },
    { aspect: 'sourcing/attribution', note: 'Confirm recipe origin and rights — do not present a recipe adapted from a copyrighted published source as fully original without appropriate attribution/permission', category: 'constraints' },
    { aspect: 'unreleased content exposure', note: 'Avoid exposing draft/unreleased cookbook content publicly before launch if the collection is intended for commercial release', category: 'preferences' },
    { aspect: 'recipe testing liability', note: 'Do not publish untested recipes as reliable/tested, since an untested recipe with a wrong quantity or missing step can lead to a failed dish or, for safety-relevant steps, an unsafe one', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'voice and tone consistency', note: 'Keep headnotes, instructional voice, and personality consistent across every recipe in the collection so it reads as one authored work, not disparate pasted-in recipes', category: 'preferences' },
    { aspect: 'headnote storytelling', note: 'Use recipe headnotes deliberately (origin story, why it works, a serving tip) to add value beyond the bare instructions, appropriate to the collection\'s tone', category: 'preferences' },
    { aspect: 'food photography/styling direction', note: 'If photography is included, define a consistent styling direction (props, backgrounds, lighting, plating) across the whole collection rather than mismatched one-off shoots', category: 'preferences' },
    { aspect: 'visual hierarchy on the page', note: 'Use typography and layout to make ingredients, steps, and metadata (yield/time) visually distinct at a glance', category: 'functionalRequirements' },
    { aspect: 'thematic cohesion', note: 'Align recipe selection and presentation with the collection\'s stated theme (seasonal, regional, dietary, technique-focused) rather than an unrelated grab-bag', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'recipe testing verification', note: 'Confirm every recipe was actually cooked/baked as written and produced the intended result before publishing — this is the single most important QA step for recipe content', category: 'constraints' },
    { aspect: 'quantity/unit cross-check', note: 'Cross-check ingredient quantities against the instructions for internal consistency (e.g. an ingredient listed but never referenced in steps, or referenced but missing from the list)', category: 'constraints' },
    { aspect: 'allergen/dietary tag accuracy', note: 'Verify every dietary/allergen tag against the actual final ingredient list — a substitution made during testing can silently invalidate a previously correct tag', category: 'constraints' },
    { aspect: 'timing accuracy', note: 'Verify stated prep/cook times reflect the actual tested times, not optimistic estimates, since consistently wrong timing erodes reader trust across a whole collection', category: 'functionalRequirements' },
    { aspect: 'step completeness check', note: 'Check for missing steps (an ingredient prepared but the step to add it is missing) and ambiguous instructions (undefined terms like "cook until done" without a cue)', category: 'constraints' },
    { aspect: 'formatting consistency pass', note: 'Verify measurement units, step numbering, and metadata formatting (yield/time) are consistent across every recipe in the collection, not just individually correct', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs full recipe testing',
      note: 'An extremely short delivery timeline alongside a requirement that every recipe in a large collection be kitchen-tested is high-risk — genuine recipe testing (cooking, adjusting, retesting) takes real time per recipe and cannot be meaningfully compressed to hours for a full cookbook.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|asap|by end of day)\b/i,
      triggerB: /\b(test\s+every\s+recipe|fully\s+tested\s+cookbook|test\s+kitchen\s+pass|all\s+recipes\s+tested)\b/i,
    },
    {
      aspect: 'no budget vs custom photography/print production',
      note: 'A near-zero/shoestring budget stated alongside a full custom food photography shoot and premium print cookbook production is a known-infeasible combination for the stated resources.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(custom\s+food\s+photography|professional\s+photo\s*shoot|premium\s+print\s+cookbook|full\s+photo\s+shoot)\b/i,
    },
    {
      aspect: 'strict allergen-free claim vs unverified substitutions',
      note: 'Claiming a strict allergen-free guarantee (nut-free, gluten-free) while relying on untested or unverified ingredient substitutions is a safety-risk combination — allergen claims require verified ingredients and cross-contamination controls, not an assumed substitution.',
      category: 'constraints',
      triggerA: /\b(guaranteed|certified|strict(ly)?)\s+(nut|gluten|dairy|allergen)[- ]free\b/i,
      triggerB: /\b(untested\s+substitut\w*|assume[sd]?\s+substitut\w*|swap\s+.*\s+without\s+testing)\b/i,
    },
  ],
};
