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
  } catch {
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
      ttsCache.delete(key);
      return null;
    }

    // Verifica integridade periodicamente (a cada 5 minutos)
    const VERIFY_INTERVAL = 300000; // 5 minutos
    if (!entry.verified || Date.now() - entry.timestamp > VERIFY_INTERVAL) {
      const isValid = await verifyCacheUrl(entry.url);
      if (!isValid) {
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
        ttsCache.delete(oldest[0]);
      }
    }

    ttsCache.set(key, { url, timestamp: Date.now(), verified: false });
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
          return false;
        }
      } catch (e) {
        // Se não conseguir validar domínio, permite (fail open em dev)
        void e;
      }
    }

    return true;
  } catch {
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
  const cancelVersionRef = useRef(0);
  const activeCancelRef = useRef<(() => void) | null>(null);
  const initializedRef = useRef(false);

  if (!initializedRef.current) {
    initializedRef.current = true;
    if (import.meta.env.MODE === 'test') {
      cacheHelpers.clear();
    }
  }

  /**
   * Cancela qualquer reprodução de áudio TTS em andamento.
   */
  const cancel = useCallback(() => {
    cancelVersionRef.current += 1;

    const activeCancel = activeCancelRef.current;
    activeCancelRef.current = null;
    if (activeCancel) {
      activeCancel();
      return;
    }

    if (!currentAudioRef.current) return;
    currentAudioRef.current.pause();
    currentAudioRef.current.src = '';
    currentAudioRef.current = null;
  }, []);

  /**
   * Converte uma string de texto em áudio falado.
   *
   * Gera áudio através da edge function `generate-tts` do Supabase que usa
   * a API do Google Translate. Os arquivos de áudio são armazenados em cache
   * no Supabase Storage e também em memória para melhor performance.
   *
   * Os elementos de áudio são configurados com crossOrigin e preload para
   * garantir compatibilidade com Chromecast durante espelhamento de tela.
   *
   * @param {string} text O texto a ser convertido em fala.
   * @returns {Promise<void>} Uma promessa que é resolvida quando a fala termina.
   */
  /**
   * Pré-carrega o áudio TTS sem reproduzi-lo.
   * Usa cache com expiração e retry logic para maior confiabilidade.
   */
  const preloadTTS = useCallback(async (text: string): Promise<string> => {
    // Verifica o cache antes de invocar a função (agora com validação)
    const cachedUrl = await cacheHelpers.get(text);
    if (cachedUrl) {
      audioTelemetry.trackCache(true); // Cache hit
      return cachedUrl;
    }

    audioTelemetry.trackCache(false); // Cache miss

    // Usa retry logic para chamadas à edge function
    return retryWithBackoff(async () => {
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text },
      });

      if (error) {
        throw new Error(`Erro ao invocar função TTS: ${error.message}`);
      }

      if (!data?.speechUrl) {
        throw new Error('Falha ao gerar áudio TTS: URL não recebida.');
      }

      // Armazena a nova URL no cache
      cacheHelpers.set(text, data.speechUrl);

      return data.speechUrl;
    }, 3, 1000).catch((error) => {
      toast.error('Erro ao gerar áudio da chamada', {
        description: 'Tentando novamente...',
      });
      throw error;
    });
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      let speechAudio: HTMLAudioElement | null = null;
      const startTime = Date.now();
      const callVersion = cancelVersionRef.current;
      let settled = false;

      const cleanup = () => {
        if (!speechAudio) return;

        speechAudio.pause();
        speechAudio.onended = null;
        speechAudio.onerror = null;
        speechAudio.onloadeddata = null;
        speechAudio.oncanplay = null;
        speechAudio.onprogress = null;
        speechAudio.onstalled = null;
        speechAudio.onwaiting = null;

        speechAudio.src = '';
        speechAudio.load();

        if (speechAudio.remove) {
          speechAudio.remove();
        }

        if (currentAudioRef.current === speechAudio) {
          currentAudioRef.current = null;
        }

        speechAudio = null;
      };

      const finalizeResolve = () => {
        if (settled) return;
        settled = true;

        cleanup();
        if (activeCancelRef.current === cancelPlayback) {
          activeCancelRef.current = null;
        }

        resolve();
      };

      const finalizeReject = (error: unknown) => {
        if (settled) return;
        settled = true;

        cleanup();
        if (activeCancelRef.current === cancelPlayback) {
          activeCancelRef.current = null;
        }

        reject(error);
      };

      const cancelPlayback = () => {
        const latency = Date.now() - startTime;
        audioTelemetry.trackPlayback(false, latency, 'cancelled');
        finalizeResolve();
      };

      // Verifica se foi cancelado antes de começar
      if (callVersion !== cancelVersionRef.current) {
        resolve();
        return;
      }

      try {
        // Obtém a URL do áudio (usa cache se disponível, com retry)
        const speechUrl = await preloadTTS(text);

        // Verifica novamente se foi cancelado após preload
        if (callVersion !== cancelVersionRef.current) {
          finalizeResolve();
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
        activeCancelRef.current = cancelPlayback;

        // Configurações para Chromecast
        speechAudio.crossOrigin = 'anonymous';
        speechAudio.preload = 'auto';
        speechAudio.volume = 1.0;

        speechAudio.onended = () => {
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(true, latency);
          finalizeResolve();
        };

        speechAudio.onerror = (e) => {
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(false, latency, 'Erro ao reproduzir áudio');
          audioTelemetry.trackError('playback_error', e?.toString() || 'Unknown error');

          // Se erro de reprodução, invalida o cache (URL pode estar corrompida)
          if (ttsCache.get(text)?.url === speechUrl) {
            ttsCache.delete(text);
          }

          finalizeReject(new Error('Erro ao reproduzir áudio'));
        };

        await speechAudio.play();
      } catch (e) {
        const latency = Date.now() - startTime;
        audioTelemetry.trackPlayback(false, latency, e instanceof Error ? e.message : 'Unknown error');
        audioTelemetry.trackError('speak_error', e instanceof Error ? e.message : String(e));

        finalizeReject(e);
      }
    });
  }, [preloadTTS]);

  return { speak, preloadTTS, cancel };
}
