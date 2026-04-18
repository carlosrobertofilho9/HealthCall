import { supabase } from '@/lib/supabaseClient';
import {
  PENDENCIA_STATUS,
  type CreatePendenciaDTO,
  type Pendencia,
  type UpdatePendenciaDTO,
  type PendenciaStatus,
} from '../types';

export const getPendencias = async (): Promise<Pendencia[]> => {
  const { data, error } = await supabase
    .from('pendencias')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createPendencia = async (payload: CreatePendenciaDTO): Promise<Pendencia> => {
  const { data, error } = await supabase
    .from('pendencias')
    .insert({
      ...payload,
      resumo: payload.resumo?.trim() || null,
      prazo: payload.prazo || null,
      responsavel: payload.responsavel?.trim() || null,
      status: PENDENCIA_STATUS.ABERTO,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePendenciaStatus = async (id: string, status: PendenciaStatus): Promise<Pendencia> => {
  const isResolved = status === PENDENCIA_STATUS.RESOLVIDO;

  const { data, error } = await supabase
    .from('pendencias')
    .update({
      status,
      updated_at: new Date().toISOString(),
      resolved_at: isResolved ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePendencia = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('pendencias')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updatePendencia = async (payload: UpdatePendenciaDTO): Promise<Pendencia> => {
  const {
    id,
    nome_paciente,
    cns_cpf,
    tipo,
    resumo,
    prioridade,
    prazo,
    responsavel,
  } = payload;

  const { data, error } = await supabase
    .from('pendencias')
    .update({
      nome_paciente,
      cns_cpf,
      tipo,
      resumo: resumo?.trim() || null,
      prioridade,
      prazo: prazo || null,
      responsavel: responsavel?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getOpenPendencias = async (): Promise<Pendencia[]> => {
  const { data, error } = await supabase
    .from('pendencias')
    .select('*')
    .neq('status', PENDENCIA_STATUS.RESOLVIDO)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};
