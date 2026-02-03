import { useState, useEffect } from 'react';
import { syncClient } from '@/services/networkSyncClient';
import localDb from '@/services/localDatabase';
import { Warning } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export function useWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const data = await syncClient.getWarnings();
      setWarnings(data);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
      toast.error('Erro ao carregar avisos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
    const handleUpdate = (event: any) => {
      if (event.table === 'warnings') {
        fetchWarnings();
      }
    };
    syncClient.on('data_update', handleUpdate);
    return () => {
      syncClient.off('data_update', handleUpdate);
    };
  }, []);

  const generateAudio = async (text: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text },
      });

      if (error || !data) {
        console.error('TTS Error:', error);
        return null;
      }

      return data.speechUrl;
    } catch (e) {
      console.error('Failed to generate audio:', e);
      return null;
    }
  };

  const addWarning = async (warning: Partial<Warning>) => {
    try {
      setIsGeneratingAudio(true);
      let audioUrl = warning.audio_url;

      // Auto-generate audio if text is present and no audio URL provided (or explicit request?)
      // We'll always try to generate if there is text.
      if (warning.text && !audioUrl) {
         toast.info('Gerando áudio para o aviso...');
         const generatedUrl = await generateAudio(warning.text);
         if (generatedUrl) {
            audioUrl = generatedUrl;
         }
      }

      await syncClient.addWarning({ ...warning, audio_url: audioUrl });
      toast.success('Aviso adicionado com sucesso');
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao adicionar aviso:', error);
      toast.error('Erro ao adicionar aviso');
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const updateWarning = async (id: string, updates: Partial<Warning>) => {
    try {
      let audioUrl = updates.audio_url;

      // If text is being updated, regenerate audio
      if (updates.text) {
         setIsGeneratingAudio(true);
         toast.info('Atualizando áudio do aviso...');
         const generatedUrl = await generateAudio(updates.text);
         if (generatedUrl) {
            audioUrl = generatedUrl;
         }
      }

      await syncClient.updateWarning(id, { ...updates, audio_url: audioUrl });
      toast.success('Aviso atualizado com sucesso');
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao atualizar aviso:', error);
      toast.error('Erro ao atualizar aviso');
    } finally {
        setIsGeneratingAudio(false);
    }
  };

  const removeWarning = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este aviso?')) {
      try {
        await syncClient.removeWarning(id);
        toast.success('Aviso removido com sucesso');
        fetchWarnings();
      } catch (error) {
        console.error('Erro ao remover aviso:', error);
        toast.error('Erro ao remover aviso');
      }
    }
  };

  const regenerateAudio = async (warning: Warning) => {
    if (!warning.text) {
      toast.error('O aviso precisa ter texto para gerar áudio.');
      return;
    }

    try {
      setIsGeneratingAudio(true);
      toast.info('Gerando áudio...');
      const audioUrl = await generateAudio(warning.text);
      
      if (audioUrl) {
        await syncClient.updateWarning(warning.id, { audio_url: audioUrl });
        toast.success('Áudio gerado com sucesso!');
        fetchWarnings();
      } else {
        toast.error('Falha ao gerar áudio. Verifique a conexão.');
      }
    } catch (error) {
      console.error('Erro ao regenerar áudio:', error);
      toast.error('Erro ao gerar áudio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const toggleWarningActive = async (id: string) => {
    try {
      await localDb.toggleWarningActive(id);
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao alternar status do aviso:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const reorderWarnings = async (orderedIds: string[]) => {
    try {
      await localDb.reorderWarnings(orderedIds);
      // Optimistic update could happen here in parent, but we'll fetch
      fetchWarnings();
    } catch (error) {
      console.error('Erro ao reordenar avisos:', error);
      toast.error('Erro ao reordenar');
    }
  };

  const saveWarningMedia = async (file: File) => {
    return await localDb.saveWarningMedia(file);
  };

  return {
    warnings,
    loading,
    isGeneratingAudio,
    addWarning,
    updateWarning,
    removeWarning,
    toggleWarningActive,
    reorderWarnings,
    saveWarningMedia,
    regenerateAudio,
    refresh: fetchWarnings
  };
}