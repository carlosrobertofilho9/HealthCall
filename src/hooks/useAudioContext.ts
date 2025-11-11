import { useRef, useEffect, useState, useCallback } from 'react';
import { audioTelemetry } from '@/lib/audioTelemetry';

/**
 * Hook para gerenciar AudioContext com health check automático
 */
export function useAudioContext() {
  const contextRef = useRef<AudioContext | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Verifica e recupera o estado do AudioContext
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      // Se não existe, cria novo
      if (!contextRef.current) {
        contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[AudioContext] Novo contexto criado');
      }

      const state = contextRef.current.state;
      console.log(`[AudioContext] Health check - Estado: ${state}`);

      // Se fechado, recria
      if (state === 'closed') {
        console.warn('[AudioContext] Contexto fechado, recriando...');
        contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioTelemetry.trackError('audiocontext_closed', 'AudioContext foi fechado e foi recriado');
      }

      // Se suspenso, retoma
      if (contextRef.current.state === 'suspended') {
        console.log('[AudioContext] Retomando contexto suspenso...');
        await contextRef.current.resume();
      }

      const healthy = contextRef.current.state === 'running';
      setIsHealthy(healthy);
      setLastCheck(new Date());

      if (!healthy) {
        audioTelemetry.trackError(
          'audiocontext_unhealthy',
          `Estado inválido: ${contextRef.current.state}`
        );
      }

      return healthy;
    } catch (error) {
      console.error('[AudioContext] Erro no health check:', error);
      setIsHealthy(false);
      audioTelemetry.trackError(
        'audiocontext_check_failed',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }, []);

  /**
   * Força retomada do AudioContext
   */
  const resume = useCallback(async (): Promise<boolean> => {
    try {
      if (!contextRef.current) {
        console.warn('[AudioContext] Contexto não existe, criando...');
        return await checkHealth();
      }

      if (contextRef.current.state === 'suspended') {
        console.log('[AudioContext] Retomando contexto...');
        await contextRef.current.resume();
      }

      const healthy = contextRef.current.state === 'running';
      setIsHealthy(healthy);
      return healthy;
    } catch (error) {
      console.error('[AudioContext] Erro ao retomar:', error);
      audioTelemetry.trackError(
        'audiocontext_resume_failed',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }, [checkHealth]);

  /**
   * Obtém o AudioContext (cria se não existir)
   */
  const getContext = useCallback(async (): Promise<AudioContext | null> => {
    const healthy = await checkHealth();
    if (healthy && contextRef.current) {
      return contextRef.current;
    }
    return null;
  }, [checkHealth]);

  /**
   * Inicia health check periódico
   */
  const startHealthCheck = useCallback((intervalMs: number = 30000) => {
    // Para health check anterior se existir
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    // Primeiro check imediato
    checkHealth();

    // Depois check periódico
    healthCheckIntervalRef.current = setInterval(() => {
      checkHealth();
    }, intervalMs);

    console.log(`[AudioContext] Health check iniciado (${intervalMs}ms)`);
  }, [checkHealth]);

  /**
   * Para health check periódico
   */
  const stopHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
      console.log('[AudioContext] Health check parado');
    }
  }, []);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      stopHealthCheck();
      // Não fecha o AudioContext para evitar problemas de reativação
    };
  }, [stopHealthCheck]);

  /**
   * Listener para mudanças de visibilidade da página
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[AudioContext] Página visível, verificando saúde...');
        checkHealth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkHealth]);

  return {
    contextRef,
    isHealthy,
    lastCheck,
    checkHealth,
    resume,
    getContext,
    startHealthCheck,
    stopHealthCheck,
  };
}
