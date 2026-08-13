import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Plain substring matching would let a bare
// keyword like 'app' match inside unrelated words, or 'tray' match inside
// "betray", silently inflating scores on unrelated inputs.
const KEYWORDS = [
  'desktop app', 'desktop application', 'native app', 'electron', 'tauri',
  'wpf', 'winforms', 'win32', 'macos app', 'windows app', 'linux app',
  'cross-platform desktop', 'system tray', 'installer', 'msi', 'dmg',
  'auto-update', 'auto-updater', 'code signing', 'menu bar app',
  'qt', 'gtk', 'swiftui desktop', 'electron app', 'appimage',
  'notarization', 'notarize', 'flatpak', 'snap package', 'deb package',
  'nsis', 'squirrel.windows', 'sparkle framework', 'ipc bridge',
  'preload script', 'native module', 'menu accelerator', 'global hotkey',
  'multi-window app', 'taskbar app', 'dock icon', 'jamf', 'intune deployment',
  'silent install', 'unattended install', 'kiosk mode app',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const desktopDevelopmentDomain: DomainModule = {
  id: 'desktop-development',
  label: 'Desktop Development',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target operating systems (Windows/macOS/Linux) and minimum OS versions supported', category: 'constraint' },
    { text: 'App must have a clear install/update mechanism', category: 'functional' },
    { text: 'Local file/filesystem access must be scoped to what the app actually needs', category: 'constraint' },
    { text: 'App should follow native OS conventions for menus, window chrome, and shortcuts', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'target platforms',
      description: 'Which operating systems (Windows, macOS, Linux) the app must run on is unspecified',
      isResolved: (input) => /\b(windows|macos|mac os|linux|cross-?platform|multi-?platform)\b/i.test(input),
    },
    {
      field: 'update mechanism',
      description: 'How the app will be distributed and kept up to date (auto-update, manual download, app store) is unspecified',
      isResolved: (input) => /\b(auto-?update|auto-?updater|manual (download|update)|app store|microsoft store|mac app store|package manager)\b/i.test(input),
    },
    {
      field: 'local file access',
      description: 'What local filesystem/OS resources (files, hardware, notifications) the app needs to access is unspecified',
      isResolved: (input) => /\b(file (system|access)|local files?|hardware access|native api|system tray|notifications?)\b/i.test(input),
    },
    {
      field: 'packaging and distribution',
      description: 'How the app will be packaged and distributed (installer, store, direct download) is unspecified',
      isResolved: (input) => /\b(installer|msi|dmg|appimage|\.exe|package|distribut(e|ion)|code sign(ed|ing)?)\b/i.test(input),
    },
    {
      field: 'offline vs online requirement',
      description: 'Whether the app must work fully offline or requires a persistent internet/server connection is unspecified',
      isResolved: (input) => /\b(offline([- ]first)?|fully offline|no internet|without internet|requires? (an )?internet|online[- ]only|always connected|local[- ]only|no network)\b/i.test(input),
    },
    {
      field: 'admin/elevated privilege needs',
      description: 'Whether the app needs to run with admin/elevated OS privileges (e.g. for system-level access) is unspecified',
      isResolved: (input) => /\b(admin(istrator)? (rights|privileges|access)?|elevated privileges?|run as admin|standard user|no admin (rights|required)|sudo|root access)\b/i.test(input),
    },
    {
      field: 'existing codebase or greenfield',
      description: 'Whether this is a brand-new desktop app or a port/rewrite of an existing web or mobile app is unspecified',
      isResolved: (input) => /\b(greenfield|from scratch|new app|port(ing)? (of|from|the)|rewrite|migrat(e|ing) (the|our|an) (web|mobile) app|wrap(ping)? (an? )?existing (web|website))\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'application shell', dependsOn: [], note: 'Main window, native menu bar, and OS-level chrome' },
    { component: 'core application logic', dependsOn: ['application shell'], note: 'Business logic, local state management' },
    { component: 'local storage / OS integration', dependsOn: ['core application logic'], note: 'Filesystem access, local database, OS-native APIs (tray, notifications, clipboard)' },
    { component: 'packaging pipeline', dependsOn: ['core application logic'], note: 'Per-OS build/bundle step producing installers (MSI/DMG/AppImage)' },
    { component: 'code signing', dependsOn: ['packaging pipeline'], note: 'Sign binaries per-platform to avoid OS security warnings' },
    { component: 'auto-update service', dependsOn: ['packaging pipeline'], note: 'Mechanism to detect, download, and apply new versions' },
  ],
  technicalConsiderations: [
    { aspect: 'framework', note: 'Choose a native or cross-platform toolkit (Electron, Tauri, Qt, WPF, native Cocoa/Win32) matching the required platforms and performance budget', category: 'functionalRequirements' },
    { aspect: 'OS API surface', note: 'Identify which native OS APIs are needed (filesystem, notifications, tray, hardware) and confirm the chosen framework exposes them', category: 'functionalRequirements' },
    { aspect: 'binary size and startup time', note: 'Cross-platform frameworks (e.g. Electron) trade startup time and binary size for portability — set an explicit budget if this matters', category: 'preferences' },
    { aspect: 'update mechanism', note: 'Define an auto-update strategy (delta updates, background download, restart-to-apply) so users are not stuck on stale, unpatched versions', category: 'functionalRequirements' },
    { aspect: 'crash reporting', note: 'Add crash/error reporting appropriate for an offline-capable desktop context (no server-side logs by default)', category: 'preferences' },
    { aspect: 'per-OS build pipeline', note: 'Set up separate build/packaging steps per target OS, since compilation and native dependencies differ across Windows/macOS/Linux', category: 'constraints' },
    { aspect: 'IPC and process boundary', note: 'For multi-process frameworks (Electron main/renderer, Tauri host/webview), define which side owns filesystem and OS API access and what crosses the IPC bridge, to avoid granting the UI layer full native privileges', category: 'functionalRequirements' },
    { aspect: 'enterprise deployment', note: 'If the app targets managed corporate machines, confirm whether it needs silent/unattended install support for MDM tools (Jamf, Intune, Group Policy) rather than an interactive installer wizard', category: 'constraints' },
    { aspect: 'GPU and rendering backend', note: 'Clarify whether the UI relies on GPU-accelerated rendering (Chromium/WebView compositor) and whether it must degrade gracefully on machines with no/blocked GPU acceleration', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'native conventions', note: 'Follow each OS\'s native UI conventions (menu bar placement, keyboard shortcuts, window controls) rather than a one-size-fits-all design', category: 'functionalRequirements' },
    { aspect: 'window and multi-monitor behavior', note: 'Define window resize/remember-position behavior and multi-monitor/DPI-scaling support', category: 'preferences' },
    { aspect: 'offline-first interactions', note: 'Design flows assuming the app may run fully offline; avoid UI states that silently require network access', category: 'functionalRequirements' },
    { aspect: 'system tray / background behavior', note: 'Clarify whether the app should minimize to tray/menu bar or fully quit on window close, and make that behavior discoverable', category: 'preferences' },
    { aspect: 'first-run and update UX', note: 'Design a clear first-run install experience and a non-disruptive update prompt/progress indicator', category: 'preferences' },
    { aspect: 'keyboard-first workflows', note: 'Define global hotkeys and in-app keyboard shortcuts for power-user actions, and ensure they do not collide with OS-reserved or common app shortcuts', category: 'preferences' },
    { aspect: 'multi-window and focus handling', note: 'For apps that open multiple windows/panels, define how focus, always-on-top, and window-switching behave so users are not left hunting for a hidden window', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'code signing', note: 'Sign installers/binaries per-platform (Authenticode on Windows, notarization on macOS) to avoid OS security warnings and tampering risk', category: 'constraints' },
    { aspect: 'local file access scope', note: 'Scope filesystem access to only the directories the app actually needs; avoid unrestricted read/write access to the user\'s system', category: 'constraints' },
    { aspect: 'update channel integrity', note: 'Serve auto-updates over a verified, signed channel (HTTPS + signature check) to prevent a compromised update server from pushing malicious binaries', category: 'constraints' },
    { aspect: 'local data at rest', note: 'Encrypt or otherwise protect sensitive local data stored on disk (credentials, tokens, personal data), since desktop storage is more exposed than a managed server', category: 'constraints' },
    { aspect: 'privilege level', note: 'Run with the least OS privilege necessary; flag any requirement for elevated/admin permissions explicitly rather than assuming it', category: 'functionalRequirements' },
    { aspect: 'IPC/preload attack surface', note: 'In Electron-style apps, disable Node.js integration in the renderer and expose only a minimal, vetted API via a preload script/context bridge to limit what a compromised web layer (e.g. via remote content) can reach', category: 'constraints' },
    { aspect: 'native module and dependency supply chain', note: 'Native modules and third-party binaries run with full app privileges; pin versions and vet native dependencies since they bypass any sandboxing the runtime provides', category: 'constraints' },
    { aspect: 'clipboard and autofill exposure', note: 'Avoid leaving sensitive data (credentials, tokens) in the system clipboard longer than necessary, since other running apps on the same machine can read it', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'native look and feel', note: 'Decide whether the app should visually match native OS chrome or present a distinct branded UI shell, and apply that choice consistently', category: 'preferences' },
    { aspect: 'iconography', note: 'Design a proper app icon set at all required OS resolutions (including tray/menu bar variants) rather than a single generic icon', category: 'preferences' },
    { aspect: 'dark/light mode', note: 'Support the OS-level light/dark appearance setting so the app does not look out of place against the rest of the desktop', category: 'preferences' },
    { aspect: 'onboarding polish', note: 'Give the first-run/install experience the same design attention as in-app screens, since it sets the first impression', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'cross-platform parity', note: 'Test core flows on every target OS independently — behavior, shortcuts, and file paths commonly diverge between Windows/macOS/Linux', category: 'functionalRequirements' },
    { aspect: 'update path testing', note: 'Test the actual upgrade path from an old installed version to the new one, not just fresh installs', category: 'functionalRequirements' },
    { aspect: 'offline/no-network states', note: 'Test app behavior with no network connection, since desktop apps are often expected to work fully offline', category: 'constraints' },
    { aspect: 'permission-denied states', note: 'Test behavior when the OS denies a requested permission (filesystem, notifications) rather than assuming it is always granted', category: 'constraints' },
    { aspect: 'uninstall cleanliness', note: 'Verify uninstall removes app files/registry entries cleanly without leaving orphaned processes or data', category: 'preferences' },
    { aspect: 'DPI and display scaling', note: 'Test on high-DPI and mixed-DPI multi-monitor setups; UI scaling bugs (blurry text, misaligned tray icons) are a common desktop-specific regression', category: 'functionalRequirements' },
    { aspect: 'antivirus/SmartScreen false positives', note: 'Test unsigned or newly-signed builds against common AV engines and Windows SmartScreen, since unrecognized publishers are frequently flagged or quarantined', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs cross-platform scope',
      note: 'A very short delivery timeline stated alongside full cross-platform (Windows/macOS/Linux) support is high-risk — per-OS packaging, signing, and QA each add real time regardless of shared codebase.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(cross-?platform|windows,?\s*(?:and\s*)?macos|macos,?\s*(?:and\s*)?linux|all (?:three )?platforms)\b/i,
    },
    {
      aspect: 'no installer vs auto-update',
      note: 'Requiring an auto-update mechanism while also stating no installer/packaging step is infeasible — auto-updaters need a signed, packaged distribution to update in place.',
      category: 'constraints',
      triggerA: /\bno\s+(installer|packaging|package)\b/i,
      triggerB: /\bauto-?updat(e|er|ing)\b/i,
    },
    {
      aspect: 'no admin rights vs system-level access',
      note: 'Requiring the app to run without admin/elevated rights while also needing system-level features (global hotkeys intercepting other apps, kernel-level drivers, protected directory writes) is contradictory — those OS capabilities typically require elevated privilege.',
      category: 'constraints',
      triggerA: /\b(no admin (rights|access|privileges)|without admin|standard user only|non-?admin)\b/i,
      triggerB: /\b(kernel[- ]level|system[- ]level access|global hotkey|protected (directory|folder)|driver install)\b/i,
    },
  ],
};
