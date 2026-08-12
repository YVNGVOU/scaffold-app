import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let bare keywords like 'hem' match inside
// unrelated words, silently inflating scores on inputs unrelated to fashion.
const KEYWORDS = [
  'fashion design', 'fashion', 'apparel', 'garment', 'clothing line', 'collection',
  'runway', 'couture', 'ready-to-wear', 'textile', 'fabric', 'pattern making',
  'sewing pattern', 'tailoring', 'silhouette', 'sizing chart', 'size run',
  'fashion brand', 'streetwear', 'menswear', 'womenswear', 'activewear',
  'swimwear', 'outerwear', 'footwear', 'accessories line', 'trim',
  'fashion illustration', 'mood board', 'lookbook', 'seasonal collection',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const fashionDomain: DomainModule = {
  id: 'fashion',
  label: 'Fashion Design',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define garment category (e.g. tops, outerwear, dresses, footwear, accessories)', category: 'functional' },
    { text: 'Specify target sizing range and fit standard (e.g. straight sizes, extended/inclusive sizing)', category: 'constraint' },
    { text: 'Identify primary fabric/material composition and sourcing approach', category: 'constraint' },
    { text: 'Define target season/collection drop (e.g. Spring/Summer, Fall/Winter, capsule, resort)', category: 'functional' },
    { text: 'Consider manufacturing feasibility at the intended production volume (sample, small-batch, mass production)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'garment type',
      description: 'The specific garment category or product type is unspecified',
      isResolved: (input) => /(dress|jacket|coat|top|blouse|shirt|pant|trouser|skirt|jean|denim|footwear|shoe|bag|accessor|swimwear|activewear|outerwear|suit|knitwear|hoodie)/i.test(input),
    },
    {
      field: 'fabric/material',
      description: 'Fabric type, weight, or material composition is unspecified',
      isResolved: (input) => /(cotton|silk|wool|linen|polyester|denim|leather|fabric|textile|knit|woven|jersey|material|blend|spandex|nylon|cashmere|viscose)/i.test(input),
    },
    {
      field: 'sizing',
      description: 'Target sizing range or fit standard is unspecified',
      isResolved: (input) => /(size|sizing|fit|xs|small|medium|large|xl|petite|plus[- ]size|inclusive sizing|grading)/i.test(input),
    },
    {
      field: 'season/collection',
      description: 'Seasonal collection timing (SS/FW/resort/capsule) is unspecified',
      isResolved: (input) => /(spring|summer|fall|autumn|winter|resort|capsule collection|season|collection drop)/i.test(input),
    },
    {
      field: 'production scale',
      description: 'Manufacturing/production scale (one-off sample, small-batch, mass production) is unspecified',
      isResolved: (input) => /(sample|prototype|small[- ]batch|mass production|manufactur|factory|production run|made[- ]to[- ]order)/i.test(input),
    },
    {
      field: 'price point / market tier',
      description: 'Target price point or market tier (fast fashion, contemporary, luxury) is unspecified',
      isResolved: (input) => /(luxury|premium|contemporary|fast fashion|budget|price point|affordable|high[- ]end)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'design concept / mood board', dependsOn: [], note: 'Establish visual direction, inspiration references, and color/material story' },
    { component: 'technical flat sketches', dependsOn: ['design concept / mood board'], note: 'Produce flat construction drawings for each style with callouts' },
    { component: 'pattern making', dependsOn: ['technical flat sketches'], note: 'Draft or digitize the sloper/pattern pieces for each garment' },
    { component: 'fabric and trim sourcing', dependsOn: ['design concept / mood board'], note: 'Source fabric, lining, and trims (buttons, zippers, labels) meeting quality and cost targets' },
    { component: 'sample development', dependsOn: ['pattern making', 'fabric and trim sourcing'], note: 'Cut and sew a first sample (proto/muslin) for fit and construction review' },
    { component: 'fit sessions', dependsOn: ['sample development'], note: 'Conduct fittings on a form or fit model, iterate pattern corrections' },
    { component: 'grading and size run', dependsOn: ['fit sessions'], note: 'Grade the approved pattern across the full size range' },
    { component: 'tech pack', dependsOn: ['grading and size run'], note: 'Compile the manufacturing spec sheet (measurements, construction, materials, labeling) for the factory' },
    { component: 'production and QC', dependsOn: ['tech pack'], note: 'Run bulk production with in-line and final quality control inspections' },
    { component: 'lookbook / presentation', dependsOn: ['production and QC'], note: 'Photograph or stage the finished collection for buyers, press, or runway presentation' },
  ],
  technicalConsiderations: [
    { aspect: 'fabric sourcing', note: 'Identify fabric mills or suppliers that can meet minimum order quantities (MOQs) for the chosen fabrication', category: 'constraints' },
    { aspect: 'pattern grading', note: 'Define the grading rule/size specification used to scale the base pattern across the full size range', category: 'functionalRequirements' },
    { aspect: 'construction method', note: 'Specify seam types, stitching, and finishing techniques (e.g. flat-felled seams, French seams, overlock) appropriate to the fabric', category: 'functionalRequirements' },
    { aspect: 'manufacturing partner', note: 'Select a cut-and-sew factory or manufacturer capable of the target production volume and quality tier', category: 'constraints' },
    { aspect: 'tech pack completeness', note: 'Ensure the tech pack includes point-of-measure (POM) charts, construction details, and approved colorways to avoid production errors', category: 'functionalRequirements' },
    { aspect: 'sample yardage', note: 'Account for sample yardage and lead time separately from bulk fabric yardage when planning the production timeline', category: 'preferences' },
    { aspect: 'care and compliance labeling', note: 'Include required fiber content, care instructions, and country-of-origin labeling per applicable regulations (e.g. FTC Care Labeling Rule)', category: 'constraints' },
    { aspect: 'quality control', note: 'Define QC checkpoints (in-line, pre-shipment inspection) and acceptable-quality-limit (AQL) standards for defects', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'fit and comfort', note: 'Prioritize wearer comfort and range of motion for the intended use case (e.g. ease allowance for activewear vs. tailored fit for outerwear)', category: 'functionalRequirements' },
    { aspect: 'sizing inclusivity', note: 'Consider whether the size range serves the intended customer base, including extended or inclusive sizing where relevant', category: 'preferences' },
    { aspect: 'ease of dressing', note: 'Evaluate closures (zippers, buttons, elastic) for ease of putting on/taking off, especially for functional or adaptive apparel', category: 'preferences' },
    { aspect: 'sensory considerations', note: 'Account for fabric hand-feel, tag placement, and seam irritation, particularly for garments worn close to skin', category: 'preferences' },
    { aspect: 'size chart clarity', note: 'Provide a clear, accurate size chart with body measurements so customers can select the correct size confidently', category: 'functionalRequirements' },
    { aspect: 'packaging and unboxing', note: 'Consider the customer unboxing experience for direct-to-consumer sales (folding, tissue, branded packaging)', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'supply chain transparency', note: 'Document supplier and factory relationships to support ethical sourcing claims and traceability requirements', category: 'constraints' },
    { aspect: 'design IP protection', note: 'Protect original prints, patterns, and silhouettes from unauthorized copying; consider trademark/design patent where warranted', category: 'preferences' },
    { aspect: 'customer data handling', note: 'If collecting body measurements or size data through a fitting tool, define how that personal data is stored and protected', category: 'constraints' },
    { aspect: 'counterfeiting risk', note: 'Assess counterfeiting/knockoff risk for distinctive branding or prints and plan enforcement/monitoring accordingly', category: 'preferences' },
    { aspect: 'material safety compliance', note: 'Confirm fabrics, dyes, and trims (e.g. children\'s wear) meet applicable safety standards (e.g. CPSIA for kidswear, flammability standards)', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'design direction', note: 'Establish a clear design narrative (silhouette language, color story, print/pattern motifs) that ties the collection together', category: 'preferences' },
    { aspect: 'trend alignment', note: 'Balance on-trend elements with a distinctive point of view so the collection does not read as generic or derivative', category: 'preferences' },
    { aspect: 'color story', note: 'Define a cohesive seasonal color palette, including core, accent, and print colors, tied to fabric dye lots', category: 'functionalRequirements' },
    { aspect: 'silhouette variety', note: 'Ensure the collection offers enough silhouette and proportion variety to give buyers/customers real choice without diluting the line', category: 'preferences' },
    { aspect: 'fabric-to-design match', note: 'Match fabric drape, weight, and stretch to the intended silhouette (e.g. bias-cut silk drapes differently than structured wool)', category: 'functionalRequirements' },
    { aspect: 'brand identity consistency', note: 'Keep design choices consistent with the brand\'s established aesthetic, price tier, and customer expectations', category: 'preferences' },
    { aspect: 'styling and presentation', note: 'Consider how pieces will be styled together in lookbooks, runway, or e-commerce photography to tell a cohesive story', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'fit consistency', note: 'Verify fit consistency across the graded size run, not just the sample size, through fit testing at multiple sizes', category: 'constraints' },
    { aspect: 'measurement accuracy', note: 'Cross-check the tech pack point-of-measure chart against the actual sewn sample before bulk cutting', category: 'functionalRequirements' },
    { aspect: 'fabric defect tolerance', note: 'Define acceptable-quality-limit (AQL) thresholds for fabric flaws, stitching defects, and color shading between dye lots', category: 'constraints' },
    { aspect: 'colorfastness and shrinkage testing', note: 'Test fabric for colorfastness (washing, rubbing) and shrinkage before committing to bulk yardage', category: 'constraints' },
    { aspect: 'labeling compliance check', note: 'Verify care labels, fiber content, and country-of-origin labeling are correct before shipment', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as a delicate fabric specified for a high-durability activewear use case', category: 'preferences' },
    { aspect: 'production timeline risk', note: 'Flag whether the stated timeline realistically accommodates sampling, fitting, grading, and bulk production lead times', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs production process',
      note: 'A very short delivery timeline (days or a couple weeks) is incompatible with a full development cycle involving pattern making, sampling, fitting, and bulk manufacturing, which typically takes months.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|next week|in (?:a|one|two) weeks?|asap|overnight)\b/i,
      triggerB: /\b(bulk production|mass production|full collection|manufactur\w*|factory)\b/i,
    },
    {
      aspect: 'budget vs custom manufacturing',
      note: 'A minimal/shoestring budget alongside custom small-batch or made-to-order manufacturing is a known-infeasible combination — cut-and-sew production carries per-unit costs, sampling fees, and factory minimums that scale poorly at low budgets.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight|low)\s+budget\b/i,
      triggerB: /\b(custom|small[- ]batch|made[- ]to[- ]order|bespoke)\s+(manufactur\w*|production|collection)\b/i,
    },
    {
      aspect: 'fabric vs use case mismatch',
      note: 'Specifying a delicate, non-durable fabric (e.g. silk, chiffon) for a high-durability or high-performance use case (activewear, workwear) is a high-risk material mismatch that typically leads to premature garment failure.',
      category: 'constraints',
      triggerA: /\b(silk|chiffon|delicate|lace|tulle)\b/i,
      triggerB: /\b(activewear|workwear|performance wear|heavy[- ]duty|athletic)\b/i,
    },
  ],
};
