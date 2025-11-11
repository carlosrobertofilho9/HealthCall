import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTextToSpeech } from '../useTextToSpeech';
import { supabase } from '@/lib/supabaseClient';

// Mock do Supabase
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock do audioTelemetry
vi.mock('@/lib/audioTelemetry', () => ({
  audioTelemetry: {
    trackCache: vi.fn(),
    trackPlayback: vi.fn(),
    trackError: vi.fn(),
  },
}));

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useTextToSpeech - Testes Simplificados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();

    // Mock do fetch global para validação de cache
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
      } as Response)
    ) as any;

    // Mock do Audio global com todos os métodos necessários
    global.Audio = class MockAudio {
      src = '';
      volume = 1.0;
      crossOrigin: string | null = null;
      preload = 'auto';
      onended: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onloadeddata: (() => void) | null = null;
      oncanplay: (() => void) | null = null;
      onprogress: (() => void) | null = null;
      onstalled: (() => void) | null = null;
      onwaiting: (() => void) | null = null;
      paused = true;

      constructor(src?: string) {
        if (src) this.src = src;
      }

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

      load() {}
      remove() {}
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('preloadTTS', () => {
    it('deve gerar novo áudio quando não está em cache', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      const url = await result.current.preloadTTS('teste');

      expect(url).toBe(mockUrl);
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-tts', {
        body: { text: 'teste' },
      });
    });

    it('deve usar cache em segunda chamada', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Primeira chamada
      const url1 = await result.current.preloadTTS('teste');
      expect(url1).toBe(mockUrl);

      // Segunda chamada deve usar cache
      const url2 = await result.current.preloadTTS('teste');
      expect(url2).toBe(mockUrl);

      // Deve ter chamado apenas uma vez (a primeira)
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });

    it('deve fazer retry em caso de falha', async () => {
      vi.mocked(supabase.functions.invoke)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { speechUrl: 'https://example.com/audio.mp3' },
          error: null,
        });

      const { result } = renderHook(() => useTextToSpeech());

      const url = await result.current.preloadTTS('teste');

      expect(url).toBe('https://example.com/audio.mp3');
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(3);
    });
  });

  describe('speak', () => {
    it('deve reproduzir áudio com sucesso', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak('teste')).resolves.not.toThrow();
    }, 10000);

    it('deve configurar Audio corretamente', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      let audioInstance: any;
      global.Audio = class MockAudio {
        constructor(src?: string) {
          audioInstance = this;
          (this as any).src = src || '';
          (this as any).volume = 1.0;
          (this as any).crossOrigin = null;
          (this as any).preload = 'auto';
          (this as any).onended = null;
          (this as any).onerror = null;
        }
        async play() {
          setTimeout(() => {
            if ((this as any).onended) (this as any).onended();
          }, 10);
          return Promise.resolve();
        }
        pause() {}
        load() {}
        remove() {}
      } as any;

      const { result } = renderHook(() => useTextToSpeech());
      await result.current.speak('teste');

      await waitFor(() => {
        expect(audioInstance.crossOrigin).toBe('anonymous');
        expect(audioInstance.preload).toBe('auto');
        expect(audioInstance.volume).toBe(1.0);
      });
    }, 10000);
  });

  describe('Validação de URLs', () => {
    it('deve bloquear URLs com protocolo javascript:', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'javascript:alert("XSS")' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak('teste')).rejects.toThrow();
    });

    it('deve bloquear URLs com protocolo data:', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'data:text/html,<script>alert("XSS")</script>' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak('teste')).rejects.toThrow();
    });

    it('deve permitir URLs HTTPS válidas', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'https://example.com/audio.mp3' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Mock mais robusto para este teste
      global.Audio = class MockAudio {
        async play() {
          setTimeout(() => {
            if ((this as any).onended) (this as any).onended();
          }, 10);
          return Promise.resolve();
        }
        pause() {}
        load() {}
        remove() {}
      } as any;

      await expect(result.current.speak('teste')).resolves.not.toThrow();
    }, 10000);
  });

  describe('Validação de Cache', () => {
    it('deve validar URLs de cache periodicamente', async () => {
      const mockUrl = 'https://example.com/audio.mp3';

      // Primeira chamada - adiciona ao cache
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response)
      ) as any;

      const { result } = renderHook(() => useTextToSpeech());

      // Pré-carrega (adiciona ao cache)
      const url1 = await result.current.preloadTTS('teste');
      expect(url1).toBe(mockUrl);

      // Segunda chamada imediatamente - deve usar cache sem verificação
      const url2 = await result.current.preloadTTS('teste');
      expect(url2).toBe(mockUrl);

      // Apenas 1 chamada ao Supabase
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);

      // Fetch pode ter sido chamado para verificação
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
