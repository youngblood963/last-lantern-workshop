# R14 private online playtest

Target: `https://route127-r14-private-playtest.youngblood963.workers.dev`.
This is a separate development Worker. It serves only `../online-game` (R13),
with `run_worker_first: true` so every asset and API request passes the tester
access gate. `/api/*` uses a Cloudflare service binding to
`route127-r12-dev-api` with the original request URL and Origin intact. Backend
session cookies therefore belong to the private site's origin. No permissive
CORS, proxy Origin rewriting, production binding, DNS change, or backend secret
copy is needed. The R14 Worker has no direct D1 binding.

## Access

Cloudflare Access has a free tier, but the account's Access API reports
`access.api.error.not_enabled`; organization inspection also lacks permission.
Official onboarding requires plan selection and payment details even for Free:
https://developers.cloudflare.com/learning-paths/clientless-access/initial-setup/create-zero-trust-org/
The account was not enrolled and no paid service was enabled. The owner authorized
separate-Worker tester authentication as the fallback.

Only `tester-owner` is issued a credential. The private credential handoff is
outside the repository. Open the HTTPS URL and enter that username/password in
the browser's native authentication prompt. Then register a separate game
account with a unique password of at least 12 characters. Click Create new
character and follow the normal opening: stand up, choose/confirm a handle,
inspect computer, hello, listen, log coordinates, road. Commands automatically
save; wait for “Cloud backup saved” before closing. On return the session resumes,
or sign in with the same game account if asked. Retry pending saves after an
outage; a conflict requires explicit recovery rather than overwriting another
version. The gate credential is not a game-account password or Cloudflare login.

Gate passwords are generated with 256 bits of randomness. The remote Worker
stores only SHA-256 credential digests in a Cloudflare secret; comparisons use
`timingSafeEqual`. An absent/invalid secret fails closed with 503. Unauthorized,
incorrect and expired credentials receive 401 before any dispatch. Credentials
expire after 30 days. No credential is embedded in assets, Git, URLs, screenshots
or public reports. All responses disable caching. Keep the handoff in a password
manager; do not forward it. The gate is possession-based access, not email-bound
SSO/MFA. Browsers cache Basic authentication until browser/session termination;
use a private window on shared devices. Game sign-out does not sign out the host
gate. Revoking the digest invalidates the gate immediately on subsequent requests.
Public source remains public in the existing repository; protection restricts
hosted execution, assets and API access on this origin.

## Safe updates

Use only `route127-r14-private-playtest`, never the public hosting/main branch.
Review changes and run:

```sh
node --test --test-isolation=none route127/private-playtest/tests/access.test.mjs
node --test --test-isolation=none route127/backend/tests/*.test.mjs
node route127/devtest/tests/r11_integrity.cjs
node route127/devtest/tests/road_balance.cjs
npx wrangler@4.152.0 deploy --dry-run --config route127/private-playtest/wrangler.jsonc
npx wrangler@4.152.0 deploy --config route127/private-playtest/wrangler.jsonc
```

Use the environment's existing private CLOUDFLARE_API_TOKEN. Preserve
TESTER_ACCESS_HASHES and the backend's AUTH_PEPPER. Never deploy the historical
example config or apply migrations for a frontend update. Do not deploy the
backend config to update the site: that targets a different Worker. Keep
`run_worker_first: true`, `preview_urls: false`, the fixed development service
binding and the access check before both dispatch paths. Never enable an asset
bypass or publicly accessible preview.

The sole owner's host credential can be rotated (revokes the previous host
credential; does not change game data or sessions):

```sh
python route127/private-playtest/issue-owner-access.py \
  --account-id b7bc43f3969d21604440c22cf3e1e4ef \
  --credential-file /absolute/private/location/new-owner.json
```

The script writes a new file exclusively with mode 0600, outside this checkout,
installs only its digest/expiry, and never prints credentials. For immediate
revocation without replacement, replace TESTER_ACCESS_HASHES with `{}` through
the Cloudflare secret mechanism; the site then fails closed. To pause hosting,
disable the R14 Worker route, not the backend. Never delete development accounts,
snapshots, or production resources as a rollback.

## Hosted verification

The exact new hostname must be allowed by the execution environment before tests.
Install/locate Playwright and Chromium; put the private gate credential JSON and
browser profile outside the checkout. Run with network access:

```sh
R127_TESTER_CREDENTIAL_FILE=/private/owner.json \
R127_BROWSER_PROFILE=/private/r14-browser-profile \
R11_CHROMIUM=/usr/bin/chromium \
node route127/private-playtest/tests/hosted-browser.cjs
```

The test creates three generated development game accounts, does not print their
credentials and retains their development records. Do not run repeatedly within
one minute because the backend's authentication throttle is shared per caller IP.
It checks real opening/commands, deterministic travel, full browser process
restart, cross-account isolation and outage recovery. Representative late-game
system tests use seeded fixtures; they are not a full campaign playthrough.
No physical-device or load/CPU-headroom claim is implied. Gameplay remains
client-driven untrusted snapshot storage, not secure competitive multiplayer.

## This task's private handoff

The current cloud runtime retains the sole owner credential in
`/workspace/work/r127-live/r14-owner.json` with mode 0600. It is intentionally
outside Git and all reports. Use it only through private credential handling;
do not paste it in chat, GitHub or logs. If that runtime is unavailable, run the
rotation script with a new private output path before owner testing.
The configured chat-output directory cannot be created in this runtime because
its parent filesystem is read-only, so no downloadable credential artifact was
produced. This does not prevent rotation or a future private file handoff.

For local acceptance, `tests/local-server.mjs` serves the same gate and client
with a local SQLite-backed API implementation; it does not use remote D1 or
Cloudflare's service-binding transport. Provide R127_DEV_CERT, R127_DEV_KEY,
AUTH_PEPPER, R127_LOCAL_DB and R127_TESTER_CREDENTIAL_FILE privately outside the
checkout. Start that script, then run the acceptance harness with
`R127_ACCEPTANCE_ORIGIN=https://localhost:8787` and a new R127_BROWSER_PROFILE.
The harness permits self-signed TLS only for that fixed local URL, and verifies
TLS normally for the live development URL. Local mode is prominently labeled.
