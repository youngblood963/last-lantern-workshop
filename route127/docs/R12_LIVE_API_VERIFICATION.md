# R12 live API verification

Verified October 23, 2026 (America/New_York), against the existing
`route127-r12-cloud-backend` source and deployed development Worker only.
This report supersedes the earlier live-network blocker in the deployment report.

| Check | Result |
| --- | --- |
| Worker HTTPS connectivity | PASS: `/api/health` returns 200 and development JSON |
| D1 connectivity | PASS: live account/session/character/save reads and writes |
| Binding | PASS: deployed `DB` targets `route127-dev`, UUID `34ab2666-c124-487f-aed9-bb1809c95919` |
| Schema | PASS: all seven tables, session index and identity trigger match migration SQL |
| Authentication | PASS: registration, login, independent sessions, logout and revocation |
| Character persistence | PASS: creation, retrieval and exact saved snapshot recovery in a separate login session |
| API security | PASS: unauthorized access, other-player read/write, forged identity, foreign Origin, invalid input, duplicate registration, rate limiting |
| Automated backend/adapter tests | PASS: nine named groups, zero failures |
| Live smoke test | PASS: 30 checks, zero failures |

All implemented routes were exercised: GET `/api/health`, POST `/api/register`,
POST `/api/login`, POST `/api/logout`, GET `/api/me`, POST `/api/character`,
and GET/POST `/api/save`. Live checks also cover secure cookie attributes,
idempotent retries, stale revision conflicts, oversized bodies and content types.
Remote configuration includes AUTH_PEPPER as a secret and enables development backups.
No authentication/configuration error prevented these operations.

The initial Python probe received Cloudflare error 1010 before reaching the
Worker; curl and an explicitly identified probe succeeded. The smoke test now
sets `User-Agent: Route127-Development-Verification/1.0`. No Worker code,
security settings, secrets, schema, or deployment needed changing.

Two generated development accounts and their character/snapshot records remain
as test evidence. Sessions were logged out and credentials discarded. No existing
data was deleted, no destructive SQL ran, and no production resource or
`route127-world` was modified. No game assets were deployed.

Reproduce from `route127/backend`:

```sh
node --test --test-isolation=none --test-reporter=spec tests/*.test.mjs
python tests/deployed-smoke.py https://route127-r12-dev-api.youngblood963.workers.dev
```

Allow at least one minute between live runs because authentication throttling is
per caller IP. The live run validates ordinary request completion, not load/CPU
headroom, long-term session expiry, remote race stress, browser restart or physical devices.

Next: provide an isolated private HTTPS origin serving the existing online-game
client and routing relative `/api/*` requests to this development Worker. Preserve
same-origin Secure HttpOnly cookies and Origin checks; do not add permissive CORS.
Then accept the complete user-driven character creation, automatic save, browser
restart, two-device recovery and conflict journey. The adapter already exists and
passes local integration tests; the deployed Worker is API-only.

Snapshots remain untrusted development backups. Server-authoritative balances,
inventory, turns/gameplay operations and global Legendary ownership are not
implemented; authority rows are reserved and unready. Password recovery, MFA and
account deletion also remain unimplemented. These features were not added here.
