DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'queue_order') THEN
        ALTER TABLE public.patients ADD COLUMN queue_order integer NOT NULL DEFAULT 0;
    END IF;
END $$;
