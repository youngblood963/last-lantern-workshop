# R14 private online playtest — deployment and acceptance handoff

October 23, 2026 (America/New_York).

**Deployment completed. Hosted browser acceptance remains BLOCKED by the current
runtime's network policy. Local browser results below are not hosted passes.**

## Source and deployment

- R13 retrieved from PR #2, head `81603cd061c6f8462b1ad7484c87579cae328397`.
- Dedicated branch: `route127-r14-private-playtest`; no merge into main.
- Separate Worker: `route127-r14-private-playtest`.
- Deployment URL: https://route127-r14-private-playtest.youngblood963.workers.dev
- Current deployed version: `5e5ea48e-26da-4513-9f21-da9c5f5c8f8f`.
- All 21 R13 online-game files are hosted, behind a Worker-first access gate.
- `/api/*` goes through an internal `API` service binding to the existing
  `route127-r12-dev-api`; original URL/Origin and game cookies are preserved.
- No direct D1 binding on R14. Existing backend continues to use `route127-dev`.
- Backend runtime/configuration, AUTH_PEPPER, production Workers,
  `route127-world`, DNS and public website were not changed. No migration ran.
- No paid service, new subscription, public release or ZIP archive was created.

R13 already supplies registration/login, normal opening/character creation,
automatic command/timed saves, interruption recovery, conflicts and returning
character recovery. One compatibility defect was found and fixed: its online
adapter rejected every `continue` command, including normal road travel. Only
the legacy title-screen continue option is now blocked. A real adapter regression
test covers road advancement/turn cost and continued refusal of legacy title
loading. The 19 gameplay/content files in the R13 integrity manifest still match
byte-for-byte; only the cloud adapter changes in the playable client.

## Access protection

Cloudflare's free Access offering exists, but the account is not onboarded:
its Access app API returned `access.api.error.not_enabled`, and organization
inspection returned a permission error. Official Free onboarding requires plan
selection/payment details. The owner authorized the separate-Worker authentication
fallback rather than account onboarding. No claim is made that Access requires
a paid subscription.

Only one host credential, `tester-owner`, is configured. It uses a generated
256-bit secret, a SHA-256 digest in TESTER_ACCESS_HASHES, a 30-day expiry and
constant-time comparison. The browser's HTTPS Basic prompt is separate from the
game's registration/login. This is possession-based owner access, not email-bound
SSO/MFA. Passwords/tokens are absent from Git, URLs, screenshots and test logs.
See `../private-playtest/README.md` for private credential retrieval/rotation and
step-by-step play/access instructions. The private output mount is unavailable;
credentials remain only in protected runtime storage pending a private handoff.

The guard precedes both static assets and API dispatch. Missing/invalid access
configuration returns 503; absent/wrong/expired credentials return 401. Responses
are not cached. Remote version inspection confirms `raw_run_worker_first=true`,
`serve_directly=false`, the tester secret binding, the sole development API
service target and no D1 binding. Routing inspection confirms previews disabled.
**Live HTTP enforcement on the R14 hostname remains unverified: do not distribute
this link or call the hosted milestone accepted until the fresh task verifies it.**

## Test results by scope

| Check | Result and scope |
| --- | --- |
| Existing Worker HTTPS/D1/auth/save/security | PASS: 30 live API checks against the R12 development hostname |
| R14 deployment and remote configuration | PASS: upload, routing and version/binding inspection |
| R14 hosted HTTPS/gate/frontend/API browser journey | BLOCKED: proxy CONNECT 403 before reaching the new hostname |
| Backend and adapter automation | PASS: 10 named Node groups, including the new travel regression |
| Access-control automation | PASS: 3 named Node groups; no-access dispatch denial, wrong/expired/malformed credentials, fail-closed configuration, valid gate vs game authentication |
| A: new player | PASS LOCAL: register, normal opening/handle confirmation, automatic character creation, room/cabinet commands, transmission and three real road segments with deterministic uneventful RNG, cloud save/reload |
| B: browser restart/return | PASS LOCAL: terminate/restart Chromium with persistent browser profile, restore location/XP/inventory/progress, logout/login same character |
| C: three accounts | PASS LOCAL: three unique characters and independent save values; another character ID cannot change read ownership or overwrite data |
| D: interrupted connection | PASS LOCAL: failed offline save, newer local progress, close/reopen, reconnect and exact pending recovery |
| Authentication error UI | PASS LOCAL: removing game-session cookies surfaces sign-in error and retains pending progress |
| Combat/inventory | PASS LOCAL: seeded combat damage, item sale and wallet change through real commands |
| Factory/Seaport/quests | PASS LOCAL: menu routing, unique boss reward, bulletin board, quest search/completion and reward |
| Banking/travel/wanderers | PASS LOCAL: deposit/withdraw, travel turn cost, encounter rendering/small talk |
| Mobile viewport/browser errors | PASS LOCAL: 390px viewport without horizontal overflow; no script errors |
| R11 price integrity | PASS: baseline equipment sale and vendor buying prices |
| Road regression | PASS: 12,000 segments, 2,352 scenario checks, combat, commands and save checks |
| Existing full R11 browser regression | BLOCKED at its final file:// entrypoint navigation by browser administrator policy; overall suite is not passed |
| Gameplay content preservation | PASS: 19 gameplay/assets match R13 manifest |

Local browser acceptance uses the same R14 guard/client and a real SQLite-backed
local API. It does not establish live service-binding transport or remote D1
browser persistence. Late-game checks use representative seeded fixtures, not an
earned full campaign. Physical phone/device acceptance, full campaign completion,
load/CPU headroom and long-duration expiry remain unverified. Local Node tests
cover expiry, rollback, concurrent saves and stale conflicts.

The live backend smoke run created two temporary development accounts/snapshots,
revoked their sessions and discarded credentials. The successful local browser
run used three accounts; local troubleshooting runs also generated local-only
records. No existing remote data was deleted or exported.

## Network blocker and fresh-task continuation

The owner published the new-host allowlist update. This task's supported runtime
snapshot still reports revision 6, enforced, with only api.cloudflare.com and the
R12 Worker hostname as custom allowed hosts. The actual new-host request receives
proxy tunnel HTTP 403, not a response from R14. No network bypass was attempted.

1. Start a task whose observed effective policy includes the exact R14 hostname.
2. Retrieve this dedicated branch and verify the remote version/guard settings.
3. Read the private owner credential from retained runtime storage, or rotate it
   with the supplied script if the runtime no longer exists. Never print secrets.
4. Run `tests/hosted-browser.cjs` with the private credential/profile paths, as
   documented in the R14 README. The default target is the R14 URL and live TLS
   verification stays enabled. Expect three generated development game accounts;
   wait a minute between repeated runs due to authentication throttling.
5. Verify unauthenticated root, index, JS, image, offline-mode and API requests
   return 401, incorrect credentials fail, and authorized game requests succeed.
6. Repeat A–E on the hosted origin, then perform owner/physical-device acceptance.
   Only then distribute the test link for hands-on playtesting.

The game remains client-driven untrusted snapshot persistence. Server-authoritative
gameplay, competitive/PvP security, global Legendary ownership, password recovery,
MFA and account deletion are outside this milestone and were not implemented.
