import { useEffect, useState } from 'react';

// Define a interface global para que o TypeScript reconheça nosso objeto injetado
declare global {
  interface Window {
    AndroidTTS?: {
      speak: (text: string) => void;
    };
  }
}

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const isAndroidWebView = !!window.AndroidTTS;

  useEffect(() => {
    // Se estiver no WebView, não precisa carregar vozes do navegador
    if (isAndroidWebView) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        const ptBRVoice = availableVoices.find((voice) => voice.lang === 'pt-BR');
        setSelectedVoice(ptBRVoice || availableVoices[0]);
      }
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }, [isAndroidWebView]);

  const speak = (text: string): Promise<void> => {
    // **AQUI ACONTECE A MÁGICA DO TTS**
    if (isAndroidWebView) {
      try {
        window.AndroidTTS?.speak(text);
        return Promise.resolve();
      } catch (e) {
        console.error("Erro ao chamar a interface nativa AndroidTTS", e);
        return Promise.reject(e);
      }
    }

    // Fallback para o navegador padrão
    return new Promise((resolve, reject) => {
      if (!selectedVoice) {
        console.warn('Nenhuma voz de síntese de fala selecionada.');
        return resolve();
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(`Falha na síntese de fala: ${e.error}`));
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        resolve();
      }
    });
  };

  return { speak, voices, selectedVoice, setSelectedVoice, isAndroidWebView };
};

export default useSpeechSynthesis;
