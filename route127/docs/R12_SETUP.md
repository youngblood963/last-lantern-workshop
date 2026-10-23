# R12 setup and reproducibility

The checked-in `backend/wrangler.jsonc` describes the actual isolated API deployment, with route127-dev bound as DB and no assets. The disabled `wrangler.example.jsonc` is retained as the historical full same-origin asset template. Do not deploy that placeholder template.

Use Node 24+ and Wrangler 4.152.0. Supply CLOUDFLARE_API_TOKEN privately using the environment's credential mechanism. Never add API tokens or AUTH_PEPPER to vars, source, reports or archives. AUTH_PEPPER already exists remotely; preserve it on updates. Rotating it invalidates existing password hashes unless an explicit account migration is designed. New environments require a fresh random private value (at least 32 characters) through Wrangler's secret mechanism.

From backend/, run:

```sh
npm test
npx wrangler@4.152.0 deploy --dry-run
```

Nine named groups can be shown with `node --test --test-isolation=none --test-reporter=spec tests/*.test.mjs`. The default process-isolated runner summarizes two test files.

Inspect schema, binding, and ownership before any future deployment or migration. This run applied migration 0001 directly through D1's query API, so the Wrangler migration ledger does not record it. All schema DDL is idempotent, but verify existing definitions before reapplication. Back up any populated development application data privately before future schema changes. Never include account rows, salts, hashes, sessions or DB exports in deliverables. Never target route127-world.

For local UI testing, use the existing local HTTPS runner. Set R127_DEV_CERT, R127_DEV_KEY, AUTH_PEPPER, and R127_LOCAL_DB to private locally generated certificate/key/pepper/database resources outside this source directory. Run `npm run local`, then use https://localhost:8787. A self-signed certificate is suitable only for isolated automation with explicit test-browser TLS handling; manual sessions need locally trusted development certificates.

With Playwright and Chromium available and the local HTTPS runner active:

```sh
node tests/browser-smoke.cjs
```

Set R11_CHROMIUM if the Chromium executable is elsewhere. This test uses two independent browser contexts and ephemeral account credentials; it does not publish game assets or call the live Worker. The test bootstraps an isolated game character for integration, so a full user-driven character-creation journey and two physical devices still require acceptance testing.

After network policy permits the exact deployed hostname, run:

```sh
python tests/deployed-smoke.py https://route127-r12-dev-api.youngblood963.workers.dev
```

This explicit live test creates two generated development accounts/snapshots and never prints their credentials. Do not run it against production. Do not run repeated instances within one minute due to the IP authentication throttle. Check Worker runtime logs/metrics for CPU limits without logging request bodies, passwords or cookies.

The API is currently accessible on a dedicated workers.dev development hostname; no game assets are served. Preserve production routes and DNS. Hosted game testing needs a private same-origin frontend/API arrangement; keep the adapter's relative URLs and cookie protections. Do not add permissive cross-origin access.
