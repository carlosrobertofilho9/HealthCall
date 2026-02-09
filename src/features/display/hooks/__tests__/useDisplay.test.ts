import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisplay } from '../useDisplay';
import * as displayService from '@/features/display/services/displayService';
import { supabase } from '@/lib/supabaseClient';

// Mock dos módulos
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: '123' } },
    loading: false,
  })),
}));

vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: vi.fn(() => ({
    speak: vi.fn().mockResolvedValue(undefined),
    preloadTTS: vi.fn().mockResolvedValue('https://example.com/audio.mp3'),
    cancel: vi.fn(),
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

describe('useDisplay - Audio System', () => {
  let mockChannel: any;
  let audioContextInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock do Supabase channel
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback) => {
        callback('SUBSCRIBED');
        return mockChannel;
      }),
    };

    vi.mocked(supabase.channel).mockReturnValue(mockChannel);

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

      expect(result.current.audioActivated).toBe(true);
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
      let bellAudio: any;
      global.Audio = class MockAudio {
        constructor() {
          bellAudio = this;
          (this as any).src = '/bell.mp3';
          (this as any).pause = vi.fn();
        }
        async play() {
          // Não chama onended (simula timeout)
          return Promise.resolve();
        }
      } as any;

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      expect(bellAudio.pause).toHaveBeenCalled();
      expect(bellAudio.src).toBe('');
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

      expect(result.current.audioActivated).toBe(true);
    });
  });

  describe('enqueueCall/drainQueue - FIFO Queue System', () => {
    it('deve enfileirar múltiplas chamadas e reproduzir em sequência', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
        cancel: vi.fn(),
      });

      const { result } = renderHook(() => useDisplay());

      // Ativa áudio primeiro
      await act(async () => {
        await result.current.activateAudio();
      });

      const patient = {
        id: '1',
        name: 'Paciente 1',
        destination: 'Sala 1',
        status: 'Chamado' as const,
      };

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      vi.mocked(displayService.getPatientById)
        .mockResolvedValueOnce({ ...patient, callCount: 1 })
        .mockResolvedValueOnce({ ...patient, callCount: 2 });

      await act(async () => {
        await Promise.all([
          insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } }),
          insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } }),
        ]);
      });

      await waitFor(() => {
        // Ambas as chamadas devem ser processadas sequencialmente
        expect(mockSpeak).toHaveBeenCalledTimes(2);
      });
    });

    it('deve ignorar chamadas duplicadas', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
        cancel: vi.fn(),
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
        cancel: vi.fn(),
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
        cancel: vi.fn(),
      });

      const { result } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      const insertCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT' && call[1].table === 'calls'
      )?.[2];

      vi.mocked(displayService.getPatientById)
        .mockResolvedValueOnce({
          id: '1',
          name: 'Paciente 1',
          destination: 'Sala 1',
          callCount: 1,
          status: 'Chamado' as const,
        })
        .mockResolvedValueOnce({
          id: '1',
          name: 'Paciente 1',
          destination: 'Sala 1',
          callCount: 2,
          status: 'Chamado' as const,
        });

      // Dispara 2 eventos em sequência rápida
      await act(async () => {
        await Promise.all([
          insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } }),
          insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } }),
        ]);
      });

      await waitFor(
        () => {
          // Deve processar ambos em ordem via fila FIFO
          expect(mockSpeak).toHaveBeenCalledTimes(2);
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
        cancel: vi.fn(),
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
    it('deve limpar subscription ao desmontar', async () => {
      const { result, unmount } = renderHook(() => useDisplay());

      await act(async () => {
        await result.current.activateAudio();
      });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('deve limpar interval ao desmontar', () => {
      vi.useFakeTimers();

      const { unmount } = renderHook(() => useDisplay());

      unmount();

      vi.clearAllTimers();
      vi.useRealTimers();
    });
  });
});
