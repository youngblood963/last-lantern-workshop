# GitHub handoff — Route 127 R12

Updated October 23, 2026 (America/New_York).

Repository: https://github.com/youngblood963/last-lantern-workshop

Development branch: https://github.com/youngblood963/last-lantern-workshop/tree/route127-r12-cloud-backend

Project root: `route127/`. GitHub replaces ZIP transfers as the development source of truth. The branch retains repository main history; existing `route127/devtest/` and `route127/playtest/` locations remain. R12 backend, isolated online client, documentation and evidence are added alongside them. No content is deleted and main is not updated.

## Retrieve the project (Forge, Nuts, or another developer)

For a new checkout:

```sh
git clone --branch route127-r12-cloud-backend --single-branch https://github.com/youngblood963/last-lantern-workshop.git
cd last-lantern-workshop
```

For an existing checkout, first commit or stash your own work, then:

```sh
git fetch origin
git switch --track origin/route127-r12-cloud-backend
```

If that local branch already exists, use `git switch route127-r12-cloud-backend`, followed by `git pull --ff-only`. Run `git rev-parse HEAD` to record the version under test. Do not reset or force-push another developer's work. Contributors need GitHub repository access to push; anonymous users can read this public repository.

## Make and commit development changes

Work from the current development branch. Prefer a focused topic branch for each follow-up:

```sh
git switch route127-r12-cloud-backend
git pull --ff-only
git switch -c route127-your-change
# Edit files, run the relevant tests, and review the diff.
git status --short
git diff --check
git add -- route127/backend route127/online-game route127/docs
# Stage route127/devtest only if your task explicitly changes offline development.
git diff --cached --stat
git diff --cached
git commit -m "Describe the Route 127 development change"
git push -u origin HEAD
```

Open follow-up PRs against `route127-r12-cloud-backend`, not main. Do not merge into main or alter live/public routes without a separate release instruction. No CI deployment or website files outside the Route 127 development scope were changed in this integration. Do not stage the entire repository blindly. New archives, `.env*`, `.dev.vars*`, private keys, certificates, account/database exports, SQLite files, node_modules and `.wrangler/` state are excluded by the project .gitignore. Never place runtime secret values in documentation, source, test output or config vars. Test harnesses generate their credentials in memory; literal negative-test inputs are not real account credentials.

## Development Cloudflare configuration

The deployment source is `route127/backend/worker.mjs`; actual config is `route127/backend/wrangler.jsonc`.

| Setting | Development value |
| --- | --- |
| Worker name | `route127-r12-dev-api` |
| Endpoint | `https://route127-r12-dev-api.youngblood963.workers.dev` |
| Binding | `DB` |
| D1 database | `route127-dev` |
| D1 UUID | `34ab2666-c124-487f-aed9-bb1809c95919` |
| ENVIRONMENT | `development` |
| DEV_BACKUP_ENABLED | `true` |
| Compatibility | `2026-10-01`, `nodejs_compat` |
| AUTH_PEPPER | Existing private Worker secret; value never in Git |
| Assets | None deployed; API only |

CLOUDFLARE_API_TOKEN is provided privately by the managed environment and verified active. Read-only inspection confirmed the deployed binding and required secret metadata. Nothing was redeployed in this GitHub assignment. Never target `route127-world`, existing production Workers, production routes/DNS, or the live website.

`0001_accounts.sql` was applied directly through the D1 API, not the Wrangler migration ledger. The seven account/save tables, session index and immutable identity trigger match that migration. One historical players row remains preserved. Review actual schema before any future migration. Do not automatically reapply or assume a populated DB is empty based on the absent Wrangler ledger. The historical asset-enabled `wrangler.example.jsonc` is not the actual deployment config and still contains an intentionally unusable placeholder.

## Run automated tests

Use Node 24+. Backend runtime tests need no third-party Node dependencies:

```sh
cd route127/backend
npm test
# Show all nine named groups rather than the default two-file summary:
node --test --test-isolation=none --test-reporter=spec tests/*.test.mjs
cd ../devtest
node tests/r11_integrity.cjs
node tests/road_balance.cjs
```

For browser integration, provide Playwright and Chromium in your development environment. From `route127/backend`, set R127_DEV_CERT, R127_DEV_KEY, AUTH_PEPPER and R127_LOCAL_DB privately to local-only resources outside the checkout, then `npm run local`. In another terminal in that directory, run `node tests/browser-smoke.cjs`. Set R11_CHROMIUM if Chromium is not at /usr/bin/chromium. The local HTTPS runner serves the online game and API on one origin. Browser automation handles its local certificate only within its test context. Generated accounts live only in the selected local SQLite file. Never commit that file or the cert/key.

The older offline browser suite is `node tests/r11_browser.cjs` from `route127/devtest`. Its final disk-file navigation check is blocked by the current managed browser policy, so the full suite is not marked passed. No policy bypass is needed or approved; rerun it in a permitted offline environment.

Results for this integration are in GITHUB_QA_RESULTS.md, with raw outputs in GITHUB_*_OUTPUT.txt. Prior local workerd evidence is retained separately in R12_LOCAL_WORKERD_OUTPUT.txt.

## Remaining live acceptance

The current environment revision 8 still allows api.cloudflare.com but omits the development Worker hostname. Consequently no new live endpoint pass is claimed. A refreshed task must observe the exact Worker hostname in its effective allowlist before retrying.

Once available, from `route127/backend` run:

```sh
python tests/deployed-smoke.py https://route127-r12-dev-api.youngblood963.workers.dev
```

This is an explicit development write test, not a read-only health check. It creates two generated development accounts/snapshots, checks thirty HTTP behaviors, revokes sessions and discards credentials. Records remain in route127-dev; it never cleans up historical data. Wait at least one minute between runs due to per-IP auth throttling. Check actual deployed CPU/time allowance for scrypt, persistence across independent sessions, and unauthorized access denial. Local workerd passes do not establish the deployed account's CPU allowance. Do not purchase/upgrade a service without authorization.

The adapter uses same-origin `/api/*` requests and Secure HttpOnly cookies. The deployed API alone does not serve a game. The local HTTPS arrangement is tested; hosted integration still needs a private development same-origin frontend/API arrangement and two physical-device acceptance. Do not use permissive CORS, modify the live website, or publish a player build as a workaround.

## Future development deploys

Only when a development deployment is requested, first retrieve the latest branch and run tests. From `route127/backend`, compare the config above with authenticated Cloudflare settings. Ensure DB is the existing development UUID, preserve AUTH_PEPPER, and confirm no assets or production routes have been added. Use the private credential binding; never paste a token into a command, config file or commit.

```sh
npx wrangler@4.152.0 deploy --dry-run --config wrangler.jsonc
# After reviewing the dry run and within an authorized development update:
npx wrangler@4.152.0 deploy --config wrangler.jsonc
```

Do not rotate AUTH_PEPPER routinely: existing password hashes depend on it. Schema changes require a separate reviewed additive migration and a private backup of populated dev data; never commit database exports. After deployment, repeat health and explicit development smoke checks. Retain the prior Worker version for rollback; do not roll back schemas destructively.

Next milestone: run deployed API acceptance in a refreshed environment, then establish private same-origin hosted UI testing and physical cross-device recovery/conflict acceptance. Snapshots remain untrusted development backups; authoritative gameplay/economy operations are a later milestone.
