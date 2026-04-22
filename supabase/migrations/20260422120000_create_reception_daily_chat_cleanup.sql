CREATE TABLE IF NOT EXISTS public.reception_daily_chat_cleanups (
  day_key date PRIMARY KEY,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reception_daily_chat_cleanups ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reset_reception_chat_for_day(
  p_day_key date,
  p_triggered_by uuid DEFAULT NULL
)
RETURNS TABLE (
  did_reset boolean,
  deleted_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer := 0;
  v_deleted integer := 0;
BEGIN
  IF p_day_key IS NULL THEN
    RAISE EXCEPTION 'day_key é obrigatório' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.reception_daily_chat_cleanups(day_key, triggered_by)
  VALUES (p_day_key, p_triggered_by)
  ON CONFLICT (day_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 1 THEN
    DELETE FROM public.reception_messages;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    UPDATE public.reception_daily_chat_cleanups
    SET deleted_count = v_deleted
    WHERE day_key = p_day_key;
  END IF;

  RETURN QUERY SELECT v_inserted = 1, v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_reception_chat_for_day(date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_reception_chat_for_day(date, uuid) TO service_role;
