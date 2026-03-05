import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Interface pública do hook useWarningTimer.
 */
export interface UseWarningTimerReturn {
  /** Se os warnings devem ser exibidos. */
  showWarnings: boolean;
  /** Para os warnings imediatamente e reseta o timer. */
  stopWarnings: () => void;
  /** Reinicia o timer de inatividade. */
  resetTimer: () => void;
}

// Tempo em ms para iniciar warnings após inatividade
const WARNINGS_DELAY_MS = 10000;

/**
 * Hook que controla o timer de inatividade para exibição de avisos.
 *
 * Quando nenhuma chamada está ativa e o áudio está ativado, inicia um timer.
 * Após o tempo de inatividade, ativa os warnings. Quando uma chamada é detectada,
 * para os warnings imediatamente.
 *
 * @param isCalling - Se uma chamada está em andamento.
 * @param audioActivated - Se o áudio foi ativado pelo usuário.
 */
export function useWarningTimer(
  isCalling: boolean,
  audioActivated: boolean
): UseWarningTimerReturn {
  const [showWarnings, setShowWarnings] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showWarningsRef = useRef(false);

  /**
   * Para warnings imediatamente e limpa o timer.
   */
  const stopWarnings = useCallback(() => {
    setShowWarnings(false);
    showWarningsRef.current = false;
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  /**
   * Inicia/reinicia o timer de inatividade.
   */
  const resetTimer = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    warningTimerRef.current = setTimeout(() => {
      console.log('[WarningTimer] Iniciando exibição de avisos após inatividade');
      setShowWarnings(true);
      showWarningsRef.current = true;
    }, WARNINGS_DELAY_MS);
  }, []);

  // Gerencia o timer baseado no estado de chamada
  useEffect(() => {
    if (!audioActivated) return;

    if (isCalling) {
      console.log('[WarningTimer] Chamada detectada, parando avisos');
      stopWarnings();
    } else {
      console.log('[WarningTimer] Sem chamada ativa, iniciando timer');
      resetTimer();
    }

    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isCalling, audioActivated, stopWarnings, resetTimer]);

  return {
    showWarnings,
    stopWarnings,
    resetTimer,
  };
}
