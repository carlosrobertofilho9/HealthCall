import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

// Interface para o tipo de dados do contexto
interface SettingsContextType {
  useBrowserVoice: boolean;
  setUseBrowserVoice: (value: boolean) => Promise<void>;
  loading: boolean;
}

// Cria o contexto com um valor padrão undefined
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Props para o provedor do contexto
interface SettingsProviderProps {
  children: ReactNode;
}

/**
 * Provedor do contexto de configurações.
 *
 * Este componente gerencia o estado global das configurações, buscando os dados
 * do Supabase e fornecendo funções para atualizá-los. Ele também lida com
 * o estado de carregamento inicial.
 *
 * @param {SettingsProviderProps} props As propriedades do provedor, incluindo os componentes filhos.
 * @returns {React.ReactElement} O provedor de contexto envolvendo os filhos.
 */
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const { user } = useAuth();
  const [useBrowserVoice, setUseBrowserVoiceState] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('global_settings')
          .select('value')
          .eq('setting_name', 'USE_BROWSER_VOICE')
          .single();

        if (error) throw error;
        if (data) setUseBrowserVoiceState(data.value);
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel('global-settings-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_settings',
          filter: 'setting_name=eq.USE_BROWSER_VOICE',
        },
        (payload) => {
          if (payload.new && 'value' in payload.new) {
            setUseBrowserVoiceState(payload.new.value as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const setUseBrowserVoice = async (value: boolean) => {
    if (!user) {
      console.error('Usuário não autenticado. A alteração não foi salva.');
      return;
    }

    try {
      const { error } = await supabase
        .from('global_settings')
        .update({
          value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('setting_name', 'USE_BROWSER_VOICE');

      if (error) {
        throw error;
      }

      setUseBrowserVoiceState(value);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
    }
  };

  const value = {
    useBrowserVoice,
    setUseBrowserVoice,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook customizado para acessar o contexto de configurações.
 *
 * Este hook simplifica o acesso ao `SettingsContext`, garantindo que ele
 * seja usado apenas dentro de um `SettingsProvider`.
 *
 * @returns {SettingsContextType} O valor do contexto.
 * @throws {Error} Se o hook for usado fora de um `SettingsProvider`.
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};
