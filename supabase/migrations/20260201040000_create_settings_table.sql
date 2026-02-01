-- Create a settings table for key-value storage
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Turn on RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (dashboard) to select, insert, update
CREATE POLICY "Allow authenticated to manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow public (display) to read settings
CREATE POLICY "Allow public to read settings"
ON public.settings
FOR SELECT
TO public
USING (true);

-- Insert default RSS Feed URL (G1 Saúde)
INSERT INTO public.settings (key, value, description)
VALUES ('rss_url', 'https://g1.globo.com/dynamo/saude/rss2.xml', 'URL do Feed RSS de Notícias')
ON CONFLICT (key) DO NOTHING;
