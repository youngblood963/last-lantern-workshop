> Historical Phase 1 candidate notes. R12 current status, deployment, verification, and limitations are in [R12_DEPLOYMENT_REPORT.md](R12_DEPLOYMENT_REPORT.md) and [R12_SETUP.md](R12_SETUP.md). Earlier credential/browser/deployment blockers below describe the prior run.

# Backend status — Phase 1

Baseline v55.5 R11; October 22, 2026, America/New_York.

**Status: locally tested development implementation; Cloudflare acceptance blocked. Definition of Done NOT met.**

## Infrastructure audit

| Resource | Evidence obtained in this run | Remaining verification |
| --- | --- | --- |
| route127-api | Existing baseline notes identify this production Worker; read-only HTTP request returned 403 in this environment | Actual availability, account ownership, deployed source, routes, bindings, and permissions |
| route127-world | Named in the work order and baseline audit notes | Existing database ID, schema, deployment bindings, and production isolation |
| route127-dev-api | Recovered earlier fixed registration Worker from the user's files; current read-only HTTP request returned 403 | Whether recovered code matches deployment; account ownership, routes, bindings, secrets, CPU budget |
| route127-dev | Recovered prototype expects binding DB and players.auth_hash | Actual database ID, complete schema, migration history, constraints, and data |
| Shared World Probe | Recovered probe archive plus current public repository HTML/JS | Live Worker/D1 behavior cannot be inferred from these files |
| shared-world-dev.js | Current public repository source recovered and hashed | Prototype is keyed by slot:name and uses client-issued sw IDs/tokens; unsafe as permanent account identity |
| Public repository infrastructure search | Recursive GitHub main tree returned truncated=false; only three probe/adapter paths matched infrastructure filenames | No wrangler, migration, SQL, or Worker path found by this filename audit; this is not authenticated deployment inspection |
| R11 runtime | Inspected full development archive, save/load chain, identity/bank loader, casino journals | Real-browser and deployed D1/workerd regression testing |

The recovered historical Worker supports metadata registration and public player scanning. It hashes a client token, but accepts client-created IDs. It has no login/password account model, account-to-character relation, or complete save API. The recovered ZIP has one Worker JS file and no SQL/config/migrations. Existing players must not be automatically claimed based on names or these old tokens.

The public-source checksums and repository search output are in `audit-evidence/`. A 403 from this environment is not evidence that the Workers are down or that D1 is bound correctly.

## Implemented and tested locally

- Registration and sign-in with normalized unique login names. Passwords use salted scrypt (N=16384, r=8, p=5) plus a server secret pepper. Test credentials are generated only at test runtime.
- Random 256-bit sessions stored as hashes; seven-day expiry; Secure, HttpOnly, host-only, SameSite=Strict cookies; logout revokes the current session. Login creates a new session, preserving other device sessions.
- Exact same-origin checks on state-changing requests, no permissive CORS, strict JSON parsing, bounded streamed request body, bounded snapshot complexity, unsafe-key rejection, basic snapshot/name validation, and hashed IP/login authentication throttling.
- One character per account via a database UNIQUE constraint. Immutable server-issued character IDs with a database trigger preventing ID/ownership updates. All character reads/writes resolve the owner from the session; supplied account IDs or character IDs cannot select another account.
- Mutable character display name committed atomically with its snapshot. Existing normal gameplay rename mechanics remain; globally unique display names and server-authoritative rename fees are not implemented.
- Full schema-38 R11 development snapshot backup, preserving player statistics, equipment/inventory, flags/quests, Factory, Seaport, recruitment, crime, turns/refill data, road state, and active combat data. No lossy field-by-field reconstruction of the player object.
- Local bank period and casino journals travel with snapshots so an older browser journal does not override cloud recovery. Cloud IDs survive R11's existing local identity migration.
- Existing save hooks plus five-second fallback, serialized requests, durable pending requests, retries with stable IDs, revision compare-and-swap, atomic database batch, and idempotency receipts. A stale save gets 409 and pauses sync rather than overwriting newer data.
- Local manual saves retained. Cloud load creates a local recovery record before replacing its rolling autosave. Loading a different local slot pauses cloud sync; identity mismatch also blocks uploading a different local character.
- Production environment flag fails closed. Snapshot writes require explicit development opt-in. Configuration defaults keep public Workers/preview URLs disabled.

## Important scope limits

**Snapshots are untrusted development backups.** Their balances, inventory, quest rewards, clocks, and turn counts originate in R11's browser simulation. The server validates shape/ownership/revision, not the legitimacy of every gameplay action. A manipulated client can alter its own backup. Those values NEVER update the separate server authority record, whose authority_ready remains 0. This does not launch an authoritative economy or claim anti-cheat.

Server-owned balances/turns/inventory require authenticated gameplay operations and a vetted migration policy. Replacing this with 'accept the browser balance' would violate the work order. The separate authority table intentionally has no client mutation endpoint. Global Legendary ownership and its local registry do not become portable global ownership in this phase; the existing local Legendary registry is not migrated or reinterpreted as global ownership.

Other limits: no password reset/recovery, MFA, email verification, account deletion, public moderation, server-enforced rename fees, server-controlled refills, or production rollout. Login uniqueness prevents duplicate logins; it cannot establish one real human per account. Abrupt browser termination can lose changes made since the last local/cloud checkpoint. A pending save survives restart after it has been written locally. Keep local recovery copies until acceptance testing is complete.

## Exact blockers

1. No authenticated Cloudflare connector was available; a Cloudflare plugin search returned no matching result.
2. No CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN variables were present, and Wrangler was not installed. No existing D1 ID, binding, schema, or deployed Worker configuration could be authenticated.
3. Both Worker root checks returned HTTP 403 from this execution environment. No remote write was attempted.
4. No Chromium binary was available. Browser installation failed with an invalid/truncated downloaded archive. Real-browser layout, cookie behavior, restart, and physical cross-device testing remain unverified.

Needed next: authenticated read-only inspection of the existing dev Worker/config and route127-dev schema, followed by an isolated private development setup with that existing DB, AUTH_PEPPER as a private Worker secret, and same-origin test game/API routing. Keep all credentials outside chat packages. See CONFIGURATION.md. After runtime tests pass, complete the manual acceptance matrix on two actual devices. Do not call Phase 1 done until those checks pass.
