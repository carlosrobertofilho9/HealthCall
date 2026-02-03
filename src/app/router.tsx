import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { DisplayDataProvider } from '@/contexts/DisplayDataContext';
import { NetworkSyncProvider } from '@/contexts/NetworkSyncContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import App from '@/App';
import { HomePage } from '@/features/dashboard';
import { WarningsPage } from '@/features/warnings';
import { DisplayPage } from '@/features/display';
import SettingsPage from '@/features/settings/routes/SettingsPage';
import LoginPage from '@/features/authentication/routes/LoginPage';

import { ProtectedRoute } from '@/components/ProtectedRoute';


/**
 * Configuração principal de rotas da aplicação.
 */
export const router = createBrowserRouter([
	{
		element: (
			<NetworkSyncProvider>
				<SettingsProvider>
					<UserProfileProvider>
							<DisplayDataProvider>
								<Outlet />
							</DisplayDataProvider>
					</UserProfileProvider>
				</SettingsProvider>
			</NetworkSyncProvider>
		),
		children: [
			// Layout principal com rotas protegidas
			{
				path: '/',
				element: (
					<ProtectedRoute>
						<App />
					</ProtectedRoute>
				),
				children: [
					{ index: true, element: <HomePage /> },
					{ path: 'dashboard/warnings', element: <WarningsPage /> },
					{ path: 'settings', element: <SettingsPage /> },
				],
			},
			// Rota para o painel de exibição pública
			{
				path: '/display',
				element: <DisplayPage />,
			},
			// Rotas de autenticação
			{
				path: '/auth/login',
				element: <LoginPage />,
			},
		],
	},
]);

export default router;
