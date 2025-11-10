import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Cache em memória com expiração para evitar URLs antigas/inválidas
interface CacheEntry {
  url: string;
  timestamp: number;
}

const ttsCache = new Map<string, CacheEntry>();
const CACHE_EXPIRATION_MS = 3600000; // 1 hora
const MAX_CACHE_SIZE = 100;

/**
 * Gerencia o cache com expiração e limite de tamanho
 */
const cacheHelpers = {
  get(key: string): string | null {
    const entry = ttsCache.get(key);
    if (!entry) return null;

    // Verifica se expirou
    if (Date.now() - entry.timestamp > CACHE_EXPIRATION_MS) {
      ttsCache.delete(key);
      return null;
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

    ttsCache.set(key, { url, timestamp: Date.now() });
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
 * Hook customizado para gerenciar a funcionalidade de Text-to-Speech (TTS).
 *
 * Este hook converte texto em fala usando SEMPRE arquivos de áudio reais
 * gerados via edge function do Supabase (Google Translate TTS).
 *
 * NOTA: Não usa speechSynthesis nativo do navegador porque esse áudio
 * não é capturado pelo espelhamento do Chromecast.
 *
 * @returns {{
 *   speak: (text: string) => Promise<void>
 * }} Um objeto contendo a função `speak` para iniciar a síntese de voz.
 */
export function useTextToSpeech() {
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
  const preloadTTS = async (text: string): Promise<string> => {
    // Verifica o cache antes de invocar a função
    const cachedUrl = cacheHelpers.get(text);
    if (cachedUrl) {
      console.log('[TTS] Usando áudio do cache:', text.substring(0, 30) + '...');
      return cachedUrl;
    }

    // Usa retry logic para chamadas à edge function
    return retryWithBackoff(async () => {
      console.log('[TTS] Gerando novo áudio:', text.substring(0, 30) + '...');

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
      console.log('[TTS] Áudio gerado e armazenado no cache');

      return data.speechUrl;
    }, 3, 1000).catch((e) => {
      console.error('[TTS] Erro após retry:', e);
      toast.error('Erro ao gerar áudio da chamada', {
        description: 'Tentando novamente...',
      });
      throw e;
    });
  };

  const speak = (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtém a URL do áudio (usa cache se disponível, com retry)
        const speechUrl = await preloadTTS(text);

        // Cria e configura o elemento de áudio
        const speechAudio = new Audio(speechUrl);

        // Configurações para Chromecast
        speechAudio.crossOrigin = 'anonymous';
        speechAudio.preload = 'auto';
        speechAudio.volume = 1.0;

        // Gerencia eventos de áudio
        const cleanup = () => {
          speechAudio.onended = null;
          speechAudio.onerror = null;
        };

        speechAudio.onended = () => {
          console.log('[TTS] Reprodução concluída');
          cleanup();
          resolve();
        };

        speechAudio.onerror = (e) => {
          console.error('[TTS] Erro na reprodução:', e);
          cleanup();

          // Se erro de reprodução, invalida o cache (URL pode estar corrompida)
          cacheHelpers.get(text); // Verifica se ainda está no cache
          if (cacheHelpers.get(text) === speechUrl) {
            console.log('[TTS] Removendo URL corrompida do cache');
            ttsCache.delete(text);
          }

          reject(new Error('Erro ao reproduzir áudio'));
        };

        console.log('[TTS] Iniciando reprodução');
        await speechAudio.play();
      } catch (e) {
        console.error('[TTS] Erro no speak():', e);
        reject(e);
      }
    });
  };

  return { speak, preloadTTS };
}
