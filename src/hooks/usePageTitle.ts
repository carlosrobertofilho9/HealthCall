import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para atualizar o título da página de forma dinâmica baseado na rota atual.
 * Altera também o título da aba do navegador (document.title).
 */
export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/display') {
      document.title = 'HealthCall Display';
    } else {
      document.title = 'HealthCall';
    }
  }, [location.pathname]);
};
