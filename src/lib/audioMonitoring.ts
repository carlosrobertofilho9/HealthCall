import { audioTelemetry } from './audioTelemetry';
import { toast } from 'sonner';

/**
 * Configuração de alertas e thresholds
 */
interface MonitoringConfig {
  // Thresholds de alerta
  maxFailureRate: number; // % de falhas antes de alertar
  maxLatency: number; // ms de latência máxima aceitável
  minCacheHitRate: number; // % mínimo de cache hit
  checkInterval: number; // ms entre verificações

  // Ações de alerta
  onHighFailureRate?: (rate: number) => void;
  onHighLatency?: (latency: number) => void;
  onLowCacheHit?: (rate: number) => void;
  onCriticalError?: (error: string) => void;
}

/**
 * Status de saúde do sistema
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  metrics: {
    activationRate: number;
    playbackRate: number;
    avgLatency: number;
    cacheHitRate: number;
  };
  issues: string[];
}

/**
 * Sistema de monitoramento e alertas para o áudio
 */
class AudioMonitoring {
  private config: MonitoringConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCheck: Date | null = null;
  private healthHistory: SystemHealth[] = [];
  private readonly MAX_HISTORY = 100;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      maxFailureRate: 10, // 10% de falhas
      maxLatency: 1000, // 1 segundo
      minCacheHitRate: 50, // 50% de cache hit
      checkInterval: 60000, // 1 minuto
      ...config,
    };
  }

  /**
   * Inicia monitoramento automático
   */
  start() {
    if (this.monitoringInterval) {
      console.warn('[Monitoring] Já está rodando');
      return;
    }

    console.log('[Monitoring] Iniciando monitoramento automático');

    // Primeira verificação imediata
    this.checkHealth();

    // Verificações periódicas
    this.monitoringInterval = setInterval(() => {
      this.checkHealth();
    }, this.config.checkInterval);
  }

  /**
   * Para monitoramento automático
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[Monitoring] Monitoramento parado');
    }
  }

  /**
   * Verifica saúde do sistema
   */
  checkHealth(): SystemHealth {
    const metrics = audioTelemetry.getMetrics();
    const issues: string[] = [];
    let status: HealthStatus = 'healthy';

    // Analisa taxa de falha de ativação
    const activationTotal =
      metrics.activation.success + metrics.activation.failure;
    const activationRate =
      activationTotal > 0
        ? (metrics.activation.success / activationTotal) * 100
        : 100;

    if (activationRate < 100 - this.config.maxFailureRate) {
      issues.push(
        `Taxa de ativação baixa: ${activationRate.toFixed(1)}%`
      );
      status = 'warning';

      if (this.config.onHighFailureRate) {
        this.config.onHighFailureRate(100 - activationRate);
      }
    }

    // Analisa taxa de falha de reprodução
    const playbackTotal =
      metrics.playback.success + metrics.playback.failure;
    const playbackRate =
      playbackTotal > 0
        ? (metrics.playback.success / playbackTotal) * 100
        : 100;

    if (playbackRate < 100 - this.config.maxFailureRate) {
      issues.push(
        `Taxa de reprodução baixa: ${playbackRate.toFixed(1)}%`
      );
      status = 'critical';

      if (this.config.onHighFailureRate) {
        this.config.onHighFailureRate(100 - playbackRate);
      }
    }

    // Analisa latência
    const avgLatency = parseInt(metrics.playback.avgLatency);
    if (avgLatency > this.config.maxLatency) {
      issues.push(`Latência alta: ${avgLatency}ms`);
      if (status !== 'critical') status = 'warning';

      if (this.config.onHighLatency) {
        this.config.onHighLatency(avgLatency);
      }
    }

    // Analisa cache hit rate
    const cacheHitRate = parseFloat(metrics.cache.hitRate);
    if (cacheHitRate < this.config.minCacheHitRate) {
      issues.push(`Cache hit rate baixo: ${cacheHitRate.toFixed(1)}%`);
      if (status !== 'critical') status = 'warning';

      if (this.config.onLowCacheHit) {
        this.config.onLowCacheHit(cacheHitRate);
      }
    }

    // Verifica erros críticos
    const criticalErrors = metrics.errors.filter(
      (e) =>
        e.type === 'malicious_url_blocked' ||
        e.type === 'audiocontext_closed' ||
        e.count > 10
    );

    if (criticalErrors.length > 0) {
      criticalErrors.forEach((error) => {
        issues.push(`Erro crítico: ${error.type} (${error.count}x)`);
      });
      status = 'critical';

      if (this.config.onCriticalError) {
        criticalErrors.forEach((e) =>
          this.config.onCriticalError?.(`${e.type}: ${e.count} ocorrências`)
        );
      }
    }

    const health: SystemHealth = {
      status,
      timestamp: new Date(),
      metrics: {
        activationRate,
        playbackRate,
        avgLatency,
        cacheHitRate,
      },
      issues,
    };

    this.lastCheck = new Date();
    this.addToHistory(health);

    // Log de status
    if (issues.length > 0) {
      console.warn(`[Monitoring] Status: ${status.toUpperCase()}`, issues);
    } else {
      console.log('[Monitoring] Status: HEALTHY');
    }

    return health;
  }

  /**
   * Adiciona ao histórico
   */
  private addToHistory(health: SystemHealth) {
    this.healthHistory.push(health);

    // Mantém apenas últimos N registros
    if (this.healthHistory.length > this.MAX_HISTORY) {
      this.healthHistory.shift();
    }
  }

  /**
   * Retorna saúde atual
   */
  getCurrentHealth(): SystemHealth | null {
    if (this.healthHistory.length === 0) {
      return this.checkHealth();
    }
    return this.healthHistory[this.healthHistory.length - 1];
  }

  /**
   * Retorna histórico de saúde
   */
  getHealthHistory(): SystemHealth[] {
    return [...this.healthHistory];
  }

  /**
   * Retorna estatísticas do histórico
   */
  getHealthStats() {
    if (this.healthHistory.length === 0) {
      return null;
    }

    const healthyCount = this.healthHistory.filter(
      (h) => h.status === 'healthy'
    ).length;
    const warningCount = this.healthHistory.filter(
      (h) => h.status === 'warning'
    ).length;
    const criticalCount = this.healthHistory.filter(
      (h) => h.status === 'critical'
    ).length;

    return {
      total: this.healthHistory.length,
      healthy: healthyCount,
      warning: warningCount,
      critical: criticalCount,
      healthyPercentage: (
        (healthyCount / this.healthHistory.length) *
        100
      ).toFixed(2),
      lastCheck: this.lastCheck,
    };
  }

  /**
   * Reseta histórico
   */
  resetHistory() {
    this.healthHistory = [];
    this.lastCheck = null;
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<MonitoringConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[Monitoring] Configuração atualizada', this.config);
  }

  /**
   * Mostra relatório no console
   */
  printReport() {
    const health = this.getCurrentHealth();
    if (!health) {
      console.log('[Monitoring] Nenhuma verificação ainda');
      return;
    }

    console.group('[Monitoring] Relatório de Saúde do Sistema');
    console.log(`Status: ${health.status.toUpperCase()}`);
    console.log(`Timestamp: ${health.timestamp.toISOString()}`);
    console.log('Métricas:', health.metrics);

    if (health.issues.length > 0) {
      console.log('Problemas:', health.issues);
    }

    const stats = this.getHealthStats();
    if (stats) {
      console.log('\nEstatísticas:');
      console.log(`  Total de verificações: ${stats.total}`);
      console.log(`  Healthy: ${stats.healthy} (${stats.healthyPercentage}%)`);
      console.log(`  Warning: ${stats.warning}`);
      console.log(`  Critical: ${stats.critical}`);
    }

    console.groupEnd();
  }
}

// Singleton com configuração padrão
export const audioMonitoring = new AudioMonitoring({
  // Alertas visuais via toast
  onHighFailureRate: (rate) => {
    toast.error('Sistema de Áudio: Taxa de Falha Alta', {
      description: `${rate.toFixed(1)}% de falhas detectadas`,
    });
  },
  onHighLatency: (latency) => {
    toast.warning('Sistema de Áudio: Latência Alta', {
      description: `Latência média: ${latency}ms`,
    });
  },
  onLowCacheHit: (rate) => {
    toast.warning('Sistema de Áudio: Cache com Baixo Desempenho', {
      description: `Hit rate: ${rate.toFixed(1)}%`,
    });
  },
  onCriticalError: (error) => {
    toast.error('Sistema de Áudio: Erro Crítico', {
      description: error,
    });
  },
});

// Expõe globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).audioMonitoring = audioMonitoring;
}
