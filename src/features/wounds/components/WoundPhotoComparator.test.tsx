import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WoundPhotoComparator from './WoundPhotoComparator';
import type { WoundPhoto } from '../types';

const makePhoto = (id: string, capturedAt: string): WoundPhoto => ({
  id,
  wound_id: 'w1',
  entry_id: null,
  storage_path: `${id}.jpg`,
  captured_at: capturedAt,
  display_order: 0,
  description: null,
  is_primary: false,
  created_by: 'user-1',
  created_at: capturedAt,
  deleted_at: null,
  deleted_by: null,
  signed_url: `https://example.com/${id}.jpg`,
});

describe('WoundPhotoComparator', () => {
  it('mostra mensagem quando não há fotos suficientes', () => {
    render(<WoundPhotoComparator photos={[makePhoto('p1', '2026-04-01T10:00:00.000Z')]} />);

    expect(screen.getByText(/Adicione pelo menos 2 fotos/i)).toBeInTheDocument();
  });

  it('renderiza slider e permite alterar valor', () => {
    render(
      <WoundPhotoComparator
        photos={[
          makePhoto('p1', '2026-04-01T10:00:00.000Z'),
          makePhoto('p2', '2026-04-02T10:00:00.000Z'),
        ]}
      />,
    );

    const slider = screen.getByLabelText(/Slider de comparação/i) as HTMLInputElement;
    expect(slider.value).toBe('50');

    fireEvent.change(slider, { target: { value: '75' } });
    expect(slider.value).toBe('75');
  });
});
