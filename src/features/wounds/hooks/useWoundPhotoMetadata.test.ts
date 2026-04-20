import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WoundPhotoExifMetadata } from '../types';
import { useWoundPhotoMetadata } from './useWoundPhotoMetadata';

const mocks = vi.hoisted(() => ({
  getWoundPhotoMetadataCache: vi.fn(),
  saveWoundPhotoMetadataCache: vi.fn(),
  getWoundPhotoMetadataFromMemoryCache: vi.fn(),
  loadWoundPhotoMetadataFromSupabase: vi.fn(),
  setWoundPhotoMetadataInMemoryCache: vi.fn(),
}));

vi.mock('../services/woundOfflineStore', () => ({
  getWoundPhotoMetadataCache: mocks.getWoundPhotoMetadataCache,
  saveWoundPhotoMetadataCache: mocks.saveWoundPhotoMetadataCache,
}));

vi.mock('../services/woundPhotoMetadataService', () => ({
  getWoundPhotoMetadataFromMemoryCache: mocks.getWoundPhotoMetadataFromMemoryCache,
  loadWoundPhotoMetadataFromSupabase: mocks.loadWoundPhotoMetadataFromSupabase,
  setWoundPhotoMetadataInMemoryCache: mocks.setWoundPhotoMetadataInMemoryCache,
}));

const photo = {
  id: 'photo-1',
  wound_id: 'wound-1',
  storage_path: 'wound-1/photo-1.jpg',
  captured_at: '2026-04-20T09:00:00.000Z',
} as const;

describe('useWoundPhotoMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWoundPhotoMetadataFromMemoryCache.mockReturnValue(undefined);
    mocks.getWoundPhotoMetadataCache.mockResolvedValue(null);
    mocks.saveWoundPhotoMetadataCache.mockResolvedValue(undefined);
    mocks.loadWoundPhotoMetadataFromSupabase.mockResolvedValue(null);
  });

  it('usa cache do IndexedDB e evita novo download', async () => {
    const metadata: WoundPhotoExifMetadata = { make: 'Apple', model: 'iPhone' };
    mocks.getWoundPhotoMetadataCache.mockResolvedValue({
      id: 'photo-meta:photo-1',
      photo_id: photo.id,
      wound_id: photo.wound_id,
      storage_path: photo.storage_path,
      captured_at: photo.captured_at,
      metadata,
      updatedAt: Date.now(),
    });

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.source).toBe('indexeddb');
    expect(mocks.loadWoundPhotoMetadataFromSupabase).not.toHaveBeenCalled();
  });

  it('em cache miss baixa/extrai e persiste no cache', async () => {
    const metadata: WoundPhotoExifMetadata = { make: 'Samsung', latitude: -23.5, longitude: -46.6 };
    mocks.loadWoundPhotoMetadataFromSupabase.mockResolvedValue(metadata);

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.source).toBe('supabase');
    expect(mocks.saveWoundPhotoMetadataCache).toHaveBeenCalledWith({
      photo_id: photo.id,
      wound_id: photo.wound_id,
      storage_path: photo.storage_path,
      captured_at: photo.captured_at,
      metadata,
    });
  });

  it('expõe erro quando download/extract falha', async () => {
    mocks.loadWoundPhotoMetadataFromSupabase.mockRejectedValue(new Error('erro de download'));

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toContain('erro de download');
  });

  it('reload força nova tentativa ignorando cache', async () => {
    mocks.getWoundPhotoMetadataFromMemoryCache.mockReturnValue({ make: 'Cached Device' });
    mocks.loadWoundPhotoMetadataFromSupabase.mockResolvedValue({ make: 'Fresh Device' });

    const { result } = renderHook(() => useWoundPhotoMetadata(photo));

    await waitFor(() => expect(result.current.source).toBe('memory'));

    act(() => {
      result.current.reload();
    });

    await waitFor(() => expect(mocks.loadWoundPhotoMetadataFromSupabase).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.source).toBe('supabase'));
  });
});
