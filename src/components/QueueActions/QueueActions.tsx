import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { STORAGE_KEYS } from '@/constants';

interface QueueActionsProps {
  onClearQueue: () => void;
}

const QueueActions: React.FC<QueueActionsProps> = ({ onClearQueue }) => {
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
    <div className="bg-[#1a2c22] rounded-2xl p-8 shadow-2xl h-fit mt-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="browser-voice-switch" className="text-white">
            Usar chamador de voz do navegador
          </Label>
          <Switch
            id="browser-voice-switch"
            checked={useBrowserVoice}
            onCheckedChange={handleToggleChange}
          />
        </div>
        <Button variant="destructive" onClick={onClearQueue} className="w-full">
          Limpar Fila
        </Button>
      </div>
    </div>
  );
};

export default QueueActions;
