import { useCallback, useRef } from 'react';
import { audioTelemetry } from '@/lib/audioTelemetry';

function getPortugueseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase() === 'pt-br') ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('pt')) ||
    null
  );
}

/**
 * TTS local. Usa apenas a Web Speech API disponível no navegador/dispositivo.
 * Nenhum texto de chamada é enviado para um backend de terceiros pelo HealthCall.
 */
export function useTextToSpeech() {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cancelVersionRef = useRef(0);

  const cancel = useCallback(() => {
    cancelVersionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentUtteranceRef.current = null;
  }, []);

  /**
   * Mantido por compatibilidade com o anunciador: a Web Speech API não precisa
   * baixar arquivo de áudio. Retorna o próprio texto após aquecer a lista de vozes.
   */
  const preloadTTS = useCallback(async (text: string): Promise<string> => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    audioTelemetry.trackCache(true);
    return text;
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();

    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      const error = new Error('Síntese de voz não disponível neste navegador.');
      audioTelemetry.trackError('speech_unavailable', error.message);
      return Promise.reject(error);
    }

    const version = cancelVersionRef.current;
    const start = Date.now();

    return new Promise<void>((resolve, reject) => {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = getPortugueseVoice();
      if (voice) utterance.voice = voice;
      currentUtteranceRef.current = utterance;

      const finish = (success: boolean, error?: Error) => {
        if (currentUtteranceRef.current === utterance) currentUtteranceRef.current = null;
        const latency = Date.now() - start;
        audioTelemetry.trackPlayback(success, latency, error?.message);
        if (version !== cancelVersionRef.current) {
          resolve();
        } else if (success) {
          resolve();
        } else {
          reject(error || new Error('Falha na síntese de voz.'));
        }
      };

      utterance.onend = () => finish(true);
      utterance.onerror = (event) => finish(false, new Error(`Falha na síntese de voz: ${event.error || 'erro desconhecido'}`));

      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        finish(false, error instanceof Error ? error : new Error(String(error)));
      }
    });
  }, []);

  return { speak, preloadTTS, cancel };
}
