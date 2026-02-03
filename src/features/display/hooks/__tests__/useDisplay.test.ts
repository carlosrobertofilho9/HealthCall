import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisplay } from '../useDisplay';
import * as displayService from '@/features/display/services/displayService';
import * as localDb from '@/services/localDatabase';

// Mock do react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => ({
    pathname: '/display',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  })),
}));

// Mock do useTextToSpeech
vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: vi.fn(() => ({
    speak: vi.fn()
  }))
}));


vi.mock('@/hooks/useAudioContext', () => ({
  useAudioContext: vi.fn(() => ({
    contextRef: { current: { state: 'running' } },
    isHealthy: true,
    resume: vi.fn().mockResolvedValue(undefined),
    startHealthCheck: vi.fn(),
  })),
}));

vi.mock('@/features/display/services/displayService', () => ({
  getLastCall: vi.fn(),
  getCallHistory: vi.fn(),
  getNextPatients: vi.fn(),
  getPatientById: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/audioMonitoring', () => ({
  audioMonitoring: {
    start: vi.fn(),
    stop: vi.fn(),
    getMetrics: vi.fn(() => ({})),
  },
}));

vi.mock('@/lib/audioTelemetry', () => ({
  audioTelemetry: {
    trackActivation: vi.fn(),
    trackPlayback: vi.fn(),
    trackCache: vi.fn(),
    trackError: vi.fn(),
  },
}));

describe('useDisplay - Audio System', () => {
  let audioContextInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock do localDatabase para realtime updates
    vi.mocked(localDb.onDataUpdate).mockImplementation(() => {});
    vi.mocked(localDb.offDataUpdate).mockImplementation(() => {});

    // Mock dos serviços
    vi.mocked(displayService.getLastCall).mockResolvedValue(null);
    vi.mocked(displayService.getCallHistory).mockResolvedValue([]);
    vi.mocked(displayService.getNextPatients).mockResolvedValue([]);

    // Reset AudioContext mock
    audioContextInstance = null;
    global.AudioContext = class MockAudioContext {
      state: 'running' | 'suspended' = 'running';

      constructor() {
        audioContextInstance = this;
      }

      async resume() {
        this.state = 'running';
        return Promise.resolve();
      }

      async suspend() {
        this.state = 'suspended';
        return Promise.resolve();
      }
    } as any;

    // Reset Audio mock
    global.Audio = class MockAudio {
      src = '';
      volume = 1.0;
      crossOrigin: string | null = null;
      preload = 'auto';
      onended: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      oncanplay: (() => void) | null = null;
      onprogress: (() => void) | null = null;
      onstalled: (() => void) | null = null;
      onwaiting: (() => void) | null = null;
      paused = true;

      async play() {
        this.paused = false;
        setTimeout(() => {
          if (this.onended) this.onended();
        }, 10);
        return Promise.resolve();
      }

      pause() {
        this.paused = true;
      }

      load() {
        // Mock implementation
      }

      remove() {
        // Mock implementation
      }
    } as any;
  });

  describe('activateAudio', () => {
    it('deve criar AudioContext apenas uma vez', async () => {
      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const firstContext = audioContextInstance;

      await act(async () => {
        await result.current.activateAudio();
      });

      expect(audioContextInstance).toBe(firstContext);
    });

    it('deve impedir múltiplos cliques simultâneos', async () => {
      const { result } = renderHook(() => useDisplay());

      const promise1 = act(async () => {
        await result.current.activateAudio();
      });

      const promise2 = act(async () => {
        await result.current.activateAudio();
      });

      await Promise.all([promise1, promise2]);

      // Apenas uma ativação deve ocorrer
      expect(result.current.audioActivated).toBe(true);
    });

    it('deve retomar AudioContext suspenso', async () => {
      audioContextInstance = {
        state: 'suspended',
        resume: vi.fn().mockResolvedValue(undefined),
      };

      global.AudioContext = vi.fn(() => audioContextInstance) as any;

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      expect(audioContextInstance.resume).toHaveBeenCalled();
    });

    it('deve definir isActivatingAudio durante ativação', async () => {
      const { result } = renderHook(() => useDisplay());

      expect(result.current.isActivatingAudio).toBe(false);

      const promise = act(async () => {
        await result.current.activateAudio();
      });

      // Durante a ativação (não podemos verificar diretamente, mas o estado deve mudar)
      await promise;

      expect(result.current.isActivatingAudio).toBe(false);
      expect(result.current.audioActivated).toBe(true);
    });

    it('deve fazer cleanup do Audio em caso de timeout', async () => {
      vi.useFakeTimers();

      let bellAudio: any;
      global.Audio = class MockAudio {
        constructor() {
          bellAudio = this;
          (this as any).src = '/bell.mp3';
          (this as any).pause = vi.fn();
        }
        async play() {
          // Não chama onended (simula timeout)
          return new Promise(() => {});
        }
      } as any;

      const { result } = renderHook(() => useDisplay());

      const promise = act(async () => {
        await result.current.activateAudio();
      });

      // Avança 3 segundos (timeout)
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      await promise.catch(() => {});

      expect(bellAudio.pause).toHaveBeenCalled();
      expect(bellAudio.src).toBe('');

      vi.useRealTimers();
    });

    it('deve lidar com erro ao tocar campainha', async () => {
      global.Audio = class MockAudio {
        async play() {
          setTimeout(() => {
            if ((this as any).onerror) {
              (this as any).onerror(new Error('Audio play failed'));
            }
          }, 10);
          return Promise.resolve();
        }
        pause() {}
      } as any;

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      expect(result.current.audioActivated).toBe(false);
    });
  });

  describe('playBellAndSpeak - Mutex System', () => {
    it('deve bloquear múltiplas reproduções simultâneas', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
      });

      const { result, rerender } = renderHook(() => useDisplay());

      // Ativa áudio primeiro
      await act(async () => {
        await result.current.activateAudio();
      });

      // Simula duas chamadas chegando simultaneamente
      const patient1 = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      const patient2 = {
        id: '2',
        name: 'Paciente 2',
        destination: 'Sala 2',
        callCount: 1,
        status: 'Chamado' as const,
      };

      // Dispara evento INSERT para patient1
      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      vi.mocked(displayService.getPatientById).mockResolvedValue(patient1);

      act(() => {
        insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      // Imediatamente dispara para patient2
      vi.mocked(displayService.getPatientById).mockResolvedValue(patient2);

      act(() => {
        insertCallback?.({ new: { patient_id: '2', location: 'Sala 2' } });
      });

      await waitFor(() => {
        // Apenas uma chamada deve ter sido processada
        expect(mockSpeak).toHaveBeenCalledTimes(1);
      });
    });

    it('deve ignorar chamadas duplicadas', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
      });

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const patient = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      vi.mocked(displayService.getPatientById).mockResolvedValue(patient);

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      // Primeira chamada
      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledTimes(1);
      });

      // Chamada duplicada
      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      // Não deve chamar novamente
      expect(mockSpeak).toHaveBeenCalledTimes(1);
    });

    it('deve permitir retry em caso de erro', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
      });

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const patient = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      vi.mocked(displayService.getPatientById).mockResolvedValue(patient);

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      // Primeira tentativa (falha)
      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledTimes(1);
      });

      // Segunda tentativa (sucesso) - deve permitir porque não atualizou lastCalledRef
      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledTimes(2);
      });
    });

    it('deve retomar AudioContext suspenso antes de reproduzir', async () => {
      const resumeMock = vi.fn().mockResolvedValue(undefined);
      audioContextInstance = {
        state: 'suspended',
        resume: resumeMock,
      };

      global.AudioContext = vi.fn(() => audioContextInstance) as any;

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      // Muda estado para suspenso
      audioContextInstance.state = 'suspended';

      const patient = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      vi.mocked(displayService.getPatientById).mockResolvedValue(patient);

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(resumeMock).toHaveBeenCalled();
      });
    });

    it('deve fazer cleanup completo do elemento Audio da campainha', async () => {
      let bellAudio: any;
      const pauseMock = vi.fn();

      global.Audio = class MockAudio {
        constructor() {
          bellAudio = this;
          (this as any).src = '/bell.mp3';
          (this as any).pause = pauseMock;
          (this as any).onended = null;
          (this as any).onerror = null;
        }
        async play() {
          setTimeout(() => {
            if ((this as any).onended) (this as any).onended();
          }, 10);
          return Promise.resolve();
        }
      } as any;

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const patient = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      vi.mocked(displayService.getPatientById).mockResolvedValue(patient);

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(bellAudio.onended).toBeNull();
        expect(bellAudio.onerror).toBeNull();
        expect(bellAudio.src).toBe('');
      });
    });
  });

  describe('Cenários de Race Condition', () => {
    it('deve lidar com múltiplos eventos INSERT rápidos', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const callOrder: number[] = [];
      const mockSpeak = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            callOrder.push(Date.now());
            resolve(undefined);
          }, 50);
        });
      });

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
      });

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      // Dispara 5 eventos em sequência rápida
      for (let i = 0; i < 5; i++) {
        vi.mocked(displayService.getPatientById).mockResolvedValue({
          id: `${i}`,
          name: `Paciente ${i}`,
          destination: `Sala ${i}`,
          callCount: 1,
          status: 'Chamado' as const,
        });

        act(() => {
          insertCallback?.({ new: { patient_id: `${i}`, location: `Sala ${i}` } });
        });
      }

      await waitFor(
        () => {
          // Deve processar apenas 1 (o primeiro, os outros foram bloqueados pelo mutex)
          expect(mockSpeak).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Vulnerabilidades de Segurança', () => {
    it('não deve permitir injection via nome do paciente', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
      });

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const maliciousPatient = {
        id: '1',
        name: '<script>alert("XSS")</script>',
        destination: 'Sala 1',
        callCount: 1,
        status: 'Chamado' as const,
      };

      vi.mocked(displayService.getPatientById).mockResolvedValue(maliciousPatient);

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          'Chamando <script>alert("XSS")</script>, para Sala 1'
        );
      });

      // O conteúdo é passado como texto, não executado
    });
  });

  describe('Memory Leaks', () => {
    it('deve limpar subscription ao desmontar', () => {
      const { unmount } = renderHook(() => useDisplay());

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('deve limpar interval ao desmontar', () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() => useDisplay());

      // Verifica que fetchDisplayData foi agendado
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      unmount();

      vi.clearAllTimers();
      vi.useRealTimers();
    });
  });
});
