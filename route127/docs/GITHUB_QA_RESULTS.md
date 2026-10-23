# GitHub integration QA — Route 127 R12

Verified October 23, 2026 (America/New_York).

## Current integration results

| Check | Result |
| --- | --- |
| Node 24 backend/adapter suites | 9 groups passed; 0 failed. Raw output: GITHUB_BACKEND_OUTPUT.txt |
| Offline integrity | Passed; equipment buy/sell values preserved. GITHUB_INTEGRITY_OUTPUT.txt |
| Offline road regression | Passed; 12,000 segments, 2,352 scenario checks, combat/commands/save assertions. GITHUB_ROAD_OUTPUT.txt |
| Local Chromium online integration | 6 groups passed; registration, protected session cookies, character linking, autosave, independent-session recovery, reload, mobile width and logout; no JS errors. GITHUB_BROWSER_OUTPUT.txt |
| Local Cloudflare workerd | Prior completed R12 run: 30 HTTP checks passed; evidence retained in R12_LOCAL_WORKERD_OUTPUT.txt |
| Cloudflare authentication | Read-only token verification reports active |
| Deployed configuration | route127-r12-dev-api has sole D1 binding DB to route127-dev UUID 34ab2666-c124-487f-aed9-bb1809c95919; required secret metadata and development variables confirmed |
| Existing dev Worker | route127-dev-api settings unchanged from pre-R12 inspection |
| Historical dev data | One historical players row remains; zero remote R12 test accounts |
| Production | No remote writes, deployment, route/DNS edits, production DB changes or live website changes in this integration |
| Credential/file scan | No runtime Cloudflare token, private key signature, GitHub token, AWS access key, JWT, credential-bearing URL or literal API-key/token/pepper/secret assignment found in staged files; private state/database/cert/key/cache/archive exclusions checked |
| Scope | Only route127 development files added/changed; no existing content deleted; playtest and site entrypoints unchanged |

The only existing application file changed relative to main is route127/devtest/app.js, carrying forward the R12 package's removal of its embedded local QA switch. Newly imported online-game/app.js also has two pre-existing whitespace-only issues normalized. New schema documentation had extra terminal blank lines removed. No game mechanics changed. The original package manifest is retained as historical evidence using its original paths; use Git commits/diffs for the current repository source state.

The browser smoke test used the existing isolated local HTTPS runner, whose Worker implementation is byte-identical to the imported backend/worker.mjs. It did not access the live website or deployed Worker. Runtime credentials, cookies and local databases remain outside the repository. The scan covers newly staged/current changed files; it does not rewrite or certify all pre-existing repository history.

## Not claimed as passed

The current cloud environment revision 8 reports current/enforced policy but still omits route127-r12-dev-api.youngblood963.workers.dev. Live endpoint and deployed CPU-budget testing therefore remains pending in a refreshed task. See GITHUB_HANDOFF.md for the exact opt-in smoke command and test-data side effects. No unnecessary redeployment was performed.

The earlier offline browser suite reached its final file:// navigation assertion, which managed browser policy blocked; the overall suite is not passed. Physical-device acceptance, full user-driven character creation, complete browser restart, hosted private same-origin UI, and remote concurrency/outage acceptance remain open.

Snapshots are untrusted backups rather than an authoritative online economy. This GitHub handoff preserves the completed R12 work; it does not claim full online gameplay acceptance.
