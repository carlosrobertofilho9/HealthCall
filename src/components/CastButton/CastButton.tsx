
import React, { useEffect } from 'react';

// Este ID será fornecido ao registrar o seu app receiver
const APPLICATION_ID = 'A75B4462'; 

const CastButton: React.FC = () => {
  useEffect(() => {
    const initializeCastApi = () => {
      if (window.cast && window.cast.framework) {
        // Inicializa o contexto do Cast com o ID da nossa aplicação receiver
        window.cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: APPLICATION_ID,
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
      } else {
        // A API do Cast ainda não foi carregada, tente novamente em breve
        setTimeout(initializeCastApi, 100);
      }
    };

    initializeCastApi();
  }, []);

  // O elemento <google-cast-launcher> é um componente web fornecido
  // pelo script do Google Cast. Ele renderiza o ícone de transmissão
  // e gerencia a conexão ao ser clicado.
  return (
    <google-cast-launcher
      style={{ width: '24px', height: '24px', cursor: 'pointer' }}
    />
  );
};

export default CastButton;
