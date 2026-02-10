import React from 'react';

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
  <div className="bg-gray-900 text-white flex flex-col min-h-screen items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl mb-4">Bem-vindo à Tela de Chamadas</h1>
      <p className="text-lg text-gray-400 mb-8">
        Para garantir que os alertas sonoros funcionem, o navegador exige uma interação inicial.
      </p>
      <button
        onClick={onActivate}
        disabled={isActivating}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <span className="material-symbols-outlined align-middle mr-2">
          {isActivating ? 'hourglass_empty' : 'volume_up'}
        </span>
        {isActivating ? 'Ativando...' : 'Ativar Som e Iniciar'}
      </button>
    </div>
  </div>
);
