import { supabase } from '@/lib/supabaseClient';
import type { ReceptionMessage } from '../types';

export async function listReceptionMessages(): Promise<ReceptionMessage[]> {
  const { data, error } = await supabase
    .from('reception_messages')
    .select(`
      id,
      sender_id,
      sender_name,
      content,
      created_at,
      profiles!sender_id (
        avatar_url,
        full_name
      )
    `)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data || []) as ReceptionMessage[];
}

export async function sendReceptionMessage(content: string, senderName?: string | null): Promise<void> {
  const trimmedContent = content.trim();
  if (!trimmedContent) return;

  const { data: userData } = await supabase.auth.getUser();
  const senderId = userData.user?.id ?? null;

  const { error } = await supabase.from('reception_messages').insert({
    content: trimmedContent,
    sender_id: senderId,
    sender_name: senderName?.trim() || null,
  });

  if (error) throw error;
}
