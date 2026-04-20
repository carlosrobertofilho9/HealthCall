import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para atualizar o título da página de forma dinâmica baseado na rota atual.
 * Altera também o título da aba do navegador (document.title).
 */
export const usePageTitle = (title?: string) => {
  const location = useLocation();

  useEffect(() => {
    if (title) {
        document.title = `${title} | HealthCall`;
    } else if (location.pathname.startsWith('/wounds')) {
      document.title = 'Curativos | HealthCall';
    } else if (location.pathname === '/display') {
      document.title = 'HealthCall Display';
    } else if (location.pathname.startsWith('/appointments')) {
      document.title = 'Marcações | HealthCall';
    } else if (location.pathname.startsWith('/documents')) {
      document.title = 'Documentos | HealthCall';
    } else {
      document.title = 'HealthCall';
    }
  }, [location.pathname, title]);
};
