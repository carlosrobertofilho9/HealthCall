-- HealthCall Local Database Schema
-- SQLite version

-- Users table (local authentication)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    default_destination TEXT,
    is_first_login INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
    name TEXT NOT NULL,
    destination TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aguardando',
    callCount INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    CHECK (status IN ('Em Atendimento', 'Aguardando', 'Atendimento Finalizado', 'Chamado'))
);

-- Calls table (history of patient calls)
CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
    patient_id TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Warnings table (announcements/messages for display)
CREATE TABLE IF NOT EXISTS warnings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
    text TEXT NOT NULL,
    background_url TEXT,
    active INTEGER DEFAULT 1,
    media_type TEXT DEFAULT 'image',
    qrcode_url TEXT,
    start_time TEXT,
    end_time TEXT,
    duration INTEGER,
    priority INTEGER DEFAULT 0,
    "order" INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    CHECK (media_type IN ('image', 'video', 'youtube'))
);

-- Settings table (key-value storage)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_patient_id ON calls(patient_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_warnings_active ON warnings(active);
CREATE INDEX IF NOT EXISTS idx_warnings_priority_order ON warnings(priority DESC, "order" ASC);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES 
    ('rss_url', 'https://g1.globo.com/dynamo/saude/rss2.xml', 'URL do Feed RSS de Notícias');

-- Insert default admin user (password: admin123)
-- Password hash is bcrypt of 'admin123'
INSERT OR IGNORE INTO users (id, email, password_hash, name, is_first_login) VALUES 
    ('default-admin-user', 'admin@healthcall.local', '$2b$10$K3mZ8C7vKQH9ZX5Z5Z5Z5u5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5.', 'Administrador', 1);
