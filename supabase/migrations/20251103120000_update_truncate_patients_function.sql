CREATE OR REPLACE FUNCTION truncate_patients()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE public.patients CASCADE;
END;
$$ LANGUAGE plpgsql;