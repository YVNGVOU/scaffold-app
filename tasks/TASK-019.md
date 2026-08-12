# TASK-019

- Timestamp: 2026-08-11
- Original request: "app will aslo require login with a SINVAUX account" → clarified through dialogue: purpose is a license/paid-access gate (billing model TBD, not yet decided one-time vs subscription — build the account layer now, wire up payment enforcement later once a processor is chosen). Infra: Supabase (hosting + Postgres + Auth). Credentials confirmed safe (anon/public key, verified by decoding the JWT payload — `"role":"anon"`) and provided by the user. 7-day offline grace period confirmed.
- Priority: P1 (was P2/BLOCKED, now unblocked with real credentials)
- Dependencies: TASK-001 through TASK-018 (all done, all independently verified).
- Status: ACTIVE
- Classification: feature, architecture

## Locked decisions (confirmed via dialogue, do not deviate without asking)
- Backend: Supabase. Project URL: `https://bpcxrtqhlvgylbpnfjhp.supabase.co`. Anon/public key: provided by user in chat (verify it decodes to `"role":"anon"` before using — do not use any key that decodes to `"role":"service_role"` or is prefixed `sb_secret_`, those are backend-only secrets and must NEVER be embedded in the desktop client).
- Auth method: Supabase's built-in email/password auth, plus magic link as an alternative sign-in option.
- No payment/subscription enforcement in this task — the gate is simply "has a valid, logged-in Supabase account." Design the data model with a `plan`/`subscription_status` concept in mind for later, but do not build billing logic now (explicitly deferred, not decided which processor).
- Offline grace period: 7 days. A previously-successful login should keep working offline for up to 7 days before requiring re-verification; this respects the app's local-first identity while still enforcing the account gate.
- The anon/public Supabase key IS safe to commit to the repo (that is its intended purpose — it's the client-facing key, protected by Supabase Row Level Security policies, not a secret). Do not treat it with the same handling as the updater's private signing key.

## Requirements
1. Add `@supabase/supabase-js` as a dependency of `apps/desktop`.
2. Create `apps/desktop/src/lib/supabase.ts` — initializes the Supabase client with the project URL and anon key (as committed constants, per the locked decision above — not a secret, safe to commit; still put them in one clearly-named file rather than scattered inline).
3. Build a `LoginScreen`/`AuthGate` component (implementer's naming judgment) in the dark SINVAUX/Scaffold visual language (`--sv-*` tokens only, no rounded corners, no new UI component libraries) with:
   - Email + password fields, "Sign In" and "Sign Up" actions (Supabase's `signInWithPassword`/`signUp`).
   - A magic-link option ("Email me a sign-in link" — Supabase's `signInWithOtp`).
   - Basic error display (wrong password, unconfirmed email, network failure) — non-blocking, clear messaging, consistent with the app's existing error-handling style in `App.tsx`.
   - A "check your email to confirm" state after signup, since Supabase's default project settings typically require email confirmation — verify this assumption against the actual project behavior if possible, or just handle both cases (confirmed-immediately and requires-confirmation) gracefully.
4. Wire this as a gate in front of the existing 4-pane app: `App.tsx` (or a new top-level wrapper component) checks auth state on load; if not authenticated (and not within the offline grace period, see requirement 5), render the login/signup screen instead of the compiler UI. Once authenticated, render the existing app unchanged.
5. **Offline grace period implementation**: on successful login/session-refresh, record a timestamp (e.g. `auth_last_verified_at`) via the EXISTING settings mechanism (`get_setting`/`set_setting` Tauri commands + the `settings` SQLite table, built in TASK-018 — reuse this, don't invent a second persistence mechanism). On app start: attempt to restore/refresh the Supabase session normally; if that succeeds, update `auth_last_verified_at` to now and proceed. If session restore fails due to what looks like a network error (not an explicit "invalid session"/"logged out" response), check `auth_last_verified_at` — if it's within 7 days, allow the app to proceed anyway (offline grace), showing a small non-blocking indicator that the account couldn't be re-verified. If it's been more than 7 days, or if Supabase explicitly says the session/token is invalid (not just unreachable), require login.
6. Add a "Sign Out" action somewhere reasonable (e.g. in the new `SettingsPanel.tsx` from TASK-018, alongside the About section) that clears the Supabase session and the locally-cached `auth_last_verified_at`, returning the user to the login screen.
7. Supabase's JS client persists its own session token — verify it uses a storage mechanism that actually works in the Tauri webview (default is `localStorage`, which should work in a Tauri webview; confirm this rather than assuming, since Tauri's webview environment can have quirks). If `localStorage` proves unreliable, consider a custom storage adapter backed by the existing SQLite `settings` table instead — implementer's judgment, but verify whichever approach you pick actually persists a session across app restarts.
8. Do NOT build any subscription/billing/plan-enforcement logic — the gate is authentication only, not authorization-by-plan. Do not create Stripe integration code, do not add payment UI.
9. Zero AI API calls (unrelated to this task, but the standing constraint stays in force — this task is about the Supabase auth SDK only, no LLM anywhere).
10. All 123 pre-existing tests must still pass — this task should not need `packages/compiler` changes at all (pure `apps/desktop` frontend + reused existing Rust settings commands), verify with `git diff --stat` that `packages/compiler`/`packages/schema` show zero changes.
11. `tsc --noEmit`, `vite build`, `cargo build` must all stay clean.
12. Update `state/CANONICAL_STATE.md` and task/queue status on completion, including a clear note that this is auth-only (no billing yet) so a future task adding payment enforcement has accurate context.
13. Commit and push to `origin/master`. Do not touch the updater signing key or release artifacts.

## Explicitly out of scope
- Payment/subscription/billing integration of any kind (Stripe or otherwise) — separate future task once a processor is chosen.
- Password reset flow (nice-to-have, not required for this task — Supabase supports it but implementer should skip unless trivially easy to include; don't let it block the core login/signup/gate flow).
- OAuth providers (Google/GitHub sign-in) — email/password + magic link only for this task.
- Multi-account/team/org features.
