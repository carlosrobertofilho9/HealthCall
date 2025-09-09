import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import { HomePage } from '@/pages/Home';
import { DisplayPage } from '@/pages/Display';
import LoginPage from '@/pages/Login/LoginPage';

export const router = createBrowserRouter([
  // Árvore principal com layout do App
  {
    path: '/',
    element: <App />,
    children: [{ index: true, element: <HomePage /> }],
  },
  // Rota standalone para a tela de exibição, fora do layout/app
  {
    path: '/display',
    element: <DisplayPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

export default router;
