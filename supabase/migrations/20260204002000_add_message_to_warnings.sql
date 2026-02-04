-- Add message column to warnings table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warnings' AND column_name = 'message') THEN
        ALTER TABLE public.warnings ADD COLUMN message text;
    END IF;
END $$;
