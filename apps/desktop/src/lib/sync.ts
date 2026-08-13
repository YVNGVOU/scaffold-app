// Cloud sync orchestration: push everything local up, pull anything newer
// down. The server's upsert (scaffold-api.js) and the local upsert_*_from_sync
// Tauri commands are both last-write-wins on `updated_at`, so pushing the
// full local set every run is safe/idempotent (not just "since last sync")
// — simpler and correct, at the cost of some extra bandwidth on large
// libraries, an acceptable tradeoff for now.
//
// Deletes propagate as tombstones, not real deletes: delete_prompt/
// delete_project/delete_template (commands.rs) now set a `deleted` flag
// instead of removing the row, push uses the *_for_sync list variants
// (which, unlike the UI-facing list_*, include soft-deleted rows) so the
// tombstone reaches the server, and pull applies every row it gets back —
// including deleted ones — via the same last-write-wins upsert as any other
// field, so a delete on one device now does reach other devices next sync.
import { listProjectsForSync, listTemplatesForSync, listPromptsForSync, listCompiles, getSetting, setSetting, upsertProjectFromSync, upsertTemplateFromSync, upsertPromptFromSync, insertCompileFromSync } from './api';
import { pullSync, pushSync } from './cloud';

export const LAST_SYNC_KEY = 'cloud_last_sync';

export interface SyncSummary {
  pushed: number;
  pulled: number;
  serverTime: string;
}

export async function runSync(): Promise<SyncSummary> {
  const lastSync = await getSetting(LAST_SYNC_KEY);

  const [projects, templates, prompts] = await Promise.all([listProjectsForSync(), listTemplatesForSync(), listPromptsForSync()]);
  // Soft-deleted prompts have no compiles left locally (delete_prompt still
  // hard-deletes those), so listCompiles on one just returns [] — harmless.
  const compileLists = await Promise.all(prompts.map((p) => listCompiles(p.id)));
  const compiles = compileLists.flat();

  await pushSync({ projects, templates, prompts, compiles });
  const pushed = projects.length + templates.length + prompts.length + compiles.length;

  const pulled = await pullSync(lastSync ?? undefined);
  for (const p of pulled.projects) {
    await upsertProjectFromSync({ ...p, deleted: !!p.deleted });
  }
  for (const t of pulled.templates) {
    await upsertTemplateFromSync({ ...t, deleted: !!t.deleted });
  }
  for (const pr of pulled.prompts) {
    await upsertPromptFromSync({ ...pr, deleted: !!pr.deleted });
  }
  for (const c of pulled.compiles) {
    await insertCompileFromSync(c);
  }
  const pulledCount = pulled.projects.length + pulled.templates.length + pulled.prompts.length + pulled.compiles.length;

  await setSetting(LAST_SYNC_KEY, pulled.serverTime);

  return { pushed, pulled: pulledCount, serverTime: pulled.serverTime };
}
