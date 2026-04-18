import { supabase } from '@/lib/supabaseClient';
import { Warning, CreateWarningDTO, UpdateWarningDTO } from '../types';
import {
  cacheRemoteWarningMedia,
  deleteLocalWarningMedia,
  isLocalWarningMediaUrl,
} from './localWarningMedia';

const WARNING_MEDIA_CACHE_CONTROL_SECONDS = '31536000';

export const getWarnings = async (): Promise<Warning[]> => {
  const { data, error } = await supabase
    .from('warnings')
    .select('*')
    .order('priority_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getActiveWarnings = async (): Promise<Warning[]> => {
  const { data, error } = await supabase
    .from('warnings')
    .select('*')
    .eq('active', true)
    .order('priority_order', { ascending: true });

  if (error) throw error;
  return data;
};

export const createWarning = async (warning: CreateWarningDTO): Promise<Warning> => {
  const { data, error } = await supabase
    .from('warnings')
    .insert(warning)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWarning = async (warning: UpdateWarningDTO): Promise<Warning> => {
  const { id, ...updates } = warning;
  const { data, error } = await supabase
    .from('warnings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWarningMedia = async (contentUrl?: string | null): Promise<void> => {
  if (!contentUrl) return;
  if (isLocalWarningMediaUrl(contentUrl)) {
    await deleteLocalWarningMedia(contentUrl);
    return;
  }

  await deleteLocalWarningMedia(contentUrl).catch(() => undefined);

  // Attempt to delete the Supabase Storage file.
  try {
    const fileName = contentUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('warnings').remove([fileName]);
    }
  } catch {
    // Don't throw here, as the record is already deleted
  }
};

export const deleteWarning = async (id: string, contentUrl: string): Promise<void> => {
  // Delete the record first
  const { error: dbError } = await supabase
    .from('warnings')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;

  await deleteWarningMedia(contentUrl);
};

export const uploadMedia = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('warnings')
    .upload(filePath, file, {
      cacheControl: WARNING_MEDIA_CACHE_CONTROL_SECONDS,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('warnings').getPublicUrl(filePath);
  await cacheRemoteWarningMedia(data.publicUrl, file, file.name).catch(() => undefined);

  return data.publicUrl;
};
