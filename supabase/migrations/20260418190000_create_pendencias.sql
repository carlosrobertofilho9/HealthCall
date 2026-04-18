BEGIN;

CREATE TABLE IF NOT EXISTS public.pendencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_paciente text NOT NULL,
  cns_cpf text NOT NULL,
  tipo text NOT NULL,
  resumo text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'resolvido')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pendencias_status_created_at ON public.pendencias(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pendencias_cns_cpf ON public.pendencias(cns_cpf);
CREATE INDEX IF NOT EXISTS idx_pendencias_nome_paciente ON public.pendencias(nome_paciente);

ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pendencias'
      AND policyname = 'Pendencias are readable by authenticated users'
  ) THEN
    CREATE POLICY "Pendencias are readable by authenticated users"
      ON public.pendencias
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pendencias'
      AND policyname = 'Pendencias can be inserted by authenticated users'
  ) THEN
    CREATE POLICY "Pendencias can be inserted by authenticated users"
      ON public.pendencias
      FOR INSERT
      TO authenticated
      WITH CHECK (created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pendencias'
      AND policyname = 'Pendencias can be updated by authenticated users'
  ) THEN
    CREATE POLICY "Pendencias can be updated by authenticated users"
      ON public.pendencias
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pendencias'
      AND policyname = 'Pendencias can be deleted by authenticated users'
  ) THEN
    CREATE POLICY "Pendencias can be deleted by authenticated users"
      ON public.pendencias
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END
$$;

COMMIT;
