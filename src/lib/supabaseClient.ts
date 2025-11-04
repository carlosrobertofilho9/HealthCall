import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

/**
 * The Supabase client instance.
 *
 * This singleton instance is configured with the project's URL and anonymous key
 * from the environment variables. It is used throughout the application to
 * interact with Supabase services like Auth, Database, and Realtime.
 *
 * @see https://supabase.com/docs/library/js/client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
