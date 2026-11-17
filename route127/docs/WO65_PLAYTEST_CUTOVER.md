# WO65 PLAYTEST staging and R14 dependency audit

The Route 127 landing page already links to `playtest/` and its hidden DEVTEST link opens `devtest/?cloud=1`. The main branch has no HTML launch link to the R14 hostname. A separate bookmark or previously distributed tester URL can still open the R14 gateway directly.

R14 requires its existing tester Basic Auth before serving the bundled online game or forwarding same-origin `/api/*`. The deployed gateway binds `API` to `route127-r12-dev-api`. Its tester credentials are independent of cloud accounts. DEVTEST reaches the same API Worker and D1 database through the direct DEVTEST route.

The deployed API accepts the R15 expedition endpoints from the R14 hostname and local development origins. PLAYTEST's hosted origin has no equivalent expedition entry. An aggregate, read-only D1 audit found 30 cloud accounts, 28 characters, 28 version-38 snapshots, seven R15 expedition character rows and fourteen expedition item rows. Version-38 snapshots cover regular gameplay. R15 expedition location, equipment and other authoritative records are held in separate tables. The counts do not identify which players still use R14. Authenticated access to the deployed R14 client was unavailable for this audit.

## Run isolated PLAYTEST staging

From `route127/backend`, use Node 24 and the local TLS settings documented in `tests/local-server.mjs`. Set `R127_DEV_CERT`, `R127_DEV_KEY` and a disposable local `AUTH_PEPPER`. Set `R127_LOCAL_DB` to a new local SQLite path and run `R127_PLAYTEST_STAGE=1 npm run local`. Open `https://localhost:8788/route127/playtest/?cloud=1`.

The cloud entry is opt-in on the local staging port. `?offline=1` opens the existing local game with its original browser saves. PLAYTEST cloud recovery and pending writes use a dedicated browser namespace. The cloud contract uses the same account, character and revision across clients when both use the same dataset. The staging database is independent of live D1.

Existing cloud accounts load their saved character. An account without a character can explicitly copy the newest compatible version-38 browser snapshot or start fresh. The existing browser save is also available directly. Copying preserves that save and creates a cloud character with a server-issued identity. Older formats and names outside the current cloud rules remain available in the local game. There is no bulk migration.

## Verification and remaining cutover

Local Chromium passed graphical registration, creation, returning account login, session reuse, save and restore, sign-out, interrupted acknowledgement with same-request retry, and a stale-write conflict across independent sessions. A representative existing PLAYTEST browser save copied successfully. Its location, HP, turns, currency, inventory, gear and quest flag restored with the same cloud identity in PLAYTEST and DEVTEST against one disposable SQLite database. The original browser slot and autosave bytes remained intact. All 13 backend and R14 tests passed.

The hosted PLAYTEST and DEVTEST pages and public homepage returned HTTP 200. R14 still presented its existing HTTP 401 access challenge. Live records, routes, bindings and Worker deployments were left in place.

Before switching the hosted PLAYTEST entry, verify the authenticated R14 expedition flow and its existing authoritative records from the intended replacement entry. Confirm compatibility for representative live snapshots across both clients. Then enable the verified hosted PLAYTEST login and route, confirm existing accounts can resume, and retire only the R14 gateway service once those checks pass. Preserve the shared API Worker, D1 database, secrets and browser save recovery.
