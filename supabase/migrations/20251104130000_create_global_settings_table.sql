-- Create the global_settings table
CREATE TABLE IF NOT EXISTS global_settings (
  setting_name TEXT PRIMARY KEY,
  value BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read access to authenticated users"
ON global_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to authenticated users"
ON global_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert the initial setting for browser voice
INSERT INTO global_settings (setting_name, value)
VALUES ('USE_BROWSER_VOICE', true)
ON CONFLICT (setting_name) DO NOTHING;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE global_settings;
