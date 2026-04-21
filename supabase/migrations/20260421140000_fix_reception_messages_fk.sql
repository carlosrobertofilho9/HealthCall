-- Update reception_messages to reference public.profiles directly for better joining
alter table public.reception_messages
  drop constraint if exists reception_messages_sender_id_fkey;

alter table public.reception_messages
  add constraint reception_messages_sender_id_fkey 
  foreign key (sender_id) 
  references public.profiles(id) 
  on delete set null;
