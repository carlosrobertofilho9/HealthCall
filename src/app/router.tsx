import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import { HomePage } from '@/pages/Home';
import { DisplayPage } from '@/pages/Display';
import SettingsPage from '@/pages/Settings/SettingsPage';
import LoginPage from '@/pages/Login/LoginPage';
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
			{ path: 'login', element: <LoginPage /> },
		],
	},
	// Standalone route for the public display screen
	{
		path: '/display',
		element: <DisplayPage />,
	},
]);

export default router;
