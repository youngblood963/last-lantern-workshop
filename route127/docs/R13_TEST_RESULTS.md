# R13 test results — 2026-10-23

## Passed

- 9 local Node test groups, 0 failures: actual R11 script adapter integration (automatic creation/load, latest outage recovery, conflict resolution and retained recovery copy, legacy slot/autosave preservation); lost-acknowledgement idempotency; bank/casino journals; backend session lifecycle; one-character ownership and cross-account isolation; atomic stale-device/competing writes; validation/CSRF/size/rate limits; recoverable database errors.
- Actual headless Chromium against the local HTTPS runner: registration through the real opening, automatic save after a real command, reload/session recovery, closing during network interruption and newest-progress recovery, representative inventory/quest/progression serialization, returning-account login, offline mode, full browser process restart with persisted browser state, no script errors.
- 30 live checks against ONLY route127-r12-dev-api.youngblood963.workers.dev: registration/login/logout, secure cookie attributes, persistent character/save/load, account isolation, forged identity refusal, duplicate character refusal, idempotency, stale conflicts, input/size/CSRF protection, authentication throttling. Two generated development accounts/snapshots were created; credentials discarded. No production writes.
- Existing R11 equipment/vendor integrity check passed. All online-game gameplay scripts and artwork match the R12 baseline byte-for-byte; only cloud-dev.js and its index cache reference change there.
- JavaScript syntax and git diff whitespace checks passed.

## Remaining acceptance

Private hosted browser integration with the live Worker was NOT tested: the API-only endpoint does not serve the game. Nuts must provide private same-origin hosting. Physical phone/two-device testing, session-expiry UI acceptance and full Factory/Seaport/recruitment playthrough remain. Local automated API tests exercise expiry; gameplay/content preservation is established by byte comparison plus targeted browser tests, not a full campaign replay.

## Raw local output

```
✔ R13 automatic creation, cloud resume, outage latest progress, journals and slots (1077.65991ms)
✔ R13 lost acknowledgement is idempotent and auth denies foreign character (369.320561ms)
✔ R13 bank and casino journals survive account recovery (629.214467ms)
✔ registration, login, cookie protection, restart, expiry and logout (784.669477ms)
✔ one character, immutable server identity, owned snapshot, rename, isolation (409.391416ms)
✔ idempotent retries, stale device conflict, request key misuse and rollback (215.74639ms)
✔ CSRF, invalid JSON/schema/size, rate limiting and dev fail-closed (2254.523769ms)
✔ D1 outage produces recoverable 503 without error/secret disclosure (222.364919ms)
✔ concurrent character creation and competing device saves have one winner (183.861606ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 6177.736427
```

## Browser output

```
PASS registration, actual opening, automatic character creation
PASS real command save and session reload
PASS outage close/reopen, latest progress, inventory, quest, progression, legacy preservation
PASS returning account login
PASS offline QA
PASS full browser process restart with persisted cookie and storage
PASS no browser errors
```

## Live development API output

```
PASS: health
PASS: unauthenticated access denied
PASS: foreign origin denied
PASS: malformed JSON denied
PASS: invalid account denied
PASS: account registration
PASS: duplicate registration denied
PASS: wrong password denied
PASS: second development account
PASS: invalid snapshot denied
PASS: server identity character creation
PASS: second character denied
PASS: other account cannot retrieve character
PASS: persistent save
PASS: idempotent retry
PASS: stale revision conflict
PASS: forged character denied
PASS: second character account creation
PASS: other account cannot overwrite character
PASS: separate session login
PASS: persistent load across independent sessions
PASS: logout
PASS: revoked session denied
PASS: original session remains valid
PASS: oversized request denied
PASS: wrong content type denied
PASS: authentication throttling
PASS: logout original session
PASS: logout second account
PASS: 30 checks; only generated development accounts/snapshots written. Credentials discarded.
```
