CREATE TABLE IF NOT EXISTS r127_solace_activity (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id) ON DELETE CASCADE,
 last_play_at INTEGER NOT NULL
);
