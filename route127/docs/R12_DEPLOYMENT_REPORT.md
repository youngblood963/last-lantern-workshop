> GitHub is now the source handoff: see [GITHUB_HANDOFF.md](GITHUB_HANDOFF.md) and [GITHUB_QA_RESULTS.md](GITHUB_QA_RESULTS.md). ZIP-transfer/output-mount notes below describe the earlier packaging task and no longer block source access. Historical package offline-r11 maps to repository devtest.

# Route 127 R12 — development deployment report

Updated October 23, 2026 (America/New_York).

**Deployment and additive migration completed. Live endpoint acceptance is BLOCKED by the execution environment network policy. Do not interpret local passes as live passes.**

## Development resources

- Worker: `route127-r12-dev-api`
- Development API URL: https://route127-r12-dev-api.youngblood963.workers.dev
- D1: `route127-dev`, UUID `34ab2666-c124-487f-aed9-bb1809c95919`
- Authenticated Cloudflare settings confirm one D1 binding, `DB`, to this UUID.
- Environment is `development`; `DEV_BACKUP_ENABLED=true`.
- `AUTH_PEPPER` was generated privately and stored as a Worker secret. Its value is absent from source, logs, and this package. Remote binding metadata confirms its presence; local runtime verifies the contract.
- No game assets were deployed. `/` has no game page; health is at `/api/health`.
- Only the new R12 Worker was uploaded. Existing `route127-dev-api`, production Workers, production database `route127-world`, DNS, routes, and the live website were not modified. No paid subscription or service was added.

## Database verification and migration

Authenticated inspection found the historical `players` table, Cloudflare-managed `_cf_KV`, and one historical player row. No application schema name conflicted with the additive migration.

`backend/migrations/0001_accounts.sql` was applied directly using the D1 query API, exclusively against the verified development UUID. All ten statements succeeded. The seven new tables are `r127_accounts`, `r127_sessions`, `r127_characters`, `r127_snapshots`, `r127_authority`, `r127_receipts`, and `r127_auth_limits`. `r127_session_owner` and `r127_identity_immutable` were created. All nine application SQL definitions were compared with an isolated SQLite application of the migration and matched exactly. The historical players row count remained one. Migration SQL does not update, alter, delete, or claim historical records. No player row contents were retrieved or exported.

Before/after tables, indexes, triggers and SQL are recorded in R12_SCHEMA_BEFORE.md and R12_SCHEMA_AFTER.md, including Cloudflare-managed and historical objects. This direct migration did not create a Wrangler migration history row. Future Wrangler application may list the migration as pending; its CREATE IF NOT EXISTS statements are idempotent, but review the actual schema before any reapplication.

## Verification results

| Check | Result and scope |
| --- | --- |
| Cloudflare authentication | Active token, authenticated development D1 and Worker inspection succeeded |
| Remote DB binding | Correct sole binding confirmed from deployed settings |
| Remote migration | Applied; definitions and preserved historical count verified |
| Wrangler 4.152.0 deploy dry run | Passed; nodejs_compat module bundled, DB and variables validated |
| Node 24.19.0 backend and adapter | Nine groups passed, zero failed; real SQLite and separate R11 JavaScript realms |
| Local Cloudflare workerd | Thirty HTTP checks passed against local D1, including real scrypt runtime support |
| Real Chromium online client | Six integration groups passed over local HTTPS; two independent contexts, protected cookies, character linking, automatic save, independent cloud recovery, reload, logout, mobile width, no JS errors |
| R11 integrity | Passed; baseline buying and selling values unchanged |
| Road balance | Passed; 12,000 segments, 2,352 scenario checks, combat/commands/save checks |
| Existing full R11 browser suite | Reached its final file:// entrypoint assertion, then browser policy blocked disk-file navigation. Overall suite not passed; no bypass attempted |
| Deployed health/auth/save API | NOT VERIFIED: HTTPS proxy tunnel to the Worker hostname returned 403 before reaching the Worker |
| Actual remote CPU/latency, remote transaction races, physical devices | NOT VERIFIED |

Detailed local check output accompanies this report. Generated local test credentials stayed in memory; local databases, certificates, cookies, keys, peppers and browser state are excluded from the package. No live test accounts were created, because the deployed host could not be reached.

## Endpoint coverage

`GET /api/health`, `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`, `POST /api/character`, and `GET/POST /api/save` all passed local Cloudflare runtime HTTP tests. Checks include duplicates, wrong passwords, independent sessions, permanent server identity, single-character ownership, save/load fidelity, revision conflicts, idempotent replay, other-account read/write denial, malformed JSON, invalid snapshots, forged identity, oversized body, wrong content type, foreign Origin, authentication throttling, logout and revocation. Local Node tests additionally exercise session expiry, transaction rollback, DB outage, concurrent requests, production/disabled-backup guards, pending retries and financial journals.

None of these endpoints is reported as live-tested. Run `python backend/tests/deployed-smoke.py https://route127-r12-dev-api.youngblood963.workers.dev` after allowing this hostname. This opt-in test creates two disposable development accounts/snapshots, performs thirty checks, revokes sessions, and discards credentials. Records remain as development test evidence; no automatic deletion is attempted. Wait a minute between repeated runs because auth attempts share an IP rate limit.

## Game integration

The existing adapter uses relative `/api/*` requests and same-origin Secure HttpOnly cookies. Its complete local HTTPS save/load journey works in real Chromium and in the VM integration suite. Offline scripts, game balance, quests, combat, inventory, and story were not changed. No new player-facing game build was published.

The deployed Worker is API-only to respect the no-player-build requirement. Opening `online-game/index.html` from disk or serving it on another origin does not integrate it with the deployed API. Completing hosted integration requires an isolated private same-origin development host that serves the game and forwards `/api/*` to this Worker, with appropriate private access controls. Do not enable permissive CORS or reuse the live website as a shortcut. The local HTTPS runner remains the working development UI arrangement. Physical cross-device and browser-restart recovery remain acceptance tasks.

## Outstanding issues and next milestone

1. The user reports publishing the Worker hostname allowlist update. This task now observes environment revision 7 as current/enforced, but its effective allowed hosts still omit `route127-r12-dev-api.youngblood963.workers.dev`; the normal proxy health request still receives a tunnel 403. A refreshed task/environment with the hostname in its observed effective policy is required for live endpoint acceptance. No bypass was attempted. Live checks must pass before declaring the backend functional online.
2. Verify actual remote authentication CPU/time limits and memory allowance. Local workerd accepts scrypt but cannot establish the account's deployed request budget. No paid upgrade is authorized or attempted.
3. Complete private same-origin hosted UI routing and two physical-device acceptance, without publishing a new public player build.
4. Existing scope limits remain: snapshots are untrusted development backups; balances/inventory/turns are not server-authoritative. Authority rows remain separate and unready. Password recovery, MFA, account deletion, globally authoritative Legendary ownership, and authoritative gameplay operations are not implemented.
5. The original file:// browser regression check is blocked by managed-browser policy; retest in a permitted offline browser environment.
6. The environment's designated chat-download output path is unavailable on its read-only filesystem. A credential-free ZIP is staged under /workspace/work/r12 for transfer once an output mount is available.

Recommended milestone: finish live API acceptance, establish private same-origin development UI access, and complete cross-device persistence/conflict recovery before building server-authoritative gameplay operations.

## Final handoff checks — October 23

The ZIP was rebuilt after checking configuration, migration/schema evidence, all local test outputs, source hashes, and credential exclusions. Archive validation checks unique entry names, safe relative paths, CRC integrity, and SHA-256 for every packaged source/document except the manifest itself. Local runtime state, certificates, databases, secrets, caches and node_modules are excluded. The source package includes explicit local-browser and deployed-development smoke test scripts. No further deployments, production changes, or remote database writes were made during this handoff.

The final archive is staged at `/workspace/work/r12/Route127_R12_CloudBackend_Development.zip`. The task has no file-upload/attachment tool, and its designated chat-download output path `/codex/browser/projectless/0001-files-mentioned-by-the-user-uploaded-file-pointe/output` is absent and cannot be created on the read-only root filesystem, even through the approved execution route. The file is ready, but a downloadable chat attachment cannot be produced from this task. A file-export-capable environment/output mount is needed; no public source-hosting workaround was used.
