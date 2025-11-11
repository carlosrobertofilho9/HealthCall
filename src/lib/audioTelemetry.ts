import { supabase } from './supabaseClient';

/**
 * Métricas do sistema de áudio
 */
interface AudioMetrics {
  activationSuccess: number;
  activationFailure: number;
  playbackSuccess: number;
  playbackFailure: number;
  cacheHits: number;
  cacheMisses: number;
  totalLatency: number;
  playbackCount: number;
  errors: Map<string, number>;
}

/**
 * Evento de telemetria
 */
interface TelemetryEvent {
  type: 'activation' | 'playback' | 'cache' | 'error';
  success: boolean;
  latency?: number;
  errorType?: string;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Sistema de telemetria para monitoramento do áudio
 */
class AudioTelemetry {
  private metrics: AudioMetrics = {
    activationSuccess: 0,
    activationFailure: 0,
    playbackSuccess: 0,
    playbackFailure: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatency: 0,
    playbackCount: 0,
    errors: new Map(),
  };

  private events: TelemetryEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL_MS = 60000; // 1 minuto
  private readonly MAX_EVENTS = 100;

  constructor() {
    // Inicia flush automático a cada 1 minuto
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);

    // Flush ao descarregar página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /**
   * Registra ativação de áudio
   */
  trackActivation(success: boolean, latency?: number) {
    if (success) {
      this.metrics.activationSuccess++;
    } else {
      this.metrics.activationFailure++;
    }

    this.addEvent({
      type: 'activation',
      success,
      latency,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Telemetry] Ativação: ${success ? 'sucesso' : 'falha'}${latency ? ` (${latency}ms)` : ''}`);
  }

  /**
   * Registra reprodução de áudio
   */
  trackPlayback(success: boolean, latency: number, errorMessage?: string) {
    if (success) {
      this.metrics.playbackSuccess++;
      this.metrics.totalLatency += latency;
      this.metrics.playbackCount++;
    } else {
      this.metrics.playbackFailure++;
    }

    this.addEvent({
      type: 'playback',
      success,
      latency,
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    console.log(`[Telemetry] Reprodução: ${success ? 'sucesso' : 'falha'} (${latency}ms)`);
  }

  /**
   * Registra acesso ao cache
   */
  trackCache(hit: boolean) {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    this.addEvent({
      type: 'cache',
      success: hit,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Registra erro
   */
  trackError(errorType: string, errorMessage: string) {
    const count = this.metrics.errors.get(errorType) || 0;
    this.metrics.errors.set(errorType, count + 1);

    this.addEvent({
      type: 'error',
      success: false,
      errorType,
      errorMessage,
      timestamp: new Date().toISOString(),
    });

    console.error(`[Telemetry] Erro: ${errorType} - ${errorMessage}`);
  }

  /**
   * Obtém métricas calculadas
   */
  getMetrics() {
    const totalCache = this.metrics.cacheHits + this.metrics.cacheMisses;
    const avgLatency =
      this.metrics.playbackCount > 0
        ? Math.round(this.metrics.totalLatency / this.metrics.playbackCount)
        : 0;

    return {
      activation: {
        success: this.metrics.activationSuccess,
        failure: this.metrics.activationFailure,
        successRate:
          this.metrics.activationSuccess + this.metrics.activationFailure > 0
            ? (
                (this.metrics.activationSuccess /
                  (this.metrics.activationSuccess + this.metrics.activationFailure)) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
      },
      playback: {
        success: this.metrics.playbackSuccess,
        failure: this.metrics.playbackFailure,
        successRate:
          this.metrics.playbackSuccess + this.metrics.playbackFailure > 0
            ? (
                (this.metrics.playbackSuccess /
                  (this.metrics.playbackSuccess + this.metrics.playbackFailure)) *
                100
              ).toFixed(2) + '%'
            : 'N/A',
        avgLatency: `${avgLatency}ms`,
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate:
          totalCache > 0
            ? ((this.metrics.cacheHits / totalCache) * 100).toFixed(2) + '%'
            : 'N/A',
      },
      errors: Array.from(this.metrics.errors.entries()).map(([type, count]) => ({
        type,
        count,
      })),
    };
  }

  /**
   * Exibe métricas no console
   */
  printMetrics() {
    const metrics = this.getMetrics();
    console.group('[Telemetry] Métricas do Sistema de Áudio');
    console.log('Ativação:', metrics.activation);
    console.log('Reprodução:', metrics.playback);
    console.log('Cache:', metrics.cache);
    console.log('Erros:', metrics.errors);
    console.groupEnd();
  }

  /**
   * Adiciona evento à fila
   */
  private addEvent(event: TelemetryEvent) {
    this.events.push(event);

    // Se atingir limite, flush imediatamente
    if (this.events.length >= this.MAX_EVENTS) {
      this.flush();
    }
  }

  /**
   * Envia métricas para o backend
   */
  private async flush() {
    if (this.events.length === 0) return;

    try {
      const metrics = this.getMetrics();
      const eventsToSend = [...this.events];

      // Limpa eventos após copiar
      this.events = [];

      // Envia para Supabase (apenas em produção)
      if (import.meta.env.PROD) {
        await supabase.from('audio_metrics').insert({
          metrics,
          events: eventsToSend,
          session_id: this.getSessionId(),
          timestamp: new Date().toISOString(),
        });

        console.log(`[Telemetry] ${eventsToSend.length} eventos enviados`);
      } else {
        console.log('[Telemetry] Modo dev - métricas não enviadas');
        this.printMetrics();
      }
    } catch (error) {
      console.error('[Telemetry] Erro ao enviar métricas:', error);
      // Não propaga erro para não afetar funcionalidade principal
    }
  }

  /**
   * Obtém ou cria ID de sessão
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('audio_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('audio_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Reseta métricas (útil para testes)
   */
  reset() {
    this.metrics = {
      activationSuccess: 0,
      activationFailure: 0,
      playbackSuccess: 0,
      playbackFailure: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLatency: 0,
      playbackCount: 0,
      errors: new Map(),
    };
    this.events = [];
  }

  /**
   * Para o flush automático
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Flush final
  }
}

// Singleton
export const audioTelemetry = new AudioTelemetry();

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).audioTelemetry = audioTelemetry;
}
