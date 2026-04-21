import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWoundPhotoMetadata } from './useWoundPhotoMetadata';

const mocks = vi.hoisted(() => ({
  resolveWoundPhotoMetadataOnDemand: vi.fn(),
  reverseGeocode: vi.fn(),
}));

vi.mock('../services/woundPhotoMetadataService', () => ({
  resolveWoundPhotoMetadataOnDemand: mocks.resolveWoundPhotoMetadataOnDemand,
}));

vi.mock('../services/geocodingService', () => ({
  reverseGeocode: mocks.reverseGeocode,
}));

const photo = {
  id: 'photo-1',
  wound_id: 'wound-1',
  storage_path: 'wound-1/photo-1.jpg',
  captured_at: '2026-04-20T09:00:00.000Z',
  created_at: '2026-04-21T10:00:00.000Z',
} as const;

const hydratedPhoto = {
  ...photo,
  metadata: {
    make: 'Apple',
    latitude: -23.55,
    longitude: -46.63,
  },
} as const;

describe('useWoundPhotoMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveWoundPhotoMetadataOnDemand.mockResolvedValue({
      metadata: null,
      source: null,
    });
    mocks.reverseGeocode.mockResolvedValue(null);
  });

  it('usa metadata já hidratado da foto sem chamar serviço', async () => {
    const { result } = renderHook(() => useWoundPhotoMetadata(hydratedPhoto));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.source).toBe('memory');
    expect(mocks.resolveWoundPhotoMetadataOnDemand).not.toHaveBeenCalled();
  });

  it('enriquece metadata hidratado com endereço quando só há coordenadas', async () => {
    mocks.reverseGeocode.mockResolvedValue('Av. Paulista, Bela Vista, São Paulo');
    const { result } = renderHook(() => useWoundPhotoMetadata(hydratedPhoto));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    await waitFor(() =>
      expect(result.current.metadata?.address).toBe('Av. Paulista, Bela Vista, São Paulo'),
    );
    expect(mocks.resolveWoundPhotoMetadataOnDemand).not.toHaveBeenCalled();
  });

  it('resolve metadata sob demanda via serviço', async () => {
    mocks.resolveWoundPhotoMetadataOnDemand.mockResolvedValue({
      metadata: {
        latitude: -23.55,
        longitude: -46.63,
      },
      source: 'exif_download',
    });

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.source).toBe('exif_download');
  });

  it('expõe erro quando resolução falha', async () => {
    mocks.resolveWoundPhotoMetadataOnDemand.mockRejectedValue(new Error('erro de download'));

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toContain('erro de download');
  });

  it('reload força bypass do cache em memória do serviço', async () => {
    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(mocks.resolveWoundPhotoMetadataOnDemand).toHaveBeenCalledTimes(1));
    expect(mocks.resolveWoundPhotoMetadataOnDemand).toHaveBeenLastCalledWith(photo, { bypassMemoryCache: false });

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(mocks.resolveWoundPhotoMetadataOnDemand).toHaveBeenCalledTimes(2));
    expect(mocks.resolveWoundPhotoMetadataOnDemand).toHaveBeenLastCalledWith(photo, { bypassMemoryCache: true });
  });
});
