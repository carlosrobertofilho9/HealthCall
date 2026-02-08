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
import WarningsPage from '@/features/warnings/pages/WarningsPage';
import { AppointmentsPage } from '@/features/appointments';
import DocumentsPage from '@/features/documents/pages/DocumentsPage';
import LoginPage from '@/features/authentication/routes/LoginPage';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import ErrorPage from '@/components/ErrorPage';


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
		errorElement: <ErrorPage />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: 'settings', element: <SettingsPage /> },
      { path: 'warnings', element: <WarningsPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
		],
	},
]);

export default router;
