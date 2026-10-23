# schema-after — route127-dev

Schema only; no player/account rows or credentials.

## index r127_session_owner

```sql
CREATE INDEX r127_session_owner ON r127_sessions(account_id);
```

## table _cf_KV

```sql
CREATE TABLE _cf_KV (
        key TEXT PRIMARY KEY,
        value BLOB
      ) WITHOUT ROWID;
```

## table players

```sql
CREATE TABLE players (     id TEXT PRIMARY KEY,     character_name TEXT NOT NULL,     level INTEGER NOT NULL DEFAULT 1,     location TEXT NOT NULL DEFAULT 'Old House',     online INTEGER NOT NULL DEFAULT 0,     last_seen TEXT DEFAULT CURRENT_TIMESTAMP,     created_at TEXT DEFAULT CURRENT_TIMESTAMP , auth_hash TEXT);
```

## table r127_accounts

```sql
CREATE TABLE r127_accounts (
 id TEXT PRIMARY KEY, login TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at INTEGER NOT NULL
);
```

## table r127_auth_limits

```sql
CREATE TABLE r127_auth_limits (
 key TEXT PRIMARY KEY, window INTEGER NOT NULL, attempts INTEGER NOT NULL
);
```

## table r127_authority

```sql
CREATE TABLE r127_authority (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id),
 wallet INTEGER NOT NULL DEFAULT 0 CHECK(wallet>=0),
 bank INTEGER NOT NULL DEFAULT 0 CHECK(bank>=0),
 turns INTEGER NOT NULL DEFAULT 0 CHECK(turns>=0),
 authority_ready INTEGER NOT NULL DEFAULT 0 CHECK(authority_ready IN(0,1))
);
```

## table r127_characters

```sql
CREATE TABLE r127_characters (
 id TEXT PRIMARY KEY, account_id TEXT NOT NULL UNIQUE REFERENCES r127_accounts(id),
 name TEXT NOT NULL, created_at INTEGER NOT NULL
);
```

## table r127_receipts

```sql
CREATE TABLE r127_receipts (
 character_id TEXT NOT NULL REFERENCES r127_characters(id), request_id TEXT NOT NULL,
 payload_hash TEXT NOT NULL, revision INTEGER NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(character_id,request_id)
);
```

## table r127_sessions

```sql
CREATE TABLE r127_sessions (
 token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES r127_accounts(id),
 expires_at INTEGER NOT NULL
);
```

## table r127_snapshots

```sql
CREATE TABLE r127_snapshots (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 payload TEXT NOT NULL CHECK(json_valid(payload)), updated_at INTEGER NOT NULL
);
```

## trigger r127_identity_immutable

```sql
CREATE TRIGGER r127_identity_immutable
 BEFORE UPDATE OF id, account_id ON r127_characters
 BEGIN SELECT RAISE(ABORT,'immutable character identity'); END;
```
