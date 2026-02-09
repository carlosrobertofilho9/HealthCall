create or replace function public.call_patient_atomic(patient_id uuid, location text)
returns jsonb
language plpgsql
as $$
declare
  current_call_count integer;
  updated_patient public.patients%rowtype;
  created_call public.calls%rowtype;
begin
  select p."callCount"
    into current_call_count
  from public.patients p
  where p.id = patient_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'PATIENT_NOT_FOUND',
      detail = format('patient_id=%s', patient_id);
  end if;

  begin
    update public.patients
    set
      "callCount" = coalesce(current_call_count, 0) + 1,
      status = 'Chamado'
    where id = patient_id
    returning * into updated_patient;
  exception
    when others then
      raise exception using
        errcode = sqlstate,
        message = 'CALL_PATIENT_UPDATE_FAILED',
        detail = sqlerrm;
  end;

  begin
    insert into public.calls (patient_id, location)
    values (patient_id, location)
    returning * into created_call;
  exception
    when others then
      raise exception using
        errcode = sqlstate,
        message = 'CALL_PATIENT_INSERT_FAILED',
        detail = sqlerrm;
  end;

  return jsonb_build_object(
    'patient', to_jsonb(updated_patient),
    'call', to_jsonb(created_call)
  );
exception
  when others then
    if sqlerrm in ('PATIENT_NOT_FOUND', 'CALL_PATIENT_UPDATE_FAILED', 'CALL_PATIENT_INSERT_FAILED') then
      raise;
    end if;

    raise exception using
      errcode = sqlstate,
      message = 'CALL_PATIENT_RPC_FAILED',
      detail = sqlerrm;
end;
$$;
