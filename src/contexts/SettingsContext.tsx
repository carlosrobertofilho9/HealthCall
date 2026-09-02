import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest, subscribeHealthCallEvents } from '@/lib/apiClient';

interface SettingsContextType {
  useBrowserVoice: boolean;
  setUseBrowserVoice: (value: boolean) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [useBrowserVoice, setUseBrowserVoiceState] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const settings = await apiRequest<{ useBrowserVoice: boolean }>('/api/global-settings');
        if (mounted) setUseBrowserVoiceState(settings.useBrowserVoice);
      } catch (error) {
        console.error('Erro ao buscar configurações locais:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeHealthCallEvents((event) => {
      if (event.type === 'global-settings-changed') {
        const settings = event.settings as { useBrowserVoice?: boolean } | undefined;
        if (typeof settings?.useBrowserVoice === 'boolean') {
          setUseBrowserVoiceState(settings.useBrowserVoice);
        } else {
          void load();
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setUseBrowserVoice = async (value: boolean) => {
    const settings = await apiRequest<{ useBrowserVoice: boolean }>('/api/global-settings', {
      method: 'PATCH',
      body: JSON.stringify({ useBrowserVoice: value }),
    });
    setUseBrowserVoiceState(settings.useBrowserVoice);
  };

  return (
    <SettingsContext.Provider value={{ useBrowserVoice, setUseBrowserVoice, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};
