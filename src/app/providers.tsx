import React from 'react';

/**
 * A component that wraps the entire application with all necessary context providers.
 * 
 * NOTE: Os providers principais (NetworkSyncProvider, SettingsProvider, UserProfileProvider, 
 * DisplayDataProvider) foram movidos para o router.tsx para garantir que estejam disponíveis
 * em todas as rotas, incluindo aquelas que usam ErrorBoundary do React Router.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the providers.
 * @returns {JSX.Element} The providers wrapping the children components.
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default Providers;
