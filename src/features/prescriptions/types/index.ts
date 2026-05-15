export type PrescriptionStatus = 'pending' | 'ready' | 'delivered' | 'denied';

export type PrescriptionFlag = 'dosage_change' | 'new_medication' | 'medication_suspended' | 'total_change' | 'maintenance';

export interface Prescription {
  id: string;
  patient_name: string;
  document_type: 'CPF' | 'CNS';
  document_value: string;
  observation: string | null;
  address: string | null;
  birth_date: string | null;
  pdf_storage_path: string | null;
  pdf_url: string | null;
  status: PrescriptionStatus;
  flags: PrescriptionFlag[];
  denial_reason: string | null;
  delivered_to: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionInput {
  patient_name: string;
  document_type: 'CPF' | 'CNS';
  document_value: string;
  observation?: string | null;
  address?: string | null;
  birth_date?: string | null;
  flags?: PrescriptionFlag[];
}

export interface UploadPrescriptionPdfInput {
  prescriptionId: string;
  file: File;
}

export interface MarkDeliveredInput {
  prescriptionId: string;
  deliveredTo: string;
}

export interface DenyRenewalInput {
  prescriptionId: string;
  reason: string;
}
