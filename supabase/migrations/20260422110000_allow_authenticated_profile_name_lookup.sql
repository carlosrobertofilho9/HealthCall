DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'profiles'
        AND policyname = 'Profiles are readable by authenticated users'
    )
  THEN
    CREATE POLICY "Profiles are readable by authenticated users"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;
