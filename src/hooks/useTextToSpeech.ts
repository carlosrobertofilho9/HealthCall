import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook customizado para TTS (Text-to-Speech).
 * 
 * Tenta utilizar uma Edge Function do Supabase ('generate-tts') que retorna uma URL pública de áudio.
 * Se falhar, faz fallback para a Web Speech API nativa.
 */
export function useTextToSpeech() {
  const [isLoading, setIsLoading] = useState(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Cache simples em memória para evitar requisições repetidas
  const audioCache = useRef<Map<string, string>>(new Map());

  /**
   * Cancela qualquer reprodução em andamento
   */
  const cancel = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
  };

  /**
   * Reproduz áudio nativo (Web Speech API)
   */
  const speakNative = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('Web Speech API indisponível'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      
      utterance.onend = () => {
        currentUtteranceRef.current = null;
        resolve();
      };
      
      utterance.onerror = (e) => {
        currentUtteranceRef.current = null;
        console.error('[TTS] Erro nativo:', e);
        reject(new Error('Erro na fala nativa'));
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  };

  /**
   * Gera e reproduz o áudio
   */
  const speak = async (text: string): Promise<void> => {
    cancel(); // Para anterior
    setIsLoading(true);

    try {
      // 1. Verifica Cache
      if (audioCache.current.has(text)) {
        const cachedUrl = audioCache.current.get(text)!;
        await playAudioUrl(cachedUrl);
        return;
      }

      // 2. Tenta Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text },
      });

      if (error || !data) {
        throw new Error(error?.message || 'Erro na Edge Function');
      }

      // A Edge Function agora retorna { speechUrl: 'https://...' }
      if (data.speechUrl) {
        audioCache.current.set(text, data.speechUrl);
        await playAudioUrl(data.speechUrl);
      } else {
        throw new Error('Formato de resposta inválido da Edge Function');
      }

    } catch (err) {
      console.warn('[TTS] Falha ao usar TTS Remoto, usando fallback nativo:', err);
      // 3. Fallback para Nativo
      await speakNative(text);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudioUrl = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Tenta acordar o contexto global se possível
      const globalCtx = (window as any).healthCallAudioContext;
      if (globalCtx && globalCtx.state === 'suspended') {
        globalCtx.resume().catch((e: any) => console.warn('[TTS] Falha ao retomar contexto global:', e));
      }

      const audio = new Audio(url);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        currentAudioRef.current = null;
        resolve();
      };
      
      audio.onerror = (e) => {
        currentAudioRef.current = null;
        reject(e);
      };
      
      audio.play().catch(reject);
    });
  };

  /**
   * Pré-carrega o áudio (útil para filas)
   */
  const preloadTTS = async (text: string): Promise<string> => {
    if (audioCache.current.has(text)) return audioCache.current.get(text)!;

    try {
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text },
      });

      if (error || !data || !data.speechUrl) throw error;

      audioCache.current.set(text, data.speechUrl);
      return data.speechUrl;
    } catch (e) {
      console.warn('[TTS] Falha no preload:', e);
      return '';
    }
  };

  return { speak, preloadTTS, cancel, isLoading };
}

