-- Additive only. Never alters or claims historical players/auth_hash records.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS r127_accounts (
 id TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS r127_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES r127_accounts(id),
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS r127_session_owner ON r127_sessions(account_id);
CREATE TABLE IF NOT EXISTS r127_characters (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE REFERENCES r127_accounts(id),
 name TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TRIGGER IF NOT EXISTS r127_identity_immutable
 BEFORE UPDATE OF id, account_id ON r127_characters
 BEGIN SELECT RAISE(ABORT,'immutable character identity'); END;
CREATE TABLE IF NOT EXISTS r127_snapshots (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 payload TEXT NOT NULL CHECK(json_valid(payload)), updated_at INTEGER NOT NULL
);
-- Reserved server-authority records; snapshot uploads NEVER update these.
CREATE TABLE IF NOT EXISTS r127_authority (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id),
 wallet INTEGER NOT NULL DEFAULT 0 CHECK(wallet>=0),
 bank INTEGER NOT NULL DEFAULT 0 CHECK(bank>=0),
 turns INTEGER NOT NULL DEFAULT 0 CHECK(turns>=0),
 authority_ready INTEGER NOT NULL DEFAULT 0 CHECK(authority_ready IN(0,1))
);
CREATE TABLE IF NOT EXISTS r127_receipts (
 character_id TEXT NOT NULL REFERENCES r127_characters(id), request_id TEXT NOT NULL,
 payload_hash TEXT NOT NULL, revision INTEGER NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(character_id,request_id)
);
CREATE TABLE IF NOT EXISTS r127_auth_limits (
 key TEXT PRIMARY KEY, window INTEGER NOT NULL, attempts INTEGER NOT NULL
);
