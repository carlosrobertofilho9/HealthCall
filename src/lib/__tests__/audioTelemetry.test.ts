import { describe, it, expect, beforeEach, vi } from 'vitest';
import { audioTelemetry } from '../audioTelemetry';

// Mock do Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

describe('audioTelemetry', () => {
  beforeEach(() => {
    // Reset telemetria antes de cada teste
    audioTelemetry.reset();
    vi.clearAllMocks();
  });

  describe('trackActivation', () => {
    it('deve rastrear ativação bem-sucedida', () => {
      audioTelemetry.trackActivation(true, 250);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.activation.success).toBe(1);
      expect(metrics.activation.failure).toBe(0);
      expect(metrics.activation.successRate).toBe('100.00%');
    });

    it('deve rastrear ativação com falha', () => {
      audioTelemetry.trackActivation(false, 300);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.activation.success).toBe(0);
      expect(metrics.activation.failure).toBe(1);
      expect(metrics.activation.successRate).toBe('0.00%');
    });

    it('deve calcular taxa de sucesso corretamente', () => {
      audioTelemetry.trackActivation(true, 200);
      audioTelemetry.trackActivation(true, 250);
      audioTelemetry.trackActivation(true, 300);
      audioTelemetry.trackActivation(false, 400);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.activation.success).toBe(3);
      expect(metrics.activation.failure).toBe(1);
      expect(metrics.activation.successRate).toBe('75.00%');
    });
  });

  describe('trackPlayback', () => {
    it('deve rastrear reprodução bem-sucedida', () => {
      audioTelemetry.trackPlayback(true, 450);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.playback.success).toBe(1);
      expect(metrics.playback.failure).toBe(0);
      expect(metrics.playback.avgLatency).toBe('450ms');
    });

    it('deve rastrear reprodução com falha', () => {
      audioTelemetry.trackPlayback(false, 500, 'Network error');

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.playback.success).toBe(0);
      expect(metrics.playback.failure).toBe(1);
    });

    it('deve calcular latência média corretamente', () => {
      audioTelemetry.trackPlayback(true, 400);
      audioTelemetry.trackPlayback(true, 600);
      audioTelemetry.trackPlayback(true, 500);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.playback.avgLatency).toBe('500ms');
    });

    it('não deve incluir falhas no cálculo de latência média', () => {
      audioTelemetry.trackPlayback(true, 400);
      audioTelemetry.trackPlayback(true, 600);
      audioTelemetry.trackPlayback(false, 5000, 'Timeout');

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.playback.avgLatency).toBe('500ms');
    });
  });

  describe('trackCache', () => {
    it('deve rastrear cache hit', () => {
      audioTelemetry.trackCache(true);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.cache.hits).toBe(1);
      expect(metrics.cache.misses).toBe(0);
      expect(metrics.cache.hitRate).toBe('100.00%');
    });

    it('deve rastrear cache miss', () => {
      audioTelemetry.trackCache(false);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.cache.hits).toBe(0);
      expect(metrics.cache.misses).toBe(1);
      expect(metrics.cache.hitRate).toBe('0.00%');
    });

    it('deve calcular hit rate corretamente', () => {
      audioTelemetry.trackCache(true);
      audioTelemetry.trackCache(true);
      audioTelemetry.trackCache(true);
      audioTelemetry.trackCache(false);

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.cache.hits).toBe(3);
      expect(metrics.cache.misses).toBe(1);
      expect(metrics.cache.hitRate).toBe('75.00%');
    });
  });

  describe('trackError', () => {
    it('deve rastrear erro', () => {
      audioTelemetry.trackError('playback_error', 'Network timeout');

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.errors).toHaveLength(1);
      expect(metrics.errors[0]).toEqual({
        type: 'playback_error',
        count: 1,
      });
    });

    it('deve agregar erros do mesmo tipo', () => {
      audioTelemetry.trackError('playback_error', 'Error 1');
      audioTelemetry.trackError('playback_error', 'Error 2');
      audioTelemetry.trackError('activation_error', 'Error 3');

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.errors).toHaveLength(2);

      const playbackError = metrics.errors.find(e => e.type === 'playback_error');
      const activationError = metrics.errors.find(e => e.type === 'activation_error');

      expect(playbackError?.count).toBe(2);
      expect(activationError?.count).toBe(1);
    });
  });

  describe('Cenários Complexos', () => {
    it('deve rastrear múltiplas métricas corretamente', () => {
      // Ativações
      audioTelemetry.trackActivation(true, 250);

      // Reproduções
      audioTelemetry.trackPlayback(true, 400);
      audioTelemetry.trackPlayback(true, 600);
      audioTelemetry.trackPlayback(false, 1000, 'Timeout');

      // Cache
      audioTelemetry.trackCache(true);
      audioTelemetry.trackCache(true);
      audioTelemetry.trackCache(false);

      // Erros
      audioTelemetry.trackError('playback_error', 'Timeout');
      audioTelemetry.trackError('network_error', 'Connection failed');

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.activation.successRate).toBe('100.00%');
      expect(metrics.playback.successRate).toBe('66.67%');
      expect(metrics.playback.avgLatency).toBe('500ms');
      expect(metrics.cache.hitRate).toBe('66.67%');
      expect(metrics.errors).toHaveLength(2);
    });
  });

  describe('Reset', () => {
    it('deve resetar todas as métricas', () => {
      audioTelemetry.trackActivation(true, 250);
      audioTelemetry.trackPlayback(true, 400);
      audioTelemetry.trackCache(true);
      audioTelemetry.trackError('test_error', 'test');

      audioTelemetry.reset();

      const metrics = audioTelemetry.getMetrics();

      expect(metrics.activation.success).toBe(0);
      expect(metrics.activation.failure).toBe(0);
      expect(metrics.playback.success).toBe(0);
      expect(metrics.playback.failure).toBe(0);
      expect(metrics.cache.hits).toBe(0);
      expect(metrics.cache.misses).toBe(0);
      expect(metrics.errors).toHaveLength(0);
    });
  });
});
