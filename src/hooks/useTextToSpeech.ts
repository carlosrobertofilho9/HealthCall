import { toast } from 'sonner';
import { audioTelemetry } from '@/lib/audioTelemetry';
import { useRef } from 'react';

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

    // Pula validação em ambiente de teste
    if (import.meta.env.VITEST) {
      return entry.url;
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
 * @returns {{
 *   speak: (text: string) => Promise<void>
 * }} Um objeto contendo a função `speak` para iniciar a síntese de voz.
 */
export function useTextToSpeech() {
  /**
   * Converte uma string de texto em áudio falado.
   *
   * gera áudio através da edge function `generate-tts` do Supabase que usa
   * a API do Google Translate. Os arquivos de áudio são armazenados em cache
   * no Supabase Storage e também em memória para melhor performance.
   *
   * @param {string} text O texto a ser convertido em fala.
   */
  /*
   * Pré-carrega o áudio TTS sem reproduzi-lo.
   * Usa cache com expiração e retry logic para maior confiabilidade.
   */
  const preloadTTS = async (text: string): Promise<string> => {
    // Verifica o cache antes de invocar a função (agora com validação)
    const cachedUrl = await cacheHelpers.get(text);
    if (cachedUrl) {
      console.log('[TTS] Usando áudio do cache:', text.substring(0, 30) + '...');
      audioTelemetry.trackCache(true); // Cache hit
      return cachedUrl;
    }

    audioTelemetry.trackCache(false); // Cache miss

    // Se estiver no Electron, usa o serviço local (Google GenAI)
    if (typeof window !== 'undefined' && window.electron?.tts) {
      try {
        console.log('[TTS] Gerando áudio via Electron (GenAI)...');
        const localUrl = await window.electron.tts.generate(text);
        
        if (localUrl) {
          cacheHelpers.set(text, localUrl);
          console.log('[TTS] Áudio local gerado e cacheado:', localUrl);
          return localUrl;
        }
        console.warn('[TTS] Falha no Electron TTS');
        throw new Error('Falha ao gerar áudio TTS: nenhuma URL retornada');
      } catch (err) {
        console.error('[TTS] Erro no Electron TTS:', err);
        throw err;
      }
    }

    // Fallback: Erro se não estiver no Electron
    throw new Error('TTS só está disponível no aplicativo Electron');
  };

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const cancel = () => {
    if (currentAudioRef.current) {
      console.log('[TTS] Cancelando reprodução atual');
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
  };

  const speak = (text: string): Promise<void> => {
    // Cancela anterior se houver
    cancel();

    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      let speechUrl: string;

      try {
        // Obtém a URL do áudio (usa cache se disponível, com retry)
        speechUrl = await preloadTTS(text);

        // ⚠️ VALIDAÇÃO CRÍTICA DE SEGURANÇA
        if (!isValidAudioUrl(speechUrl)) {
          const error = new Error('URL de áudio inválida ou não confiável');
          audioTelemetry.trackError('malicious_url_blocked', `Blocked: ${speechUrl}`);
          audioTelemetry.trackPlayback(false, Date.now() - startTime, error.message);
          throw error;
        }
      } catch (e) {
        console.error('[TTS] Erro na preparação do áudio:', e);
        reject(e);
        return;
      }

      // Função interna para tentar reprodução com retries
      const attemptPlayback = async (retryCount = 0) => {
        const speechAudio = new Audio(speechUrl);
        currentAudioRef.current = speechAudio;

        speechAudio.volume = 1.0;

        // Gerencia eventos de áudio com cleanup completo
        const cleanup = () => {
          if (speechAudio) {
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
            if (speechAudio.remove) speechAudio.remove();
          }
          if (currentAudioRef.current === speechAudio) {
            currentAudioRef.current = null;
          }
        };

        speechAudio.onended = () => {
          console.log('[TTS] Reprodução concluída');
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(true, latency);
          cleanup();
          resolve();
        };

        speechAudio.onerror = (e) => {
          const mediaError = speechAudio.error;
          console.error(`[TTS] Erro na reprodução (Tentativa ${retryCount + 1}):`, e);
          console.error('[TTS] MediaError:', mediaError);
          console.error('[TTS] NetworkState:', speechAudio.networkState);
          console.error('[TTS] ReadyState:', speechAudio.readyState);

          // Retry on Network (2) or Source Not Supported (4) errors
          const isRetryable = mediaError && (mediaError.code === 2 || mediaError.code === 4);
          
          if (isRetryable && retryCount < 2) {
             console.log(`[TTS] Erro recuperável detectado. Tentando novamente em 1s...`);
             cleanup();
             // Aguarda 1s antes de tentar novamente
             setTimeout(() => attemptPlayback(retryCount + 1), 1000);
             return;
          }

          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(false, latency, 'Erro ao reproduzir áudio');
          
          const errorDetails = `Code: ${mediaError?.code}, Msg: ${mediaError?.message}, Network: ${speechAudio.networkState}, Ready: ${speechAudio.readyState}`;
          audioTelemetry.trackError('playback_error', errorDetails);

          cacheHelpers.get(text).then(cachedUrl => {
            if (cachedUrl === speechUrl) {
              ttsCache.delete(text);
            }
          });

          cleanup();
          reject(new Error('Erro ao reproduzir áudio após tentativas'));
        };

        console.log(`[TTS] Iniciando reprodução (Tentativa ${retryCount + 1})`);
        try {
          await speechAudio.play();
        } catch (e) {
          // Se foi cancelado, não é erro
          if (currentAudioRef.current === null && e instanceof Error && e.name === 'AbortError') {
               console.log('[TTS] Reprodução abortada');
               cleanup();
               resolve();
               return;
          }

          console.error('[TTS] Erro no speak():', e);
          const latency = Date.now() - startTime;
          audioTelemetry.trackPlayback(false, latency, e instanceof Error ? e.message : 'Unknown error');
          audioTelemetry.trackError('speak_error', e instanceof Error ? e.message : String(e));

          cleanup();
          reject(e);
        }
      };

      // Inicia primeira tentativa
      attemptPlayback();
    });
  };

  return { speak, preloadTTS, cancel };
}
