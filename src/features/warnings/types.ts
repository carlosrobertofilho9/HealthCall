export type MediaType = 'video' | 'image';

export interface Warning {
  id: string;
  text: string;
  background_url?: string | null;
  active: boolean;
  created_at: string;
  media_type: MediaType;
  qrcode_url?: string | null;
  start_time?: string | null; // HH:MM:SS
  end_time?: string | null;   // HH:MM:SS
  audio_url?: string | null;
  duration?: number | null;
  priority?: boolean;
  order?: number | null;
  content_url?: string | null;
  priority_order: number;
  message?: string | null;
}

export interface CreateWarningDTO {
  text: string;
  media_type: MediaType;
  content_url?: string | null;
  message?: string | null;
  duration?: number | null;
  active?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  priority_order?: number;
  background_url?: string | null;
  qrcode_url?: string | null;
  audio_url?: string | null;
  priority?: boolean;
  order?: number | null;
}

export interface UpdateWarningDTO extends Partial<CreateWarningDTO> {
  id: string;
}
