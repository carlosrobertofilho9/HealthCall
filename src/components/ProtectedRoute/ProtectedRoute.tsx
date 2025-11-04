import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Um componente de ordem superior que protege rotas, exigindo autenticação.
 *
 * Ele verifica o estado da sessão de autenticação usando o hook `useAuth`.
 * Durante a verificação, exibe uma tela de carregamento. Se o usuário não estiver
 * autenticado, ele o redireciona para a página de login. Caso contrário,
 * renderiza os componentes filhos.
 *
 * @param {ProtectedRouteProps} props As propriedades do componente.
 * @param {React.ReactNode} props.children Os componentes filhos a serem renderizados se o usuário estiver autenticado.
 * @returns {React.ReactElement} O elemento a ser renderizado.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { session, loading } = useAuth();

	if (loading) {
		return (
			<div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
				<h1 className="text-4xl mb-8">Carregando...</h1>
				<p className="mt-4 text-gray-400">Verificando autenticação.</p>
			</div>
		);
	}

	if (!session) {
		return <Navigate to="/auth/login" replace />;
	}

	return <>{children}</>;
};
