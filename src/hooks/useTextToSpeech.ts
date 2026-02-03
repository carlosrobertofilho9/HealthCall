import { useRef } from 'react';

/**
 * Hook customizado para gerenciar a funcionalidade de Text-to-Speech (TTS).
 *
 * Utiliza a Web Speech API nativa do navegador.
 */
export function useTextToSpeech() {
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Cancela a fala atual
   */
  const cancel = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtterance.current = null;
    }
  };

  /**
   * Converte texto em fala
   */
  const speak = (text: string): Promise<void> => {
    cancel(); // Cancela anterior

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Web Speech API não disponível'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        currentUtterance.current = null;
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('[TTS] Erro:', e);
        currentUtterance.current = null;
        reject(new Error('Erro na síntese de voz'));
      };

      currentUtterance.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  /**
   * Pré-carregamento não é necessário/possível com Web Speech API da mesma forma que arquivos de áudio.
   * Mantemos a assinatura para compatibilidade.
   */
  const preloadTTS = async (text: string): Promise<string> => {
    return text;
  };

  return { speak, preloadTTS, cancel };
}

