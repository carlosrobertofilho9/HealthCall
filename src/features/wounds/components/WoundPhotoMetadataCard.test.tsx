import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WoundPhotoMetadataResult } from '../types';
import { useWoundPhotoMetadata } from '../hooks/useWoundPhotoMetadata';
import WoundPhotoMetadataCard from './WoundPhotoMetadataCard';

vi.mock('../hooks/useWoundPhotoMetadata', () => ({
  useWoundPhotoMetadata: vi.fn(),
}));

const basePhoto = {
  id: 'photo-1',
  wound_id: 'wound-1',
  storage_path: 'wound-1/photo-1.jpg',
  captured_at: '2026-04-20T09:00:00.000Z',
} as const;

function mockHook(result: Partial<WoundPhotoMetadataResult>) {
  vi.mocked(useWoundPhotoMetadata).mockReturnValue({
    status: 'idle',
    metadata: null,
    error: null,
    source: null,
    reload: vi.fn(),
    ...result,
  });
}

describe('WoundPhotoMetadataCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sempre renderiza o bloco do componente', () => {
    mockHook({ status: 'loading' });
    render(<WoundPhotoMetadataCard photo={basePhoto} />);

    expect(screen.getByText(/Metadados da foto/i)).toBeInTheDocument();
    expect(screen.getByText(/Baixando foto do Supabase/i)).toBeInTheDocument();
  });

  it('renderiza estado vazio', () => {
    mockHook({ status: 'empty' });
    render(<WoundPhotoMetadataCard photo={basePhoto} />);

    expect(screen.getByText(/Metadados indisponíveis/i)).toBeInTheDocument();
  });

  it('renderiza erro e permite tentar novamente', () => {
    const reload = vi.fn();
    mockHook({ status: 'error', error: 'falha exif', reload });

    render(<WoundPhotoMetadataCard photo={basePhoto} />);
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(screen.getByText(/falha exif/i)).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('mostra link do Google Maps apenas com lat/lng válidos', () => {
    mockHook({
      status: 'ready',
      metadata: {
        make: 'Apple',
        model: 'iPhone',
        latitude: -23.55,
        longitude: -46.63,
      },
    });

    render(<WoundPhotoMetadataCard photo={basePhoto} />);
    const link = screen.getByRole('link', { name: /Ver no Google Maps/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('-23.55,-46.63'));
  });

  it('não mostra link do Google Maps sem coordenadas', () => {
    mockHook({
      status: 'ready',
      metadata: { make: 'Samsung', model: 'Galaxy' },
    });

    render(<WoundPhotoMetadataCard photo={basePhoto} />);
    expect(screen.queryByRole('link', { name: /Ver no Google Maps/i })).not.toBeInTheDocument();
  });
});
