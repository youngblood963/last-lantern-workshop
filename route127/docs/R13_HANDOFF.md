# Route127_R13_OnlineIntegration

Starting point: R12 development branch at 8d0d7f54b9ab6c0524180306ad785911726ce1d4, containing the R11 playable game.
Development branch: route127-r13-online-integration. No production changes or deployment.

## Ready

The playable client is `route127/online-game/index.html`, served with its adjacent files and `/api/*` on the same HTTPS origin. Registration/login use the existing R12 API and HttpOnly, Secure, SameSite=Strict session cookie. No auth tokens or passwords are placed in browser storage. One permanent character is created automatically when the player confirms a valid handle in the normal opening. Returning authenticated sessions load automatically; expired sessions require login. Online commands cannot select legacy slots or start a replacement character.

Existing gameplay scripts and assets are byte-for-byte unchanged. See R13_GAMEPLAY_INTEGRITY.json. The client remains untrusted snapshot persistence, NOT server-authoritative gameplay or a cheat-resistant shared world.

## Saving and recovery

Commands checkpoint after completion, existing autosave calls checkpoint, and a five-second poll captures timed changes. Saves debounce 1.2 seconds. Local pending requests retain the original request ID for idempotent retries; a separate latest snapshot retains progress made after an interrupted request. Page exit retains the latest snapshot locally. Automatic retry occurs on reconnect and periodic checkpoints; the Retry button can retry immediately. Storage failure and network/auth/save failures are visible.

Restart recovery replays any pending request, checks the saved base revision, then restores newer local progress only when it is compatible with the server revision. A stale device stops with an explicit conflict. The player may choose “Use cloud version; retain local recovery copy” and confirm; local records are archived under the account recovery prefix before the server version is loaded. No automatic merging or forced overwrite.

Creation drafts survive uncertainty during the initial POST. Sign in again to check whether creation committed; if no character exists, the Create button retries the retained draft. Existing manual slots and the legacy autosave remain untouched: cloud data is fed to the existing loader in memory. Bank and casino journals travel with the snapshot. Recovery data is account-scoped in browser storage; shared-device privacy and storage clearing remain the user's responsibility. Closing before any checkpoint or removing browser data can lose unsynced progress. A failed local-storage write is reported; the browser must allow storage for durable interruption recovery.

## Offline QA

Open the same client with `?offline=1` to bypass authentication/cloud hooks and retain the legacy local save/load slots. No cloud API calls are made by this adapter in offline mode. The existing `route127/devtest/QA_MODE.html` remains unchanged for dedicated QA tools. Never copy the online adapter into public playtest pages.

## Reproduce local tests

Node 24+, Python 3, OpenSSL, Playwright, and a Chromium executable are required. In `route127/backend`:

```
node --test --test-isolation=none tests/*.test.mjs
```

Use the local HTTPS runner described in R12_SETUP.md with private certificate/key, private AUTH_PEPPER, and a temporary R127_LOCAL_DB outside the checkout. It binds only 127.0.0.1:8787. Then, with Playwright installed/resolvable:

```
R11_CHROMIUM=/absolute/path/to/chromium node tests/r13-browser.cjs
```

The browser test creates only local disposable accounts. It drives the real opening/handle confirmation and a real gameplay command, then injects representative inventory/quest/level values to test serialization. It closes during an outage, reconnects, checks latest progress, tests logout/login and offline QA, and restarts the entire browser process using its persisted cookie/storage state. It is not a full Factory/Seaport campaign playthrough.

The existing backend rate-limit test now freezes its clock to avoid a minute-boundary false failure; backend runtime code, schema, migrations, and deployment configuration are unchanged.

## Nuts: private hosted acceptance

1. Review this branch without merging into a public hosting branch.
2. Provide PRIVATE same-origin HTTPS frontend/API hosting against the EXISTING route127-dev database, preserving the existing AUTH_PEPPER, cookie protections, origin validation, and private access policy. The verified workers.dev API alone does not serve game assets. Do not point the adapter cross-origin or loosen CORS/cookies.
3. Host only the online-game assets plus existing API handler behind that private arrangement; do not expose dev docs, databases, test credentials, or local test files. No R13 SQL migration is needed.
4. Run the browser acceptance flow there and test a physical phone, a second device, expired login, slow/offline network, stale-device conflict and explicit server-version recovery. Play through combat, bank, Factory, Seaport and recruitment for content acceptance; those scripts are unchanged but were not exhaustively replayed in R13.
5. Keep production website, route127-world database and production Worker untouched.

Outstanding: private hosted end-to-end acceptance and physical-device/full-content playtesting. No deployment, production migration, server-authoritative gameplay, password recovery, or account deletion implementation is claimed.
