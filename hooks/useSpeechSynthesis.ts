import { useEffect, useState } from 'react';

export const useSpeechSynthesis = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        // Tenta encontrar uma voz em português do Brasil
        const ptBRVoice = availableVoices.find(voice => voice.lang === 'pt-BR');
        setSelectedVoice(ptBRVoice || availableVoices[0]);
      }
    };

    // A lista de vozes é carregada de forma assíncrona
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    loadVoices(); // Carrega as vozes inicialmente
  }, []);

  const speak = (text: string) => {
    if (!selectedVoice) {
      console.warn("Nenhuma voz de síntese de fala selecionada.");
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
    utterance.rate = 0.9; // Velocidade da fala
    utterance.pitch = 1; // Tom da fala
    window.speechSynthesis.speak(utterance);
  };

  return { speak, voices, selectedVoice, setSelectedVoice };
};
