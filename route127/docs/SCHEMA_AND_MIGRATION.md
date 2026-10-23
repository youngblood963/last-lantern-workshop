# Database schema and migration

The included migration is NEW candidate schema, not a dump of either existing D1 database. Existing D1 schemas were unavailable for authenticated inspection.

File: `backend/migrations/0001_accounts.sql`. All new tables are prefixed r127_. The migration never alters, imports, or deletes the historical players table.

| Table | Purpose / invariant |
| --- | --- |
| r127_accounts | Server-issued account ID, case-insensitive unique login, salt/password hash, creation timestamp |
| r127_sessions | Hashed session token, owner FK, absolute expiry; session is looked up on every authenticated request |
| r127_characters | Server-issued character ID, UNIQUE account FK, mutable display name; trigger makes ID and owner immutable |
| r127_snapshots | One untrusted schema-38 payload per character; monotonically increasing integer revision |
| r127_authority | Reserved wallet/bank/turn authority, initially zero and disabled; snapshot endpoint cannot update it |
| r127_receipts | Character-scoped request UUID plus payload/revision hash and committed resulting revision |
| r127_auth_limits | Hashed login/IP key and one-minute authentication attempt counter |

## Atomic operations

Character creation uses a D1 batch to insert character, snapshot, and authority rows together. A concurrent second create fails the UNIQUE constraint and rolls back the entire losing batch.

A save first checks the receipt. Matching request ID and payload/revision hash replays its original result. Reusing an ID with different data fails. Otherwise, a single D1 batch performs conditional snapshot UPDATE WHERE revision=expected, INSERT receipt only when that update changed a row, and updates the name only when a new receipt was inserted. Stale saves change no snapshot or name. Receipts are scoped by authenticated character. The client keeps the same request ID and snapshot when retrying a lost acknowledgement.

This protects snapshot commits; it is not a general financial transaction API. Phase 2 action transactions will need their own server-validated rules and receipts.

## Apply safely to the EXISTING development database only

1. Authenticate locally to the correct Cloudflare account with least-privilege access. Do not copy token values into code or reports.
2. Inspect and retain the existing dev Worker configuration, version, route bindings, D1 ID, schema, and migration history. Confirm DB points to route127-dev, never route127-world. Check for any existing r127_ name collisions.
3. Export a private backup of route127-dev before any mutation. Do not include exported accounts/data in deliverables.
4. Review this candidate SQL against the actual schema and the existing migration numbering. Rename the migration number if that history already uses 0001. Do not blindly replace existing migrations or infer applied status from CREATE IF NOT EXISTS.
5. Configure Wrangler against the verified EXISTING dev database. Apply locally first and run the tests. A remote apply is appropriate only after the private dev target is verified and all deployment restrictions are satisfied.
6. Apply the reviewed additive migration to route127-dev only. Re-inspect tables, foreign keys, immutable-ID trigger, unique constraints, and D1 batch behavior.
7. Do not import sw-* identities or local-* identities as trusted owners. A signed-in test user can explicitly import a snapshot to their single newly issued char-* ID; it remains an untrusted DEV backup. Decide production migration authority separately.

## Rollback and maintenance

Retain the prior dev Worker version/config for rollback. Disable DEV_BACKUP_ENABLED to stop new backup access while investigating. Rolling back code does not require dropping the additive tables; keep data for recovery. Never run a DROP script against an unidentified database. A production migration is not supplied.

Before broader testing, add a reviewed cleanup task for expired sessions and old authentication-rate windows, plus retention limits for receipts/recovery snapshots. Keep the pepper stable and securely backed up; changing it without an explicit credential migration invalidates existing password hashes. Record password-hash parameters as a versioned scheme before any parameter change. Store server-owned item instances and action ledgers in separate tables when authoritative gameplay begins.
