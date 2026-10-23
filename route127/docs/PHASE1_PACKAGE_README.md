> Historical package README. The package directory offline-r11 maps to repository directory route127/devtest. Current instructions: ../README.md and GITHUB_HANDOFF.md. ZIP-transfer notes are historical; GitHub is now the source handoff.

# Route 127 R12 — Cloud Backend Development

An isolated API Worker has been deployed and route127-dev migrated additively. **Live endpoint acceptance is blocked by this execution environment's network policy and remains incomplete.**

Read [the R12 deployment report](docs/R12_DEPLOYMENT_REPORT.md) and [setup instructions](docs/R12_SETUP.md) first. Backend/adapter tests, local Cloudflare runtime checks, and local HTTPS browser integration pass. No player-facing game build or production changes were published. Snapshots remain untrusted development backups.

## Historical Phase 1 candidate README

# Route 127 — Online Backend Phase 1 development candidate

Baseline: v55.5 R11. Prepared October 22, 2026 (America/New_York).

**Implementation is ready for development review. Phase 1 is NOT complete under the work order's Definition of Done.** No Cloudflare deployment, remote migration, production change, or live playtest change was made.

Read `docs/BACKEND_STATUS.md` first; it supersedes historical backend notes retained in offline-r11/. It distinguishes implemented local behavior, incomplete authority, and blocked verification.

## Package layout

- `offline-r11/`: existing R11 development runtime and regression tests. No cloud script is loaded here. The embedded QA menu access value was removed; a local QA setup can supply `globalThis.ROUTE127_QA_ACCESS_CODE` before app.js. This is a local test switch, not account authentication. The original source remains in the supplied baseline archive.
- `online-game/`: isolated development game. It adds the account/backups panel and accepts server IDs in the existing local identity loader. Normal character creation and gameplay remain R11.
- `backend/`: development-only Worker candidate, additive SQL migration, configuration template, local HTTPS runner, and automated tests.
- `audit-evidence/`: recovered prototype code and public repository integration files. Historical evidence only; do not deploy these prototypes.
- `docs/`: status, schema/migration plan, configuration, testing, and Phase 2 recommendations.

## Run local tests

Use Node 24 or later. The backend tests have no third-party runtime dependencies:

```sh
cd backend
npm test
```

The tests use real SQLite, actual password hashing, and the Worker request handler. Integration tests execute the actual R11 scripts and adapter in separate JavaScript realms with independent local storage and cookies. They use a DOM test double. They do not establish real-browser, Cloudflare D1/workerd, or physical-device acceptance.

For a local HTTPS UI session, set `R127_DEV_CERT` and `R127_DEV_KEY` to a locally trusted development certificate/key, and set `AUTH_PEPPER` to a newly generated private random value of at least 32 characters. Set `R127_LOCAL_DB` to a private local SQLite path if desired. Then, from `backend/`, run:

```sh
npm run local
```

Open `https://localhost:8787`. Test accounts and snapshots live only in the local SQLite file. Do not put that database, certificate, key, pepper, cookies, or accounts into a deliverable or repository. `online-game/` must be served with its same-origin backend; opening its HTML directly from disk does not enable cloud saving.

## Development flow

1. Register a test account in the development panel.
2. Use the existing R11 character creation flow, or explicitly load a local test character on this isolated origin.
3. Choose **Use current character permanently** and confirm. The server creates one character row for this account and issues its permanent ID. This is a development snapshot import, not approval of that character's economy.
4. Play normally. Existing saves remain enabled. Existing save helpers schedule a cloud backup; a five-second polling fallback captures other changes. Cloud saves are serialized and debounced.
5. On another session/device, sign in and choose **Load cloud character**. The current local autosave and relevant journals are retained for recovery before loading the cloud snapshot.
6. A stale-device conflict pauses cloud saving. Keep/export local progress before explicitly choosing to reload cloud. Conflicting pending requests are archived locally; they are never silently merged into newer cloud state.

No updated Player ZIP is required: online code is isolated from the existing R11 Player and public tester pages. Do not upload this entire development package over the live site.
