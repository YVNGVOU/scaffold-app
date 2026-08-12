# TASK-011

- Timestamp: 2026-08-11
- Original request: "remember the compiler is the product sinvaux is my company app name should be somthing with compiler but not the company name company name should still be branded on the app" → clarified through dialogue to: app name is **"Scaffold"**, SINVAUX remains the company brand shown elsewhere in the UI (not as the primary app name).
- Priority: P1
- Status: DONE
- Classification: rebrand

## Requirements
1. Rename the app's window title / product name from "SINVAUX" to "Scaffold" everywhere that's the primary app identity:
   - `apps/desktop/src-tauri/tauri.conf.json` — `productName`/`title` fields
   - `apps/desktop/package.json` — `name`/product-facing fields if present (note: the npm package name can stay `@lucid/desktop` internally per the existing codename convention — this is about the user-facing product name, not the internal package scope)
   - Any UI header/title text in `apps/desktop/src/App.tsx` or components currently reading "SINVAUX" as the primary heading
2. Add SINVAUX as a company-brand credit somewhere secondary and tasteful — a footer line, an about/info area, or similar (e.g. "Scaffold — a SINVAUX product" or "by SINVAUX" in small type) — consistent with the existing SINVAUX editorial visual language (ivory/near-black/burgundy, hairlines, no rounded cards). Do not remove SINVAUX branding entirely — the user was explicit that the company name should still appear.
3. Do NOT rename the internal repo codename (`lucid`) or package scopes (`@lucid/schema`, `@lucid/compiler`, `@lucid/desktop`) — those are internal-only per prior locked decisions and were never user-facing.
4. Confirm no other user-facing UI text still says "SINVAUX" as if it were the app's own name (e.g. any "Welcome to SINVAUX" style copy should become "Welcome to Scaffold" or similar, with SINVAUX preserved only as the secondary brand credit).
5. `tsc --noEmit` and `vite build` must stay clean in `apps/desktop`; a full `tauri build` re-run is not required for this task but should be spot-checked if time allows (at minimum, confirm the dev build reflects the new title).
6. Update `state/CANONICAL_STATE.md` and task/queue status on completion, including the naming decision (app name "Scaffold" vs. company brand "SINVAUX") so future tasks don't reintroduce the old naming.

## Explicitly out of scope
- No UI layout/information-architecture changes (that's TASK-012, queued separately, do not start it here to avoid merge conflicts on the same files).
- No changes to the compiler package's internal naming/codename.
