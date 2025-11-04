import React from 'react';
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

const SettingsPage: React.FC = () => {
  const {
    destinations,
    selected,
    setSelected,
    loading,
    saving,
    saveDefaultDestination,
  } = useSettings();

  return (
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl max-w-xl mx-auto">
      <h2 className="text-white text-2xl font-bold leading-tight mb-6">Configurações</h2>
      <div className="space-y-6">
        <div>
          <Label htmlFor="default-destination">Destino Padrão</Label>
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
