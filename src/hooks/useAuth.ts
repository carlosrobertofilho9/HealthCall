import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

/**
 * A custom hook to manage user authentication state with Supabase.
 * It provides the current session, loading status, and user object.
 *
 * @returns {{ session: Session | null, loading: boolean, user: import('@supabase/supabase-js').User | null }} An object containing:
 * - `session`: The current user session object, or null if not authenticated.
 * - `loading`: A boolean that is true while the session is being fetched, and false otherwise.
 * - `user`: The current user object, or null if not authenticated.
 */
export function useAuth() {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const getSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setSession(session);
			setLoading(false);
		};

		getSession();

		const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => {
			authListener?.subscription.unsubscribe();
		};
	}, []);

	return { session, loading, user: session?.user ?? null };
}
