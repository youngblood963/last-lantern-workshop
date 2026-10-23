> Historical Phase 1 candidate notes. R12 current status, deployment, verification, and limitations are in [R12_DEPLOYMENT_REPORT.md](R12_DEPLOYMENT_REPORT.md) and [R12_SETUP.md](R12_SETUP.md). Earlier credential/browser/deployment blockers below describe the prior run.

# Test results and remaining acceptance

Executed October 22, 2026 (America/New_York), using Node v24.19.0.

## Passed local suites

`node --test backend/tests/*.test.mjs`: **9 test groups passed, zero failed.** See AUTOMATED_TEST_OUTPUT.txt for the captured final run.

| Test group | Coverage |
| --- | --- |
| Authentication | Registration, case-insensitive duplicate login, wrong password, password/token hashing, protected cookie attributes, authenticated session lookup, expiry, logout |
| Identity and ownership | One character per account, immutable ID trigger, server-issued identity at creation and rejection of mismatched save identity, rename retaining ownership, other account cannot load/write victim character, cross-tab session/account switches cannot upload the wrong character, server authority remains unchanged |
| Snapshot commit | Save/load, idempotent replay, request-key misuse, stale revision rejection, interrupted transaction rollback |
| Input/security boundaries | Foreign Origin rejection, invalid schema/unsafe object keys, negative balances, body limit, authentication throttling, production guard, disabled-backup guard |
| Server outage | Generic recoverable 503 without internal secret/error disclosure |
| Concurrent requests | One character creation winner and one competing revision winner; character name matches winning snapshot |
| Actual R11 adapter | Real R11 script/save/load chain, server-ID persistence, automatic backup, independent client login and recovery, conflict pause and explicit recovery |
| Adapter interruption | Offline pending request, lost response after commit, same-ID retry without revision duplication, local-slot switching pauses sync, separate-realm session recovery |
| Financial journals | Bank period and casino journals restored with cloud state; stale local casino journal cannot override the recovered snapshot |

The integration harness executes shipped JS in separate VM contexts with independent localStorage/cookie jars and a DOM test double. Backend tests use actual SQLite SQL/constraints/transactions and actual scrypt. These are local application tests, not Cloudflare D1/workerd or actual browser acceptance.

Existing R11 regression suites also passed:

- tests/r11_integrity.cjs: baseline equipment sale and vendor buy prices unchanged.
- tests/road_balance.cjs: 12,000 road segments; 2,352 scenario choice/risk/capacity/direction checks; combat victory, donation, empty roster, safeguard and actual command checks passed.

The copied isolated game differs only in the account adapter/entrypoint, server-ID acceptance in the local identity regex, and removal of the embedded local QA menu code. Existing Player and live tester files were not modified or deployed. The public R11 Player ZIP is not regenerated.

## NOT verified / must still pass

- Authenticated Cloudflare account/resource inspection and exact D1 binding/schema confirmation.
- Additive migration and actual D1 rollback, changes() behavior, and concurrency.
- Worker node:crypto scrypt support, CPU budget, and memory consumption under actual dev configuration.
- Real-browser account UI, layout, CSP behavior, and cookie persistence/recovery after fully closing/reopening the browser.
- Desktop/mobile browsers on two physical devices, independent logins and continued gameplay from the same snapshot.
- Browser storage-quota failure recovery and full character-creation UI journey.
- Worker/D1 downtime and a lost acknowledgement over the real network.
- Existing live playtest page and production unchanged, verified by deployment/source inspection (no write was attempted here).

Chromium was missing and browser installation failed with an invalid/truncated archive, so the existing browser suite could not be run. No screenshot or browser pass is claimed.

## Manual acceptance sequence after access is resolved

1. On private dev routing, register A and B. Check duplicates and wrong passwords. Inspect cookie flags without recording cookie values in a report.
2. Complete normal R11 creation for A, link once, record its non-secret server character ID, and verify a second character creation fails.
3. Earn/spend Bolts, change inventory/equipment, advance a quest/Factory/Seaport flag, and make a banking/casino change. Wait for confirmed cloud backup and record revision.
4. Fully close/reopen browser and load A. Then sign in to A on a second physical device and load. Compare relevant game data, bank period, and identity.
5. Change display name through the existing bank flow and confirm the server ID stays unchanged after recovery.
6. Verify B cannot select A's character by supplying A's ID/account ID. Expire/revoke a session and check all protected routes fail.
7. Race two device saves. Only one revision may win; the loser must retain local progress and clearly pause sync.
8. Interrupt the server and simulate a response lost after commit. Restore service and verify retry is idempotent.
9. Test local slot switching, a failed local-storage write, and conflict recovery without losing manual slots/recovery copies.
10. Re-run the existing R11 browser gameplay suite and smoke-test local Player behavior. Inspect dev/prod route boundaries. Only then assess the Definition of Done.
