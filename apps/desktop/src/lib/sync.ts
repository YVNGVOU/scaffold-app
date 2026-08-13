// Cloud sync orchestration: push everything local up, pull anything newer
// down. The server's upsert (scaffold-api.js) and the local upsert_*_from_sync
// Tauri commands are both last-write-wins on `updated_at`, so pushing the
// full local set every run is safe/idempotent (not just "since last sync")
// — simpler and correct, at the cost of some extra bandwidth on large
// libraries, an acceptable tradeoff for now.
//
// Known limitation, stated honestly rather than silently: local deletes are
// real SQL deletes (see delete_prompt/delete_project/delete_template in
// commands.rs), not tombstones, so a prompt/project/template deleted on one
// device does NOT currently propagate as a deletion to other devices —
// deleting it locally on each device is still required. The server's
// `deleted` column exists for this but nothing writes it yet.
import { listProjects, listTemplates, listPrompts, listCompiles, getSetting, setSetting, upsertProjectFromSync, upsertTemplateFromSync, upsertPromptFromSync, insertCompileFromSync } from './api';
import { pullSync, pushSync } from './cloud';

export const LAST_SYNC_KEY = 'cloud_last_sync';

export interface SyncSummary {
  pushed: number;
  pulled: number;
  serverTime: string;
}

export async function runSync(): Promise<SyncSummary> {
  const lastSync = await getSetting(LAST_SYNC_KEY);

  const [projects, templates, prompts] = await Promise.all([listProjects(), listTemplates(), listPrompts()]);
  const compileLists = await Promise.all(prompts.map((p) => listCompiles(p.id)));
  const compiles = compileLists.flat();

  await pushSync({ projects, templates, prompts, compiles });
  const pushed = projects.length + templates.length + prompts.length + compiles.length;

  const pulled = await pullSync(lastSync ?? undefined);
  for (const p of pulled.projects) {
    if (!p.deleted) await upsertProjectFromSync(p);
  }
  for (const t of pulled.templates) {
    if (!t.deleted) await upsertTemplateFromSync(t);
  }
  for (const pr of pulled.prompts) {
    if (!pr.deleted) await upsertPromptFromSync(pr);
  }
  for (const c of pulled.compiles) {
    await insertCompileFromSync(c);
  }
  const pulledCount = pulled.projects.length + pulled.templates.length + pulled.prompts.length + pulled.compiles.length;

  await setSetting(LAST_SYNC_KEY, pulled.serverTime);

  return { pushed, pulled: pulledCount, serverTime: pulled.serverTime };
}
