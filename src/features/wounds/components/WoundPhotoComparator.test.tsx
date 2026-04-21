import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WoundPhotoComparator from './WoundPhotoComparator';
import type { WoundPhoto } from '../types';

function makePhoto(
  id: string,
  capturedAt: string,
  options?: Partial<Pick<WoundPhoto, 'entry_id' | 'description' | 'signed_url'>>,
): WoundPhoto {
  return {
    id,
    wound_id: 'w1',
    entry_id: options?.entry_id ?? null,
    storage_path: `${id}.jpg`,
    captured_at: capturedAt,
    display_order: 0,
    description: options?.description ?? null,
    is_primary: false,
    created_by: 'user-1',
    created_at: capturedAt,
    deleted_at: null,
    deleted_by: null,
    signed_url:
      options && Object.prototype.hasOwnProperty.call(options, 'signed_url')
        ? (options.signed_url ?? null)
        : `https://example.com/${id}.jpg`,
  };
}

describe('WoundPhotoComparator', () => {
  it('mostra mensagem quando não há fotos suficientes', () => {
    render(<WoundPhotoComparator photos={[makePhoto('p1', '2026-04-01T12:00:00.000Z')]} />);

    expect(screen.getByText(/Adicione pelo menos 2 fotos/i)).toBeInTheDocument();
  });

  it('inicializa com foto mais antiga no antes e mais recente no depois', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p3', '2026-04-03T12:00:00.000Z', { entry_id: 'entry-3' }),
          makePhoto('p1', '2026-04-01T12:00:00.000Z', { entry_id: 'entry-1' }),
          makePhoto('p2', '2026-04-02T12:00:00.000Z', { entry_id: 'entry-2' }),
        ]}
      />,
    );

    expect(screen.getByText('Vínculo: entry-1')).toBeInTheDocument();
    expect(screen.getByText('Vínculo: entry-3')).toBeInTheDocument();
  });

  it('alterna entre modo divisor e modo lado a lado', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z'),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
      />,
    );

    expect(screen.getByTestId('split-layout')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Lado a lado/i }));
    expect(screen.getByTestId('side-by-side-layout')).toBeInTheDocument();
  });

  it('atualiza valor do divisor no slider', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z'),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
      />,
    );

    const slider = screen.getByLabelText(/Slider de comparação/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '75' } });

    expect(slider.value).toBe('75');
    expect(screen.getByText('Divisor: 75%')).toBeInTheDocument();
  });

  it('aplica zoom e reset de viewport', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z'),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
      />,
    );

    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Zoom \+/i }));
    expect(screen.getByText('Zoom: 125%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(screen.getByText('Zoom: 125%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ajustar/i }));
    expect(screen.getByText('Zoom: 100%')).toBeInTheDocument();
  });

  it('inverte os lados visuais sem quebrar seleção temporal', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z'),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
      />,
    );

    expect(screen.getByTestId('split-primary-label')).toHaveTextContent('Antes');
    fireEvent.click(screen.getByRole('button', { name: /Inverter lados/i }));
    expect(screen.getByTestId('split-primary-label')).toHaveTextContent('Depois');
  });

  it('exibe metadados resumidos e delta temporal', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z', { description: 'Dia 1' }),
          makePhoto('p2', '2026-04-03T12:00:00.000Z', { description: 'Dia 3' }),
        ]}
      />,
    );

    expect(screen.getByText('Descrição: Dia 1')).toBeInTheDocument();
    expect(screen.getByText('Descrição: Dia 3')).toBeInTheDocument();
    expect(screen.getByText('+2 dias')).toBeInTheDocument();
  });

  it('mantém fallback quando uma foto não tem signed_url', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z', { signed_url: null }),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
      />,
    );

    expect(screen.getByText(/imagem indisponível/i)).toBeInTheDocument();
  });

  it('dispara onClose ao clicar em fechar', () => {
    const onClose = vi.fn();

    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T12:00:00.000Z'),
          makePhoto('p2', '2026-04-02T12:00:00.000Z'),
        ]}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Fechar$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
