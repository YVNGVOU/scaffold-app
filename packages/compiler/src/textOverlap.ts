/**
 * Shared deterministic text-similarity primitive, originally built for
 * critique.ts's cross-specialist near-duplicate detection (Rule 2) and now
 * reused by canonicalResolver.ts to relate a specialist proposal's text to
 * a locked canonical fact's field name/description — same "smaller-set
 * overlap ratio" heuristic, just applied to a different pair of texts.
 * Extracted here rather than duplicated so both call sites can never
 * silently drift into different notions of "similar enough".
 */
export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/** Fraction of the SMALLER text's significant words that also appear in the
 * other text. Deliberately asymmetric-set-size-tolerant: a short field name
 * ("menu format") can meaningfully overlap with a much longer specialist
 * recommendation sentence without being swamped by the longer text's word
 * count, which a Jaccard/symmetric ratio would produce artificially low
 * scores for. */
export function wordOverlapRatio(a: string, b: string): number {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }
  const smaller = Math.min(wordsA.size, wordsB.size);
  return shared / smaller;
}
