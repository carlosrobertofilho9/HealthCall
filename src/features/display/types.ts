export type CallAckStatus = 'playing' | 'played' | 'failed';

export interface DisplaySession {
  id: string;
  userId: string;
  deviceName: string;
  heartbeatAt: number;
}

export interface CallEvent {
  eventId: string;
  sequence: number;
  patientId: string;
  patientName: string;
  destination: string;
  callCount: number;
  createdAt: number;
}

export interface CallAck {
  eventId: string;
  sessionId: string;
  status: CallAckStatus;
  errorMessage?: string;
  acknowledgedAt: number;
}

export interface WarningPlaybackState {
  warningId: string;
  remainingMs?: number;
  videoTime?: number;
}
