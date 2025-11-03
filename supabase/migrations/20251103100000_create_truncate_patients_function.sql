CREATE OR REPLACE FUNCTION truncate_patients()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE public.patients;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION truncate_patients() TO authenticated;