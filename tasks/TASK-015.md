# TASK-015

- Timestamp: 2026-08-11
- Original request: "add in app check for updates" — clarified through dialogue: update source is GitHub Releases, repo is private (`https://github.com/YVNGVOU/scaffold-app`, already created and pushed by the orchestrator with the initial commit of all Phase 1/2 work).
- Priority: P1
- Dependencies: TASK-001 through TASK-014 (all done). Depends on the GitHub repo existing (done — pushed as commit f7e0b02 to `origin/master`).
- Status: ACTIVE
- Classification: feature

## Requirements
1. Add Tauri's official updater plugin (`tauri-plugin-updater` + its JS bindings) to `apps/desktop`, following Tauri 2's standard updater setup.
2. Generate a Tauri updater signing keypair (`tauri signer generate` or equivalent). The **private key must never be committed to git** — save it to a local untracked file (add an explicit `.gitignore` entry for it, e.g. `apps/desktop/src-tauri/*.key` or wherever the CLI writes it) and document its location/how to use it for signing future releases in a way a human can find later (a note in `state/CANONICAL_STATE.md`). The **public key** goes into `tauri.conf.json`'s updater plugin config — that one is fine to commit.
3. Configure `tauri.conf.json`'s updater plugin `endpoints` to point at a GitHub-Releases-hosted `latest.json` manifest — the standard pattern is `https://github.com/YVNGVOU/scaffold-app/releases/latest/download/latest.json`. Confirm this matches what `tauri-action`/`tauri build --bundles` conventionally produces, or document the exact manifest format/location this app will use if deviating.
4. Add an in-app "Check for Updates" action — a button/menu item (implementer's judgment on placement, consistent with the existing SINVAUX/Scaffold visual language, e.g. near the SINVAUX footer credit or as a small icon-button in the left nav) that calls the updater plugin's check function, and on finding an update, shows a simple confirm-and-restart flow (Tauri's updater plugin has a standard `checkUpdate`/`downloadAndInstall` API — use it, don't hand-roll HTTP polling).
5. Handle the "no update available" and "check failed" (e.g. offline, no releases published yet) cases gracefully in the UI — this app is explicitly local-first and must continue working fully offline; a failed/skipped update check must never block or degrade any other functionality.
6. This is an OPTIONAL, user-initiated action, not an automatic background check — respect the project's "no telemetry, local-first, no cloud service *required*" principle. Checking for updates only happens when the user clicks the button, never silently on startup, unless/until the user is asked separately about that as a distinct preference (out of scope for now — build the manual-trigger version only).
7. Build a `latest.json` manifest for the CURRENT version (whatever's in `tauri.conf.json`'s `version` field — check it, likely `0.1.0`) alongside the already-built release artifacts (`apps/desktop/src-tauri/target/release/bundle/`), sign them with the generated private key, and publish an actual GitHub Release (tag matching the version, e.g. `v0.1.0`) to `https://github.com/YVNGVOU/scaffold-app` so there's a real release for "check for updates" to find (even though it'll correctly report "you're up to date" against itself — this proves the end-to-end mechanism works, which is the point of this task). Use `gh release create` for this.
8. Document the release process for FUTURE versions (bump version in `tauri.conf.json` + `package.json`, rebuild, sign, `gh release create` with the new tag) as a short section in `state/CANONICAL_STATE.md` or a new `docs/RELEASING.md` — this won't be automated by this task, just made repeatable.
9. `tsc --noEmit` and `vite build`/`cargo build` must stay clean.
10. Update `state/CANONICAL_STATE.md` and task/queue status on completion.

## Explicitly out of scope
- Automatic background update checks on startup (manual-trigger only, per requirement 6).
- CI/CD automation for building+publishing releases on every commit — this is a manual, documented process for now.
- Any other new feature (this task is scoped strictly to the update-check mechanism).
