import {
  addWoundEntry,
  closeWoundCase,
  createWoundCase,
  createWoundPatient,
  deleteWoundPhoto,
  reopenWoundCase,
  uploadWoundPhotos,
} from './woundService';
import {
  addWoundConflict,
  createOfflineId,
  deleteWoundPhotoBlob,
  enqueueWoundMutation,
  getWoundPhotoBlob,
  listWoundMutations,
  removeWoundMutation,
  updateWoundMutation,
} from './woundOfflineStore';
import type { WoundConflict, WoundSyncMutation, WoundSyncMutationType } from '../types';

const BASE_RETRY_MS = 5000;
const MAX_RETRY_MS = 5 * 60 * 1000;

let syncInFlight = false;

export interface WoundSyncRunResult {
  processed: number;
  succeeded: number;
  failed: number;
  blocked: number;
  errors: string[];
}

function isVersionConflict(error: unknown): boolean {
  if (!error) return false;

  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : JSON.stringify(error);

  return message.toLowerCase().includes('conflito de versão') || message.includes('40001');
}

function computeRetryDelay(retryCount: number): number {
  return Math.min(BASE_RETRY_MS * 2 ** retryCount, MAX_RETRY_MS);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Erro desconhecido';
  }
}

export async function queueWoundMutation<TPayload>(
  type: WoundSyncMutationType,
  payload: TPayload,
  woundId?: string,
): Promise<WoundSyncMutation<TPayload>> {
  const mutation: WoundSyncMutation<TPayload> = {
    id: createOfflineId('wound-mutation'),
    type,
    payload,
    wound_id: woundId,
    createdAt: Date.now(),
    retryCount: 0,
    nextRetryAt: Date.now(),
    lastError: null,
  };

  await enqueueWoundMutation(mutation);
  return mutation;
}

async function executeMutation(mutation: WoundSyncMutation): Promise<void> {
  switch (mutation.type) {
    case 'create_patient': {
      await createWoundPatient(mutation.payload as Parameters<typeof createWoundPatient>[0]);
      return;
    }

    case 'create_wound': {
      await createWoundCase(mutation.payload as Parameters<typeof createWoundCase>[0]);
      return;
    }

    case 'add_entry': {
      await addWoundEntry(mutation.payload as Parameters<typeof addWoundEntry>[0]);
      return;
    }

    case 'close_wound': {
      await closeWoundCase(mutation.payload as Parameters<typeof closeWoundCase>[0]);
      return;
    }

    case 'reopen_wound': {
      await reopenWoundCase(mutation.payload as Parameters<typeof reopenWoundCase>[0]);
      return;
    }

    case 'upload_photo': {
      const payload = mutation.payload as {
        wound_id: string;
        entry_id?: string | null;
        photo_blob_id: string;
        file_name: string;
        mime_type: string;
        captured_at?: string;
        display_order?: number;
        description?: string;
        is_primary?: boolean;
      };

      const blob = await getWoundPhotoBlob(payload.photo_blob_id);
      if (!blob) {
        throw new Error(`Blob local não encontrado: ${payload.photo_blob_id}`);
      }

      const file = new File([blob.blob], payload.file_name || blob.fileName, {
        type: payload.mime_type || blob.mimeType,
      });

      await uploadWoundPhotos([
        {
          wound_id: payload.wound_id,
          entry_id: payload.entry_id ?? null,
          file,
          captured_at: payload.captured_at,
          display_order: payload.display_order,
          description: payload.description,
          is_primary: payload.is_primary,
        },
      ]);

      await deleteWoundPhotoBlob(payload.photo_blob_id);
      return;
    }

    case 'delete_photo': {
      const payload = mutation.payload as { photo_id: string };
      await deleteWoundPhoto(payload.photo_id);
      return;
    }

    default:
      throw new Error(`Tipo de mutação desconhecido: ${(mutation as WoundSyncMutation).type}`);
  }
}

export async function syncWoundMutationsOnce(maxItems = 20): Promise<WoundSyncRunResult> {
  if (syncInFlight) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      blocked: 0,
      errors: ['Sincronização já está em andamento.'],
    };
  }

  syncInFlight = true;

  const result: WoundSyncRunResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    blocked: 0,
    errors: [],
  };

  try {
    const now = Date.now();
    const queue = await listWoundMutations();
    const pending = queue
      .filter((item) => item.nextRetryAt <= now)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, maxItems);

    for (const mutation of pending) {
      result.processed += 1;

      try {
        await executeMutation(mutation);
        await removeWoundMutation(mutation.id);
        result.succeeded += 1;
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        if ((mutation.type === 'close_wound' || mutation.type === 'reopen_wound') && isVersionConflict(error)) {
          const payload = mutation.payload as Record<string, unknown>;
          const conflict: WoundConflict = {
            id: createOfflineId('wound-conflict'),
            mutationId: mutation.id,
            wound_id: mutation.wound_id || (payload.wound_id as string) || 'unknown',
            reason: errorMessage,
            serverVersion: null,
            expectedVersion: (payload.expected_version as number | undefined) ?? null,
            payload,
            createdAt: Date.now(),
            resolvedAt: null,
          };

          await addWoundConflict(conflict);
          await removeWoundMutation(mutation.id);
          result.blocked += 1;
          continue;
        }

        const nextRetryCount = mutation.retryCount + 1;
        const delay = computeRetryDelay(nextRetryCount);
        const updated: WoundSyncMutation = {
          ...mutation,
          retryCount: nextRetryCount,
          nextRetryAt: Date.now() + delay,
          lastError: errorMessage,
        };

        await updateWoundMutation(updated);
        result.failed += 1;
        result.errors.push(errorMessage);
      }
    }
  } finally {
    syncInFlight = false;
  }

  return result;
}
