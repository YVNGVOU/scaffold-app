import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('software-development domain', () => {
  it('detects software-development domain on a realistic backend/CLI request', () => {
    const compiled = compileArchitect(
      'Build a Python CLI tool that wraps a REST API and stores results in a local database, with unit tests and a CI/CD pipeline'
    );
    expect(compiled.domain).toBe('software-development');
  });

  it('negative control: an unrelated web-focused request does not misclassify as software-development', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('software-development');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: "client" and "rapid" do not falsely trigger software-development keywords', () => {
    const state = runArchitectPipeline('We need a rapid prototype for our client meeting, a simple slideshow');
    expect(state.domain).not.toBe('software-development');
  });

  it('architect specialist produces software-development-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a Go microservice with a gRPC API, a database schema, unit tests, and a CI/CD pipeline for deployment'
    );
    expect(compiled.domain).toBe('software-development');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/core logic module|interface layer|CI\/CD pipeline|test suite/i);
  });

  it('word-boundary regression: new keywords like "parser" and "linter" do not falsely trigger inside unrelated words', () => {
    const state = runArchitectPipeline(
      'The sparse rows in the splinter wood table need repainting for the dining room'
    );
    expect(state.domain).not.toBe('software-development');
  });

  it('detects software-development domain via newly added keyword phrasings (monorepo, race condition, dependency injection)', () => {
    const compiled = compileArchitect(
      'Refactor our monorepo to fix a race condition in the worker pool and introduce dependency injection for the core module'
    );
    expect(compiled.domain).toBe('software-development');
  });

  it('security specialist surfaces a software-development-specific deserialization/idempotency consideration', () => {
    const compiled = compileArchitect(
      'Build a Go microservice with a gRPC API, a database schema, unit tests, and a CI/CD pipeline for deployment'
    );
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/idempotent|deserializ|rate limiting/i);
  });

  it('constraint specialist flags stateless requirement combined with in-memory session state', () => {
    const compiled = compileArchitect(
      'Build a stateless, horizontally scalable backend microservice with a REST API that relies on in-memory session state for user carts, with unit tests and a CI/CD pipeline'
    );
    expect(compiled.domain).toBe('software-development');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/in-memory session|contradictory|stateless/i);
  });
});
