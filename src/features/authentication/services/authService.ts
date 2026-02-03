/**
 * Serviço de autenticação (Supabase)
 * Substitui a autenticação local do Electron
 */

import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// Re-export types if needed or map them
export type AuthUser = User;

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

/**
 * Autentica um usuário usando email e senha.
 */
export async function signInWithPassword(credentials: { email: string; password: string }): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw error;
  if (!data.session || !data.user) throw new Error('Sessão não criada');

  return {
    user: data.user,
    access_token: data.session.access_token,
  };
}

/**
 * Desconecta o usuário atualmente autenticado.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Obtém a sessão de autenticação atual.
 */
export async function getSession(): Promise<AuthSession | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) return null;

  return {
    user: session.user,
    access_token: session.access_token,
  };
}

/**
 * Verifica se é o primeiro login do usuário
 * (Mocked or check metadata/profile)
 */
export async function isFirstLogin(userId: string): Promise<boolean> {
  // Check user metadata or a profiles table
  // For migration simplicity:
  return false; 
}

/**
 * Atualiza as credenciais do usuário
 */
export async function updateCredentials(
  userId: string, 
  email: string, 
  password: string, 
  name: string
): Promise<User> {
  const updates: any = {};
  if (email) updates.email = email;
  if (password) updates.password = password;
  if (name) updates.data = { name };

  const { data, error } = await supabase.auth.updateUser(updates);

  if (error) throw error;
  if (!data.user) throw new Error('Falha ao atualizar usuário');
  
  return data.user;
}

/**
 * Atualiza o destino/setor de trabalho do usuário
 */
export async function updateUserDestination(userId: string, destination: string | null): Promise<User> {
  const { data, error } = await supabase.auth.updateUser({
    data: { default_destination: destination }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Falha ao atualizar destino');

  return data.user;
}
