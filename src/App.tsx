import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Toaster } from '@/components/ui/sonner';

/**
 * O componente raiz de layout para as seções autenticadas da aplicação.
 *
 * Este componente define a estrutura visual principal, incluindo o `Header` e a área de conteúdo principal.
 * Ele também inicializa hooks globais como `usePageTitle` para gerenciar o título da página.
 * O `Outlet` do React Router é usado para renderizar as rotas filhas aninhadas.
 *
 * @returns {React.ReactElement} O componente de layout principal da aplicação.
 */
const App: React.FC = () => {
  usePageTitle();

  return (
    <div className="relative flex size-full min-h-screen flex-col">
      <Toaster position="top-center" />
      <Header />
      <main className="flex-1 px-2 py-6 lg:px-4">
        <div className="w-full max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default App;
