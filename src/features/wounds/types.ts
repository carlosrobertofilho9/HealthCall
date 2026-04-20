export const WOUND_CASE_STATUSES = ['ativa', 'acompanhamento', 'cicatrizada', 'encerrada'] as const;
export type WoundCaseStatus = (typeof WOUND_CASE_STATUSES)[number];

export const WOUND_CLOSURE_TYPES = ['alta', 'autocuidado', 'ubs'] as const;
export type WoundClosureType = (typeof WOUND_CLOSURE_TYPES)[number];

export const WOUND_EXUDATE_OPTIONS = ['ausente', 'seroso', 'sanguinolento', 'serossanguinolento', 'purulento'] as const;
export type WoundExudate = (typeof WOUND_EXUDATE_OPTIONS)[number];

export const WOUND_ODOR_OPTIONS = ['ausente', 'discreto', 'fetido'] as const;
export type WoundOdor = (typeof WOUND_ODOR_OPTIONS)[number];

export interface WoundPatient {
  id: string;
  unit_id: string | null;
  full_name: string;
  document_type: 'CPF' | 'CNS' | 'OUTRO';
  document_value: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface WoundCase {
  id: string;
  patient_id: string;
  unit_id: string | null;
  status: WoundCaseStatus;
  closure_type: WoundClosureType | null;
  closure_date: string | null;
  closure_reason: string | null;
  closed_by: string | null;
  started_at: string;
  etiology: string;
  classification: string | null;
  anatomical_region: string | null;
  anatomical_subregion: string | null;
  anatomical_code: string;
  comorbidities: string[];
  initial_bed_aspect: string[];
  initial_edges: string[];
  version: number;
  last_entry_at: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WoundEntry {
  id: string;
  wound_id: string;
  recorded_at: string;
  professional_id: string;
  measure_length_cm: number | null;
  measure_width_cm: number | null;
  measure_depth_cm: number | null;
  area_cm2: number | null;
  bed_aspect: string[];
  edges: string[];
  exudate: WoundExudate | null;
  odor: WoundOdor | null;
  perilesional_skin: string[];
  pain_scale: number | null;
  uses_antibiotic: boolean;
  antibiotic_type: string | null;
  uses_ointment: boolean;
  ointment_type: string | null;
  dressing_type: string | null;
  dressing_notes: string | null;
  non_conformity_detected: boolean;
  non_conformity_type: string | null;
  non_conformity_description: string | null;
  non_conformity_action: string | null;
  observations: string | null;
  next_change_date: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

export interface WoundPhoto {
  id: string;
  wound_id: string;
  entry_id: string | null;
  storage_path: string;
  captured_at: string;
  display_order: number;
  description: string | null;
  is_primary: boolean;
  created_by: string;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  signed_url?: string | null;
}

export interface WoundPhotoExifMetadata {
  make?: string;
  model?: string;
  software?: string;
  dateTimeOriginal?: string;
  latitude?: number;
  longitude?: number;
}

export type WoundPhotoMetadataStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export type WoundPhotoMetadataSource = 'memory' | 'indexeddb' | 'supabase' | null;

export interface WoundPhotoMetadataResult {
  status: WoundPhotoMetadataStatus;
  metadata: WoundPhotoExifMetadata | null;
  error: string | null;
  source: WoundPhotoMetadataSource;
  reload: () => void;
}

export interface WoundStatusEvent {
  id: string;
  wound_id: string;
  event_type: 'closed' | 'reopened';
  closure_type: WoundClosureType | null;
  reason: string;
  event_date: string;
  performed_by: string;
  created_at: string;
  payload: Record<string, unknown>;
  profiles?: {
    full_name: string | null;
  };
}

export interface WoundPatientWithSummary extends WoundPatient {
  wounds: Pick<WoundCase, 'id' | 'status' | 'anatomical_code' | 'updated_at' | 'closure_type'>[];
  open_wounds_count: number;
  latest_wound_updated_at: string | null;
}

export interface CreateWoundPatientInput {
  unit_id?: string | null;
  full_name: string;
  document_type: 'CPF' | 'CNS' | 'OUTRO';
  document_value: string;
}

export interface CreateWoundCaseInput {
  patient_id: string;
  unit_id?: string | null;
  started_at: string;
  etiology: string;
  classification?: string | null;
  anatomical_region?: string | null;
  anatomical_subregion?: string | null;
  anatomical_code: string;
  comorbidities?: string[];
  initial_bed_aspect?: string[];
  initial_edges?: string[];
}

export interface CreateWoundEntryInput {
  wound_id: string;
  recorded_at?: string;
  professional_id?: string;
  measure_length_cm?: number | null;
  measure_width_cm?: number | null;
  measure_depth_cm?: number | null;
  bed_aspect?: string[];
  edges?: string[];
  exudate?: WoundExudate | null;
  odor?: WoundOdor | null;
  perilesional_skin?: string[];
  pain_scale?: number | null;
  uses_antibiotic?: boolean;
  antibiotic_type?: string | null;
  uses_ointment?: boolean;
  ointment_type?: string | null;
  dressing_type?: string | null;
  dressing_notes?: string | null;
  non_conformity_detected?: boolean;
  non_conformity_type?: string | null;
  non_conformity_description?: string | null;
  non_conformity_action?: string | null;
  observations?: string | null;
  next_change_date?: string | null;
}

export interface CloseWoundCaseInput {
  wound_id: string;
  expected_version: number;
  closure_type: WoundClosureType;
  closure_date: string;
  closure_reason: string;
  closed_by?: string;
}

export interface ReopenWoundCaseInput {
  wound_id: string;
  expected_version: number;
  reason: string;
  reopened_by?: string;
}

export interface UploadWoundPhotoInput {
  wound_id: string;
  entry_id?: string | null;
  file: File;
  captured_at?: string;
  display_order?: number;
  description?: string;
  is_primary?: boolean;
}

export type WoundSyncMutationType =
  | 'create_patient'
  | 'create_wound'
  | 'add_entry'
  | 'close_wound'
  | 'reopen_wound'
  | 'upload_photo'
  | 'delete_photo';

export interface WoundSyncMutation<TPayload = Record<string, unknown>> {
  id: string;
  type: WoundSyncMutationType;
  payload: TPayload;
  wound_id?: string;
  createdAt: number;
  retryCount: number;
  nextRetryAt: number;
  lastError: string | null;
}

export interface WoundConflict {
  id: string;
  mutationId: string;
  wound_id: string;
  reason: string;
  serverVersion: number | null;
  expectedVersion: number | null;
  payload: Record<string, unknown>;
  createdAt: number;
  resolvedAt: number | null;
}

export type WoundSortOrder = 'asc' | 'desc';
