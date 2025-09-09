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
