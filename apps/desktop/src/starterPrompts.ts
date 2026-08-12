// Example starter prompts shown when the raw-input textarea is empty, grouped by domain.
// Pure static data — no logic, no wiring into domain-detection or the compiler pipeline.

export interface StarterPrompt {
  domain: 'web' | 'game' | 'branding';
  label: string;
  text: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    domain: 'web',
    label: 'Portfolio site',
    text: 'Build me a portfolio website for a freelance photographer, with a gallery, an about page, and a contact form.',
  },
  {
    domain: 'web',
    label: 'SaaS landing page',
    text: 'Design a landing page for a project management SaaS product, with pricing tiers and a signup form.',
  },
  {
    domain: 'web',
    label: 'Local business site',
    text: 'Create a website for a small neighborhood coffee shop, with a menu page, hours, and location map.',
  },
  {
    domain: 'game',
    label: '2D platformer',
    text: 'Design a 2D side-scrolling platformer where a robot collects scrap parts to repair its ship, with three levels and a boss fight.',
  },
  {
    domain: 'game',
    label: 'Roguelike deckbuilder',
    text: 'Build a roguelike deckbuilding card game set in a haunted mansion, with permadeath and procedurally generated rooms.',
  },
  {
    domain: 'game',
    label: 'Mobile puzzle game',
    text: 'Create a mobile match-three puzzle game with a candy shop theme, daily challenges, and a level progression map.',
  },
  {
    domain: 'branding',
    label: 'Coffee brand identity',
    text: 'Develop a brand identity for a new specialty coffee roaster, including logo direction, color palette, and tone of voice.',
  },
  {
    domain: 'branding',
    label: 'Fitness app branding',
    text: 'Create a brand identity for a fitness tracking app aimed at busy professionals, with a bold, energetic visual style.',
  },
  {
    domain: 'branding',
    label: 'Nonprofit rebrand',
    text: 'Rebrand a local environmental nonprofit to feel more modern and approachable, keeping their green color heritage.',
  },
];
