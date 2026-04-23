/**
 * @file O ponto de entrada principal da aplicação React.
 *
 * Este arquivo é responsável por:
 * 1. Obter o elemento DOM raiz (`root`).
 * 2. Renderizar a aplicação React dentro do elemento raiz.
 * 3. Envolver a aplicação com todos os provedores de contexto necessários (`Providers`).
 * 4. Configurar o `RouterProvider` do React Router para gerenciar as rotas.
 * 5. Importar os estilos CSS globais.
 * 6. Registrar o Service Worker para funcionalidades de Progressive Web App (PWA).
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { router } from '@/app/router';
import '@/styles/index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Verifica atualizações sempre que a página é carregada
        registration.update();
        
        // Verifica atualizações quando o app ganha foco (ex: usuário volta para a aba)
        window.addEventListener('focus', () => {
          registration.update();
        });
      })
      .catch((error) => {
        console.warn('Falha ao registrar Service Worker:', error);
      });
  });
}


