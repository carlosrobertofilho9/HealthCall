export type ReceptionMessage = {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  content: string;
  created_at: string;
};

export type ReceptionCallHistoryItem = {
  id: string;
  patientId: string;
  patientName: string;
  destination: string;
  callCount: number;
  calledAt: string;
};
