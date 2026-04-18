import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisplay } from '../useDisplay';
import { supabase } from '@/lib/supabaseClient';
import * as displayService from '@/features/display/services/displayService';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    session: { user: { id: 'user-1' } },
    loading: false,
  })),
}));

vi.mock('@/hooks/useAudioContext', () => ({
  useAudioContext: vi.fn(() => ({
    resume: vi.fn().mockResolvedValue(true),
    startHealthCheck: vi.fn(),
  })),
}));

vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: vi.fn(() => ({
    speak: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/features/display/services/displayService', () => ({
  getLastCall: vi.fn().mockResolvedValue(null),
  getCallHistory: vi.fn().mockResolvedValue([]),
  getNextPatients: vi.fn().mockResolvedValue([]),
  getScheduledAppointmentsAwaitingCheckIn: vi.fn().mockResolvedValue([]),
  getPatientById: vi.fn().mockResolvedValue(null),
  registerDisplaySession: vi.fn().mockResolvedValue(undefined),
  heartbeatDisplaySession: vi.fn().mockResolvedValue(undefined),
  getPendingCalls: vi.fn().mockResolvedValue([]),
  ackCall: vi.fn().mockResolvedValue(undefined),
}));

describe('useDisplay V3', () => {
  const SESSION_ID = '11111111-1111-4111-8111-111111111111';
  const subscribeMock = vi.fn((cb?: (status: string) => void) => {
    if (cb) cb('SUBSCRIBED');
    return channelMock;
  });

  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: subscribeMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(supabase.channel).mockReturnValue(channelMock as any);

    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: vi.fn(() => SESSION_ID),
      },
      configurable: true,
    });

    const MockAudio = class MockAudio {
      src = '';
      crossOrigin: string | null = null;
      preload = 'auto';
      volume = 1;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;

      async play() {
        setTimeout(() => this.onended?.(), 5);
        return Promise.resolve();
      }

      pause() {}
    } as any;

    (global as any).Audio = MockAudio;
    (window as any).Audio = MockAudio;

    sessionStorage.clear();
  });

  it('retorna a interface pública esperada', async () => {
    const { result } = renderHook(() => useDisplay());

    await waitFor(() => {
      expect(result.current).toMatchObject({
        calledPatient: null,
        nextPatients: [],
        callHistory: [],
        isCalling: false,
        audioActivated: false,
        isActivatingAudio: false,
        showWarnings: false,
      });
      expect(typeof result.current.activateAudio).toBe('function');
      expect(typeof result.current.stopWarnings).toBe('function');
    });
  });

  it('ativa áudio com sucesso', async () => {
    const { result } = renderHook(() => useDisplay());

    await act(async () => {
      await result.current.activateAudio();
    });

    expect(result.current.audioActivated).toBe(true);
    expect(result.current.isActivatingAudio).toBe(false);
  });

  it('inicializa sessão V3 após ativação de áudio', async () => {
    const { result } = renderHook(() => useDisplay());

    await act(async () => {
      await result.current.activateAudio();
    });

    await waitFor(() => {
      expect(displayService.registerDisplaySession).toHaveBeenCalledWith(
        SESSION_ID,
        'user-1',
        expect.stringContaining('display-')
      );
      expect(displayService.getPendingCalls).toHaveBeenCalledWith(SESSION_ID, 50);
      expect(supabase.channel).toHaveBeenCalledWith(`display-v3-${SESSION_ID}`);
    });
  });
});
