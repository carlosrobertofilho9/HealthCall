import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Warning } from '@/features/warnings/types';
import { WarningPlayer } from '../WarningPlayer';

const mocks = vi.hoisted(() => ({
  warnings: [] as any[],
  speak: vi.fn(() => Promise.resolve()),
  cancel: vi.fn(),
}));

vi.mock('@/features/warnings/hooks/useWarnings', () => ({
  useWarnings: () => ({
    warnings: mocks.warnings,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: mocks.speak,
    cancel: mocks.cancel,
  }),
}));

vi.mock('@/features/warnings/hooks/useResolvedWarningMediaUrl', () => ({
  useResolvedWarningMediaUrl: (url?: string | null) => url || null,
}));

const COOLDOWN_MS = 15 * 60 * 1000;

function makeWarning(overrides: Partial<Warning> = {}): Warning {
  return {
    id: overrides.id || 'warning-1',
    text: overrides.text || 'Aviso 1',
    background_url: null,
    active: true,
    created_at: '2026-04-18T12:00:00.000Z',
    media_type: overrides.media_type || 'image',
    qrcode_url: null,
    start_time: null,
    end_time: null,
    audio_url: null,
    duration: overrides.duration ?? 1,
    priority: false,
    order: null,
    content_url: overrides.content_url || `https://example.com/${overrides.id || 'warning-1'}.jpg`,
    priority_order: overrides.priority_order ?? 0,
    message: null,
    ...overrides,
  };
}

describe('WarningPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 18, 9, 30));
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(),
    });
    mocks.warnings = [];
    mocks.speak.mockClear();
    mocks.cancel.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exibe um aviso de imagem uma vez e entra em cooldown', () => {
    mocks.warnings = [makeWarning({ id: 'warning-1', text: 'Aviso 1', duration: 1 })];

    render(<WarningPlayer enabled paused={false} />);

    expect(screen.getByAltText('Aviso 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByAltText('Aviso 1')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(COOLDOWN_MS - 1);
    });
    expect(screen.queryByAltText('Aviso 1')).not.toBeInTheDocument();
  });

  it('passa por dois avisos e entra em cooldown depois do último', () => {
    mocks.warnings = [
      makeWarning({ id: 'warning-1', text: 'Aviso 1', duration: 1, priority_order: 1 }),
      makeWarning({ id: 'warning-2', text: 'Aviso 2', duration: 1, priority_order: 2 }),
    ];

    render(<WarningPlayer enabled paused={false} />);

    expect(screen.getByAltText('Aviso 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByAltText('Aviso 2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByAltText('Aviso 1')).not.toBeInTheDocument();
    expect(screen.queryByAltText('Aviso 2')).not.toBeInTheDocument();
  });

  it('não usa loop para vídeo único', () => {
    mocks.warnings = [
      makeWarning({
        id: 'video-1',
        text: 'Vídeo 1',
        media_type: 'video',
        content_url: 'https://example.com/video.mp4',
      }),
    ];

    const { container } = render(<WarningPlayer enabled paused={false} />);
    const video = container.querySelector('video');

    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute('loop');
    expect(video?.loop).toBe(false);
  });

  it('reinicia o ciclo depois de 15 minutos', () => {
    mocks.warnings = [makeWarning({ id: 'warning-1', text: 'Aviso 1', duration: 1 })];

    render(<WarningPlayer enabled paused={false} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByAltText('Aviso 1')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(COOLDOWN_MS);
    });
    expect(screen.getByAltText('Aviso 1')).toBeInTheDocument();
  });

  it('quando pausado não avança o ciclo', () => {
    mocks.warnings = [makeWarning({ id: 'warning-1', text: 'Aviso 1', duration: 1 })];

    render(<WarningPlayer enabled paused />);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByAltText('Aviso 1')).toBeInTheDocument();
  });

  it('mantém snapshot e retoma aviso interrompido por chamada', () => {
    mocks.warnings = [makeWarning({ id: 'warning-1', text: 'Aviso 1', duration: 10 })];

    const { rerender } = render(<WarningPlayer enabled paused={false} />);

    act(() => {
      vi.advanceTimersByTime(4000);
      window.dispatchEvent(new CustomEvent('healthcall:call-started'));
    });

    rerender(<WarningPlayer enabled paused />);
    rerender(<WarningPlayer enabled paused={false} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByAltText('Aviso 1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByAltText('Aviso 1')).not.toBeInTheDocument();
  });
});
