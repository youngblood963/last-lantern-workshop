> Historical Phase 1 candidate notes. R12 current status, deployment, verification, and limitations are in [R12_DEPLOYMENT_REPORT.md](R12_DEPLOYMENT_REPORT.md) and [R12_SETUP.md](R12_SETUP.md). Earlier credential/browser/deployment blockers below describe the prior run.

# Cloudflare configuration and private test setup

No deployment or remote SQL apply has been performed. Do not create a new Worker or D1 database as a shortcut.

## Existing resources to verify

Production: route127-api and route127-world (read-only audit only).

Development target: route127-dev-api with binding DB pointing to the EXISTING route127-dev database. The actual account/database IDs must come from authenticated Cloudflare inspection. The placeholder in wrangler.example.jsonc is deliberately not deployable.

## Configuration contract

| Setting | Requirement |
| --- | --- |
| name | Existing route127-dev-api, after checking its current source/routes |
| DB | Existing route127-dev D1 binding, verified by actual ID and schema |
| ENVIRONMENT | development; handler refuses other values |
| DEV_BACKUP_ENABLED | true only in the isolated private test environment after migration; example defaults false |
| AUTH_PEPPER | Private cryptographically random secret, at least 32 characters, set using the existing Worker's secret mechanism; never in vars, source, ZIPs, logs, or browser code |
| compatibility | Candidate uses 2026-10-01 plus nodejs_compat for node:crypto; verify actual workerd support and scrypt CPU/memory budget before runtime acceptance |
| ASSETS | online-game directory; Worker and game served from the same origin |
| workers_dev / preview_urls | false by default; do not enable public access to make a test pass |

Use `wrangler.example.jsonc` as a comparison template. Do not overwrite the existing deployment configuration before examining it. No deploy command or token is embedded.

This candidate adds `/api/health`, `/api/register`, `/api/login`, `/api/logout`, `/api/me`, `/api/character`, and GET/POST `/api/save`. Existing probe routes `/players` and `/register` are not part of the new authenticated API. Do not replace a live dev deployment without planning that route transition. The historical probes are preserved only as evidence and are never auto-enabled.

Use a private same-origin development hostname or an authenticated private tunnel to the local HTTPS runner for actual device tests. Reuse existing private routes/access policies where available. If private routing is not already configured, resolve that with the project director before publishing anything. Do not put this adapter on the public playtest page or send cross-origin cookies from lastlanternworkshop.com to workers.dev. The adapter intentionally does not support that topology.

Preserve current Worker source/config and privately export dev D1 before a reviewed migration/deployment. Inspect existing access policies if 403 persists; do not bypass them by opening public routes. This package does not prove the identity or health of either remote Worker.

## Local-only runner

Node 24+ provides the local SQLite test binding. From backend/, run npm test for automated verification. For a UI test, provide locally trusted HTTPS certificate/key paths with R127_DEV_CERT/R127_DEV_KEY, a private AUTH_PEPPER, and optional R127_LOCAL_DB, then npm run local. The runner binds only 127.0.0.1:8787 and serves the isolated game plus API. It is a local test convenience, not a production server or a D1 emulator.

The account UI uses browser fetch with same-origin credentials. Secure cookies require HTTPS. The Worker adds a same-origin CSP and refuses foreign Origin requests; static scripts/styles/images must remain on the same test origin. Its login form does not put passwords in localStorage. Account cookies are HttpOnly. Only pending snapshot backups and existing game saves are retained locally.

## Official references checked during implementation

- https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/
- https://developers.cloudflare.com/d1/worker-api/d1-database/
- https://developers.cloudflare.com/workers/static-assets/binding/

Local Node tests do not establish deployment runtime compatibility. Verify password hashing latency, CPU allowance, body limits, D1 batch rollback/changes metadata, session cookies, and private route behavior against the actual development Worker.
