import { useEffect, useState } from 'react';
import { clearQueue } from '@/features/dashboard/services/patientService';
import * as authService from '@/features/authentication/services/authService';
import type { AuthSession } from '@/features/authentication/services/authService';

/**
 * Hook customizado para gerenciar o estado de autenticação do usuário.
 * Utiliza o Supabase para autenticação.
 *
 * @returns Um objeto contendo:
 * - `session`: O objeto da sessão atual, ou null se não autenticado.
 * - `loading`: Um booleano que é true enquanto inicializa.
 * - `user`: O objeto do usuário atual, ou null se não autenticado.
 * - `signOut`: Função para deslogar.
 */
export function useAuth() {
	const [session, setSession] = useState<AuthSession | null>(null);
	const [loading, setLoading] = useState(true);

	const signOut = async () => {
		await authService.signOut();
		setSession(null);
	};

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
		user: session?.user ?? null,
		signOut
	};
}
