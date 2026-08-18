# Build, Release, and Update Specification

## Status and scope

This is the target release specification for ValoRecon. It describes work that must be implemented; it does not claim that Tauri, cloud services, CI, signing infrastructure, updater feeds, or SBOM/provenance publication exist today. The current repository is three independent npm projects: the root orchestrator, `server/`, and `web/`. The current verified baseline is `npm run build` at the root, `npm run build` and `npm test` in `server/`, and `npm run build` in `web/`.

The release unit is a signed Windows desktop installer containing the React UI and the Local Agent as a Tauri-managed sidecar, plus update metadata, signatures, checksums, SBOM, provenance, and release notes. Cloud services and a web/mobile companion are separate deployables and must never become prerequisites for local features.

## 1. Workspace migration

Before packaging, migrate the current three-project layout into one canonical application workspace without losing the existing behavior:

- Keep `server/` as the Local Agent source and `web/` as the shared UI until a deliberate workspace migration is reviewed. Do not silently convert the root to npm workspaces while changing runtime behavior.
- Add a Tauri desktop package at a stable, documented path, for example `desktop/` or `src-tauri/`, and keep its Rust lockfile and configuration under version control.
- Move shared request/response schemas into a versioned package or common source boundary. The web client currently duplicates server types in `web/src/api/client.ts`; build must consume one contract source after migration.
- Keep `server/data/` runtime state out of the executable tree. The target location is `%LOCALAPPDATA%\\ValoRecon\\` for AI configuration, autopick state, reports, feedback, logs, and migrations. Existing plaintext Gemini configuration is a launch blocker and must not be copied into an installer.
- Exclude `dist/`, `node_modules/`, `_build/`, local `.env` files, reports, caches, installers, certificates, private keys, and credentials from release inputs. Add an explicit repository policy check for this.
- Preserve Git history before refactoring. The audit reports zero commits and no remote, so creating an initial commit and a protected rollback point is a prerequisite, not an accomplished fact.
- A clean clone in a new directory must build without reading files outside the repository except declared tool caches and injected secrets.

Migration acceptance: a second Windows machine can clone the repository, install pinned dependencies, run the documented checks, and produce a release manifest containing no developer-specific absolute paths, usernames, or timestamps.

## 2. Reproducible Windows build

### Supported target

Initial target is Windows 10/11 x64. ARM64 is a separate target and must not be implied until the sidecar, WebView2/runtime policy, installer, and signing checks support it. Record minimum Windows version, architecture, WebView2 behavior, installer type, and upgrade policy in the release manifest.

### Pinned inputs

Pin and validate all build inputs:

- Node.js and npm versions; retain all three lockfiles until the workspace migration is complete.
- Rust toolchain, target triple, Cargo.lock, Tauri CLI, and Tauri framework.
- TypeScript, Vite, React, Express, `@google/genai`, and every transitive dependency. Replace the current `@google/genai: "latest"` before calling a build reproducible.
- Visual Studio Build Tools, Windows SDK, linker, WebView2 assumptions, and sidecar compiler.
- SBOM, signing, timestamp, checksum, provenance, and installer inspection tools.

A release build must use `npm ci`, never `npm install`, and fail if a lockfile changes. CI must record versions and lockfile hashes. Network access may fetch only declared lockfile inputs. A cache hit must be content-addressed and must not override the lockfile.

### Build interface

Implement one wrapper, with the final command documented once it exists. Until then, the current commands remain the baseline:

```bash
npm ci
npm ci --prefix server
npm ci --prefix web
npm run build
npm run build --prefix server
npm test --prefix server
npm run build --prefix web
```

The future release wrapper should perform, in order:

1. Validate version, target, environment, source revision, clean checkout policy, and lockfile state.
2. Install dependencies with `npm ci` and the pinned Rust toolchain.
3. Run formatting, lint, type checking, contract validation, unit tests, and integration tests.
4. Build the Local Agent in release mode for the exact Windows target.
5. Build the Vite UI with production configuration and no dev endpoints, test credentials, verbose debug mode, or secret-bearing source maps.
6. Stage the sidecar using the exact Tauri target-triple naming convention.
7. Build the Tauri installer and any explicitly supported portable artifact.
8. Inspect all final files, generate a normalized manifest, SBOM, provenance, and SHA-256 checksums.
9. Sign final executables/installer and update metadata.
10. Verify signatures and hashes after signing and after upload.

Rebuilding the same revision with identical pinned inputs must produce identical bytes where the toolchain permits. For unavoidable PE/installer nondeterminism, normalize timestamps and compare PE metadata, embedded version data, file lists, and component hashes; record the exact exception rather than declaring full reproducibility.

## 3. Tauri sidecar packaging

The Local Agent is a first-class component of the desktop release. It must not be a developer-built binary copied into `src-tauri` manually.

Requirements:

- Build one sidecar per supported target triple and include only the selected target in its bundle.
- Validate executable format, architecture, version, protocol version, expected entrypoint, and SHA-256 before Tauri packaging.
- Configure the Tauri external binary/resource path explicitly and test it from an installed application, not only `tauri dev`.
- Resolve runtime state from `%LOCALAPPDATA%\\ValoRecon\\`, never from `__dirname`, `dist/../../data`, or the install directory.
- Define sidecar startup arguments, environment inheritance, stdout/stderr capture, health handshake, startup timeout, crash detection, restart backoff, and graceful shutdown.
- Reject an incompatible sidecar protocol and surface a `VR-*` diagnostic code.
- Verify first launch, second-instance focus, quit, tray close, crash/restart, uninstall, upgrade, and stale-process cleanup.
- Ensure no orphan Agent remains after Tauri quit, forced close, failed update, or rollback.

Tauri CLI is currently absent, so adding and pinning it, creating the configuration, and implementing this packaging path are prerequisites, not current capabilities.

## 4. Configuration and environments

Use explicit environments: `local`, `ci`, `staging`, and `stable`. Runtime environment must not be inferred from branch names.

The configuration module must validate a schema before build and again at startup. Commit non-secret defaults; inject secrets from a local ignored file or CI secret provider. At minimum, separate:

- API and cloud base URLs;
- WebSocket/relay URL;
- OAuth/device client identifiers;
- updater feed URL, channel, and minimum version;
- feature flags, including `features.agentSelectAutomation`;
- telemetry/consent settings;
- allowed origins and CSP;
- `HOST`, `PORT`, `GEMINI_MODEL`, and test mode.

Local defaults remain loopback (`127.0.0.1:8799` for the Agent and Vite `:5173` for development). Staging uses staging services and a beta feed. Stable uses production services and a stable feed. The production build must exclude the development-only token bootstrap endpoint and permissive development CORS; add a test proving this.

Never package Gemini keys, Riot lockfile credentials, device secrets, OAuth client secrets, updater private keys, code-signing private keys, or test credentials. Riot tokens remain device-local and never enter the cloud or release artifacts.

External credential blockers must be reported precisely: Windows signing certificate, timestamp service, updater key, artifact storage, cloud OAuth client, cloud/relay deployment, staging database, Gemini test key, and Riot test machine/credentials. A missing blocker must fail only the dependent job with setup instructions; it must never be replaced with fabricated success or a checked-in secret.

## 5. CI jobs and gates

CI does not exist in the audited repository. Implement protected jobs with least privilege:

- `validate`: repository policy, lockfile policy, formatting, lint, TypeScript checks, Rust checks, schema validation, secret scan.
- `characterization`: current server build, current server 24-test baseline, web build, API shape snapshots.
- `unit`: server services, shared contracts, frontend components, and Rust/Tauri lifecycle units.
- `integration`: Local Agent, fake Riot transport, local auth, filesystem migration, cloud auth, device enrollment, relay, and WebSocket protocol.
- `build-windows`: clean Windows x64 release build and Tauri bundle.
- `reproducibility`: build the same commit twice and compare manifests, file lists, hashes, and normalized metadata.
- `supply-chain`: dependency audit, license policy, SBOM, provenance, and banned-secret scan.
- `security`: installer inspection, signature verification, CSP/config checks, auth negatives, and dependency advisories.
- `e2e-windows`: install and exercise the release-equivalent app on a clean Windows runner.
- `publish-staging`: upload immutable candidate artifacts and beta updater metadata.
- `promote-stable`: protected manual approval that promotes the exact staging digest without rebuilding.
- `rollback`: protected workflow that republishes a previously verified stable manifest.

Pull requests must run all deterministic checks. Version tags create immutable candidates. Stable promotion must reference an already verified staging digest, never compile different bytes. Release credentials should use OIDC or short-lived tokens where supported; release jobs must not write to source branches.

## 6. Signing and release artifacts

Use an organization-controlled Windows certificate in an HSM, cloud signing service, or protected signing host. The private key must never be on a normal build runner or in the repository.

Sign required executables/sidecar before bundling, then sign the final installer/portable executable after all content is final. Use a trusted timestamp. Verify certificate chain, publisher identity, EKU, timestamp, signature status, and expected certificate fingerprint. Record the fingerprint and tool version, never private material. Missing, expired, revoked, or untrusted signing material blocks release.

Each version/target/channel directory must contain:

- signed installer and optional portable artifact;
- sidecar/component record with target, version, and hash;
- updater metadata and detached updater signature;
- `SHA256SUMS` covering every distributable file;
- SPDX or CycloneDX SBOM for UI, server/sidecar, Rust, and bundled runtime dependencies;
- build manifest with version, commit, target, toolchains, lockfile hashes, and artifact hashes;
- provenance attestation linking artifact to source revision and CI run;
- release notes and compatibility statement.

Checksums are computed from final bytes and verified before and after publication. Do not claim public SBOM, SLSA level, provenance, or signing availability until the system is deployed and a clean machine verifies it.

## 7. Channels and updater signature flow

Maintain separate `staging`/beta and `stable` feeds. Stable clients must never consume staging metadata by default. Versions are immutable and never overwritten.

Updater flow:

1. Compute final payload hash and size.
2. Create canonical metadata containing version, platform, minimum supported version, channel, URL, hash, size, expiry, and release notes.
3. Sign metadata in a protected step with the updater private key.
4. Pin the public verification key in the app or use a separately authenticated key-rotation mechanism.
5. Client fetches over HTTPS, validates schema, host, channel, signature, expiry, version ordering, minimum version, hash, size, and platform.
6. Client downloads to a temporary path, verifies hash/signature, then atomically stages the update.
7. Shut down the Agent cleanly, install, restart, and report success/failure.

Reject unsigned/expired metadata, unknown keys, downgrade attempts, cross-channel responses, mismatched hash/size, unapproved redirects, and payloads for another architecture. Key rotation requires overlapping keys and emergency revocation documentation.

## 8. Compatibility and rollback

Every release declares Windows/architecture support, UI-Agent protocol range, cloud API/schema range, updater minimum version, data migration version, and downgrade policy. Startup must explain incompatible versions with a `VR-*` code.

State migrations must be transactional or backed up and verified. A failed update restores the previous executable and preserves diagnostics. The rollback runbook must cover feed rollback, artifact retention, signing/key incidents, cloud compatibility, schema rollback limits, and user communication. Never promise data downgrade safety without exercising it.

Promotion checklist:

- source revision/version immutable and approved;
- all current and new CI gates green;
- clean Windows installer works without developer tooling;
- sidecar and runtime state paths verified;
- signatures, checksums, SBOM, provenance, and release notes match;
- staging install, upgrade, cloud-offline, Agent crash/restart, and rollback tests pass;
- compliance decision in `docs/compliance.md` is signed before public distribution;
- stable points to the tested staging digest;
- prior known-good version and rollback owner recorded.
