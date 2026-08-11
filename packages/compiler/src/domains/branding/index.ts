import type { DomainModule } from '../types.js';

const KEYWORDS = [
  'brand', 'branding', 'logo', 'identity', 'style guide', 'brand guidelines',
  'color palette', 'typography', 'wordmark', 'visual identity', 'rebrand',
  'brand kit', 'moodboard',
];

export const brandingDomain: DomainModule = {
  id: 'branding',
  label: 'Branding',
  score(input: string): number {
    const text = input.toLowerCase();
    let score = 0;
    for (const kw of KEYWORDS) {
      if (text.includes(kw)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Deliver a coherent color and type system', category: 'functional' },
    { text: 'Deliverables must be provided in editable + exportable formats', category: 'constraint' },
    { text: 'Consider scalability of logo across sizes/media', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'audience',
      description: 'Target audience/market for the brand is unspecified',
      isResolved: (input) => /(audience|market|customers?|demographic|for (my|our|a))/i.test(input),
    },
    {
      field: 'deliverables',
      description: 'Expected deliverables (logo, guidelines, full kit, etc.) are unspecified',
      isResolved: (input) => /(logo|guideline|brand kit|style guide|wordmark|assets?)/i.test(input),
    },
    {
      field: 'style',
      description: 'Desired style/tone (e.g. minimal, playful, luxury) is unspecified',
      isResolved: (input) => /(minimal|playful|luxury|modern|retro|bold|elegant|professional|edgy|warm|corporate)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'logo system', dependsOn: [], note: 'Primary mark, variations, clear space rules' },
    { component: 'color/type system', dependsOn: ['logo system'], note: 'Palette and typography scale' },
    { component: 'deliverable set', dependsOn: ['logo system', 'color/type system'], note: 'Final packaged assets/guidelines' },
  ],
};
