import React, { useEffect } from 'react';
import { useAudioContext } from '@/hooks/useAudioContext';

/**
 * Componente invisível responsável por manter o AudioContext ativo e monitorado.
 * Implementa a estratégia de "Silent Loop" para evitar suspensão em background.
 */
export const AudioKeeper: React.FC = () => {
  const { startHealthCheck, resume, isHealthy } = useAudioContext();

  useEffect(() => {
    // Inicia o health check (que inicia o silent loop se possível)
    startHealthCheck();

    // Tenta retomar o contexto em qualquer interação do usuário
    const handleInteraction = () => {
      resume();
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    // Monitora visibilidade para reativar ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startHealthCheck, resume]);

  // Pode renderizar um indicador discreto se quiser (opcional)
  // Por enquanto, invisível.
  return null;
};
