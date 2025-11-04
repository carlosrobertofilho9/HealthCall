import { supabase } from '@/lib/supabaseClient';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';

/**
 * Autentica um usuário usando email e senha.
 *
 * @param {SignInWithPasswordCredentials} credentials As credenciais de email e senha do usuário.
 * @returns {Promise<import('@supabase/supabase-js').AuthResponse['data']>} Os dados da resposta de autenticação.
 * @throws {import('@supabase/supabase-js').AuthError} Se a autenticação falhar.
 */
export async function signInWithPassword(credentials: SignInWithPasswordCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
}

/**
 * Desconecta o usuário atualmente autenticado.
 *
 * @throws {import('@supabase/supabase-js').AuthError} Se o processo de logout falhar.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtém a sessão de autenticação atual.
 *
 * @returns {Promise<import('@supabase/supabase-js').Session | null>} A sessão atual, ou `null` se não houver sessão ativa.
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
