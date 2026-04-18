import React from 'react';
import { useSettings as useLocalSettings } from '@/features/settings/hooks/useSettings';
import { useSettings } from '@/contexts/SettingsContext';
import { ThemeSelector } from '@/features/settings/components/ThemeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Label,
  Switch,
  FormSection,
  ActionBar
} from '@/components/ui';
import { Palette } from 'lucide-react';

/**
 * A página de configurações da aplicação.
 *
 * Permite configurar: destino padrão, síntese de voz e tema visual.
 *
 * @returns {React.ReactElement} O componente da página de configurações.
 */
const SettingsPage: React.FC = () => {
  const {
    destinations,
    selected,
    setSelected,
    loading: loadingDestination,
    saving,
    saveDefaultDestination,
  } = useLocalSettings();

  const { useBrowserVoice, setUseBrowserVoice, loading: loadingVoiceSetting } = useSettings();

  const loading = loadingDestination || loadingVoiceSetting;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-card-foreground leading-tight mb-6">Configurações</h2>
      <div className="space-y-4">
        <FormSection title="Fluxo padrão">
          <div>
            <Label htmlFor="default-destination" className="font-medium mb-2 block">
              Destino Padrão
            </Label>
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
        </FormSection>

        <FormSection title="Áudio">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="browser-voice-switch">
              Usar chamador de voz do navegador
            </Label>
            <Switch
              id="browser-voice-switch"
              checked={useBrowserVoice}
              onCheckedChange={setUseBrowserVoice}
              disabled={loading}
            />
          </div>
        </FormSection>

        <FormSection
          title="Tema Visual"
          icon={<Palette size={14} className="text-primary" />}
        >
          <p className="text-sm text-muted-foreground mb-3">
            Escolha a paleta de cores que melhor representa seu estilo.
          </p>
          <ThemeSelector />
        </FormSection>

        <ActionBar separated className="justify-end">
          <Button
            onClick={saveDefaultDestination}
            disabled={saving || loading}
            className="w-full sm:w-auto"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </ActionBar>
      </div>
    </div>
  );
};

export default SettingsPage;
