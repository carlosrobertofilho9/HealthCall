ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS home_visit_address text,
  ADD COLUMN IF NOT EXISTS home_visit_reference text,
  ADD COLUMN IF NOT EXISTS home_visit_reason text;
