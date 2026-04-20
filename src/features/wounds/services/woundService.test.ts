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

  return {
    mockFrom,
    mockSelect,
    mockInsert,
    mockSingle,
    mockStorageUpload,
    mockStorageRemove,
    mockCreateSignedUrl,
    mockStorageFrom,
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
});
