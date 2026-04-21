CREATE OR REPLACE FUNCTION public.bulk_reschedule_appointments(
  p_source_date date,
  p_target_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $bulk_reschedule$
DECLARE
  v_source_service text;
  v_target_service text;
  v_eligible_count integer;
  v_conflict_slots integer[];
  v_invalid_slots integer[];
  v_target_total_slots integer;
  v_moved_slots integer[] := ARRAY[]::integer[];
  v_original public.appointments%rowtype;
  v_new_appointment public.appointments%rowtype;
BEGIN
  IF p_source_date = p_target_date THEN
    RAISE EXCEPTION 'A data de destino deve ser diferente da data original'
      USING ERRCODE = '22023';
  END IF;

  v_source_service := CASE
    WHEN EXTRACT(ISODOW FROM p_source_date) IN (1, 2) THEN 'UBS'
    WHEN EXTRACT(ISODOW FROM p_source_date) = 3 THEN 'HOME_VISIT'
    ELSE NULL
  END;

  v_target_service := CASE
    WHEN EXTRACT(ISODOW FROM p_target_date) IN (1, 2) THEN 'UBS'
    WHEN EXTRACT(ISODOW FROM p_target_date) = 3 THEN 'HOME_VISIT'
    ELSE NULL
  END;

  IF v_source_service IS NULL THEN
    RAISE EXCEPTION 'A data original não possui atendimento'
      USING ERRCODE = '22023';
  END IF;

  IF v_target_service IS NULL THEN
    RAISE EXCEPTION 'A data de destino não possui atendimento'
      USING ERRCODE = '22023';
  END IF;

  IF v_source_service <> v_target_service THEN
    RAISE EXCEPTION 'A data de destino deve ter o mesmo tipo de atendimento da data original'
      USING ERRCODE = '22023';
  END IF;

  v_target_total_slots := CASE
    WHEN EXTRACT(ISODOW FROM p_target_date) = 1 THEN 30
    WHEN EXTRACT(ISODOW FROM p_target_date) IN (2, 3) THEN 15
    ELSE 0
  END;

  SELECT count(*)
  INTO v_eligible_count
  FROM public.appointments
  WHERE scheduled_date = p_source_date
    AND status = 'Agendado'
    AND document_value <> 'BLOQUEIO';

  IF v_eligible_count = 0 THEN
    RAISE EXCEPTION 'Não há pacientes agendados para reagendar nesta data'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT array_agg(slot_number ORDER BY slot_number)
  INTO v_invalid_slots
  FROM public.appointments
  WHERE scheduled_date = p_source_date
    AND status = 'Agendado'
    AND document_value <> 'BLOQUEIO'
    AND slot_number > v_target_total_slots;

  IF COALESCE(array_length(v_invalid_slots, 1), 0) > 0 THEN
    RAISE EXCEPTION 'As fichas % não existem na agenda de destino', array_to_string(v_invalid_slots, ', ')
      USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(target.slot_number ORDER BY target.slot_number)
  INTO v_conflict_slots
  FROM public.appointments source
  JOIN public.appointments target
    ON target.scheduled_date = p_target_date
   AND target.slot_number = source.slot_number
   AND target.status IN ('Agendado', 'Compareceu', 'Faltou')
  WHERE source.scheduled_date = p_source_date
    AND source.status = 'Agendado'
    AND source.document_value <> 'BLOQUEIO';

  IF COALESCE(array_length(v_conflict_slots, 1), 0) > 0 THEN
    RAISE EXCEPTION 'As fichas % já estão ocupadas no dia de destino', array_to_string(v_conflict_slots, ', ')
      USING ERRCODE = '23505';
  END IF;

  FOR v_original IN
    SELECT *
    FROM public.appointments
    WHERE scheduled_date = p_source_date
      AND status = 'Agendado'
      AND document_value <> 'BLOQUEIO'
    ORDER BY slot_number
    FOR UPDATE
  LOOP
    UPDATE public.appointments
    SET
      status = 'Remarcado',
      status_updated_at = now(),
      updated_at = now()
    WHERE id = v_original.id;

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
      p_target_date,
      v_original.slot_number,
      v_original.patient_name,
      v_original.document_type,
      v_original.document_value,
      v_original.acs_name,
      v_original.home_visit_address,
      v_original.home_visit_reference,
      v_original.home_visit_reason,
      'Agendado',
      now(),
      v_original.id
    )
    RETURNING * INTO v_new_appointment;

    UPDATE public.appointments
    SET
      rescheduled_to_id = v_new_appointment.id,
      updated_at = now()
    WHERE id = v_original.id;

    v_moved_slots := array_append(v_moved_slots, v_original.slot_number);
  END LOOP;

  RETURN jsonb_build_object(
    'rescheduled_count', v_eligible_count,
    'source_date', p_source_date,
    'target_date', p_target_date,
    'moved_slots', v_moved_slots
  );
END;
$bulk_reschedule$;

GRANT EXECUTE ON FUNCTION public.bulk_reschedule_appointments(date, date) TO authenticated;
