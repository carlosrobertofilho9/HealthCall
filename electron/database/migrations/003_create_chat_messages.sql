-- Create messages table for Team Chat
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
    content TEXT NOT NULL,
    sender_id TEXT, -- Pode ser null para sistema ou ID do cliente
    sender_name TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- text, image, system
    timestamp INTEGER DEFAULT (strftime('%s', 'now') * 1000), -- JS timestamp (ms)
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
