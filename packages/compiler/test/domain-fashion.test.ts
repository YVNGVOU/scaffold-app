import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('fashion domain', () => {
  it('detects fashion domain on a realistic Fashion Design request', () => {
    const compiled = compileArchitect(
      'Design a Spring/Summer capsule collection of womenswear dresses in cotton and linen, with a size run from XS to XL and small-batch manufacturing at a contemporary price point'
    );
    expect(compiled.domain).toBe('fashion');
  });

  it('negative control: an unrelated software-development request does not misclassify as fashion', () => {
    const compiled = compileArchitect(
      'Build a REST API backend service in Node.js with a PostgreSQL database and JWT authentication for a task management app'
    );
    expect(compiled.domain).not.toBe('fashion');
  });

  it('word-boundary regression: unrelated words do not falsely trigger fashion keywords', () => {
    const state = runArchitectPipeline('The hemisphere of the trimmer market grew, and the collectionist reviewed the seasonal report');
    expect(state.domain).not.toBe('fashion');
  });

  it('architect specialist produces fashion-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design a Fall/Winter streetwear collection of hoodies and outerwear in a heavyweight cotton fleece, with pattern making, tech packs, and bulk manufacturing through a cut-and-sew factory'
    );
    expect(compiled.domain).toBe('fashion');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/pattern making|tech pack|sample development|grading/i);
  });

  it('technical specialist surfaces a fashion-specific consideration', () => {
    const compiled = compileArchitect(
      'Design a Fall/Winter streetwear collection of hoodies and outerwear in a heavyweight cotton fleece, with pattern making, tech packs, and bulk manufacturing through a cut-and-sew factory'
    );
    expect(compiled.domain).toBe('fashion');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/fabric sourcing|pattern grading|construction method|manufacturing partner|tech pack/i);
  });
});
