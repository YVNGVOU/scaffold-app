// TASK-079: Batch Compile — pure line-splitting helper.
//
// Turns a raw multi-line textarea value into a list of individual prompt
// inputs, one per non-blank line. Blank lines (including lines that are
// only whitespace) are skipped entirely, and each surviving line is
// trimmed. Pure, no I/O, no pipeline calls — the actual per-line pipeline
// invocation lives in the desktop app (apps/desktop/src/App.tsx), which
// reuses the exact same runArchitectPipeline/runQuickPipeline/
// runMasterPipeline calls handleCompile already uses, one call per line.

/**
 * Splits a batch-compile textarea value into individual prompt lines.
 * - Splits on any newline style (\n, \r\n, \r).
 * - Trims each line.
 * - Drops blank/whitespace-only lines.
 * - Does not deduplicate — identical lines become identical separate prompts.
 */
export function splitBatchLines(raw: string): string[] {
  return raw
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
