CREATE TABLE IF NOT EXISTS messages (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
 message TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS contact_limits (
 key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS limits_expiry ON contact_limits(expires);
