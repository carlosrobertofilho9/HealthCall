
import React, { useEffect } from 'react';

const APPLICATION_ID = 'A75B4462';

const CastButton: React.FC = () => {
	useEffect(() => {
		const initializeCastApi = (isAvailable: boolean) => {
			if (isAvailable) {
				window.cast.framework.CastContext.getInstance().setOptions({
					receiverApplicationId: APPLICATION_ID,
					autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
				});
			}
		};

		if (window.cast && window.cast.framework) {
			// API já disponível
			initializeCastApi(true);
		} else {
			// Definir o callback para quando a API estiver disponível
			window.__onGCastApiAvailable = initializeCastApi;
		}

    return () => {
      // Limpar o callback quando o componente for desmontado
      delete window.__onGCastApiAvailable;
    }
	}, []);

	return <google-cast-launcher style={{ width: '24px', height: '24px', cursor: 'pointer' }} />;
};

export default CastButton;
