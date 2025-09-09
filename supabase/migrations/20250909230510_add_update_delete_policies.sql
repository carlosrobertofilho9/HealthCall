-- Allow UPDATE and DELETE on patients for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow update for authenticated users' AND tablename = 'patients'
  ) THEN
    CREATE POLICY "Allow update for authenticated users" ON patients
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow delete for authenticated users' AND tablename = 'patients'
  ) THEN
    CREATE POLICY "Allow delete for authenticated users" ON patients
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;
