import { supabase } from '@/lib/supabaseClient';
import type {
  Prescription,
  CreatePrescriptionInput,
  UploadPrescriptionPdfInput,
  MarkDeliveredInput,
  DenyRenewalInput,
  PrescriptionStatus,
} from '../types';

const PRESCRIPTIONS_BUCKET = 'prescriptions';
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

function assertPdfFile(file: File): void {
  if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Apenas arquivos PDF são permitidos.');
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('O PDF excede o limite de 10MB.');
  }
}

function buildPdfPath(prescriptionId: string, fileName: string): string {
  const extension = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'pdf';
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 11)}`;
  const timestamp = Date.now();
  return `${prescriptionId}/${timestamp}-${randomId}.${extension}`;
}

export async function fetchPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchPrescriptions] Erro:', error);
    throw new Error('Não foi possível carregar as receitas.');
  }

  return (data ?? []) as Prescription[];
}

export async function createPrescription(
  input: CreatePrescriptionInput
): Promise<Prescription> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('prescriptions')
    .insert({
      patient_name: input.patient_name.trim(),
      document_type: input.document_type,
      document_value: input.document_value.replace(/\D/g, ''),
      observation: input.observation?.trim() || null,
      address: input.address?.trim() || null,
      birth_date: input.birth_date || null,
      flags: input.flags ?? [],
      status: 'pending',
      created_by: userData?.user?.id ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[createPrescription] Erro:', error);
    throw new Error('Não foi possível registrar a receita.');
  }

  return data as Prescription;
}

export async function updatePrescriptionStatus(
  id: string,
  status: PrescriptionStatus
): Promise<Prescription> {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('[updatePrescriptionStatus] Erro:', error);
    throw new Error('Não foi possível atualizar o status.');
  }

  return data as Prescription;
}

export async function markPrescriptionDelivered(
  input: MarkDeliveredInput
): Promise<Prescription> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('prescriptions')
    .update({
      status: 'delivered',
      delivered_to: input.deliveredTo.trim(),
      delivered_at: new Date().toISOString(),
      delivered_by: userData?.user?.id ?? null,
    })
    .eq('id', input.prescriptionId)
    .select()
    .single();

  if (error || !data) {
    console.error('[markPrescriptionDelivered] Erro:', error);
    throw new Error('Não foi possível registrar a entrega.');
  }

  return data as Prescription;
}

export async function uploadPrescriptionPdf(
  input: UploadPrescriptionPdfInput
): Promise<{ url: string; storagePath: string }> {
  assertPdfFile(input.file);

  const storagePath = buildPdfPath(input.prescriptionId, input.file.name);

  const { error: uploadError } = await supabase.storage
    .from(PRESCRIPTIONS_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: '31536000',
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    console.error('[uploadPrescriptionPdf] Erro no upload:', uploadError);
    throw new Error('Falha ao enviar o PDF.');
  }

  const { data: urlData } = supabase.storage
    .from(PRESCRIPTIONS_BUCKET)
    .getPublicUrl(storagePath);

  const publicUrl = urlData?.publicUrl ?? '';

  const { error: updateError } = await supabase
    .from('prescriptions')
    .update({
      pdf_storage_path: storagePath,
      pdf_url: publicUrl,
      status: 'ready',
    })
    .eq('id', input.prescriptionId);

  if (updateError) {
    console.error('[uploadPrescriptionPdf] Erro ao atualizar registro:', updateError);
    throw new Error('PDF enviado, mas não foi possível atualizar o status.');
  }

  return { url: publicUrl, storagePath };
}

export async function deletePrescription(id: string): Promise<void> {
  const { data: prescription, error: fetchError } = await supabase
    .from('prescriptions')
    .select('pdf_storage_path')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('[deletePrescription] Erro ao buscar receita:', fetchError);
  }

  if (prescription?.pdf_storage_path) {
    const { error: storageError } = await supabase.storage
      .from(PRESCRIPTIONS_BUCKET)
      .remove([prescription.pdf_storage_path]);

    if (storageError) {
      console.error('[deletePrescription] Erro ao remover PDF:', storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[deletePrescription] Erro ao deletar receita:', deleteError);
    throw new Error('Não foi possível remover a receita.');
  }
}

export async function batchDeletePrescriptions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const { data: prescriptions, error: fetchError } = await supabase
    .from('prescriptions')
    .select('id, pdf_storage_path')
    .in('id', ids);

  if (fetchError) {
    console.error('[batchDeletePrescriptions] Erro ao buscar:', fetchError);
  }

  const pathsToDelete = (prescriptions ?? [])
    .filter((p) => p.pdf_storage_path)
    .map((p) => p.pdf_storage_path!);

  if (pathsToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(PRESCRIPTIONS_BUCKET)
      .remove(pathsToDelete);

    if (storageError) {
      console.error('[batchDeletePrescriptions] Erro ao remover PDFs:', storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from('prescriptions')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('[batchDeletePrescriptions] Erro ao deletar:', deleteError);
    throw new Error('Não foi possível remover as receitas.');
  }
}

export async function batchUpdatePrescriptionsStatus(
  ids: string[],
  status: PrescriptionStatus
): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from('prescriptions')
    .update({ status })
    .in('id', ids);

  if (error) {
    console.error('[batchUpdatePrescriptionsStatus] Erro:', error);
    throw new Error('Não foi possível atualizar o status das receitas.');
  }
}

export async function denyPrescriptionRenewal(
  input: DenyRenewalInput
): Promise<Prescription> {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({
      status: 'denied',
      denial_reason: input.reason.trim(),
    })
    .eq('id', input.prescriptionId)
    .select()
    .single();

  if (error || !data) {
    console.error('[denyPrescriptionRenewal] Erro:', error);
    throw new Error('Não foi possível negar a renovação.');
  }

  return data as Prescription;
}

export async function getPrescriptionPdfUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PRESCRIPTIONS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    console.error('[getPrescriptionPdfUrl] Erro:', error);
    throw new Error('Não foi possível gerar o link do PDF.');
  }

  return data.signedUrl;
}
