import type { Appointment } from '@/types';

export type ReceptionMessage = {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  created_at: string;
};

export type ReceptionCall = {
  patientName: string;
  slotNumber: number;
  calledAt: number;
};

export type ReceptionQueueItem = Appointment & {
  waitMinutes: number;
};
