import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

// Cache em memória para armazenar URLs de TTS geradas
const ttsCache = new Map<string, string>();

/**
 * Hook customizado para gerenciar a funcionalidade de Text-to-Speech (TTS).
 *
 * Este hook encapsula a lógica para converter texto em fala, utilizando a API
 * nativa do navegador (`speechSynthesis`) como primeira opção e fazendo fallback
 * para uma função TTS do Supabase em caso de falha ou indisponibilidade.
 *
 * @returns {{
 *   speak: (text: string) => Promise<void>
 * }} Um objeto contendo a função `speak` para iniciar a síntese de voz.
 */
export function useTextToSpeech() {
  /**
   * Converte uma string de texto em áudio falado.
   *
   * A função primeiro tenta usar a API `speechSynthesis` do navegador. Se não
   * estiver disponível ou se ocorrer um erro, ela automaticamente aciona um
   * fallback para a função `generate-tts` do Supabase e notifica o usuário
   * sobre o erro.
   *
   * @param {string} text O texto a ser convertido em fala.
   * @returns {Promise<void>} Uma promessa que é resolvida quando a fala termina,
   * ou rejeitada se ambos os métodos (navegador e Supabase) falharem.
   */
  const speak = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const speakWithSupabase = async (errorMessage?: string) => {
        if (errorMessage) {
          toast.error('Erro na voz do navegador. Usando fallback.', {
            description: errorMessage,
          });
        }

        // Verifica o cache antes de invocar a função
        if (ttsCache.has(text)) {
          const speechUrl = ttsCache.get(text)!;
          const speechAudio = new Audio(speechUrl);
          speechAudio.play();
          speechAudio.onended = () => resolve();
          speechAudio.onerror = (e) => reject(e);
          return;
        }

        try {
          const { data, error } = await supabase.functions.invoke('generate-tts', {
            body: { text },
          });

          if (error) throw new Error(`Erro ao invocar função TTS: ${error.message}`);
          if (!data?.speechUrl) throw new Error('Falha ao gerar áudio TTS: URL não recebida.');

          // Armazena a nova URL no cache
          ttsCache.set(text, data.speechUrl);

          const speechAudio = new Audio(data.speechUrl);
          speechAudio.play();
          speechAudio.onended = () => resolve();
          speechAudio.onerror = (e) => reject(e);
        } catch (e) {
          toast.error('Ocorreu um erro ao gerar o áudio da chamada no Supabase.');
          reject(e);
        }
      };

      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'pt-BR';
          utterance.onerror = (e) => {
            speakWithSupabase(`Erro: ${e.error}`);
          };
          utterance.onend = () => resolve();
          speechSynthesis.speak(utterance);
        } catch (e: any) {
          speakWithSupabase(e.message);
        }
      } else {
        speakWithSupabase('API de voz do navegador não suportada.');
      }
    });
  };

  return { speak };
}
