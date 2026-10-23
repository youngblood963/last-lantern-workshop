# Route 127 development

The permanent Route 127 source is in this repository under `route127/`, on branch [`route127-r12-cloud-backend`](https://github.com/youngblood963/last-lantern-workshop/tree/route127-r12-cloud-backend). Clone or pull this branch for development; ZIP transfers are no longer the handoff process.

Read [GitHub handoff and development workflow](docs/GITHUB_HANDOFF.md), [R12 deployment report](docs/R12_DEPLOYMENT_REPORT.md), and [local/runtime setup](docs/R12_SETUP.md).

| Directory | Purpose |
| --- | --- |
| `backend/` | R12 API Worker, actual development Wrangler config, migration, test harnesses |
| `online-game/` | Isolated game and same-origin account/cloud-save adapter; not deployed |
| `devtest/` | Established offline R11 development runtime, tests, and historical notes; no cloud adapter |
| `docs/` | Current handoff, schema evidence, testing results, and historical Phase 1 notes |
| `audit-evidence/` | Historical prototype evidence; not deployment source |
| `playtest/` | Existing public player build; unchanged |

The source package's `offline-r11/` was mapped into the existing `devtest/` directory. No duplicate offline game directory was created. Only the packaged removal of the embedded local QA switch was carried into existing `devtest/app.js`; it is a local testing switch, not account authentication. Other existing development files and history are preserved.

## Development backend

- Worker: `route127-r12-dev-api`
- API URL: https://route127-r12-dev-api.youngblood963.workers.dev
- Sole D1 binding: `DB` → `route127-dev` (`34ab2666-c124-487f-aed9-bb1809c95919`)
- Private remote secret: `AUTH_PEPPER`; never store its value in Git
- Mode: development snapshot backups; gameplay balances/items/turns are not server-authoritative

The isolated Worker and additive migration are deployed. Authenticated Cloudflare inspection confirms settings and schema. **Live endpoint acceptance is still blocked by the current task's outbound network policy.** Local backend, workerd, and browser tests pass; these are not live acceptance results.

## Tests

From the repository root, use Node 24 or newer:

```sh
cd route127/backend
npm test
node --test --test-isolation=none --test-reporter=spec tests/*.test.mjs
cd ../devtest
node tests/r11_integrity.cjs
node tests/road_balance.cjs
```

Playwright/Chromium browser checks and the explicit live development smoke test are documented in [GITHUB_HANDOFF.md](docs/GITHUB_HANDOFF.md). Credentials, local databases, certificates, runtime state and new ZIPs do not belong in Git.

## Boundaries

Keep work on development branches. Do not merge to main, alter the live website, deploy public game assets, or modify `route127-world` as part of this handoff. No automated deployment workflow was added. Future development deployment requires checking the Worker name and sole development D1 UUID before running any remote command.
