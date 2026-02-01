-- Create warnings table
create table public.warnings (
  id uuid not null default gen_random_uuid (),
  text text not null,
  background_url text null,
  active boolean null default true,
  created_at timestamp with time zone not null default now(),
  constraint warnings_pkey primary key (id)
) tablespace pg_default;

-- Enable RLS
alter table public.warnings enable row level security;

-- Create policies
create policy "Enable read access for all users"
on public.warnings for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on public.warnings for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on public.warnings for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users"
on public.warnings for delete
to authenticated
using (true);

-- Enable Realtime
alter publication supabase_realtime add table public.warnings;
