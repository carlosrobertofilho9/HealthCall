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

class AudioTelemetry {
  private metrics: AudioMetrics = this.emptyMetrics();

  private emptyMetrics(): AudioMetrics {
    return {
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
  }

  trackActivation(success: boolean, latency?: number) {
    if (success) this.metrics.activationSuccess += 1;
    else this.metrics.activationFailure += 1;
    console.debug(`[Audio] ativação ${success ? 'ok' : 'falhou'}${latency != null ? ` (${latency}ms)` : ''}`);
  }

  trackPlayback(success: boolean, latency: number, errorMessage?: string) {
    if (success) {
      this.metrics.playbackSuccess += 1;
      this.metrics.totalLatency += latency;
      this.metrics.playbackCount += 1;
    } else {
      this.metrics.playbackFailure += 1;
      if (errorMessage) console.warn('[Audio] reprodução falhou:', errorMessage);
    }
  }

  trackCache(hit: boolean) {
    if (hit) this.metrics.cacheHits += 1;
    else this.metrics.cacheMisses += 1;
  }

  trackError(errorType: string, errorMessage: string) {
    this.metrics.errors.set(errorType, (this.metrics.errors.get(errorType) || 0) + 1);
    console.error(`[Audio] ${errorType}: ${errorMessage}`);
  }

  getMetrics() {
    const totalCache = this.metrics.cacheHits + this.metrics.cacheMisses;
    const playbackTotal = this.metrics.playbackSuccess + this.metrics.playbackFailure;
    const activationTotal = this.metrics.activationSuccess + this.metrics.activationFailure;
    const avgLatency = this.metrics.playbackCount > 0 ? Math.round(this.metrics.totalLatency / this.metrics.playbackCount) : 0;
    return {
      activation: {
        success: this.metrics.activationSuccess,
        failure: this.metrics.activationFailure,
        successRate: activationTotal > 0 ? `${((this.metrics.activationSuccess / activationTotal) * 100).toFixed(2)}%` : 'N/A',
      },
      playback: {
        success: this.metrics.playbackSuccess,
        failure: this.metrics.playbackFailure,
        successRate: playbackTotal > 0 ? `${((this.metrics.playbackSuccess / playbackTotal) * 100).toFixed(2)}%` : 'N/A',
        avgLatency: `${avgLatency}ms`,
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: totalCache > 0 ? `${((this.metrics.cacheHits / totalCache) * 100).toFixed(2)}%` : 'N/A',
      },
      errors: Array.from(this.metrics.errors.entries()).map(([type, count]) => ({ type, count })),
    };
  }

  printMetrics() {
    console.table(this.getMetrics());
  }

  reset() {
    this.metrics = this.emptyMetrics();
  }

  destroy() {
    // Métricas são intencionalmente efêmeras e não saem do dispositivo.
  }
}

export const audioTelemetry = new AudioTelemetry();

if (typeof window !== 'undefined') {
  (window as Window & { audioTelemetry?: AudioTelemetry }).audioTelemetry = audioTelemetry;
}
