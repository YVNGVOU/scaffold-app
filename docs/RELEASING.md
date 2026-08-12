# Releasing Scaffold (desktop app updates)

This documents the manual, repeatable process for publishing a new signed
Scaffold desktop release to GitHub Releases so the in-app "Check for Updates"
button (Tauri's official updater plugin) can find it.

This is **not automated** (no CI/CD) by design — see TASK-015. Each release is
a deliberate, manual act.

## One-time setup (already done)

- Updater signing keypair generated with `tauri signer generate`.
  - **Private key**: `apps/desktop/src-tauri/scaffold-updater.key` — lives only
    on this machine's disk, gitignored (see root `.gitignore`,
    `apps/desktop/src-tauri/*.key`). **Never commit this file.** No password
    was set on the key (empty password) for automation simplicity; if you
    rotate keys, decide deliberately whether to add one.
  - **Public key**: `apps/desktop/src-tauri/scaffold-updater.key.pub` — safe to
    commit, and its base64 content is already embedded in
    `apps/desktop/src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
  - If the private key file is ever lost, all previously published releases
    become unverifiable by the updater — you would need to generate a new
    keypair, update `pubkey` in `tauri.conf.json`, and publish a fresh release;
    existing installs cannot auto-update across a key rotation and would need
    to be reinstalled manually once.
- Updater endpoint configured in `tauri.conf.json`:
  `https://github.com/YVNGVOU/scaffold-app/releases/latest/download/latest.json`
  — this is GitHub's "latest release" permalink pattern, so it always resolves
  to whatever release is currently marked "latest" without needing to bump the
  URL per version.

## Steps for a new release (e.g. bumping 0.1.0 -> 0.2.0)

1. **Bump the version** in two places (must match):
   - `apps/desktop/src-tauri/tauri.conf.json` -> `"version"`
   - `apps/desktop/package.json` -> `"version"`

2. **Set the signing environment variables** in your shell (Git Bash / PowerShell), reading the private key file content:

   Bash:
   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat apps/desktop/src-tauri/scaffold-updater.key)"
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""   # empty, matches how the key was generated
   ```

   PowerShell:
   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content apps/desktop/src-tauri/scaffold-updater.key -Raw
   $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
   ```

3. **Rebuild** from `apps/desktop`:
   ```bash
   npm run tauri build
   ```
   With the env vars set and `bundle.createUpdaterArtifacts: true` in
   `tauri.conf.json`, Tauri automatically produces a detached `.sig` file next
   to each installer bundle under
   `apps/desktop/src-tauri/target/release/bundle/` (e.g.
   `nsis/Scaffold_<version>_x64-setup.exe` +
   `nsis/Scaffold_<version>_x64-setup.exe.sig`).

4. **Regenerate `latest.json`** with the new version, the new pub_date (ISO
   8601 UTC), the contents of the new `.sig` file, and a download URL matching
   the exact asset name you're about to upload:
   ```json
   {
     "version": "0.2.0",
     "notes": "<what changed>",
     "pub_date": "<ISO8601 UTC now>",
     "platforms": {
       "windows-x86_64": {
         "signature": "<contents of the .sig file>",
         "url": "https://github.com/YVNGVOU/scaffold-app/releases/download/v0.2.0/Scaffold_0.2.0_x64-setup.exe"
       }
     }
   }
   ```

5. **Publish the GitHub Release** (tag must match the version, prefixed `v`):
   ```bash
   gh release create v0.2.0 --repo YVNGVOU/scaffold-app \
     --title "v0.2.0" --notes "<summary of changes>" \
     apps/desktop/src-tauri/target/release/bundle/nsis/Scaffold_0.2.0_x64-setup.exe \
     apps/desktop/src-tauri/target/release/bundle/nsis/Scaffold_0.2.0_x64-setup.exe.sig \
     latest.json
   ```

6. **Verify**:
   ```bash
   gh release view v0.2.0 --repo YVNGVOU/scaffold-app
   ```
   and confirm `latest.json`, the installer, and the `.sig` are all listed as
   assets, and that GitHub marks this release "latest" (the endpoint URL in
   `tauri.conf.json` always points at whichever release GitHub currently
   considers latest).

7. Existing installs of Scaffold will now see the update when a user manually
   clicks "Check for Updates" — there is deliberately no automatic background
   check (see TASK-015 / `state/CANONICAL_STATE.md`).

## Notes

- Only the `windows-x86_64` platform target has been exercised so far (this
  project's dev environment is Windows). If macOS/Linux builds are added
  later, `latest.json`'s `platforms` object gains additional keys
  (`darwin-x86_64`, `darwin-aarch64`, `linux-x86_64`, etc.) following the same
  pattern — each with its own signature/url pointing at that platform's
  bundle asset.
- The MSI bundle (`msi/Scaffold_<version>_x64_en-US.msi`) is also produced and
  signed but is not currently referenced by `latest.json` — the NSIS
  installer is the one wired up as the Windows updater artifact. Both remain
  useful as direct-download installers.
