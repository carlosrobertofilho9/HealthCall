import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWoundPatient, getSignedWoundPhotoUrl, uploadWoundPhotos } from './woundService';

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockIs = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();

  const mockChain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    is: mockIs,
    order: mockOrder,
    single: mockSingle,
  };

  mockSelect.mockReturnValue(mockChain);
  mockInsert.mockReturnValue(mockChain);
  mockUpdate.mockReturnValue(mockChain);
  mockDelete.mockReturnValue(mockChain);
  mockEq.mockReturnValue(mockChain);
  mockIs.mockReturnValue(mockChain);
  mockOrder.mockReturnValue(mockChain);

  const mockFrom = vi.fn(() => mockChain);

  const mockStorageUpload = vi.fn();
  const mockStorageRemove = vi.fn();
  const mockCreateSignedUrl = vi.fn();
  const mockStorageFrom = vi.fn(() => ({
    upload: mockStorageUpload,
    remove: mockStorageRemove,
    createSignedUrl: mockCreateSignedUrl,
  }));

  const mockResizeAndCompressImage = vi.fn();
  const mockSaveWoundPhotoCache = vi.fn();

  return {
    mockFrom,
    mockInsert,
    mockSingle,
    mockStorageUpload,
    mockCreateSignedUrl,
    mockStorageFrom,
    mockResizeAndCompressImage,
    mockSaveWoundPhotoCache,
  };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mocks.mockFrom,
    storage: {
      from: mocks.mockStorageFrom,
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/imageUtils', () => ({
  resizeAndCompressImage: mocks.mockResizeAndCompressImage,
}));

vi.mock('./woundOfflineStore', () => ({
  getWoundPhotoCache: vi.fn(),
  saveWoundPhotoCache: mocks.mockSaveWoundPhotoCache,
  deleteWoundPhotoCache: vi.fn(),
}));

describe('woundService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockSingle.mockResolvedValue({
      data: {
        id: 'patient-1',
        full_name: 'Maria',
        document_type: 'CPF',
        document_value: '123',
      },
      error: null,
    });

    mocks.mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/photo' },
      error: null,
    });

    mocks.mockStorageUpload.mockResolvedValue({ error: null });
    mocks.mockResizeAndCompressImage.mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' }));
    mocks.mockSaveWoundPhotoCache.mockResolvedValue(undefined);
  });

  it('cria paciente de wound tracking com sucesso', async () => {
    const result = await createWoundPatient({
      full_name: 'Maria',
      document_type: 'CPF',
      document_value: '12345678900',
    });

    expect(result.id).toBe('patient-1');
    expect(mocks.mockFrom).toHaveBeenCalledWith('wound_patients');
  });

  it('gera URL assinada para foto de ferida', async () => {
    const signedUrl = await getSignedWoundPhotoUrl('wound-1/photo.jpg');
    expect(signedUrl).toBe('https://signed.example/photo');
    expect(mocks.mockStorageFrom).toHaveBeenCalledWith('wound-photos');
  });

  it('valida upload de foto e recusa arquivo não-imagem', async () => {
    const invalidFile = new File(['test'], 'doc.txt', { type: 'text/plain' });

    await expect(
      uploadWoundPhotos([
        {
          wound_id: 'wound-1',
          file: invalidFile,
        },
      ]),
    ).rejects.toThrow('Apenas imagens são permitidas');
  });

  it('sobe arquivo original para tipos web-safe sem converter', async () => {
    const file = new File(['pngdata'], 'lesao.png', { type: 'image/png' });
    mocks.mockSingle.mockResolvedValueOnce({
      data: {
        id: 'photo-1',
        wound_id: 'wound-1',
        storage_path: 'wound-1/photo-1.png',
      },
      error: null,
    });

    await uploadWoundPhotos([
      {
        wound_id: 'wound-1',
        file,
      },
    ]);

    expect(mocks.mockResizeAndCompressImage).not.toHaveBeenCalled();
    expect(mocks.mockStorageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/\.png$/),
      file,
      expect.objectContaining({ contentType: 'image/png' }),
    );

    const insertPayload = mocks.mockInsert.mock.calls[0][0];
    expect(insertPayload).not.toHaveProperty('latitude');
    expect(insertPayload).not.toHaveProperty('longitude');
    expect(insertPayload).not.toHaveProperty('location_source');
    expect(insertPayload).not.toHaveProperty('location_captured_at');
  });

  it('converte formato não web-safe para JPEG antes do upload', async () => {
    const file = new File(['rawheic'], 'lesao.heic', { type: 'image/heic' });
    const converted = new Blob(['jpegdata'], { type: 'image/jpeg' });
    mocks.mockResizeAndCompressImage.mockResolvedValueOnce(converted);
    mocks.mockSingle.mockResolvedValueOnce({
      data: {
        id: 'photo-2',
        wound_id: 'wound-1',
        storage_path: 'wound-1/photo-2.jpg',
      },
      error: null,
    });

    await uploadWoundPhotos([
      {
        wound_id: 'wound-1',
        file,
      },
    ]);

    expect(mocks.mockResizeAndCompressImage).toHaveBeenCalledWith(file);
    expect(mocks.mockStorageUpload).toHaveBeenCalledWith(
      expect.stringMatching(/\.jpg$/),
      converted,
      expect.objectContaining({ contentType: 'image/jpeg' }),
    );
  });

  it('faz fallback sem colunas de geolocalização quando schema antigo rejeita campos legados', async () => {
    const file = new File(['jpeg'], 'lesao.jpg', { type: 'image/jpeg' });
    mocks.mockSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST204',
          message: "Could not find the 'latitude' column of 'wound_photos' in the schema cache",
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'photo-legacy-schema',
          wound_id: 'wound-1',
          storage_path: 'wound-1/photo-legacy-schema.jpg',
        },
        error: null,
      });

    const uploaded = await uploadWoundPhotos([
      {
        wound_id: 'wound-1',
        file,
        latitude: -23.55,
        longitude: -46.63,
        location_source: 'device',
        location_captured_at: '2026-04-21T10:00:00.000Z',
      },
    ]);

    expect(uploaded).toHaveLength(1);
    expect(mocks.mockInsert).toHaveBeenCalledTimes(2);
    expect(mocks.mockInsert.mock.calls[0][0]).toMatchObject({
      latitude: -23.55,
      longitude: -46.63,
      location_source: 'device',
      location_captured_at: '2026-04-21T10:00:00.000Z',
    });
    expect(mocks.mockInsert.mock.calls[1][0]).not.toHaveProperty('latitude');
    expect(mocks.mockInsert.mock.calls[1][0]).not.toHaveProperty('longitude');
    expect(mocks.mockInsert.mock.calls[1][0]).not.toHaveProperty('location_source');
    expect(mocks.mockInsert.mock.calls[1][0]).not.toHaveProperty('location_captured_at');
  });
});
