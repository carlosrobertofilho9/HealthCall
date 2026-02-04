-- Add content_url column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warnings' AND column_name = 'content_url') THEN
        ALTER TABLE public.warnings ADD COLUMN content_url text;
    END IF;
END $$;

-- Add start_time column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warnings' AND column_name = 'start_time') THEN
        ALTER TABLE public.warnings ADD COLUMN start_time time without time zone;
    END IF;
END $$;

-- Add end_time column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warnings' AND column_name = 'end_time') THEN
        ALTER TABLE public.warnings ADD COLUMN end_time time without time zone;
    END IF;
END $$;

-- Add priority_order column if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'warnings' AND column_name = 'priority_order') THEN
        ALTER TABLE public.warnings ADD COLUMN priority_order integer not null default 0;
    END IF;
END $$;

-- Make content_url not null if it is null (optional cleanup, but be careful with existing data)
-- ALTER TABLE public.warnings ALTER COLUMN content_url SET NOT NULL;
