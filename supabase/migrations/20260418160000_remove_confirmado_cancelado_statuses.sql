UPDATE public.appointments
SET status = 'Agendado', status_updated_at = now(), updated_at = now()
WHERE status = 'Confirmado';

UPDATE public.appointments
SET status = 'Faltou', status_updated_at = now(), updated_at = now()
WHERE status = 'Cancelado';

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('Agendado', 'Compareceu', 'Faltou', 'Remarcado'));

DROP INDEX IF EXISTS public.appointments_active_slot_unique;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_slot_unique
  ON public.appointments (scheduled_date, slot_number)
  WHERE status IN ('Agendado', 'Compareceu', 'Faltou');

CREATE OR REPLACE FUNCTION public.reschedule_appointment(
  p_original_id uuid,
  p_scheduled_date date,
  p_slot_number integer
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $reschedule$
DECLARE
  v_new_appointment public.appointments%rowtype;
BEGIN
  PERFORM 1
  FROM public.appointments
  WHERE id = p_original_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Marcação original não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE id = p_original_id
      AND status = 'Remarcado'
  ) THEN
    RAISE EXCEPTION 'Esta marcação não pode ser remarcada porque está com status Remarcado'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.appointments
  SET
    status = 'Remarcado',
    status_updated_at = now(),
    updated_at = now()
  WHERE id = p_original_id;

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
  SELECT
    p_scheduled_date,
    p_slot_number,
    a.patient_name,
    a.document_type,
    a.document_value,
    a.acs_name,
    a.home_visit_address,
    a.home_visit_reference,
    a.home_visit_reason,
    'Agendado',
    now(),
    a.id
  FROM public.appointments a
  WHERE a.id = p_original_id
  RETURNING * INTO v_new_appointment;

  UPDATE public.appointments
  SET
    rescheduled_to_id = v_new_appointment.id,
    updated_at = now()
  WHERE id = p_original_id;

  RETURN v_new_appointment;
END;
$reschedule$;

GRANT EXECUTE ON FUNCTION public.reschedule_appointment(uuid, date, integer) TO authenticated;
