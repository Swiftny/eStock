CREATE TABLE IF NOT EXISTS demo_sessions (
 token_hash TEXT PRIMARY KEY, org_id TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('staff','manager')),
 expires_at TEXT NOT NULL
);
