/**
 * Friendly error classification (TASK-027). Pure, local to apps/desktop —
 * no packages/compiler change needed. Takes whatever was caught (a Tauri
 * command rejection, a Supabase SDK error, a thrown Error, etc.) and
 * produces a short human-readable summary plus the untouched raw text, so
 * the raw error is always available behind a "Details" expand for
 * debugging without ever showing it as the primary message.
 */
export interface FriendlyError {
  /** Short, human-readable sentence safe to show as the primary message. */
  summary: string;
  /** Untouched raw error text, for the "Details" expand. */
  raw: string;
}

function rawText(e: unknown): string {
  if (e instanceof Error) return e.stack ?? e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as { message?: unknown }).message ?? String(e));
  }
  return String(e);
}

export function toFriendlyError(e: unknown): FriendlyError {
  const raw = rawText(e);
  const msg = raw.toLowerCase();

  // Network / Supabase-unreachable — SDK errors and plain fetch failures.
  if (/network|fetch|failed to fetch|econnrefused|enotfound|timed out|timeout/.test(msg)) {
    return { summary: "Couldn't reach the server. Check your connection and try again.", raw };
  }

  // SQLite / Tauri command failures. Tauri command rejections are plain
  // strings (see src-tauri's Result<T, String> convention) so these often
  // arrive without an "Error:" prefix — match on the underlying sqlite
  // driver's own wording plus the generic "database" term.
  if (/sqlite|database is locked|constraint failed|no such table|disk i\/o error|database/.test(msg)) {
    return { summary: "Couldn't save — a local database error occurred.", raw };
  }

  return { summary: 'Something went wrong. Please try again.', raw };
}
