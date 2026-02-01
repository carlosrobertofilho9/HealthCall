import React from 'react';
import { createHashRouter, Outlet } from 'react-router-dom';
import { DisplayDataProvider } from '@/contexts/DisplayDataContext';
import App from '@/App';
import { HomePage, WarningsPage } from '@/features/dashboard';
import { DisplayPage } from '@/features/display';
import SettingsPage from '@/features/settings/routes/SettingsPage';
import LoginPage from '@/features/authentication/routes/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

/**
 * The main application router configuration.
 * It defines all the routes for the application, including protected routes
 * that require authentication.
 *
 * Uses HashRouter instead of BrowserRouter to support Electron's file:// protocol.
 * @see https://reactrouter.com/en/main/routers/create-hash-router
 */
export const router = createHashRouter([
	{
		element: (
			<DisplayDataProvider>
				<Outlet />
			</DisplayDataProvider>
		),
		children: [
			// Main application layout with protected routes
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
			// Standalone route for the public display screen
			{
				path: '/display',
				element: <DisplayPage />,
			},
			// Authentication routes
			{
				path: '/auth/login',
				element: <LoginPage />,
			},
		],
	},
]);

export default router;
