import { useState, useEffect, useCallback } from 'react';
import { castService, CastState } from '@/services/castService';
import { Patient, Warning } from '@/types';

const CAST_CONFIG = {
  receiverApplicationId: 'A75B4462', // HealthCall Custom Receiver ID
  namespace: 'urn:x-cast:com.healthcall.display',
  autoJoinPolicy: 'origin_scoped',
  language: 'pt-BR',
};

/**
 * React hook for managing Google Cast functionality
 * 
 * Provides an easy-to-use interface for Cast features in React components
 */
export function useCast() {
  const [castState, setCastState] = useState<CastState>('NOT_CONNECTED');
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Computed states
  const isAvailable = castState !== 'NO_DEVICES_AVAILABLE';
  const isConnected = castState === 'CONNECTED';
  const isConnecting = castState === 'CONNECTING';

  // Initialize Cast SDK
  useEffect(() => {
    let mounted = true;

    const initCast = async () => {
      try {
        console.log('[useCast] Initializing Cast SDK...');
        await castService.initialize(CAST_CONFIG);
        
        if (mounted) {
          setIsInitialized(true);
          console.log('[useCast] Cast SDK initialized');
        }
      } catch (err: any) {
        console.error('[useCast] Initialization error:', err);
        if (mounted) {
          setError(err);
        }
      }
    };

    initCast();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen to Cast state changes
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = castService.onStateChange((state) => {
      console.log('[useCast] State changed:', state);
      setCastState(state);

      // Update device name
      if (state === 'CONNECTED') {
        setDeviceName(castService.getDeviceName());
      } else {
        setDeviceName(null);
      }
    });

    return unsubscribe;
  }, [isInitialized]);

  /**
   * Request a Cast session (open Cast dialog)
   */
  const connect = useCallback(async () => {
    if (!isInitialized) {
      console.warn('[useCast] Cannot connect: not initialized');
      return;
    }

    try {
      setError(null);
      await castService.requestSession();
    } catch (err: any) {
      console.error('[useCast] Connection error:', err);
      setError(err);
    }
  }, [isInitialized]);

  /**
   * End the current Cast session
   */
  const disconnect = useCallback(() => {
    if (!isConnected) {
      console.warn('[useCast] Cannot disconnect: not connected');
      return;
    }

    try {
      castService.endSession();
      setError(null);
    } catch (err: any) {
      console.error('[useCast] Disconnect error:', err);
      setError(err);
    }
  }, [isConnected]);

  /**
   * Send a patient call to the Cast receiver
   */
  const sendPatientCall = useCallback((patient: Patient, destination: string) => {
    if (!isConnected) {
      console.warn('[useCast] Cannot send patient call: not connected');
      return;
    }

    castService.sendPatientCall(patient, destination);
  }, [isConnected]);

  /**
   * Send a warning to the Cast receiver
   */
  const sendWarning = useCallback((warning: Warning) => {
    if (!isConnected) {
      console.warn('[useCast] Cannot send warning: not connected');
      return;
    }

    castService.sendWarning(warning);
  }, [isConnected]);

  /**
   * Send configuration update to the receiver
   */
  const sendConfig = useCallback((config: { facilityName?: string; settings?: any }) => {
    if (!isConnected) {
      console.warn('[useCast] Cannot send config: not connected');
      return;
    }

    castService.sendConfigUpdate(config);
  }, [isConnected]);

  /**
   * Send Supabase credentials to receiver for direct connection
   */
  const sendSupabaseConfig = useCallback((url: string, key: string) => {
    if (!isConnected) {
      console.warn('[useCast] Cannot send Supabase config: not connected');
      return;
    }

    castService.sendSupabaseConfig(url, key);
  }, [isConnected]);

  /**
   * Listen for messages from the Cast receiver
   */
  const onMessage = useCallback((callback: (message: any) => void) => {
    return castService.onMessage(callback);
  }, []);

  return {
    // State
    castState,
    isAvailable,
    isConnected,
    isConnecting,
    isInitialized,
    deviceName,
    error,

    // Actions
    connect,
    disconnect,
    sendPatientCall,
    sendWarning,
    sendConfig,
    sendSupabaseConfig,
    onMessage,
  };
}
