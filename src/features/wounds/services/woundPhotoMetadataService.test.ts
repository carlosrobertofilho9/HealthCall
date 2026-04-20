import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as ExifReader from 'exifreader';
import {
  clearWoundPhotoMetadataMemoryCache,
  downloadWoundPhotoBlob,
  extractWoundPhotoMetadata,
  loadWoundPhotoMetadataFromSupabase,
} from './woundPhotoMetadataService';

const mocks = vi.hoisted(() => {
  const mockStorageDownload = vi.fn();
  const mockStorageFrom = vi.fn(() => ({
    download: mockStorageDownload,
  }));

  return {
    mockStorageDownload,
    mockStorageFrom,
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

describe('woundPhotoMetadataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearWoundPhotoMetadataMemoryCache();
  });

  it('faz download de blob no bucket correto', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' });
    mocks.mockStorageDownload.mockResolvedValue({ data: blob, error: null });

    const result = await downloadWoundPhotoBlob('w1/photo.jpg');

    expect(mocks.mockStorageFrom).toHaveBeenCalledWith('wound-photos');
    expect(mocks.mockStorageDownload).toHaveBeenCalledWith('w1/photo.jpg');
    expect(result).toBe(blob);
  });

  it('converte GPS com referência S/W para coordenadas negativas', async () => {
    vi.mocked(ExifReader.load).mockReturnValue({
      GPSLatitude: { value: [[23, 1], [30, 1], [0, 1]] },
      GPSLatitudeRef: { value: ['S'] },
      GPSLongitude: { value: [[46, 1], [37, 1], [30, 1]] },
      GPSLongitudeRef: { value: ['W'] },
      Make: { description: 'Apple' },
      Model: { description: 'iPhone 14' },
    } as never);

    const metadata = await extractWoundPhotoMetadata(new Blob(['img'], { type: 'image/jpeg' }));

    expect(metadata?.make).toBe('Apple');
    expect(metadata?.model).toBe('iPhone 14');
    expect(metadata?.latitude).toBeCloseTo(-23.5, 6);
    expect(metadata?.longitude).toBeCloseTo(-46.625, 6);
  });

  it('retorna null quando não há EXIF útil', async () => {
    vi.mocked(ExifReader.load).mockReturnValue({
      ImageWidth: { description: '1000', value: 1000 },
    } as never);

    const metadata = await extractWoundPhotoMetadata(new Blob(['img'], { type: 'image/jpeg' }));

    expect(metadata).toBeNull();
  });

  it('baixa do Supabase e extrai EXIF em sequência', async () => {
    mocks.mockStorageDownload.mockResolvedValue({
      data: new Blob(['img'], { type: 'image/jpeg' }),
      error: null,
    });
    vi.mocked(ExifReader.load).mockReturnValue({
      Make: { description: 'Samsung' },
      Model: { description: 'Galaxy' },
    } as never);

    const metadata = await loadWoundPhotoMetadataFromSupabase('w1/photo.jpg');

    expect(mocks.mockStorageDownload).toHaveBeenCalledWith('w1/photo.jpg');
    expect(metadata).toMatchObject({ make: 'Samsung', model: 'Galaxy' });
  });
});
