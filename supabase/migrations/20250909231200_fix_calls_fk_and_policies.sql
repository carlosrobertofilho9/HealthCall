-- Ensure calls has proper RLS policies and cascade deletes when a patient is removed

-- Add INSERT policy on calls for authenticated users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert for authenticated users' AND tablename = 'calls'
  ) THEN
    CREATE POLICY "Allow insert for authenticated users" ON calls
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Add DELETE policy on calls for authenticated users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete for authenticated users' AND tablename = 'calls'
  ) THEN
    CREATE POLICY "Allow delete for authenticated users" ON calls
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Alter foreign key to cascade deletes from patients to calls
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'calls'
      AND tc.constraint_name = 'calls_patient_id_fkey'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    ALTER TABLE public.calls DROP CONSTRAINT calls_patient_id_fkey;
  END IF;

  -- Recreate FK with ON DELETE CASCADE
  ALTER TABLE public.calls
    ADD CONSTRAINT calls_patient_id_fkey
    FOREIGN KEY (patient_id)
    REFERENCES public.patients (id)
    ON DELETE CASCADE;
END $$;
