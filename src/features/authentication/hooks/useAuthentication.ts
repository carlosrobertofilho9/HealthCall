import { useState, useCallback } from 'react';
import * as authService from '@/features/authentication/services/authService';
import type { LocalUser, LocalSession } from '@/features/authentication/services/authService';

// Interface para erros de autenticação
interface AuthError {
  message: string;
}

/**
 * Um hook customizado para gerenciar a lógica de autenticação local.
 *
 * Este hook encapsula as chamadas de serviço de autenticação (login, logout, getSession)
 * e gerencia os estados de carregamento, erro e do usuário.
 *
 * @returns Um objeto contendo o estado de autenticação e as funções.
 */
export function useAuthentication() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const session = await authService.signInWithPassword(credentials);
      setUser(session.user);
      return true;
    } catch (err: any) {
      setError({ message: err.message || 'Erro ao fazer login' });
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
    } catch (err: any) {
      setError({ message: err.message || 'Erro ao fazer logout' });
    } finally {
      setLoading(false);
    }
  }, []);

  const getSession = useCallback(async (): Promise<LocalSession | null> => {
    const session = await authService.getSession();
    setUser(session?.user ?? null);
    return session;
  }, []);

  const isFirstLogin = useCallback(async (userId: string): Promise<boolean> => {
    return authService.isFirstLogin(userId);
  }, []);

  const updateCredentials = useCallback(async (
    userId: string, 
    email: string, 
    password: string, 
    name: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateCredentials(userId, email, password, name);
      setUser(updatedUser);
      return true;
    } catch (err: any) {
      setError({ message: err.message || 'Erro ao atualizar credenciais' });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    user, 
    error, 
    loading, 
    login, 
    logout, 
    getSession, 
    isFirstLogin, 
    updateCredentials 
  };
}
