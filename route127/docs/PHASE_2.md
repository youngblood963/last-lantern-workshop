# Recommended next work

First finish Phase 1 acceptance: inspect the existing Cloudflare dev binding/schema, review/apply the additive migration privately, verify workerd/D1 behavior, and pass real-browser/two-device tests. This is unfinished Phase 1 work, not something to rename as Phase 2.

After that foundation passes:

1. Replace untrusted snapshot economy with server-validated action operations, starting with bank transfers and paid renames. Atomically commit server-owned balances, character state, and action receipts. Do not accept a browser's replacement balance.
2. Establish a reviewed legacy-character migration policy. Browser snapshots, sw tokens, or matching names cannot establish trusted historical wealth/item ownership. Keep trusted state separate until approved reconciliation succeeds.
3. Add server item-instance ownership, deterministic reward/quest validation, and an action ledger before enabling trading or any persistent online economy.
4. Move clock-sensitive rules to server time, including turn refill, bank periods/interest, crafting completion, and daily stock. Keep future server-controlled daily turns out of the current launch claim.
5. Add password recovery, credential-hash versioning/rotation, reviewed session/rate-limit cleanup, account support flows, backup retention, monitoring, and operational recovery drills before any public account release.
6. Only after authoritative ownership exists, implement global Legendary ownership, wanted rankings, announcements/events, and later player interactions/PvP. These remain excluded from Phase 1.

Do not remove local saves or public manual-save behavior until cloud reliability and migration safety are demonstrated and a separate rollout is authorized.
