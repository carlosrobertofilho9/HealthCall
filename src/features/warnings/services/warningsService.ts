import { supabase } from '@/lib/supabaseClient';
import { Warning, CreateWarningDTO, UpdateWarningDTO } from '../types';

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

export const deleteWarning = async (id: string, contentUrl: string): Promise<void> => {
  // Delete the record first
  const { error: dbError } = await supabase
    .from('warnings')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;

  // Attempt to delete the file from storage
  try {
    const fileName = contentUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('warnings').remove([fileName]);
    }
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    // Don't throw here, as the record is already deleted
  }
};

export const uploadMedia = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('warnings')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('warnings').getPublicUrl(filePath);
  return data.publicUrl;
};
