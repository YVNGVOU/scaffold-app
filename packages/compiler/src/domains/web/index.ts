import type { DomainModule } from '../types.js';

const KEYWORDS = [
  'website', 'web app', 'webapp', 'web application', 'landing page', 'frontend',
  'backend', 'react', 'html', 'css', 'browser', 'web site', 'saas', 'dashboard',
  'api', 'web page', 'webpage',
];

export const webDomain: DomainModule = {
  id: 'web',
  label: 'Web Development',
  score(input: string): number {
    const text = input.toLowerCase();
    let score = 0;
    for (const kw of KEYWORDS) {
      if (text.includes(kw)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Site must be responsive across common device sizes', category: 'functional' },
    { text: 'Define hosting/deployment target', category: 'constraint' },
    { text: 'Basic accessibility (semantic HTML, keyboard navigation)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform (web only, or also mobile/responsive) is unspecified',
      isResolved: (input) => /mobile|responsive|desktop|cross-platform|browser/i.test(input),
    },
    {
      field: 'purpose',
      description: 'The purpose of the site/app (e.g. marketing, e-commerce, internal tool) is unspecified',
      isResolved: (input) => /(marketing|e-?commerce|shop|store|blog|portfolio|internal tool|dashboard|saas|landing)/i.test(input),
    },
    {
      field: 'audience',
      description: 'Target audience is unspecified',
      isResolved: (input) => /(audience|users?|customers?|for (my|our|a))/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'frontend', dependsOn: [], note: 'Client-side UI layer' },
    { component: 'backend', dependsOn: ['frontend'], note: 'Server-side logic / API layer' },
    { component: 'data layer', dependsOn: ['backend'], note: 'Persistence / database' },
    { component: 'deployment', dependsOn: ['frontend', 'backend'], note: 'Hosting and CI/CD target' },
  ],
};
