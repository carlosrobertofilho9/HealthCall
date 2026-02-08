import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { useRef, useCallback } from 'react';

// Cache em memória com expiração para evitar URLs antigas/inválidas
interface CacheEntry {
  url: string;
  timestamp: number;
  verified: boolean; // URL foi verificada recentemente
}

const ttsCache = new Map<string, CacheEntry>();
const CACHE_EXPIRATION_MS = 3600000; // 1 hora
const MAX_CACHE_SIZE = 100;

/**
 * Verifica se uma URL de cache ainda é válida
 */
async function verifyCacheUrl(url: string): Promise<boolean> {
  try {
    // HEAD request para verificar se URL ainda existe
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.error('[TTS] Erro ao verificar URL de cache:', error);
    return false;
  }
}

/**
 * Gerencia o cache com expiração e limite de tamanho
 */
const cacheHelpers = {
  async get(key: string): Promise<string | null> {
    const entry = ttsCache.get(key);
    if (!entry) return null;

    // Verifica se expirou
    if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
      console.log('[TTS] Cache expirado, removendo:', key.substring(0, 30));
      ttsCache.delete(key);
      return null;
    }

    // Verifica integridade periodicamente (a cada 5 minutos)
    const VERIFY_INTERVAL = 300000; // 5 minutos
    if (!entry.verified || Date.now() - entry.timestamp > VERIFY_INTERVAL) {
      console.log('[TTS] Verificando integridade do cache:', key.substring(0, 30));

      const isValid = await verifyCacheUrl(entry.url);
      if (!isValid) {
        console.warn('[TTS] URL de cache inválida, removendo:', entry.url);
        ttsCache.delete(key);
        return null;
      }

      entry.verified = true;
      entry.timestamp = Date.now(); // Atualiza timestamp após verificação
    }

    return entry.url;
  },

  set(key: string, url: string) {
    // Remove entradas mais antigas se atingir limite
    if (ttsCache.size >= MAX_CACHE_SIZE) {
      const oldest = Array.from(ttsCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) {
        console.log('[TTS] Cache cheio, removendo mais antigo:', oldest[0].substring(0, 30));
        ttsCache.delete(oldest[0]);
      }
    }

    ttsCache.set(key, { url, timestamp: Date.now(), verified: true });
  },

  clear() {
    ttsCache.clear();
  },
};

/**
 * Retry logic com exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[TTS] Tentativa ${i + 1} falhou. Tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas');
}

/**
 * Valida se uma URL de áudio é segura e confiável
 */
function isValidAudioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // CRÍTICO: Bloqueia protocolos perigosos
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      console.error('[TTS] Protocolo inválido bloqueado:', parsed.protocol);
      return false;
    }

    // Em produção, valida domínio Supabase
    if (import.meta.env.PROD && import.meta.env.VITE_SUPABASE_URL) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseDomain = new URL(supabaseUrl).hostname;

        // Extrai domínio principal (ex: supabase.co)
        const mainDomain = supabaseDomain.split('.').slice(-2).join('.');

        if (!parsed.hostname.includes(mainDomain)) {
          console.error('[TTS] Domínio não autorizado:', parsed.hostname);
          return false;
        }
      } catch (e) {
        // Se não conseguir validar domínio, permite (fail open em dev)
        console.warn('[TTS] Não foi possível validar domínio:', e);
      }
    }

    return true;
  } catch (e) {
    console.error('[TTS] URL malformada:', url);
    return false;
  }
}

/**
 * Hook customizado para gerenciar a funcionalidade de Text-to-Speech (TTS).
 *
 * Este hook converte texto em fala usando SEMPRE arquivos de áudio reais
 * gerados via edge function do Supabase (Google Translate TTS).
 *
 * NOTA: Não usa speechSynthesis nativo do navegador porque esse áudio
 * não é capturado pelo espelhamento do Chromecast.
 *
 * @returns {{
 *   speak: (text: string) => Promise<void>,
 *   preloadTTS: (text: string) => Promise<string>,
 *   cancel: () => void
 * }} Um objeto contendo a função `speak` para iniciar a síntese de voz.
 */
export function useTextToSpeech() {
  // Ref para rastrear o áudio atual em reprodução
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const cancelledRef = useRef(false);

  /**
   * Cancela qualquer reprodução de áudio TTS em andamento.
   */
  const cancel = useCallback(() => {
    console.log('[TTS] Cancelando reprodução...');
    cancelledRef.current = true;
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    // Reset após breve delay para permitir novas reproduções
    setTimeout(() => {
      cancelledRef.current = false;
    }, 100);
  }, []);

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

  const speak = (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let speechAudio: HTMLAudioElement | null = null;
      const startTime = Date.now();

      // Verifica se foi cancelado antes de começar
      if (cancelledRef.current) {
        console.log('[TTS] Reprodução cancelada antes de iniciar');
        resolve();
        return;
      }

      try {
        // Obtém a URL do áudio (usa cache se disponível, com retry)
        const speechUrl = await preloadTTS(text);

        // Verifica novamente se foi cancelado após preload
        if (cancelledRef.current) {
          console.log('[TTS] Reprodução cancelada após preload');
          resolve();
          return;
        }

        // ⚠️ VALIDAÇÃO CRÍTICA DE SEGURANÇA
        // DEVE rejeitar antes de criar elemento Audio
        if (!isValidAudioUrl(speechUrl)) {
          const error = new Error('URL de áudio inválida ou não confiável');
          audioTelemetry.trackError('malicious_url_blocked', `Blocked: ${speechUrl}`);
          audioTelemetry.trackPlayback(false, Date.now() - startTime, error.message);
          throw error; // Propaga erro imediatamente
        }

        // Cria e configura o elemento de áudio
        speechAudio = new Audio(speechUrl);
        currentAudioRef.current = speechAudio;

        // Configurações para Chromecast
        speechAudio.crossOrigin = 'anonymous';
        speechAudio.preload = 'auto';
        speechAudio.volume = 1.0;

        // Gerencia eventos de áudio com cleanup completo
        const cleanup = () => {
          if (speechAudio) {
            // Pausa reprodução
            speechAudio.pause();

            // Remove todos os event listeners
            speechAudio.onended = null;
            speechAudio.onerror = null;
            speechAudio.onloadeddata = null;
            speechAudio.oncanplay = null;
            speechAudio.onprogress = null;
            speechAudio.onstalled = null;
            speechAudio.onwaiting = null;

            // Limpa src e força descarga do buffer
            speechAudio.src = '';
            speechAudio.load();

            // Remove do DOM se foi adicionado
            if (speechAudio.remove) {
              speechAudio.remove();
            }

            speechAudio = null;
          }
        };

        speechAudio.onended = () => {
          console.log('[TTS] Reprodução concluída');
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(true, latency);
          cleanup();
          currentAudioRef.current = null;
          resolve();
        };

        speechAudio.onerror = (e) => {
          console.error('[TTS] Erro na reprodução:', e);
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(false, latency, 'Erro ao reproduzir áudio');
          audioTelemetry.trackError('playback_error', e?.toString() || 'Unknown error');

          // Se erro de reprodução, invalida o cache (URL pode estar corrompida)
          if (cacheHelpers.get(text) === speechUrl) {
            console.log('[TTS] Removendo URL corrompida do cache');
            ttsCache.delete(text);
          }

          cleanup();
          currentAudioRef.current = null;
          reject(new Error('Erro ao reproduzir áudio'));
        };

        console.log('[TTS] Iniciando reprodução');
        await speechAudio.play();
      } catch (e) {
        console.error('[TTS] Erro no speak():', e);
        const latency = Date.now() - startTime;
        audioTelemetry.trackPlayback(false, latency, e instanceof Error ? e.message : 'Unknown error');
        audioTelemetry.trackError('speak_error', e instanceof Error ? e.message : String(e));

        // Cleanup em caso de erro
        if (speechAudio) {
          speechAudio.pause();
          speechAudio.src = '';
        }
        currentAudioRef.current = null;

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

  return { speak, preloadTTS, cancel };
}

