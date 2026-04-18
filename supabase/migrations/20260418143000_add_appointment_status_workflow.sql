ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Agendado',
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rescheduled_from_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rescheduled_to_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

UPDATE public.appointments
SET status = 'Agendado'
WHERE status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_status_check'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('Agendado', 'Confirmado', 'Compareceu', 'Faltou', 'Cancelado', 'Remarcado'));
  END IF;
END $$;

DO $$
DECLARE
  constraint_record record;
  index_record record;
BEGIN
  FOR constraint_record IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'appointments'
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname)
        FROM unnest(c.conkey) AS key(attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = key.attnum
      ) = ARRAY['scheduled_date', 'slot_number']::text[]
  LOOP
    EXECUTE format('ALTER TABLE public.appointments DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;

  FOR index_record IN
    SELECT i.relname AS index_name
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'appointments'
      AND ix.indisunique
      AND ix.indpred IS NULL
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname)
        FROM unnest(ix.indkey) AS key(attnum)
        JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = key.attnum
      ) = ARRAY['scheduled_date', 'slot_number']::text[]
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', index_record.index_name);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_unique
  ON public.appointments (scheduled_date, slot_number)
  WHERE status IN ('Agendado', 'Confirmado', 'Compareceu', 'Faltou');

CREATE INDEX IF NOT EXISTS idx_appointments_status_date
  ON public.appointments (status, scheduled_date);

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_original_id uuid,
  p_scheduled_date date,
  p_slot_number integer
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  original_appointment public.appointments%rowtype;
  new_appointment public.appointments%rowtype;
BEGIN
  SELECT *
  INTO original_appointment
  FROM public.appointments
  WHERE id = p_original_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marcação original não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF original_appointment.status IN ('Cancelado', 'Remarcado') THEN
    RAISE EXCEPTION 'Esta marcação não pode ser remarcada porque está com status %', original_appointment.status
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.appointments
  SET
    status = 'Remarcado',
    status_updated_at = now(),
    updated_at = now()
  WHERE id = original_appointment.id;

  INSERT INTO public.appointments (
    scheduled_date,
    slot_number,
    patient_name,
    document_type,
    document_value,
    acs_name,
    home_visit_address,
    home_visit_reference,
    home_visit_reason,
    status,
    status_updated_at,
    rescheduled_from_id
  )
  VALUES (
    p_scheduled_date,
    p_slot_number,
    original_appointment.patient_name,
    original_appointment.document_type,
    original_appointment.document_value,
    original_appointment.acs_name,
    original_appointment.home_visit_address,
    original_appointment.home_visit_reference,
    original_appointment.home_visit_reason,
    'Agendado',
    now(),
    original_appointment.id
  )
  RETURNING * INTO new_appointment;

  UPDATE public.appointments
  SET
    rescheduled_to_id = new_appointment.id,
    updated_at = now()
  WHERE id = original_appointment.id;

  RETURN new_appointment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reschedule_appointment(uuid, date, integer) TO authenticated;
