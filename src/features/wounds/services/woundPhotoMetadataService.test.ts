import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as ExifReader from 'exifreader';
import {
  LEGACY_GEO_CUTOFF_ISO,
  clearWoundPhotoMetadataMemoryCache,
  downloadWoundPhotoBlob,
  resolveWoundPhotoMetadataOnDemand,
} from './woundPhotoMetadataService';

const mocks = vi.hoisted(() => {
  const mockStorageDownload = vi.fn();
  const mockStorageFrom = vi.fn(() => ({
    download: mockStorageDownload,
  }));

  const mockReverseGeocode = vi.fn();

  return {
    mockStorageDownload,
    mockStorageFrom,
    mockReverseGeocode,
  };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: mocks.mockStorageFrom,
    },
  },
}));

vi.mock('exifreader', () => ({
  load: vi.fn(),
}));

vi.mock('./geocodingService', () => ({
  reverseGeocode: mocks.mockReverseGeocode,
}));

const basePhoto = {
  id: 'photo-1',
  wound_id: 'wound-1',
  storage_path: 'wound-1/photo-1.jpg',
  captured_at: '2026-04-21T10:00:00.000Z',
  created_at: '2026-04-21T10:00:00.000Z',
} as const;

describe('woundPhotoMetadataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearWoundPhotoMetadataMemoryCache();
    mocks.mockReverseGeocode.mockResolvedValue('Rua Teste, Centro, São Paulo');
    mocks.mockStorageDownload.mockResolvedValue({
      data: new Blob(['img'], { type: 'image/jpeg' }),
      error: null,
    });
  });

  it('faz download de blob no bucket correto', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' });
    mocks.mockStorageDownload.mockResolvedValue({ data: blob, error: null });

    const result = await downloadWoundPhotoBlob('w1/photo.jpg');

    expect(mocks.mockStorageFrom).toHaveBeenCalledWith('wound-photos');
    expect(mocks.mockStorageDownload).toHaveBeenCalledWith('w1/photo.jpg');
    expect(result).toBe(blob);
  });

  it('prioriza coordenadas já presentes na linha da foto', async () => {
    const resolved = await resolveWoundPhotoMetadataOnDemand({
      ...basePhoto,
      latitude: -23.55,
      longitude: -46.63,
      location_source: 'device',
      location_captured_at: '2026-04-21T09:00:00.000Z',
    });

    expect(resolved.source).toBe('photo_row');
    expect(resolved.metadata?.latitude).toBeCloseTo(-23.55, 6);
    expect(resolved.metadata?.longitude).toBeCloseTo(-46.63, 6);
    expect(mocks.mockStorageDownload).not.toHaveBeenCalled();
  });

  it('usa EXIF baixado quando disponível', async () => {
    vi.mocked(ExifReader.load).mockReturnValue({
      GPSLatitude: { value: [[23, 1], [30, 1], [0, 1]] },
      GPSLatitudeRef: { value: ['S'] },
      GPSLongitude: { value: [[46, 1], [37, 1], [30, 1]] },
      GPSLongitudeRef: { value: ['W'] },
      Make: { description: 'Apple' },
      Model: { description: 'iPhone 14' },
    } as never);

    const resolved = await resolveWoundPhotoMetadataOnDemand(basePhoto);

    expect(resolved.source).toBe('exif_download');
    expect(resolved.metadata?.make).toBe('Apple');
    expect(resolved.metadata?.latitude).toBeCloseTo(-23.5, 6);
  });

  it('retorna EXIF mesmo sem coordenadas (sem fallback de GPS do dispositivo)', async () => {
    vi.mocked(ExifReader.load).mockReturnValue({
      Make: { description: 'Apple' },
      Model: { description: 'iPhone 15' },
    } as never);

    const resolved = await resolveWoundPhotoMetadataOnDemand(basePhoto);

    expect(resolved.source).toBe('exif_download');
    expect(resolved.metadata?.make).toBe('Apple');
    expect(resolved.metadata?.latitude).toBeUndefined();
    expect(resolved.metadata?.longitude).toBeUndefined();
  });

  it('retorna vazio quando EXIF não possui dados úteis', async () => {
    vi.mocked(ExifReader.load).mockReturnValue({} as never);

    const resolved = await resolveWoundPhotoMetadataOnDemand({
      ...basePhoto,
      created_at: '2026-04-20T23:59:59.000Z',
    });

    expect(resolved.metadata).toBeNull();
    expect(resolved.source).toBeNull();
  });

  it('mantém data de corte legada configurada', () => {
    expect(LEGACY_GEO_CUTOFF_ISO).toBe('2026-04-21T00:00:00.000Z');
  });
});
