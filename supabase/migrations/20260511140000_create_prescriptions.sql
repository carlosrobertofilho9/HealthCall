create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null check (char_length(trim(patient_name)) > 0),
  document_type text not null check (document_type in ('CPF', 'CNS')),
  document_value text not null check (char_length(trim(document_value)) > 0),
  location text not null check (char_length(trim(location)) > 0),
  address text,
  birth_date date,
  pdf_storage_path text,
  pdf_url text,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prescriptions_created_at_idx
  on public.prescriptions (created_at desc);

create index if not exists prescriptions_status_idx
  on public.prescriptions (status);

alter table public.prescriptions enable row level security;

create policy "prescriptions_select_authenticated"
  on public.prescriptions
  for select
  to authenticated
  using (true);

create policy "prescriptions_insert_authenticated"
  on public.prescriptions
  for insert
  to authenticated
  with check (true);

create policy "prescriptions_update_authenticated"
  on public.prescriptions
  for update
  to authenticated
  using (true)
  with check (true);

create policy "prescriptions_delete_authenticated"
  on public.prescriptions
  for delete
  to authenticated
  using (true);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================================
-- STORAGE: PRESCRIPTIONS BUCKET + POLICIES
-- ==========================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('prescriptions', 'prescriptions', true, 10485760)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can read prescriptions bucket'
  ) THEN
    CREATE POLICY "Authenticated can read prescriptions bucket"
      ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'prescriptions');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can upload prescriptions bucket'
  ) THEN
    CREATE POLICY "Authenticated can upload prescriptions bucket"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'prescriptions');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Authenticated can delete prescriptions bucket'
  ) THEN
    CREATE POLICY "Authenticated can delete prescriptions bucket"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'prescriptions');
  END IF;
END
$$;
