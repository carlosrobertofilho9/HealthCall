import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import { HomePage } from '@/features/dashboard';
import { DisplayPage } from '@/features/display';
import SettingsPage from '@/features/settings/routes/SettingsPage';
import WarningsPage from '@/features/warnings/pages/WarningsPage';
import { AppointmentsPage, CapacityDashboardPage, WeeklyAppointmentsPage, QuickReceptionPage } from '@/features/appointments';
import DocumentsPage from '@/features/documents/pages/DocumentsPage';
import LoginPage from '@/features/authentication/routes/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

/**
 * The main application router configuration.
 * It defines all the routes for the application, including protected routes
 * that require authentication.
 *
 * @see https://reactrouter.com/en/main/routers/create-browser-router
 */
export const router = createBrowserRouter([
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
			{ path: 'settings', element: <SettingsPage /> },
      { path: 'warnings', element: <WarningsPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'appointments/quick', element: <QuickReceptionPage /> },
      { path: 'appointments/week', element: <WeeklyAppointmentsPage /> },
      { path: 'appointments/capacity', element: <CapacityDashboardPage /> },
      { path: 'documents', element: <DocumentsPage /> },
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
]);

export default router;
