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
  created_at: '2026-04-21T09:00:00.000Z',
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

  it('renderiza loading no fluxo sob demanda', () => {
    mockHook({ status: 'loading' });
    render(<WoundPhotoMetadataCard photo={basePhoto} />);

    expect(screen.getByText(/Metadados da foto/i)).toBeInTheDocument();
    expect(screen.getByText(/Carregando metadados sob demanda/i)).toBeInTheDocument();
  });

  it('renderiza estado vazio para foto legada', () => {
    mockHook({ status: 'empty' });
    render(<WoundPhotoMetadataCard photo={{ ...basePhoto, created_at: '2026-04-20T08:00:00.000Z' }} />);

    expect(screen.getByText(/Localização indisponível \(legado\)/i)).toBeInTheDocument();
  });

  it('renderiza erro e permite tentar novamente', () => {
    const reload = vi.fn();
    mockHook({ status: 'error', error: 'falha exif', reload });

    render(<WoundPhotoMetadataCard photo={basePhoto} />);
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(screen.getByText(/falha exif/i)).toBeInTheDocument();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('mostra coordenadas e origem quando há GPS', () => {
    mockHook({
      status: 'ready',
      source: 'photo_row',
      metadata: {
        make: 'Apple',
        model: 'iPhone',
        latitude: -23.55,
        longitude: -46.63,
      },
    });

    render(<WoundPhotoMetadataCard photo={{ ...basePhoto, location_source: 'device' }} />);
    const link = screen.getByRole('link', { name: /Ver no Google Maps/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('-23.55,-46.63'));
    expect(screen.getByText(/Origem: GPS do dispositivo/i)).toBeInTheDocument();
  });
});
