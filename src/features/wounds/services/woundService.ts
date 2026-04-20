import { supabase } from '@/lib/supabaseClient';
import type {
  CloseWoundCaseInput,
  CreateWoundCaseInput,
  CreateWoundEntryInput,
  CreateWoundPatientInput,
  ReopenWoundCaseInput,
  UploadWoundPhotoInput,
  WoundCase,
  WoundCaseStatus,
  WoundEntry,
  WoundPatient,
  WoundPatientWithSummary,
  WoundStatusEvent,
} from '../types';
import { getWoundPhotoCache, saveWoundPhotoCache, deleteWoundPhotoCache } from './woundOfflineStore';

const WOUND_STORAGE_BUCKET = 'wound-photos';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function assertImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Apenas imagens são permitidas para upload.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('A imagem excede o limite de 5MB.');
  }
}

function buildPhotoPath(woundId: string, fileName: string): string {
  const extension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
  const safeExt = (extension?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '') || 'jpg').slice(0, 5);
  
  // Use a more robust unique ID for the file path
  const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 11)}`;
  
  const timestamp = Date.now();
  return `${woundId}/${timestamp}-${randomId}.${safeExt}`;
}

export async function listPatientsWithTrackedWounds(filters?: {
  search?: string;
  anatomicalCode?: string;
  includeClosed?: boolean;
}): Promise<WoundPatientWithSummary[]> {
  let query = supabase
    .from('wound_patients')
    .select(`
      *,
      wound_cases (
        id,
        status,
        anatomical_code,
        updated_at,
        closure_type
      )
    `)
    .eq('active', true)
    .order('updated_at', { ascending: false });

  if (filters?.search) {
    query = query.ilike('full_name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const patients = (data ?? []) as Array<WoundPatient & { wound_cases?: WoundCase[] }>;

  return patients
    .map((patient) => {
      const wounds = (patient.wound_cases ?? []) as Pick<WoundCase, 'id' | 'status' | 'anatomical_code' | 'updated_at' | 'closure_type'>[];
      const woundsByLocation = filters?.anatomicalCode
        ? wounds.filter((wound) => wound.anatomical_code === filters.anatomicalCode)
        : wounds;

      const filteredWounds = filters?.includeClosed
        ? woundsByLocation
        : woundsByLocation.filter((wound) => wound.status !== 'encerrada');

      const latestWoundUpdatedAt = filteredWounds
        .map((wound) => wound.updated_at)
        .sort()
        .reverse()[0] ?? null;

      return {
        ...patient,
        wounds: filteredWounds,
        open_wounds_count: filteredWounds.filter((wound) => wound.status !== 'encerrada').length,
        latest_wound_updated_at: latestWoundUpdatedAt,
      } satisfies WoundPatientWithSummary;
    })
    .filter((patient) => patient.wounds.length > 0 || filters?.includeClosed === true);
}

export async function createWoundPatient(input: CreateWoundPatientInput): Promise<WoundPatient> {
  if (!input.full_name.trim()) {
    throw new Error('Nome do paciente é obrigatório.');
  }

  if (!input.document_value.trim()) {
    throw new Error('Documento do paciente é obrigatório.');
  }

  const { data, error } = await supabase
    .from('wound_patients')
    .insert({
      unit_id: input.unit_id ?? null,
      full_name: input.full_name.trim(),
      document_type: input.document_type,
      document_value: input.document_value.trim(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as WoundPatient;
}

export async function updateWoundPatient(patientId: string, input: Partial<CreateWoundPatientInput>): Promise<WoundPatient> {
  if (input.full_name && !input.full_name.trim()) {
    throw new Error('Nome do paciente é obrigatório.');
  }

  if (input.document_value && !input.document_value.trim()) {
    throw new Error('Documento do paciente é obrigatório.');
  }

  const { data, error } = await supabase
    .from('wound_patients')
    .update({
      full_name: input.full_name?.trim(),
      document_type: input.document_type,
      document_value: input.document_value?.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', patientId)
    .select('*')
    .single();

  if (error) throw error;
  return data as WoundPatient;
}

export async function deleteWoundPatient(patientId: string): Promise<void> {
  // 1. Get all photos for all wounds of this patient
  const { data: photos, error: photosError } = await supabase
    .from('wound_photos')
    .select('storage_path, wound_cases!inner(patient_id)')
    .eq('wound_cases.patient_id', patientId);

  if (photosError) throw photosError;

  // 2. Delete files from storage
  if (photos && photos.length > 0) {
    const paths = photos.map((p: any) => p.storage_path);
    const { error: storageError } = await supabase.storage
      .from(WOUND_STORAGE_BUCKET)
      .remove(paths);

    if (storageError) {
      console.warn('Erro ao deletar algumas fotos do storage:', storageError);
    }
  }

  // 3. Delete patient (cascades to wound_cases, wound_entries, wound_photos metadata)
  const { error: deleteError } = await supabase
    .from('wound_patients')
    .delete()
    .eq('id', patientId);

  if (deleteError) throw deleteError;
}

export async function listWoundsByPatient(
  patientId: string,
  statusFilter: WoundCaseStatus | 'all' = 'all',
): Promise<WoundCase[]> {
  let query = supabase
    .from('wound_cases')
    .select('*')
    .eq('patient_id', patientId)
    .order('updated_at', { ascending: false });

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as WoundCase[];
}

export async function createWoundCase(input: CreateWoundCaseInput): Promise<WoundCase> {
  if (!input.patient_id) {
    throw new Error('Paciente da ferida é obrigatório.');
  }

  if (!input.anatomical_code.trim()) {
    throw new Error('Localização anatômica é obrigatória.');
  }

  if (!input.started_at) {
    throw new Error('Data de início da lesão é obrigatória.');
  }

  if (!input.etiology.trim()) {
    throw new Error('Etiologia é obrigatória.');
  }

  const payload = {
    patient_id: input.patient_id,
    unit_id: input.unit_id ?? null,
    started_at: input.started_at,
    etiology: input.etiology.trim(),
    classification: input.classification?.trim() || null,
    anatomical_region: input.anatomical_region || null,
    anatomical_subregion: input.anatomical_subregion || null,
    anatomical_code: input.anatomical_code,
    comorbidities: input.comorbidities ?? [],
    initial_bed_aspect: input.initial_bed_aspect ?? [],
    initial_edges: input.initial_edges ?? [],
  };

  const { data, error } = await supabase
    .from('wound_cases')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data as WoundCase;
}

export async function addWoundEntry(input: CreateWoundEntryInput): Promise<WoundEntry> {
  if (!input.wound_id) {
    throw new Error('Ferida é obrigatória para registrar evolução.');
  }

  if (input.pain_scale != null && (input.pain_scale < 0 || input.pain_scale > 10)) {
    throw new Error('Escala de dor deve estar entre 0 e 10.');
  }

  const payload = {
    wound_id: input.wound_id,
    recorded_at: input.recorded_at ?? new Date().toISOString(),
    professional_id: input.professional_id,
    measure_length_cm: input.measure_length_cm ?? null,
    measure_width_cm: input.measure_width_cm ?? null,
    measure_depth_cm: input.measure_depth_cm ?? null,
    bed_aspect: input.bed_aspect ?? [],
    edges: input.edges ?? [],
    exudate: input.exudate ?? null,
    odor: input.odor ?? null,
    perilesional_skin: input.perilesional_skin ?? [],
    pain_scale: input.pain_scale ?? null,
    uses_antibiotic: input.uses_antibiotic ?? false,
    antibiotic_type: input.antibiotic_type || null,
    uses_ointment: input.uses_ointment ?? false,
    ointment_type: input.ointment_type || null,
    dressing_type: input.dressing_type || null,
    dressing_notes: input.dressing_notes || null,
    non_conformity_detected: input.non_conformity_detected ?? false,
    non_conformity_type: input.non_conformity_type || null,
    non_conformity_description: input.non_conformity_description || null,
    non_conformity_action: input.non_conformity_action || null,
    observations: input.observations || null,
    next_change_date: input.next_change_date || null,
  };

  const { data, error } = await supabase
    .from('wound_entries')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  
  // Se for sucesso, atualizar o last_entry_at do wound_case
  await supabase
    .from('wound_cases')
    .update({ 
      last_entry_at: payload.recorded_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', payload.wound_id);

  return data as WoundEntry;
}

export async function updateWoundEntry(entryId: string, input: Partial<CreateWoundEntryInput>): Promise<WoundEntry> {
  const { data, error } = await supabase
    .from('wound_entries')
    .update({
      recorded_at: input.recorded_at,
      professional_id: input.professional_id,
      measure_length_cm: input.measure_length_cm,
      measure_width_cm: input.measure_width_cm,
      measure_depth_cm: input.measure_depth_cm,
      bed_aspect: input.bed_aspect,
      edges: input.edges,
      exudate: input.exudate,
      odor: input.odor,
      perilesional_skin: input.perilesional_skin,
      pain_scale: input.pain_scale,
      uses_antibiotic: input.uses_antibiotic,
      antibiotic_type: input.antibiotic_type,
      uses_ointment: input.uses_ointment,
      ointment_type: input.ointment_type,
      dressing_type: input.dressing_type,
      dressing_notes: input.dressing_notes,
      non_conformity_detected: input.non_conformity_detected,
      non_conformity_type: input.non_conformity_type,
      non_conformity_description: input.non_conformity_description,
      non_conformity_action: input.non_conformity_action,
      observations: input.observations,
      next_change_date: input.next_change_date,
    })
    .eq('id', entryId)
    .select('*')
    .single();

  if (error) throw error;
  return data as WoundEntry;
}

export async function deleteWoundEntry(entryId: string): Promise<void> {
  // 1. Buscar fotos vinculadas a esta evolução
  const { data: photos, error: photosError } = await supabase
    .from('wound_photos')
    .select('id, storage_path')
    .eq('entry_id', entryId);

  if (photosError) throw photosError;

  // 2. Deletar fotos do storage e metadados
  if (photos && photos.length > 0) {
    const paths = photos.map((p) => p.storage_path);
    await supabase.storage.from(WOUND_STORAGE_BUCKET).remove(paths);
    
    // O delete da entrada vai dar cascade nos metadados da foto se configurado, 
    // mas vamos garantir deletando os ids de cache local também
    for (const photo of photos) {
      await deleteWoundPhotoCache(photo.id).catch(() => undefined);
    }
  }

  // 3. Deletar a evolução
  const { error } = await supabase
    .from('wound_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}

export async function updateWoundCase(woundId: string, input: Partial<CreateWoundCaseInput>): Promise<WoundCase> {
  const payload = {
    started_at: input.started_at,
    etiology: input.etiology?.trim(),
    classification: input.classification?.trim(),
    anatomical_region: input.anatomical_region,
    anatomical_subregion: input.anatomical_subregion,
    anatomical_code: input.anatomical_code,
    comorbidities: input.comorbidities,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('wound_cases')
    .update(payload)
    .eq('id', woundId)
    .select('*')
    .single();

  if (error) throw error;
  return data as WoundCase;
}

export async function listWoundEntries(woundId: string): Promise<WoundEntry[]> {
  const { data, error } = await supabase
    .from('wound_entries')
    .select('*')
    .eq('wound_id', woundId)
    .order('recorded_at', { ascending: false });

  if (error) throw error;

  return hydrateEntriesWithProfiles(data ?? []);
}

export async function closeWoundCase(input: CloseWoundCaseInput): Promise<WoundCase> {
  const { data, error } = await supabase.rpc('close_wound_case', {
    p_wound_id: input.wound_id,
    p_expected_version: input.expected_version,
    p_closure_type: input.closure_type,
    p_closure_date: input.closure_date,
    p_closure_reason: input.closure_reason,
    p_closed_by: input.closed_by ?? null,
  });

  if (error) throw error;
  return data as WoundCase;
}

export async function reopenWoundCase(input: ReopenWoundCaseInput): Promise<WoundCase> {
  const { data, error } = await supabase.rpc('reopen_wound_case', {
    p_wound_id: input.wound_id,
    p_expected_version: input.expected_version,
    p_reason: input.reason,
    p_reopened_by: input.reopened_by ?? null,
  });

  if (error) throw error;
  return data as WoundCase;
}

export async function uploadWoundPhotos(inputs: UploadWoundPhotoInput[]): Promise<WoundPhoto[]> {
  const uploaded: WoundPhoto[] = [];

  for (let index = 0; index < inputs.length; index += 1) {
    const item = inputs[index];
    assertImageFile(item.file);

    const storagePath = buildPhotoPath(item.wound_id, item.file.name);

    const { error: uploadError } = await supabase.storage
      .from(WOUND_STORAGE_BUCKET)
      .upload(storagePath, item.file, {
        cacheControl: '31536000',
        contentType: item.file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error('[uploadWoundPhotos] Erro no upload para storage:', uploadError);
      throw uploadError;
    }

    const { data: metadata, error: metadataError } = await supabase
      .from('wound_photos')
      .insert({
        wound_id: item.wound_id,
        entry_id: item.entry_id ?? null,
        storage_path: storagePath,
        captured_at: item.captured_at ?? new Date().toISOString(),
        display_order: item.display_order ?? index,
        description: item.description ?? null,
        is_primary: item.is_primary ?? false,
      })
      .select('*')
      .single();

    if (metadataError) {
      console.error('[uploadWoundPhotos] Erro ao inserir metadados no banco:', metadataError);
      // Tentativa de rollback no storage caso o banco falhe
      await supabase.storage.from(WOUND_STORAGE_BUCKET).remove([storagePath]).catch(() => undefined);
      throw metadataError;
    }

    // Cache the blob locally immediately
    const photo = metadata as WoundPhoto;
    await saveWoundPhotoCache(photo.id, item.file);

    uploaded.push(photo);
  }

  return uploaded;
}

export async function deleteWoundPhoto(photoId: string): Promise<void> {
  const { data: photo, error: photoError } = await supabase
    .from('wound_photos')
    .select('*')
    .eq('id', photoId)
    .single();

  if (photoError) throw photoError;

  const storagePath = (photo as WoundPhoto).storage_path;

  const { error: dbError } = await supabase
    .from('wound_photos')
    .update({
      deleted_at: new Date().toISOString(),
      is_primary: false,
    })
    .eq('id', photoId);

  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage.from(WOUND_STORAGE_BUCKET).remove([storagePath]);
  if (storageError) throw storageError;

  // Clear local cache for this photo
  await deleteWoundPhotoCache(photoId).catch(() => undefined);
}

export async function listWoundPhotos(woundId: string): Promise<WoundPhoto[]> {
  const { data, error } = await supabase
    .from('wound_photos')
    .select('*')
    .eq('wound_id', woundId)
    .is('deleted_at', null)
    .order('captured_at', { ascending: false })
    .order('display_order', { ascending: true });

  if (error) throw error;

  return (data ?? []) as WoundPhoto[];
}

export async function listWoundStatusEvents(woundId: string): Promise<WoundStatusEvent[]> {
  const { data, error } = await supabase
    .from('wound_status_events')
    .select('*')
    .eq('wound_id', woundId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return hydrateEventsWithProfiles(data ?? []);
}

export async function getSignedWoundPhotoUrl(storagePath: string, expiresInSec = 3600): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(WOUND_STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSec);

  if (error) throw error;

  if (!data?.signedUrl) {
    throw new Error('Não foi possível gerar URL assinada da foto.');
  }

  return data.signedUrl;
}

export async function hydratePhotosWithSignedUrls(photos: WoundPhoto[], expiresInSec = 3600): Promise<WoundPhoto[]> {
  const signedPhotos = await Promise.all(
    photos.map(async (photo) => {
      try {
        // 1. Try to get from local cache first
        const cachedBlob = await getWoundPhotoCache(photo.id);
        if (cachedBlob) {
          return {
            ...photo,
            signed_url: URL.createObjectURL(cachedBlob),
          };
        }

        // 2. If not in cache, get signed URL and download to cache
        const signedUrl = await getSignedWoundPhotoUrl(photo.storage_path, expiresInSec);
        
        // Background fetch the blob to cache it for next time
        // We don't await this to avoid blocking the initial render, 
        // but we return the signedUrl for immediate use.
        void fetch(signedUrl)
          .then(res => res.blob())
          .then(blob => saveWoundPhotoCache(photo.id, blob))
          .catch(err => console.warn(`Falha ao cachear foto ${photo.id}:`, err));

        return {
          ...photo,
          signed_url: signedUrl,
        };
      } catch (err) {
        console.error(`Erro ao hidratar foto ${photo.id}:`, err);
        return {
          ...photo,
          signed_url: null,
        };
      }
    }),
  );

  return signedPhotos;
}

async function hydrateEntriesWithProfiles(entries: any[]): Promise<WoundEntry[]> {
  if (entries.length === 0) return [];

  const professionalIds = [...new Set(entries.map((e) => e.professional_id))];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', professionalIds);

  if (error) {
    console.error('Erro ao buscar perfis dos profissionais:', error);
    return entries as WoundEntry[];
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]));

  return entries.map((entry) => ({
    ...entry,
    profiles: profileMap.get(entry.professional_id) || undefined,
  })) as WoundEntry[];
}

async function hydrateEventsWithProfiles(events: any[]): Promise<WoundStatusEvent[]> {
  if (events.length === 0) return [];

  const performedByBy = [...new Set(events.map((e) => e.performed_by))];
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', performedByBy);

  if (error) {
    console.error('Erro ao buscar perfis dos eventos:', error);
    return events as WoundStatusEvent[];
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]));

  return events.map((event) => ({
    ...event,
    profiles: profileMap.get(event.performed_by) || undefined,
  })) as WoundStatusEvent[];
}
