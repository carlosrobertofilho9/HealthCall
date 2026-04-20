BEGIN;

-- ==========================================================================
-- WOUND TRACKING MVP (FASE 1)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.wound_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text,
  full_name text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('CPF', 'CNS', 'OUTRO')),
  document_value text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.wound_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.wound_patients(id) ON DELETE CASCADE,
  unit_id text,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'acompanhamento', 'cicatrizada', 'encerrada')),
  closure_type text CHECK (closure_type IN ('alta', 'autocuidado', 'ubs')),
  closure_date date,
  closure_reason text,
  closed_by uuid REFERENCES auth.users(id),
  started_at date NOT NULL,
  etiology text NOT NULL,
  classification text,
  anatomical_region text,
  anatomical_subregion text,
  anatomical_code text NOT NULL,
  comorbidities text[] NOT NULL DEFAULT '{}',
  initial_bed_aspect text[] NOT NULL DEFAULT '{}',
  initial_edges text[] NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  last_entry_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wound_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wound_id uuid NOT NULL REFERENCES public.wound_cases(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  professional_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  measure_length_cm numeric(8,2),
  measure_width_cm numeric(8,2),
  measure_depth_cm numeric(8,2),
  area_cm2 numeric(10,2) GENERATED ALWAYS AS (
    CASE
      WHEN measure_length_cm IS NULL OR measure_width_cm IS NULL THEN NULL
      ELSE (measure_length_cm * measure_width_cm)
    END
  ) STORED,
  bed_aspect text[] NOT NULL DEFAULT '{}',
  edges text[] NOT NULL DEFAULT '{}',
  exudate text CHECK (exudate IN ('ausente', 'seroso', 'sanguinolento', 'serossanguinolento', 'purulento')),
  odor text CHECK (odor IN ('ausente', 'discreto', 'fetido')),
  perilesional_skin text[] NOT NULL DEFAULT '{}',
  pain_scale smallint CHECK (pain_scale BETWEEN 0 AND 10),
  uses_antibiotic boolean NOT NULL DEFAULT false,
  antibiotic_type text,
  uses_ointment boolean NOT NULL DEFAULT false,
  ointment_type text,
  dressing_type text,
  dressing_notes text,
  non_conformity_detected boolean NOT NULL DEFAULT false,
  non_conformity_type text,
  non_conformity_description text,
  non_conformity_action text,
  observations text,
  next_change_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wound_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wound_id uuid NOT NULL REFERENCES public.wound_cases(id) ON DELETE CASCADE,
  entry_id uuid REFERENCES public.wound_entries(id) ON DELETE SET NULL,
  storage_path text NOT NULL UNIQUE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  display_order integer NOT NULL DEFAULT 0,
  description text,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.wound_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wound_id uuid NOT NULL REFERENCES public.wound_cases(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('closed', 'reopened')),
  closure_type text CHECK (closure_type IN ('alta', 'autocuidado', 'ubs')),
  reason text NOT NULL,
  event_date date NOT NULL,
  performed_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_wound_patients_document_unique
  ON public.wound_patients (COALESCE(unit_id, ''), document_type, document_value);

CREATE INDEX IF NOT EXISTS idx_wound_patients_full_name
  ON public.wound_patients (full_name);

CREATE INDEX IF NOT EXISTS idx_wound_cases_patient_status
  ON public.wound_cases (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_wound_cases_anatomical_code
  ON public.wound_cases (anatomical_code);

CREATE INDEX IF NOT EXISTS idx_wound_entries_wound_recorded_at
  ON public.wound_entries (wound_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_wound_photos_wound_captured_at
  ON public.wound_photos (wound_id, captured_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wound_photos_primary_by_wound
  ON public.wound_photos (wound_id)
  WHERE is_primary = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wound_status_events_wound_created_at
  ON public.wound_status_events (wound_id, created_at DESC);

-- ==========================================================================
-- HELPERS
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.touch_wound_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wound_patients_touch_updated_at ON public.wound_patients;
CREATE TRIGGER trg_wound_patients_touch_updated_at
BEFORE UPDATE ON public.wound_patients
FOR EACH ROW
EXECUTE FUNCTION public.touch_wound_updated_at();

DROP TRIGGER IF EXISTS trg_wound_cases_touch_updated_at ON public.wound_cases;
CREATE TRIGGER trg_wound_cases_touch_updated_at
BEFORE UPDATE ON public.wound_cases
FOR EACH ROW
EXECUTE FUNCTION public.touch_wound_updated_at();

CREATE OR REPLACE FUNCTION public.bump_wound_case_after_entry_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.wound_cases
  SET
    last_entry_at = NEW.recorded_at,
    version = version + 1,
    updated_by = NEW.professional_id,
    updated_at = now()
  WHERE id = NEW.wound_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wound_entries_bump_case ON public.wound_entries;
CREATE TRIGGER trg_wound_entries_bump_case
AFTER INSERT ON public.wound_entries
FOR EACH ROW
EXECUTE FUNCTION public.bump_wound_case_after_entry_insert();

CREATE OR REPLACE FUNCTION public.close_wound_case(
  p_wound_id uuid,
  p_expected_version integer,
  p_closure_type text,
  p_closure_date date,
  p_closure_reason text,
  p_closed_by uuid DEFAULT NULL
)
RETURNS public.wound_cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case public.wound_cases%rowtype;
  v_user uuid;
BEGIN
  IF p_wound_id IS NULL THEN
    RAISE EXCEPTION 'wound_id é obrigatório' USING ERRCODE = '22023';
  END IF;

  IF p_expected_version IS NULL THEN
    RAISE EXCEPTION 'expected_version é obrigatório' USING ERRCODE = '22023';
  END IF;

  IF p_closure_type NOT IN ('alta', 'autocuidado', 'ubs') THEN
    RAISE EXCEPTION 'closure_type inválido: %', p_closure_type USING ERRCODE = '22023';
  END IF;

  IF COALESCE(trim(p_closure_reason), '') = '' THEN
    RAISE EXCEPTION 'motivo do fechamento é obrigatório' USING ERRCODE = '22023';
  END IF;

  v_user := COALESCE(p_closed_by, auth.uid());

  SELECT *
  INTO v_case
  FROM public.wound_cases
  WHERE id = p_wound_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ferida não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_case.version <> p_expected_version THEN
    RAISE EXCEPTION 'Conflito de versão: esperado %, encontrado %', p_expected_version, v_case.version
      USING ERRCODE = '40001';
  END IF;

  IF v_case.status = 'encerrada' THEN
    RAISE EXCEPTION 'Ferida já está encerrada' USING ERRCODE = '22023';
  END IF;

  UPDATE public.wound_cases
  SET
    status = 'encerrada',
    closure_type = p_closure_type,
    closure_date = COALESCE(p_closure_date, CURRENT_DATE),
    closure_reason = p_closure_reason,
    closed_by = v_user,
    version = version + 1,
    updated_by = v_user,
    updated_at = now()
  WHERE id = p_wound_id
  RETURNING * INTO v_case;

  INSERT INTO public.wound_status_events (
    wound_id,
    event_type,
    closure_type,
    reason,
    event_date,
    performed_by,
    payload
  ) VALUES (
    p_wound_id,
    'closed',
    p_closure_type,
    p_closure_reason,
    COALESCE(p_closure_date, CURRENT_DATE),
    v_user,
    jsonb_build_object('expected_version', p_expected_version, 'new_version', v_case.version)
  );

  RETURN v_case;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_wound_case(
  p_wound_id uuid,
  p_expected_version integer,
  p_reason text,
  p_reopened_by uuid DEFAULT NULL
)
RETURNS public.wound_cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case public.wound_cases%rowtype;
  v_user uuid;
BEGIN
  IF p_wound_id IS NULL THEN
    RAISE EXCEPTION 'wound_id é obrigatório' USING ERRCODE = '22023';
  END IF;

  IF p_expected_version IS NULL THEN
    RAISE EXCEPTION 'expected_version é obrigatório' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'justificativa da reabertura é obrigatória' USING ERRCODE = '22023';
  END IF;

  v_user := COALESCE(p_reopened_by, auth.uid());

  SELECT *
  INTO v_case
  FROM public.wound_cases
  WHERE id = p_wound_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ferida não encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF v_case.version <> p_expected_version THEN
    RAISE EXCEPTION 'Conflito de versão: esperado %, encontrado %', p_expected_version, v_case.version
      USING ERRCODE = '40001';
  END IF;

  IF v_case.status <> 'encerrada' THEN
    RAISE EXCEPTION 'Apenas feridas encerradas podem ser reabertas' USING ERRCODE = '22023';
  END IF;

  UPDATE public.wound_cases
  SET
    status = 'ativa',
    closure_type = NULL,
    closure_date = NULL,
    closure_reason = NULL,
    closed_by = NULL,
    version = version + 1,
    updated_by = v_user,
    updated_at = now()
  WHERE id = p_wound_id
  RETURNING * INTO v_case;

  INSERT INTO public.wound_status_events (
    wound_id,
    event_type,
    closure_type,
    reason,
    event_date,
    performed_by,
    payload
  ) VALUES (
    p_wound_id,
    'reopened',
    NULL,
    p_reason,
    CURRENT_DATE,
    v_user,
    jsonb_build_object('expected_version', p_expected_version, 'new_version', v_case.version)
  );

  RETURN v_case;
END;
$$;

GRANT EXECUTE ON FUNCTION public.close_wound_case(uuid, integer, text, date, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_wound_case(uuid, integer, text, uuid) TO authenticated;

-- ==========================================================================
-- RLS
-- ==========================================================================

ALTER TABLE public.wound_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wound_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wound_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wound_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wound_status_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_patients'
      AND policyname = 'Wound patients are readable by authenticated users'
  ) THEN
    CREATE POLICY "Wound patients are readable by authenticated users"
      ON public.wound_patients FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_patients'
      AND policyname = 'Wound patients can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Wound patients can be inserted by authenticated users"
      ON public.wound_patients FOR INSERT TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_patients'
      AND policyname = 'Wound patients can be updated by authenticated users'
  ) THEN
    CREATE POLICY "Wound patients can be updated by authenticated users"
      ON public.wound_patients FOR UPDATE TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_cases'
      AND policyname = 'Wound cases are readable by authenticated users'
  ) THEN
    CREATE POLICY "Wound cases are readable by authenticated users"
      ON public.wound_cases FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_cases'
      AND policyname = 'Wound cases can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Wound cases can be inserted by authenticated users"
      ON public.wound_cases FOR INSERT TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_cases'
      AND policyname = 'Wound cases can be updated by authenticated users'
  ) THEN
    CREATE POLICY "Wound cases can be updated by authenticated users"
      ON public.wound_cases FOR UPDATE TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_entries'
      AND policyname = 'Wound entries are readable by authenticated users'
  ) THEN
    CREATE POLICY "Wound entries are readable by authenticated users"
      ON public.wound_entries FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_entries'
      AND policyname = 'Wound entries can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Wound entries can be inserted by authenticated users"
      ON public.wound_entries FOR INSERT TO authenticated
      WITH CHECK (professional_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_photos'
      AND policyname = 'Wound photos are readable by authenticated users'
  ) THEN
    CREATE POLICY "Wound photos are readable by authenticated users"
      ON public.wound_photos FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_photos'
      AND policyname = 'Wound photos can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Wound photos can be inserted by authenticated users"
      ON public.wound_photos FOR INSERT TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_photos'
      AND policyname = 'Wound photos can be updated by authenticated users'
  ) THEN
    CREATE POLICY "Wound photos can be updated by authenticated users"
      ON public.wound_photos FOR UPDATE TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_status_events'
      AND policyname = 'Wound status events are readable by authenticated users'
  ) THEN
    CREATE POLICY "Wound status events are readable by authenticated users"
      ON public.wound_status_events FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'wound_status_events'
      AND policyname = 'Wound status events can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Wound status events can be inserted by authenticated users"
      ON public.wound_status_events FOR INSERT TO authenticated
      WITH CHECK (performed_by = auth.uid());
  END IF;
END
$$;

-- ==========================================================================
-- STORAGE: PRIVATE BUCKET + POLICIES
-- ==========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('wound-photos', 'wound-photos', false, 5242880)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can read wound photos bucket'
  ) THEN
    CREATE POLICY "Authenticated can read wound photos bucket"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'wound-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can upload wound photos bucket'
  ) THEN
    CREATE POLICY "Authenticated can upload wound photos bucket"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'wound-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can delete wound photos bucket'
  ) THEN
    CREATE POLICY "Authenticated can delete wound photos bucket"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'wound-photos');
  END IF;
END
$$;

COMMIT;
