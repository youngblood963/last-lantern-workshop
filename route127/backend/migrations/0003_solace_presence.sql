CREATE TABLE IF NOT EXISTS r127_solace_presence (
 character_id TEXT NOT NULL REFERENCES r127_characters(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL REFERENCES r127_sessions(token_hash) ON DELETE CASCADE,
 last_seen INTEGER NOT NULL,
 PRIMARY KEY (character_id, token_hash)
);
CREATE INDEX IF NOT EXISTS r127_solace_presence_seen ON r127_solace_presence(last_seen);
