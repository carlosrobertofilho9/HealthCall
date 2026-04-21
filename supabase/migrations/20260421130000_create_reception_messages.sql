create table if not exists public.reception_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists reception_messages_created_at_idx
  on public.reception_messages (created_at desc);

alter table public.reception_messages enable row level security;

create policy "reception_messages_select_authenticated"
  on public.reception_messages
  for select
  using (auth.role() = 'authenticated');

create policy "reception_messages_insert_authenticated"
  on public.reception_messages
  for insert
  with check (auth.role() = 'authenticated');
