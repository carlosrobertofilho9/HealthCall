const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const requestedMode = import.meta.env.VITE_DATA_MODE?.trim().toLowerCase();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * HealthCall is local-first by default. The legacy Supabase backend remains
 * available only when explicitly requested with VITE_DATA_MODE=supabase.
 */
export const dataMode: 'local' | 'supabase' =
  requestedMode === 'supabase' && hasSupabaseConfig ? 'supabase' : 'local';

export const isLocalMode = dataMode === 'local';
export const isSupabaseMode = dataMode === 'supabase';

export const localApiBase = (import.meta.env.VITE_LOCAL_API_URL?.trim() || '').replace(/\/$/, '');
