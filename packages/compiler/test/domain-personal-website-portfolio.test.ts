import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('personal-website-portfolio domain', () => {
  it('detects personal-website-portfolio domain on a realistic portfolio request', () => {
    const compiled = compileArchitect(
      'Build a personal portfolio website showcasing my design work, with an about me page, project case studies, and a downloadable resume, hosted on my own personal domain'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
  });

  it('negative control: an unrelated software-development request does not misclassify as personal-website-portfolio', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('personal-website-portfolio');
  });

  it('word-boundary regression: unrelated words do not falsely trigger personal-website-portfolio keywords', () => {
    const state = runArchitectPipeline('The homepage carousel and portfolio management dashboard for our investment fund needs a redesign');
    expect(state.domain).not.toBe('personal-website-portfolio');
  });

  it('disambiguation: a general business/marketing website request classifies as web, not personal-website-portfolio', () => {
    const compiled = compileArchitect(
      'Build a web app landing page for our SaaS product with a signup flow, pricing page, and React frontend'
    );
    expect(compiled.domain).not.toBe('personal-website-portfolio');
  });

  it('disambiguation: a standalone resume document request classifies as resume-cv, not personal-website-portfolio', () => {
    const compiled = compileArchitect(
      'Write an ATS-friendly one-page resume for a job application with a professional summary and skills section'
    );
    expect(compiled.domain).toBe('resume-cv');
  });

  it('disambiguation: a personal portfolio site request classifies as personal-website-portfolio, not resume-cv', () => {
    const compiled = compileArchitect(
      'Design a developer portfolio site on Wix with an about me page, links to my GitHub projects, and a contact form'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
  });

  it('architect specialist produces personal-website-portfolio-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Create a photography portfolio website for myself with a project showcase, individual case-study pages for my best shoots, and a contact section, built on Squarespace'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/case-study|work\/project showcase|contact section|hero/i);
  });

  it('technical specialist surfaces a personal-website-portfolio-specific consideration', () => {
    const compiled = compileArchitect(
      'Create a photography portfolio website for myself with a project showcase, individual case-study pages for my best shoots, and a contact section, built on Squarespace'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/platform choice|maintainability|resume file sync|image optimization/i);
  });
});
