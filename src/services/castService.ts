/**
 * Google Cast Service for HealthCall
 * 
 * This service provides a centralized interface for managing Chromecast connections
 * and sending messages to the Cast Receiver application.
 */

import { Patient, Warning } from '@/types';

declare global {
  interface Window {
    cast: any;
    chrome: any;
    __onGCastApiAvailable: (isAvailable: boolean) => void;
  }
}

export type CastState = 'NO_DEVICES_AVAILABLE' | 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED';

export interface CastConfig {
  receiverApplicationId: string;
  namespace: string;
  autoJoinPolicy?: string;
  language?: string;
}

type MessageListener = (message: any) => void;
type StateListener = (state: CastState) => void;

class CastService {
  private castContext: any = null;
  private currentSession: any = null;
  private config: CastConfig | null = null;
  private messageListeners: Set<MessageListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the Cast framework
   */
  async initialize(config: CastConfig): Promise<void> {
    if (this.isInitialized) {
      console.log('[Cast] Already initialized');
      return;
    }

    // Disable in Electron
    if (window.electron) {
      console.log('[Cast] Chromecast support is disabled in Electron');
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      console.log('[Cast] Initializing Cast framework...');
      this.config = config;

      // Wait for Cast SDK to load
      const checkCastAvailable = () => {
        if (window.cast && window.cast.framework) {
          this.initializeCastFramework();
          resolve();
        } else if (window.chrome && window.chrome.cast) {
          // Fallback to older API
          this.initializeCastFramework();
          resolve();
        } else {
          console.log('[Cast] SDK not loaded yet, waiting...');
          setTimeout(checkCastAvailable, 100);
        }
      };

      // Set up callback for API availability
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        console.log('[Cast] API available:', isAvailable);
        if (isAvailable) {
          checkCastAvailable();
        } else {
          reject(new Error('Cast API not available'));
        }
      };

      // Start checking
      checkCastAvailable();
    });

    return this.initializationPromise;
  }

  private initializeCastFramework(): void {
    try {
      if (!this.config) {
        throw new Error('Config not set');
      }

      this.castContext = window.cast.framework.CastContext.getInstance();
      
      this.castContext.setOptions({
        receiverApplicationId: this.config.receiverApplicationId,
        autoJoinPolicy: this.config.autoJoinPolicy || window.cast.framework.AutoJoinPolicy.ORIGIN_SCOPED,
        language: this.config.language || 'pt-BR',
        resumeSavedSession: true,
      });

      // Listen for session state changes
      this.castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        this.handleSessionStateChanged.bind(this)
      );

      // Listen for cast state changes
      this.castContext.addEventListener(
        window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        this.handleCastStateChanged.bind(this)
      );

      this.isInitialized = true;
      console.log('[Cast] Framework initialized successfully');
      
      // Emit initial state
      this.notifyStateChange(this.getCastState());
    } catch (error) {
      console.error('[Cast] Initialization error:', error);
      throw error;
    }
  }

  private handleSessionStateChanged(event: any): void {
    console.log('[Cast] Session state changed:', event.sessionState);
    
    switch (event.sessionState) {
      case window.cast.framework.SessionState.SESSION_STARTED:
      case window.cast.framework.SessionState.SESSION_RESUMED:
        this.currentSession = event.session;
        this.setupMessageListener();
        this.notifyStateChange('CONNECTED');
        break;
      
      case window.cast.framework.SessionState.SESSION_ENDED:
        this.currentSession = null;
        this.notifyStateChange('NOT_CONNECTED');
        break;
    }
  }

  private handleCastStateChanged(event: any): void {
    console.log('[Cast] Cast state changed:', event.castState);
    this.notifyStateChange(this.getCastState());
  }

  private setupMessageListener(): void {
    if (!this.currentSession || !this.config) return;

    this.currentSession.addMessageListener(
      this.config.namespace,
      (namespace: string, message: string) => {
        try {
          const parsedMessage = JSON.parse(message);
          console.log('[Cast] Message received:', parsedMessage);
          this.messageListeners.forEach(listener => listener(parsedMessage));
        } catch (error) {
          console.error('[Cast] Error parsing message:', error);
        }
      }
    );
  }

  /**
   * Request a new Cast session
   */
  async requestSession(): Promise<void> {
    if (!this.isInitialized) {
      // If in Electron, this is expected behavior
      if (window.electron) {
        console.log('[Cast] Session request ignored (Electron)');
        return;
      }
      throw new Error('Cast service not initialized');
    }

    try {
      console.log('[Cast] Requesting session...');
      await this.castContext.requestSession();
      console.log('[Cast] Session requested successfully');
    } catch (error: any) {
      if (error.code === 'cancel') {
        console.log('[Cast] User cancelled session request');
      } else {
        console.error('[Cast] Error requesting session:', error);
        throw error;
      }
    }
  }

  /**
   * End the current Cast session
   */
  endSession(): void {
    if (!this.currentSession) {
      console.warn('[Cast] No active session to end');
      return;
    }

    try {
      console.log('[Cast] Ending session...');
      this.currentSession.endSession(true);
    } catch (error) {
      console.error('[Cast] Error ending session:', error);
    }
  }

  /**
   * Get the current Cast session
   */
  getCurrentSession(): any {
    return this.currentSession;
  }

  /**
   * Get the current Cast state
   */
  getCastState(): CastState {
    if (window.electron) {
      return 'NO_DEVICES_AVAILABLE';
    }

    if (!this.isInitialized || !this.castContext) {
      return 'NOT_CONNECTED';
    }

    const state = this.castContext.getCastState();
    
    switch (state) {
      case window.cast.framework.CastState.NO_DEVICES_AVAILABLE:
        return 'NO_DEVICES_AVAILABLE';
      case window.cast.framework.CastState.NOT_CONNECTED:
        return 'NOT_CONNECTED';
      case window.cast.framework.CastState.CONNECTING:
        return 'CONNECTING';
      case window.cast.framework.CastState.CONNECTED:
        return 'CONNECTED';
      default:
        return 'NOT_CONNECTED';
    }
  }

  /**
   * Check if currently connected to a Cast device
   */
  isConnected(): boolean {
    return this.getCastState() === 'CONNECTED' && this.currentSession !== null;
  }

  /**
   * Get the name of the connected Cast device
   */
  getDeviceName(): string | null {
    if (!this.currentSession) return null;
    
    try {
      return this.currentSession.getCastDevice().friendlyName;
    } catch {
      return null;
    }
  }

  /**
   * Send a custom message to the Cast receiver
   */
  sendMessage(message: any): void {
    if (!this.isConnected() || !this.config) {
      console.warn('[Cast] Cannot send message: not connected');
      return;
    }

    try {
      this.currentSession.sendMessage(
        this.config.namespace,
        message
      );
      console.log('[Cast] Message sent:', message);
    } catch (error) {
      console.error('[Cast] Error sending message:', error);
    }
  }

  /**
   * Send a patient call to the Cast receiver
   */
  sendPatientCall(patient: Patient, destination: string, audioUrl?: string | null): void {
    const payload: any = {
      patient,
      destination,
      timestamp: Date.now(),
    };

    if (audioUrl) {
      payload.audioUrl = audioUrl;
    }

    this.sendMessage({
      type: 'PATIENT_CALL',
      data: payload,
    });
  }

  /**
   * Send a warning to the Cast receiver
   */
  sendWarning(warning: Warning): void {
    this.sendMessage({
      type: 'WARNING_DISPLAY',
      data: {
        warning,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send configuration update to the Cast receiver
   */
  sendConfigUpdate(config: { facilityName?: string; settings?: any }): void {
    this.sendMessage({
      type: 'CONFIG_UPDATE',
      data: config,
    });
  }

  /**
   * Send Supabase configuration to receiver for direct connection
   */
  sendSupabaseConfig(url: string, key: string): void {
    this.sendMessage({
      type: 'SUPABASE_CONFIG',
      data: { url, key },
    });
  }

  /**
   * Add a listener for messages from the Cast receiver
   */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Add a listener for Cast state changes
   */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    
    // Immediately notify of current state
    listener(this.getCastState());
    
    return () => this.stateListeners.delete(listener);
  }

  private notifyStateChange(state: CastState): void {
    this.stateListeners.forEach(listener => listener(state));
  }
}

// Export singleton instance
export const castService = new CastService();
