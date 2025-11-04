import { supabase } from '@/lib/supabase';
import { SignInWithPasswordCredentials } from '@supabase/supabase-js';

export async function signInWithPassword(credentials: SignInWithPasswordCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
