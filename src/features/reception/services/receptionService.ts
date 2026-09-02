import { apiRequest } from '@/lib/apiClient';
import type { ReceptionCallHistoryItem, ReceptionMessage } from '../types';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function listReceptionMessages(): Promise<ReceptionMessage[]> {
  return apiRequest<ReceptionMessage[]>('/api/reception/messages');
}

export async function sendReceptionMessage(content: string, senderName?: string | null): Promise<void> {
  const trimmedContent = content.trim();
  if (!trimmedContent) return;
  await apiRequest<ReceptionMessage>('/api/reception/messages', {
    method: 'POST',
    body: JSON.stringify({ content: trimmedContent, senderName: senderName?.trim() || null }),
  });
}

export async function ensureReceptionChatDailyReset(): Promise<void> {
  await apiRequest<void>('/api/reception/reset', { method: 'POST' });
}

export async function listReceptionCallHistoryByDate(date: Date): Promise<ReceptionCallHistoryItem[]> {
  return apiRequest<ReceptionCallHistoryItem[]>(`/api/reception/calls?date=${encodeURIComponent(formatLocalDate(date))}`);
}
