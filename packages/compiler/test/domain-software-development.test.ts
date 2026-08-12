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
});
