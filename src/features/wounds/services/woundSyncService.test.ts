import { beforeEach, describe, expect, it, vi } from 'vitest';

const serviceMocks = vi.hoisted(() => ({
  createWoundPatient: vi.fn(),
  createWoundCase: vi.fn(),
  addWoundEntry: vi.fn(),
  closeWoundCase: vi.fn(),
  reopenWoundCase: vi.fn(),
  uploadWoundPhotos: vi.fn(),
  deleteWoundPhoto: vi.fn(),
}));

const storeMocks = vi.hoisted(() => ({
  listWoundMutations: vi.fn(),
  removeWoundMutation: vi.fn(),
  updateWoundMutation: vi.fn(),
  enqueueWoundMutation: vi.fn(),
  createOfflineId: vi.fn(() => 'offline-id'),
  addWoundConflict: vi.fn(),
  getWoundPhotoBlob: vi.fn(),
  deleteWoundPhotoBlob: vi.fn(),
}));

vi.mock('./woundService', () => serviceMocks);
vi.mock('./woundOfflineStore', () => storeMocks);

import { syncWoundMutationsOnce } from './woundSyncService';

describe('woundSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.listWoundMutations.mockResolvedValue([]);
  });

  it('processa fila FIFO e remove mutações com sucesso', async () => {
    storeMocks.listWoundMutations.mockResolvedValue([
      {
        id: 'm1',
        type: 'create_patient',
        payload: { full_name: 'Maria', document_type: 'CPF', document_value: '123' },
        createdAt: Date.now() - 1000,
        retryCount: 0,
        nextRetryAt: Date.now() - 100,
        lastError: null,
      },
    ]);

    const result = await syncWoundMutationsOnce();

    expect(result.succeeded).toBe(1);
    expect(serviceMocks.createWoundPatient).toHaveBeenCalledTimes(1);
    expect(storeMocks.removeWoundMutation).toHaveBeenCalledWith('m1');
  });

  it('bloqueia mutação de fechamento com conflito de versão', async () => {
    storeMocks.listWoundMutations.mockResolvedValue([
      {
        id: 'm-close',
        type: 'close_wound',
        payload: { wound_id: 'w1', expected_version: 4 },
        wound_id: 'w1',
        createdAt: Date.now() - 200,
        retryCount: 0,
        nextRetryAt: Date.now() - 10,
        lastError: null,
      },
    ]);

    serviceMocks.closeWoundCase.mockRejectedValue(new Error('Conflito de versão: esperado 4, encontrado 5'));

    const result = await syncWoundMutationsOnce();

    expect(result.blocked).toBe(1);
    expect(storeMocks.addWoundConflict).toHaveBeenCalledTimes(1);
    expect(storeMocks.removeWoundMutation).toHaveBeenCalledWith('m-close');
  });

  it('aplica retry exponencial quando erro é transitório', async () => {
    storeMocks.listWoundMutations.mockResolvedValue([
      {
        id: 'm-entry',
        type: 'add_entry',
        payload: { wound_id: 'w1' },
        wound_id: 'w1',
        createdAt: Date.now() - 200,
        retryCount: 1,
        nextRetryAt: Date.now() - 10,
        lastError: null,
      },
    ]);

    serviceMocks.addWoundEntry.mockRejectedValue(new Error('Network Error'));

    const result = await syncWoundMutationsOnce();

    expect(result.failed).toBe(1);
    expect(storeMocks.updateWoundMutation).toHaveBeenCalledTimes(1);
    const updated = storeMocks.updateWoundMutation.mock.calls[0][0];
    expect(updated.retryCount).toBe(2);
    expect(updated.nextRetryAt).toBeGreaterThan(Date.now());
  });
});
