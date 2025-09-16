/// <reference types="chromecast-caf-sender" />
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type CastState = {
  isApiAvailable: boolean;
  isSessionActive: boolean;
  currentSession: cast.framework.CastSession | null;
};

const CastContext = createContext<CastState>({
  isApiAvailable: false,
  isSessionActive: false,
  currentSession: null,
});

type CastProviderProps = {
	autoJoinPolicy?: chrome.cast.AutoJoinPolicy;
	children: React.ReactNode;
};

export const CastProvider: React.FC<CastProviderProps> = ({ autoJoinPolicy, children }) => {
	const [isApiAvailable, setIsApiAvailable] = useState(false);
	const [currentSession, setCurrentSession] = useState<cast.framework.CastSession | null>(null);
	const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('castSessionActive') === 'true';
		}
		return false;
	});

	const initCast = useCallback(
		(isAvailable: boolean) => {
			if (isAvailable && window.cast && window.cast.framework && window.chrome && window.chrome.cast) {
				window.cast.framework.CastContext.getInstance().setOptions({
					receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
					autoJoinPolicy: autoJoinPolicy || window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
				});

				setIsApiAvailable(true);

				// Listen for session state changes
				const context = window.cast.framework.CastContext.getInstance();
				const handler = (e: cast.framework.SessionStateEventData) => {
					const state = e.sessionState;
					if (
						state === cast.framework.SessionState.SESSION_STARTED ||
						state === cast.framework.SessionState.SESSION_RESUMED
					) {
						setCurrentSession(context.getCurrentSession());
						setIsSessionActive(true);
						localStorage.setItem('castSessionActive', 'true');
					} else if (state === cast.framework.SessionState.SESSION_ENDED) {
						setCurrentSession(null);
						setIsSessionActive(false);
						localStorage.setItem('castSessionActive', 'false');
					}
				};
				context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, handler);
			}
		},
		[autoJoinPolicy]
	);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'castSessionActive') {
      setIsSessionActive(event.newValue === 'true');
    }
  }, []);

  useEffect(() => {
    // Definir o callback global antes de carregar
    window.__onGCastApiAvailable = initCast;

    // Se já disponível
    if (window.cast && window.cast.framework && window.chrome && window.chrome.cast) {
      initCast(true);
    }

    window.addEventListener('storage', handleStorageChange);

    return () => {
      delete window.__onGCastApiAvailable;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initCast, handleStorageChange]);

  const value = {
    isApiAvailable,
    isSessionActive,
    currentSession,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
};

// Hook para usar contexto
export const useCast = () => useContext(CastContext);