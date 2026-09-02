import { createClient } from '@supabase/supabase-js';
import { hasSupabaseConfig } from './runtime';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * The Supabase client is kept only for the optional legacy/cloud mode.
 * Local-first installations intentionally do not need Supabase environment
 * variables. Placeholder values prevent legacy modules from crashing during
 * module evaluation; local mode never performs requests through this client.
 */
const supabaseUrl = configuredUrl || 'http://127.0.0.1:54321';
const supabaseAnonKey = configuredAnonKey || 'healthcall-local-mode-no-supabase';

export const isSupabaseConfigured = hasSupabaseConfig;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'healthcall-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'healthcall-web-app',
    },
  },
});
