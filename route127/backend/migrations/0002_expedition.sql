CREATE TABLE IF NOT EXISTS r127_world_activity (
 character_id TEXT NOT NULL REFERENCES r127_world_characters(character_id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL REFERENCES r127_sessions(token_hash) ON DELETE CASCADE,
 last_seen INTEGER NOT NULL,
 PRIMARY KEY(character_id,token_hash)
);

CREATE TABLE IF NOT EXISTS r127_world_characters (
 character_id TEXT PRIMARY KEY REFERENCES r127_characters(id) ON DELETE CASCADE,
 ruleset TEXT NOT NULL DEFAULT 'r15-expedition-v1' CHECK(ruleset='r15-expedition-v1'),
 node TEXT NOT NULL DEFAULT 'old-house' CHECK(node IN ('old-house','west-road','solace')),
 level INTEGER NOT NULL DEFAULT 1 CHECK(level=1),
 xp INTEGER NOT NULL DEFAULT 0 CHECK(xp=0),
 max_hp INTEGER NOT NULL DEFAULT 100 CHECK(max_hp=100),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 last_activity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS r127_world_events (
 character_id TEXT NOT NULL REFERENCES r127_world_characters(character_id) ON DELETE CASCADE,
 request_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('enroll','depart','approach','leave','return')),
 request_hash TEXT NOT NULL,
 from_node TEXT,
 to_node TEXT NOT NULL,
 revision INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 PRIMARY KEY(character_id,request_id), UNIQUE(character_id,revision)
);

CREATE TABLE IF NOT EXISTS r127_world_items (
 id TEXT PRIMARY KEY,
 character_id TEXT NOT NULL REFERENCES r127_world_characters(character_id) ON DELETE CASCADE,
 item_key TEXT NOT NULL CHECK(item_key IN ('rusted-pipe','worn-jacket')),
 slot TEXT NOT NULL CHECK(slot IN ('weapon','armor')),
 quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity=1),
 UNIQUE(character_id,slot),
 CHECK((slot='weapon' AND item_key='rusted-pipe') OR (slot='armor' AND item_key='worn-jacket'))
);

CREATE INDEX IF NOT EXISTS r127_world_population ON r127_world_characters(node,character_id);
