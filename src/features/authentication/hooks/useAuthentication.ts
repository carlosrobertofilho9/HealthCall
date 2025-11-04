import { useState, useCallback } from 'react';
import { AuthError, User, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import * as authService from '@/features/authentication/services/authService';

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
