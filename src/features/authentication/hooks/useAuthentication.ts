import { useState, useCallback } from 'react';
import { AuthError, User, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import * as authService from '@/features/authentication/services/authService';

/**
 * Um hook customizado para gerenciar a lógica de autenticação.
 *
 * Este hook encapsula as chamadas de serviço de autenticação (login, logout, getSession)
 * e gerencia os estados de carregamento, erro e do usuário. Ele fornece uma interface
 * simplificada para que os componentes de UI interajam com a camada de autenticação.
 *
 * @returns {{
 *   user: User | null,
 *   error: AuthError | null,
 *   loading: boolean,
 *   login: (credentials: SignInWithPasswordCredentials) => Promise<boolean>,
 *   logout: () => Promise<void>,
 *   getSession: () => Promise<import('@supabase/supabase-js').Session | null>
 * }} Um objeto contendo o estado de autenticação e as funções.
 */
export function useAuthentication() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: SignInWithPasswordCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithPassword(credentials);
      return true;
    } catch (error: any) {
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = useCallback(async () => {
    const session = await authService.getSession();
    setUser(session?.user ?? null);
    return session;
  }, []);

  return { user, error, loading, login, logout, getSession };
}
