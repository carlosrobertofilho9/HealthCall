import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type ProtectedRouteProps = {
	children: React.ReactNode;
};

/**
 * A component that protects a route, redirecting to the login page if the user is not authenticated.
 * It displays a loading indicator while checking the authentication status.
 * @param {ProtectedRouteProps} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render if the user is authenticated.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { session, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
				<h1 className="text-4xl mb-8">Carregando...</h1>
				<p className="mt-4 text-gray-400">Verificando autenticação.</p>
			</div>
		);
	}

	if (!session) {
		return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
	}

	return <>{children}</>;
};
