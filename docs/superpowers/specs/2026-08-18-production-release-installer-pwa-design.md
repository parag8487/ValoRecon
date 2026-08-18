# ValoRecon Production Release: NSIS Installer, Layout Optimization & Persistent Mobile Companion Design

**Date:** 2026-08-18  
**Status:** Approved  
**Target Version:** v1.0.0  

---

## 1. Overview & Goals

ValoRecon is an advanced tactical companion for VALORANT. This design establishes the complete production package encompassing:
1. **Windows NSIS Setup Installer:** Automated single-click installation (`ValoRecon_1.0.0_x64-setup.exe`), desktop shortcut generation, Start Menu registration, and clean uninstallation.
2. **Desktop Viewport & Layout Architecture:** Strict scroll padding and viewport sizing across desktop, laptop (13"–17"), and multi-monitor setups to eliminate content clipping.
3. **Persistent Mobile Companion (PWA + Instant QR Pairing + In-App Scanner):** Permanent one-time device pairing stored in `localStorage`, dynamic deep-link QR code generation on the desktop app, and an in-app mobile camera scanner.
4. **Production Deployment & Safety:** Safe, read-only Riot Lockfile RPC architecture compliant with Riot Games terms (zero anti-cheat evasion / zero input injection) and unified deployment build pipeline.

---

## 2. Windows NSIS Setup Installer

### 2.1 Installer Architecture
- **Self-Contained Installer:** `ValoRecon_1.0.0_x64-setup.exe` bundles all runtime dependencies (Tauri executable, embedded sidecar agent, frontend assets).
- **Zero End-User Prerequisites:** Players do not require Rust, Node.js, NSIS, or administrator rights.
- **Tauri Bundle Configuration (`src-tauri/tauri.conf.json`):**
  ```json
  {
    "bundle": {
      "active": true,
      "targets": ["nsis"],
      "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"],
      "windows": {
        "nsis": {
          "installMode": "currentUser",
          "createDesktopShortcut": "Always",
          "createStartMenuShortcut": true,
          "shortcutName": "ValoRecon",
          "languages": ["English"]
        }
      }
    }
  }
  ```

### 2.2 Installation Flow
1. User downloads `ValoRecon_1.0.0_x64-setup.exe`.
2. Executes installer without UAC prompts (`installMode: "currentUser"` installs into `%LOCALAPPDATA%\Programs\ValoRecon`).
3. Shortcut `ValoRecon.lnk` is placed on the Desktop and in Start Menu programs.
4. Application launches upon completion and registers an entry in Windows Add/Remove Programs.

---

## 3. Desktop Viewport & Layout Architecture

### 3.1 Layout Hierarchy
- **Shell Viewport (`.main-viewport`):** `display: flex; flex-direction: column; height: 100vh; overflow: hidden;`
- **Content Area (`.content-area`):**
  - Desktop (`min-width: 769px`): `flex: 1 1 0%; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 24px 28px 48px 28px;`
  - Mobile (`max-width: 768px`): `padding: 14px 12px calc(88px + env(safe-area-inset-bottom, 16px)) 12px;`
- **Coach Screen (`.coach-screen`):**
  - Desktop: Flex column filling available height with fixed bottom input bar.
  - Mobile: `height: calc(100dvh - 146px)`.

### 3.2 Clearance Guarantees
- Bottom action bars, save buttons in Settings, match round timelines, store cards, and coach query suggestions retain at least 48px of bottom scroll padding on desktop to prevent clipping.

---

## 4. Persistent Mobile Companion & QR Scanner

### 4.1 Progressive Web App (PWA)
- **Manifest (`web/public/manifest.webmanifest`):**
  ```json
  {
    "name": "ValoRecon Tactical Companion",
    "short_name": "ValoRecon",
    "start_url": "/#/companion",
    "display": "standalone",
    "background_color": "#0f1923",
    "theme_color": "#ff4655",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- **Mobile Home Screen:** Allows tapping "Add to Home Screen" in iOS Safari / Android Chrome for a full-screen, app-like experience.

### 4.2 Pairing Architecture & QR Deep-Linking
```
[ Desktop App Display ]
  ┌──────────────────────────────┐
  │   [ Dynamic QR Code ]        │ ── (1) Scan with Phone Camera / Google Lens
  │   Pairing Code: VALO99       │        OR (2) In-App Mobile Camera Scanner
  └──────────────────────────────┘                        │
                                                          ▼
                                            Opens Deep-Link:
                                            https://<host>/#/companion?code=VALO99&token=<auth>
                                                          │
                                                          ▼
                                            Auto-Connect & Store Session in localStorage
                                                          │
                                                          ▼
                                            Permanent Auto-Reconnect on Future Launches
```

### 4.3 In-App Mobile QR Camera Scanner
- **Camera Integration:** Uses browser `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` to scan the desktop screen directly from within the companion web app.
- **Auto-Handshake:** Automatically parses the QR code content and verifies the pairing code without typing.
- **Manual Fallback:** Retains the 6-digit text code input for devices without camera access.
- **Persistence (`localStorage`):**
  - Key: `valorecon_companion_session`
  - Payload: `{ deviceId: string, pairingCode: string, token: string, host: string, pairedAt: number }`

---

## 5. Security, Riot Compliance & Safety

- **Read-Only Local RPC:** ValoRecon interacts only with local Riot Client Lockfile endpoints (match state, player loadout, store offers) via loopback HTTP/HTTPS.
- **No Anti-Cheat Evasion / No Input Injection:** Operates strictly outside the game process without injecting keystrokes, modifying memory, or interfering with Riot Vanguard.
- **Token Security:** Ephemeral launch tokens and encrypted session headers prevent unauthorized local network discovery.

---

## 6. Build, Release & Deployment Pipeline

### 6.1 Unified Build Commands
- `npm run build:all` — Type-checks and builds both backend server (`server/dist/`) and frontend web app (`web/dist/`).
- `npm run release:bundle` — Invokes Tauri NSIS bundler to produce `ValoRecon_1.0.0_x64-setup.exe` and `valorecon.exe`.
- `npm run release:verify` — Validates TypeScript, CycloneDX SBOM (`dist/sbom.json`), and cryptographic checksums (`dist/SHA256SUMS.txt`).

### 6.2 Publication Assets
- `ValoRecon_1.0.0_x64-setup.exe` (Windows NSIS Setup Installer)
- `valorecon.exe` (Standalone Portable Binary)
- `update.json` (Ed25519-Signed Updater Manifest)
- `sbom.json` (CycloneDX 1.5 SBOM)
- `SHA256SUMS.txt` (SHA-256 Checksums)
