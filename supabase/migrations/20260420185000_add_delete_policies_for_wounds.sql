BEGIN;

-- Add DELETE policies for wound tracking tables to allow "complete cleaning"

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_patients'
      AND policyname = 'Wound patients can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Wound patients can be deleted by authenticated users"
      ON public.wound_patients FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_cases'
      AND policyname = 'Wound cases can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Wound cases can be deleted by authenticated users"
      ON public.wound_cases FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_entries'
      AND policyname = 'Wound entries can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Wound entries can be deleted by authenticated users"
      ON public.wound_entries FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_photos'
      AND policyname = 'Wound photos can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Wound photos can be deleted by authenticated users"
      ON public.wound_photos FOR DELETE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_status_events'
      AND policyname = 'Wound status events can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Wound status events can be deleted by authenticated users"
      ON public.wound_status_events FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

COMMIT;
