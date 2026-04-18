import React from 'react';
import { Button } from '@/components/ui';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface AudioActivationScreenProps {
  onActivate: () => void;
  isActivating: boolean;
}

/**
 * Tela inicial exibida antes da ativação de áudio.
 * Requer interação do usuário para cumprir política de autoplay do browser.
 */
export const AudioActivationScreen: React.FC<AudioActivationScreenProps> = ({
  onActivate,
  isActivating,
}) => (
  <div className={DISPLAY_CLASS.pageCentered}>
    <div className="text-center">
      <h1 className="text-4xl mb-4">Bem-vindo à Tela de Chamadas</h1>
      <p className={`text-lg ${DISPLAY_CLASS.textMuted} mb-8`}>
        Para garantir que os alertas sonoros funcionem, o navegador exige uma interação inicial.
      </p>
      <Button
        onClick={onActivate}
        disabled={isActivating}
        className="h-auto py-4 px-8 text-xl transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
      >
        <span className="material-symbols-outlined align-middle mr-2">
          {isActivating ? 'hourglass_empty' : 'volume_up'}
        </span>
        {isActivating ? 'Ativando...' : 'Ativar Som e Iniciar'}
      </Button>
    </div>
  </div>
);
