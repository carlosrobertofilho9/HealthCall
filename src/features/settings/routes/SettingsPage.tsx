import React, { useState, useEffect } from 'react';
import { useSettings } from '@/features/settings/hooks/useSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/switch';
import { STORAGE_KEYS } from '@/constants';

/**
 * A página de configurações da aplicação.
 *
 * Este componente permite que os usuários configurem suas preferências, como
 * definir um destino padrão para novos pacientes e escolher se desejam usar
 * a síntese de voz nativa do navegador para os anúncios.
 * Ele utiliza o hook `useSettings` para gerenciar a lógica de carregamento e salvamento
 * do destino padrão.
 *
 * @returns {React.ReactElement} O componente da página de configurações.
 */
const SettingsPage: React.FC = () => {
  const {
    destinations,
    selected,
    setSelected,
    loading,
    saving,
    saveDefaultDestination,
  } = useSettings();

  const [useBrowserVoice, setUseBrowserVoice] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem(STORAGE_KEYS.USE_BROWSER_VOICE);
    if (storedPreference) {
      setUseBrowserVoice(JSON.parse(storedPreference));
    }
  }, []);

  const handleToggleChange = (value: boolean) => {
    setUseBrowserVoice(value);
    localStorage.setItem(STORAGE_KEYS.USE_BROWSER_VOICE, JSON.stringify(value));
  };

  return (
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl max-w-xl mx-auto">
      <h2 className="text-white text-2xl font-bold leading-tight mb-6">Configurações</h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="default-destination" className="text-white font-medium mb-2 block">
            Destino Padrão
          </Label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#96c5a9] z-10">meeting_room</span>
            <Select onValueChange={setSelected} value={selected} disabled={loading}>
              <SelectTrigger id="default-destination">
                <SelectValue placeholder="Nenhum (selecionar ao adicionar)" />
              </SelectTrigger>
              <SelectContent>
                {destinations.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="browser-voice-switch" className="text-white">
            Usar chamador de voz do navegador
          </Label>
          <Switch id="browser-voice-switch" checked={useBrowserVoice} onCheckedChange={handleToggleChange} />
        </div>
        <div className="pt-2">
          <Button
            onClick={saveDefaultDestination}
            disabled={saving || loading}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
