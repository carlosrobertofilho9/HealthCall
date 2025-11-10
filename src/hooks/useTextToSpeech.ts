import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Cache em memória para armazenar URLs de TTS geradas
const ttsCache = new Map<string, string>();

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
   * Útil para reduzir latência ao carregar o áudio enquanto outra ação acontece.
   */
  const preloadTTS = async (text: string): Promise<string> => {
    // Verifica o cache antes de invocar a função
    if (ttsCache.has(text)) {
      return ttsCache.get(text)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text },
      });

      if (error) throw new Error(`Erro ao invocar função TTS: ${error.message}`);
      if (!data?.speechUrl) throw new Error('Falha ao gerar áudio TTS: URL não recebida.');

      // Armazena a nova URL no cache
      ttsCache.set(text, data.speechUrl);

      return data.speechUrl;
    } catch (e) {
      toast.error('Ocorreu um erro ao gerar o áudio da chamada no Supabase.');
      throw e;
    }
  };

  const speak = (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Obtém a URL do áudio (usa cache se disponível)
        const speechUrl = await preloadTTS(text);

        // Cria e configura o elemento de áudio
        const speechAudio = new Audio(speechUrl);

        // Configurações para Chromecast
        speechAudio.crossOrigin = 'anonymous';
        speechAudio.preload = 'auto';
        speechAudio.volume = 1.0;

        speechAudio.onended = () => resolve();
        speechAudio.onerror = (e) => reject(e);
        speechAudio.play().catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  };

  return { speak, preloadTTS };
}
