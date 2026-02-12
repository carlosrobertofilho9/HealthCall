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

vi.mock('@/hooks/useAudioContext', () => ({
  useAudioContext: vi.fn(() => ({
    contextRef: { current: null },
    isHealthy: false,
    resume: vi.fn().mockResolvedValue(true),
    startHealthCheck: vi.fn(),
    stopHealthCheck: vi.fn(),
    checkHealth: vi.fn().mockResolvedValue(true),
    getContext: vi.fn().mockResolvedValue(null),
    lastCheck: null,
  })),
}));

vi.mock('@/lib/audioTelemetry', () => ({
  audioTelemetry: {
    trackActivation: vi.fn(),
    trackPlayback: vi.fn(),
    trackCache: vi.fn(),
    trackError: vi.fn(),
    getMetrics: vi.fn(),
    printMetrics: vi.fn(),
  },
}));

vi.mock('@/lib/audioMonitoring', () => ({
  audioMonitoring: {
    start: vi.fn(),
    stop: vi.fn(),
    checkHealth: vi.fn(),
  },
}));

vi.mock('@/features/display/services/displayService', () => ({
  getLastCall: vi.fn(),
  getCallHistory: vi.fn(),
  getNextPatients: vi.fn(),
  getPatientById: vi.fn(),
  getCalledPatient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useDisplay - Refactored Architecture', () => {
  let mockChannel: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

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

    // Mock Audio
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

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Orchestrator Interface', () => {
    it('deve retornar a interface completa do contexto', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current).toHaveProperty('calledPatient');
      expect(result.current).toHaveProperty('nextPatients');
      expect(result.current).toHaveProperty('callHistory');
      expect(result.current).toHaveProperty('isCalling');
      expect(result.current).toHaveProperty('audioActivated');
      expect(result.current).toHaveProperty('activateAudio');
      expect(result.current).toHaveProperty('isActivatingAudio');
      expect(result.current).toHaveProperty('showWarnings');
      expect(result.current).toHaveProperty('stopWarnings');
    });

    it('deve iniciar com áudio desativado', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.audioActivated).toBe(false);
      expect(result.current.isCalling).toBe(false);
      expect(result.current.isActivatingAudio).toBe(false);
    });

    it('deve iniciar com listas vazias', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.calledPatient).toBeNull();
      expect(result.current.nextPatients).toEqual([]);
      expect(result.current.callHistory).toEqual([]);
    });
  });

  describe('activateAudio', () => {
    it('deve ativar áudio com sucesso', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await result.current.activateAudio();
      });

      expect(result.current.audioActivated).toBe(true);
      expect(result.current.isActivatingAudio).toBe(false);
    });

    it('deve impedir múltiplos cliques simultâneos', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await Promise.all([
          result.current.activateAudio(),
          result.current.activateAudio(),
        ]);
      });

      expect(result.current.audioActivated).toBe(true);
    });
  });

  describe('Realtime Data Integration', () => {
    it('deve criar canal Supabase com session ativa e áudio ativado', async () => {
      const { result } = renderHook(() => useDisplay());

      // Canal só é criado após ativação de áudio
      await act(async () => {
        await result.current.activateAudio();
      });

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith(
          expect.stringMatching(/^realtime-display-global-/)
        );
      });
    });

    it('deve buscar dados iniciais após ativação de áudio', async () => {
      const { result } = renderHook(() => useDisplay());

      // Dados iniciais só são buscados após ativação de áudio
      await act(async () => {
        await result.current.activateAudio();
      });

      await waitFor(() => {
        expect(displayService.getLastCall).toHaveBeenCalled();
        expect(displayService.getCallHistory).toHaveBeenCalled();
        expect(displayService.getNextPatients).toHaveBeenCalled();
      });
    });
  });

  describe('Call Announcer Integration', () => {
    it('deve anunciar chamada quando evento INSERT é recebido no realtime', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
        cancel: vi.fn(),
      });

      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Ativa áudio primeiro
      await act(async () => {
        await result.current.activateAudio();
      });

      expect(result.current.audioActivated).toBe(true);

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

      expect(insertCallback).toBeDefined();

      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          'Chamando Paciente 1, para Sala 1'
        );
      }, { timeout: 3000 });
    });

    it('deve anunciar chamada via fallback de UPDATE em patients', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
        cancel: vi.fn(),
      });

      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await act(async () => {
        await result.current.activateAudio();
      });

      const updateCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'UPDATE' && call[1].table === 'patients'
      )?.[2];

      expect(updateCallback).toBeDefined();

      await act(async () => {
        await updateCallback?.({
          new: {
            id: '2',
            name: 'Paciente 2',
            destination: 'Sala 2',
            status: 'Chamado',
            callCount: 1,
            queue_order: 0,
          },
        });
      });

      await waitFor(() => {
        expect(mockSpeak).toHaveBeenCalledWith(
          'Chamando Paciente 2, para Sala 2'
        );
      }, { timeout: 3000 });
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

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

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
      }, { timeout: 3000 });

      // Chamada duplicada (mesmo id + callCount)
      await act(async () => {
        await insertCallback?.({ new: { patient_id: '1', location: 'Sala 1' } });
      });

      // Não deve chamar novamente
      expect(mockSpeak).toHaveBeenCalledTimes(1);
    });
  });

  describe('Warning Timer Integration', () => {
    it('deve iniciar sem warnings visíveis', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current.showWarnings).toBe(false);
    });

    it('deve ter função stopWarnings disponível', async () => {
      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(typeof result.current.stopWarnings).toBe('function');
    });
  });

  describe('Memory Leaks', () => {
    it('deve limpar canal Supabase ao desmontar', async () => {
      const { result, unmount } = renderHook(() => useDisplay());

      // Ativa áudio para criar o canal
      await act(async () => {
        await result.current.activateAudio();
      });

      await waitFor(() => {
        expect(supabase.channel).toHaveBeenCalledWith(
          expect.stringMatching(/^realtime-display-global-/)
        );
      });

      unmount();

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('Segurança', () => {
    it('não deve permitir injection via nome do paciente', async () => {
      const { useTextToSpeech } = await import('@/hooks/useTextToSpeech');
      const mockSpeak = vi.fn().mockResolvedValue(undefined);

      vi.mocked(useTextToSpeech).mockReturnValue({
        speak: mockSpeak,
        preloadTTS: vi.fn().mockResolvedValue('url'),
        cancel: vi.fn(),
      });

      const { result } = renderHook(() => useDisplay());

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

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
      }, { timeout: 3000 });
    });
  });
});
