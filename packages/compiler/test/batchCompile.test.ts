import { describe, it, expect } from 'vitest';
import { splitBatchLines } from '../src/index.js';

describe('splitBatchLines', () => {
  it('splits one prompt per non-blank line', () => {
    const raw = 'build me a portfolio site\nmake a mobile game\nwrite a business plan';
    expect(splitBatchLines(raw)).toEqual([
      'build me a portfolio site',
      'make a mobile game',
      'write a business plan',
    ]);
  });

  it('skips blank lines and whitespace-only lines', () => {
    const raw = 'first prompt\n\n   \nsecond prompt\n\n\nthird prompt';
    expect(splitBatchLines(raw)).toEqual(['first prompt', 'second prompt', 'third prompt']);
  });

  it('trims leading/trailing whitespace from each line', () => {
    const raw = '  build a website  \n\tmake a game\t';
    expect(splitBatchLines(raw)).toEqual(['build a website', 'make a game']);
  });

  it('handles \\r\\n and \\r line endings', () => {
    const raw = 'one\r\ntwo\rthree';
    expect(splitBatchLines(raw)).toEqual(['one', 'two', 'three']);
  });

  it('returns an empty array for empty or all-blank input', () => {
    expect(splitBatchLines('')).toEqual([]);
    expect(splitBatchLines('   \n\n\t\n  ')).toEqual([]);
  });

  it('does not deduplicate identical lines', () => {
    const raw = 'make a website\nmake a website';
    expect(splitBatchLines(raw)).toEqual(['make a website', 'make a website']);
  });

  it('preserves internal whitespace within a line', () => {
    const raw = 'build   me   a   site';
    expect(splitBatchLines(raw)).toEqual(['build   me   a   site']);
  });
});
