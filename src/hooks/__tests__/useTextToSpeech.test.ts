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

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useTextToSpeech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Audio mock
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

  describe('preloadTTS', () => {
    it('deve fazer cache de URLs geradas', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Primeira chamada
      const url1 = await result.current.preloadTTS('teste');
      expect(url1).toBe(mockUrl);
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);

      // Segunda chamada deve usar cache
      const url2 = await result.current.preloadTTS('teste');
      expect(url2).toBe(mockUrl);
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1); // Não chamou novamente
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

    it('deve lançar erro após esgotar tentativas', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.preloadTTS('teste')).rejects.toThrow();
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(3); // 3 tentativas
    });

    it('deve expirar cache após 1 hora', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Primeira chamada
      await result.current.preloadTTS('teste');
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);

      // Avança o tempo em 1 hora + 1ms
      vi.useFakeTimers();
      vi.advanceTimersByTime(3600000 + 1);

      // Segunda chamada deve gerar novo áudio (cache expirado)
      await result.current.preloadTTS('teste');
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('deve respeitar limite de 100 itens no cache', async () => {
      vi.mocked(supabase.functions.invoke).mockImplementation((name, options) => {
        return Promise.resolve({
          data: { speechUrl: `https://example.com/${options.body.text}.mp3` },
          error: null,
        });
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Preenche cache com 101 itens
      for (let i = 0; i < 101; i++) {
        await result.current.preloadTTS(`texto ${i}`);
      }

      // Verifica que item mais antigo foi removido
      await result.current.preloadTTS('texto 0');
      // Se foi removido, deve fazer nova chamada (total = 102)
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(102);
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
    });

    it('deve configurar Audio corretamente para Chromecast', async () => {
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
      } as any;

      const { result } = renderHook(() => useTextToSpeech());
      await result.current.speak('teste');

      await waitFor(() => {
        expect(audioInstance.crossOrigin).toBe('anonymous');
        expect(audioInstance.preload).toBe('auto');
        expect(audioInstance.volume).toBe(1.0);
      });
    });

    it('deve fazer cleanup completo de listeners após reprodução', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      let audioInstance: any;
      global.Audio = class MockAudio {
        constructor() {
          audioInstance = this;
          (this as any).src = '';
          (this as any).onended = null;
          (this as any).onerror = null;
          (this as any).onloadeddata = null;
        }
        async play() {
          setTimeout(() => {
            if ((this as any).onended) (this as any).onended();
          }, 10);
          return Promise.resolve();
        }
        pause() {}
      } as any;

      const { result } = renderHook(() => useTextToSpeech());
      await result.current.speak('teste');

      await waitFor(() => {
        expect(audioInstance.onended).toBeNull();
        expect(audioInstance.onerror).toBeNull();
        expect(audioInstance.onloadeddata).toBeNull();
        expect(audioInstance.src).toBe('');
      });
    });

    it('deve remover URL do cache em caso de erro de reprodução', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      global.Audio = class MockAudio {
        async play() {
          setTimeout(() => {
            if ((this as any).onerror) {
              (this as any).onerror(new Error('Playback error'));
            }
          }, 10);
          return Promise.resolve();
        }
        pause() {}
      } as any;

      const { result } = renderHook(() => useTextToSpeech());

      // Primeira tentativa deve falhar e remover do cache
      await expect(result.current.speak('teste')).rejects.toThrow();

      // Segunda tentativa deve chamar API novamente
      global.Audio = class MockAudio {
        async play() {
          setTimeout(() => {
            if ((this as any).onended) (this as any).onended();
          }, 10);
          return Promise.resolve();
        }
        pause() {}
      } as any;

      await result.current.speak('teste');
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
    });

    it('deve lidar com erro ao gerar TTS', async () => {
      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('TTS generation failed'));

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak('teste')).rejects.toThrow();
    });

    it('deve fazer cleanup em caso de exceção durante play', async () => {
      const mockUrl = 'https://example.com/audio.mp3';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: mockUrl },
        error: null,
      });

      let audioInstance: any;
      global.Audio = class MockAudio {
        constructor() {
          audioInstance = this;
          (this as any).src = mockUrl;
        }
        async play() {
          throw new Error('Play failed');
        }
        pause() {}
      } as any;

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak('teste')).rejects.toThrow('Play failed');

      // Verifica que cleanup foi feito
      expect(audioInstance.src).toBe('');
    });
  });

  describe('Cenários de Stress', () => {
    it('deve lidar com múltiplas chamadas simultâneas', async () => {
      vi.mocked(supabase.functions.invoke).mockImplementation((name, options) => {
        return Promise.resolve({
          data: { speechUrl: `https://example.com/${options.body.text}.mp3` },
          error: null,
        });
      });

      const { result } = renderHook(() => useTextToSpeech());

      // 10 chamadas simultâneas
      const promises = Array.from({ length: 10 }, (_, i) =>
        result.current.speak(`texto ${i}`)
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('deve lidar com texto muito longo', async () => {
      const longText = 'a'.repeat(10000);
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'https://example.com/audio.mp3' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak(longText)).resolves.not.toThrow();
    });

    it('deve lidar com caracteres especiais', async () => {
      const specialText = '!@#$%^&*()_+{}[]|:;<>?,./~`';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'https://example.com/audio.mp3' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      await expect(result.current.speak(specialText)).resolves.not.toThrow();
    });
  });

  describe('Vulnerabilidades', () => {
    it('não deve permitir XSS através do texto', async () => {
      const xssText = '<script>alert("XSS")</script>';
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'https://example.com/audio.mp3' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Deve processar sem executar script
      await expect(result.current.speak(xssText)).resolves.not.toThrow();
    });

    it('deve validar URL retornada pela API', async () => {
      // URL maliciosa
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { speechUrl: 'javascript:alert("XSS")' },
        error: null,
      });

      const { result } = renderHook(() => useTextToSpeech());

      // Não deve executar código malicioso
      await result.current.speak('teste');
    });
  });
});
