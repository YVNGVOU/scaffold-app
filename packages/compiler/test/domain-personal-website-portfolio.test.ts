import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('personal-website-portfolio domain', () => {
  it('detects personal-website-portfolio domain on a realistic portfolio request', () => {
    const compiled = compileArchitect(
      'I need a personal portfolio website to showcase my design work for freelance clients, with an about page and case studies'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
  });

  it('detects domain from a new keyword phrasing (artist portfolio / job hunting)', () => {
    const compiled = compileArchitect(
      'Build an artist portfolio for job hunting so recruiters can see my illustration work and download my digital resume'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
  });

  it('negative control: an unrelated backend request does not misclassify as personal-website-portfolio', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('personal-website-portfolio');
  });

  it('word-boundary regression: unrelated words do not falsely trigger new keywords', () => {
    const state = runArchitectPipeline(
      'The vcarding process and bio.link.exe installer failed silently for the writerly application on my personal computer'
    );
    expect(state.domain).not.toBe('personal-website-portfolio');
  });

  it('ambiguity checklist: target audience field recognizes a bare short answer', () => {
    const compiled = compileArchitect(
      'Design a personal portfolio site aimed at hiring managers and recruiters, showcasing my top projects with case studies'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/target audience.*unspecified/i);
  });

  it('constraint specialist flags free-tier hosting vs heavy media mismatch', () => {
    const compiled = compileArchitect(
      'Build my personal portfolio website on GitHub Pages free tier, with a video showreel and large hi-res image galleries of my photography'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/free.?tier hosting vs heavy media portfolio|bandwidth\/storage/i);
  });

  it('technical specialist surfaces the new video/media hosting consideration', () => {
    const compiled = compileArchitect(
      'Build a personal portfolio website with a demo reel video and photography galleries showcasing my creative work for clients'
    );
    expect(compiled.domain).toBe('personal-website-portfolio');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/video\/media hosting|YouTube\/Vimeo unlisted/i);
  });
});
