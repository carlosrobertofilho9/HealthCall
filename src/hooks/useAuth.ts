import { useEffect, useState } from 'react';
import { clearQueue } from '@/features/dashboard/services/patientService';
import * as authService from '@/features/authentication/services/authService';
import type { LocalSession, LocalUser } from '@/features/authentication/services/authService';

/**
 * A custom hook to manage user authentication state.
 * Uses local SQLite authentication via Electron IPC.
 *
 * @returns An object containing:
 * - `session`: The current session object, or null if not authenticated.
 * - `loading`: A boolean that is true while initializing, and false otherwise.
 * - `user`: The current user object, or null if not authenticated.
 */
export function useAuth() {
	const [session, setSession] = useState<LocalSession | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const runDailyCleanup = async () => {
			const today = new Date().toISOString().split('T')[0];
			const lastCleanedDate = localStorage.getItem('lastQueueCleanDate');

			if (lastCleanedDate !== today) {
				console.log('Running daily queue cleaning from useAuth...');
				try {
					await clearQueue();
					localStorage.setItem('lastQueueCleanDate', today);
					console.log('Daily cleanup successful.');
				} catch (error) {
					console.error('Daily cleanup failed:', error);
				}
			}
		};

		const initialize = async () => {
			try {
				// Verifica se existe uma sessão salva
				const existingSession = await authService.getSession();
				setSession(existingSession);
				
				if (existingSession) {
					await runDailyCleanup();
				}
			} catch (error) {
				console.error('Error initializing auth:', error);
				setSession(null);
			} finally {
				setLoading(false);
			}
		};

		initialize();
	}, []);

	return { 
		session, 
		loading, 
		user: session?.user ?? null 
	};
}
