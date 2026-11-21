CREATE TABLE r127_community_posts (
 id TEXT PRIMARY KEY,
 parent_id TEXT REFERENCES r127_community_posts(id) ON DELETE CASCADE,
 account_id TEXT NOT NULL REFERENCES r127_accounts(id),
 author TEXT NOT NULL,
 level INTEGER NOT NULL,
 identity TEXT,
 title TEXT NOT NULL,
 message TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 pinned INTEGER NOT NULL DEFAULT 0,
 locked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX r127_community_threads ON r127_community_posts(parent_id, created_at);
CREATE TABLE r127_community_post_limits (
 account_id TEXT PRIMARY KEY REFERENCES r127_accounts(id),
 posted_at INTEGER NOT NULL
);
CREATE TRIGGER r127_community_post_limit BEFORE INSERT ON r127_community_posts
WHEN NEW.identity IS NULL
BEGIN
 SELECT RAISE(ABORT, 'community cooldown') FROM r127_community_post_limits
 WHERE account_id=NEW.account_id AND posted_at>NEW.created_at-600000;
 INSERT INTO r127_community_post_limits VALUES(NEW.account_id, NEW.created_at)
 ON CONFLICT(account_id) DO UPDATE SET posted_at=excluded.posted_at;
END;
CREATE TABLE r127_community_feedback (
 account_id TEXT PRIMARY KEY REFERENCES r127_accounts(id),
 request_id TEXT NOT NULL,
 reserved_at INTEGER NOT NULL,
 sent_at INTEGER
);
