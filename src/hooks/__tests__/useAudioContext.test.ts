import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAudioContext } from '../useAudioContext';

// Mock do audioTelemetry
vi.mock('@/lib/audioTelemetry', () => ({
  audioTelemetry: {
    trackError: vi.fn(),
  },
}));

describe('useAudioContext', () => {
  let mockAudioContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock do AudioContext
    mockAudioContext = {
      state: 'running' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    global.AudioContext = vi.fn(() => mockAudioContext) as any;
    (global as any).webkitAudioContext = vi.fn(() => mockAudioContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Inicialização', () => {
    it('deve criar AudioContext no primeiro checkHealth', async () => {
      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
      expect(result.current.isHealthy).toBe(true);
    });

    it('não deve criar múltiplos AudioContext', async () => {
      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
        await result.current.checkHealth();
        await result.current.checkHealth();
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkHealth', () => {
    it('deve retornar true quando AudioContext está running', async () => {
      mockAudioContext.state = 'running';

      const { result } = renderHook(() => useAudioContext());

      const healthy = await act(async () => {
        return await result.current.checkHealth();
      });

      expect(healthy).toBe(true);
      expect(result.current.isHealthy).toBe(true);
    });

    it('deve retomar AudioContext suspenso', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn(async () => {
        mockAudioContext.state = 'running';
      });

      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
      });

      expect(mockAudioContext.resume).toHaveBeenCalled();
      expect(result.current.isHealthy).toBe(true);
    });

    it('deve recriar AudioContext fechado', async () => {
      mockAudioContext.state = 'closed';

      const { result } = renderHook(() => useAudioContext());

      // Primeiro checkHealth
      await act(async () => {
        await result.current.checkHealth();
      });

      // Fecha o contexto
      mockAudioContext.state = 'closed';

      // Segundo checkHealth deve recriar
      await act(async () => {
        await result.current.checkHealth();
      });

      expect(global.AudioContext).toHaveBeenCalledTimes(3); // 1 inicial + 2 recriações
    });
  });

  describe('resume', () => {
    it('deve retomar AudioContext suspenso', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn(async () => {
        mockAudioContext.state = 'running';
      });

      const { result } = renderHook(() => useAudioContext());

      // Cria o contexto primeiro
      await act(async () => {
        await result.current.checkHealth();
      });

      // Suspende
      mockAudioContext.state = 'suspended';

      // Resume
      const success = await act(async () => {
        return await result.current.resume();
      });

      expect(success).toBe(true);
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    it('deve retornar true se já está running', async () => {
      mockAudioContext.state = 'running';

      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
      });

      const success = await act(async () => {
        return await result.current.resume();
      });

      expect(success).toBe(true);
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });

    it('deve criar contexto se não existir', async () => {
      const { result } = renderHook(() => useAudioContext());

      const success = await act(async () => {
        return await result.current.resume();
      });

      expect(success).toBe(true);
      expect(global.AudioContext).toHaveBeenCalled();
    });
  });

  describe('getContext', () => {
    it('deve retornar AudioContext válido', async () => {
      const { result } = renderHook(() => useAudioContext());

      const context = await act(async () => {
        return await result.current.getContext();
      });

      expect(context).toBe(mockAudioContext);
    });

    it('deve retornar null se checkHealth falhar', async () => {
      mockAudioContext.state = 'closed';
      mockAudioContext.resume = vi.fn().mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useAudioContext());

      const context = await act(async () => {
        return await result.current.getContext();
      });

      expect(context).toBeNull();
    });
  });

  describe('startHealthCheck', () => {
    it('deve iniciar verificação periódica', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useAudioContext());

      act(() => {
        result.current.startHealthCheck(1000);
      });

      // Avança 1 segundo
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isHealthy).toBe(true);

      vi.useRealTimers();
    });

    it('deve parar verificação anterior ao iniciar nova', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useAudioContext());

      act(() => {
        result.current.startHealthCheck(1000);
        result.current.startHealthCheck(2000);
      });

      // Deve ter apenas um intervalo ativo
      expect(vi.getTimerCount()).toBe(1);

      vi.useRealTimers();
    });
  });

  describe('stopHealthCheck', () => {
    it('deve parar verificação periódica', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useAudioContext());

      act(() => {
        result.current.startHealthCheck(1000);
        result.current.stopHealthCheck();
      });

      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Listener de visibilidade', () => {
    it('deve fazer checkHealth quando página fica visível', async () => {
      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
      });

      // Simula mudança de visibilidade
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible',
      });

      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Deve ter verificado novamente
      await waitFor(() => {
        expect(result.current.lastCheck).toBeTruthy();
      });
    });
  });

  describe('Cleanup', () => {
    it('deve parar health check ao desmontar', () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() => useAudioContext());

      unmount();

      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('Cenários de Erro', () => {
    it('deve rastrear erro quando AudioContext falha', async () => {
      const { audioTelemetry } = await import('@/lib/audioTelemetry');

      mockAudioContext.resume = vi.fn().mockRejectedValue(new Error('Resume failed'));
      mockAudioContext.state = 'suspended';

      const { result } = renderHook(() => useAudioContext());

      await act(async () => {
        await result.current.checkHealth();
      });

      expect(audioTelemetry.trackError).toHaveBeenCalled();
    });

    it('deve retornar false se checkHealth falhar completamente', async () => {
      global.AudioContext = vi.fn(() => {
        throw new Error('AudioContext not supported');
      }) as any;

      const { result } = renderHook(() => useAudioContext());

      const healthy = await act(async () => {
        return await result.current.checkHealth();
      });

      expect(healthy).toBe(false);
      expect(result.current.isHealthy).toBe(false);
    });
  });

  describe('Recuperação Automática', () => {
    it('deve recuperar de estado suspended automaticamente', async () => {
      const { result } = renderHook(() => useAudioContext());

      // Inicializa
      await act(async () => {
        await result.current.checkHealth();
      });

      expect(result.current.isHealthy).toBe(true);

      // Simula suspensão
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume = vi.fn(async () => {
        mockAudioContext.state = 'running';
      });

      // Verifica novamente
      await act(async () => {
        await result.current.checkHealth();
      });

      expect(mockAudioContext.resume).toHaveBeenCalled();
      expect(result.current.isHealthy).toBe(true);
    });

    it('deve recuperar de estado closed recriando', async () => {
      const firstContext = {
        state: 'running' as AudioContextState,
        resume: vi.fn().mockResolvedValue(undefined),
        suspend: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
      const recreatedContext = {
        state: 'running' as AudioContextState,
        resume: vi.fn().mockResolvedValue(undefined),
        suspend: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(global.AudioContext).mockReturnValueOnce(firstContext).mockReturnValueOnce(recreatedContext);

      const { result } = renderHook(() => useAudioContext());

      // Inicializa
      await act(async () => {
        await result.current.checkHealth();
      });

      // Simula fechamento
      firstContext.state = 'closed';

      // Verifica novamente - deve recriar
      await act(async () => {
        await result.current.checkHealth();
      });

      expect(result.current.contextRef.current).not.toBe(firstContext);
      expect(result.current.isHealthy).toBe(true);
    });
  });
});
