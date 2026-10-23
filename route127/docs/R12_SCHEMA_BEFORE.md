# schema-before — route127-dev

Schema only; no player/account rows or credentials.

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
