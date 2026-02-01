import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as localDb from '@/services/localDatabase';

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
/**
 * Provedor do contexto de configurações.
 *
 * Este componente gerencia o estado global das configurações, buscando os dados
 * do banco de dados local e fornecendo funções para atualizá-los. Ele também lida com
 * o estado de carregamento inicial.
 *
 * @param {SettingsProviderProps} props As propriedades do provedor, incluindo os componentes filhos.
 * @returns {React.ReactElement} O provedor de contexto envolvendo os filhos.
 */
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [useBrowserVoice, setUseBrowserVoiceState] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const value = await localDb.getSetting('USE_BROWSER_VOICE');
        if (value !== null) {
          setUseBrowserVoiceState(value === 'true');
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // Listener para atualizações em tempo real
    const handleDataUpdate = (data: { table: string }) => {
      if (data.table === 'settings') {
        fetchSettings();
      }
    };

    localDb.onDataUpdate(handleDataUpdate);

    return () => {
      localDb.offDataUpdate(handleDataUpdate);
    };
  }, []);

  const setUseBrowserVoice = async (value: boolean) => {
    try {
      await localDb.setSetting('USE_BROWSER_VOICE', value);
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
