import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { webDomain } from '../src/domains/web/index.js';

describe('web domain', () => {
  it('detects web domain on a realistic web app request', () => {
    const compiled = compileArchitect(
      'Build a SaaS dashboard web app with a React frontend and a REST API backend, with a signup form and login page'
    );
    expect(compiled.domain).toBe('web');
  });

  it('negative control: an unrelated menu-design request does not misclassify as web', () => {
    const compiled = compileArchitect(
      'Design a menu for a coffee shop with pastries and drinks, organized into sections with prices and dietary tags'
    );
    expect(compiled.domain).not.toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger web keywords', () => {
    const state = runArchitectPipeline(
      'The therapist gave rapid advice about a day spa retreat, nothing to do with software'
    );
    expect(state.domain).not.toBe('web');
  });

  it('detects new keyword phrasings like progressive web app and checkout flow', () => {
    const compiled = compileArchitect(
      'Build a progressive web app with a checkout flow, an admin panel, and GraphQL for the user portal'
    );
    expect(compiled.domain).toBe('web');
  });

  it('ambiguity checklist recognizes a bare short answer for the authentication field', () => {
    const field = webDomain.ambiguityChecklist.find((f) => f.field === 'authentication');
    expect(field).toBeDefined();
    expect(field!.isResolved('login required for all users')).toBe(true);
    expect(field!.isResolved('a website for a bakery')).toBe(false);
  });

  it('security specialist surfaces a new web-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a web app dashboard with public contact forms and third-party analytics scripts embedded on every page'
    );
    expect(compiled.domain).toBe('web');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/csrf|rate-limit|third-party script/i);
  });

  it('constraint specialist flags SEO requirement vs client-only rendering tension', () => {
    const compiled = compileArchitect(
      'Build a single-page web application dashboard that must rank well on Google for organic search traffic'
    );
    expect(compiled.domain).toBe('web');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/seo|client-only render/i);
  });
});
