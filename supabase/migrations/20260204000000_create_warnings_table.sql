-- Create enum for warning type if not exists
DO $$ BEGIN
    CREATE TYPE warning_type AS ENUM ('video', 'image');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create warnings table if not exists
create table if not exists public.warnings (
  id uuid not null default gen_random_uuid(),
  title text not null,
  type warning_type not null,
  content_url text not null,
  message text, -- Caption text and TTS message
  duration integer not null default 10, -- Duration in seconds
  active boolean not null default true,
  start_time time without time zone, -- Scheduling start time
  end_time time without time zone, -- Scheduling end time
  priority_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint warnings_pkey primary key (id)
);

-- Enable Row Level Security
alter table public.warnings enable row level security;

-- Policies for warnings table
drop policy if exists "Enable read access for all users" on public.warnings;
create policy "Enable read access for all users"
on public.warnings for select
using (true);

drop policy if exists "Enable insert for authenticated users only" on public.warnings;
create policy "Enable insert for authenticated users only"
on public.warnings for insert
to authenticated
with check (true);

drop policy if exists "Enable update for authenticated users only" on public.warnings;
create policy "Enable update for authenticated users only"
on public.warnings for update
to authenticated
using (true);

drop policy if exists "Enable delete for authenticated users only" on public.warnings;
create policy "Enable delete for authenticated users only"
on public.warnings for delete
to authenticated
using (true);

-- Create storage bucket for warnings if it doesn't exist
insert into storage.buckets (id, name, public)
values ('warnings', 'warnings', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Give public access to warnings files" on storage.objects;
create policy "Give public access to warnings files"
on storage.objects for select
using ( bucket_id = 'warnings' );

drop policy if exists "Enable upload for authenticated users" on storage.objects;
create policy "Enable upload for authenticated users"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'warnings' );

drop policy if exists "Enable update for authenticated users" on storage.objects;
create policy "Enable update for authenticated users"
on storage.objects for update
to authenticated
using ( bucket_id = 'warnings' );

drop policy if exists "Enable delete for authenticated users" on storage.objects;
create policy "Enable delete for authenticated users"
on storage.objects for delete
to authenticated
using ( bucket_id = 'warnings' );
