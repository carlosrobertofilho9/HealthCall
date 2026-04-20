import type { WoundConflict, WoundPhotoExifMetadata, WoundSyncMutation } from '../types';

const DB_NAME = 'healthcall-wound-offline';
const DB_VERSION = 3;

export const STORES = {
  drafts: 'woundDrafts',
  queue: 'woundMutationsQueue',
  photoBlobs: 'woundPhotoBlobs',
  conflicts: 'woundConflicts',
  photoMetadata: 'woundPhotoMetadata',
  photoCache: 'woundPhotoCache', // New store for caching downloaded photos
} as const;

type WoundDraftRecord = {
  id: string;
  wound_id: string;
  form: Record<string, unknown>;
  updatedAt: number;
};

type WoundPhotoBlobRecord = {
  id: string;
  wound_id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
};

export type WoundPhotoMetadataCacheRecord = {
  id: string;
  photo_id: string;
  wound_id: string;
  storage_path: string;
  captured_at: string;
  metadata: WoundPhotoExifMetadata | null;
  updatedAt: number;
};

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponível neste navegador.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.drafts)) {
        db.createObjectStore(STORES.drafts, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.queue)) {
        db.createObjectStore(STORES.queue, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.photoBlobs)) {
        db.createObjectStore(STORES.photoBlobs, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.conflicts)) {
        db.createObjectStore(STORES.conflicts, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.photoMetadata)) {
        db.createObjectStore(STORES.photoMetadata, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.photoCache)) {
        db.createObjectStore(STORES.photoCache, { keyPath: 'photo_id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir banco local de curativos.'));
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = runner(store);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Falha na operação do IndexedDB.'));
    };

    tx.oncomplete = () => db.close();
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error('Transação abortada no IndexedDB.'));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Erro de transação no IndexedDB.'));
    };
  });
}

async function withStoreCursor<T>(
  storeName: string,
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    runner(store, resolve, reject);

    tx.oncomplete = () => db.close();
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error('Transação abortada no IndexedDB.'));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Erro de transação no IndexedDB.'));
    };
  });
}

export function createOfflineId(prefix = 'offline'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function saveWoundDraft(woundId: string, form: Record<string, unknown>): Promise<void> {
  const payload: WoundDraftRecord = {
    id: `draft:${woundId}`,
    wound_id: woundId,
    form,
    updatedAt: Date.now(),
  };

  await withStore(STORES.drafts, 'readwrite', (store) => store.put(payload));
}

export async function getWoundDraft(woundId: string): Promise<WoundDraftRecord | null> {
  const result = await withStore<WoundDraftRecord | undefined>(
    STORES.drafts,
    'readonly',
    (store) => store.get(`draft:${woundId}`),
  );

  return result ?? null;
}

export async function deleteWoundDraft(woundId: string): Promise<void> {
  await withStore(STORES.drafts, 'readwrite', (store) => store.delete(`draft:${woundId}`));
}

export async function enqueueWoundMutation<TPayload>(mutation: WoundSyncMutation<TPayload>): Promise<void> {
  await withStore(STORES.queue, 'readwrite', (store) => store.put(mutation));
}

export async function listWoundMutations(): Promise<WoundSyncMutation[]> {
  return withStoreCursor<WoundSyncMutation[]>(STORES.queue, 'readonly', (store, resolve, reject) => {
    const items: WoundSyncMutation[] = [];
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(items.sort((a, b) => a.createdAt - b.createdAt));
        return;
      }

      items.push(cursor.value as WoundSyncMutation);
      cursor.continue();
    };

    request.onerror = () => reject(request.error || new Error('Falha ao listar fila de sincronização.'));
  });
}

export async function updateWoundMutation(mutation: WoundSyncMutation): Promise<void> {
  await withStore(STORES.queue, 'readwrite', (store) => store.put(mutation));
}

export async function removeWoundMutation(mutationId: string): Promise<void> {
  await withStore(STORES.queue, 'readwrite', (store) => store.delete(mutationId));
}

export async function countPendingMutations(): Promise<number> {
  const list = await listWoundMutations();
  return list.length;
}

export async function saveWoundPhotoBlob(record: WoundPhotoBlobRecord): Promise<void> {
  await withStore(STORES.photoBlobs, 'readwrite', (store) => store.put(record));
}

export async function getWoundPhotoBlob(id: string): Promise<WoundPhotoBlobRecord | null> {
  const result = await withStore<WoundPhotoBlobRecord | undefined>(STORES.photoBlobs, 'readonly', (store) => store.get(id));
  return result ?? null;
}

export async function deleteWoundPhotoBlob(id: string): Promise<void> {
  await withStore(STORES.photoBlobs, 'readwrite', (store) => store.delete(id));
}

export async function saveWoundPhotoMetadataCache(input: Omit<WoundPhotoMetadataCacheRecord, 'id' | 'updatedAt'>): Promise<void> {
  const payload: WoundPhotoMetadataCacheRecord = {
    id: `photo-meta:${input.photo_id}`,
    ...input,
    updatedAt: Date.now(),
  };

  await withStore(STORES.photoMetadata, 'readwrite', (store) => store.put(payload));
}

export async function getWoundPhotoMetadataCache(photoId: string): Promise<WoundPhotoMetadataCacheRecord | null> {
  const result = await withStore<WoundPhotoMetadataCacheRecord | undefined>(
    STORES.photoMetadata,
    'readonly',
    (store) => store.get(`photo-meta:${photoId}`),
  );

  return result ?? null;
}

export async function deleteWoundPhotoMetadataCache(photoId: string): Promise<void> {
  await withStore(STORES.photoMetadata, 'readwrite', (store) => store.delete(`photo-meta:${photoId}`));
}

export async function addWoundConflict(conflict: WoundConflict): Promise<void> {
  await withStore(STORES.conflicts, 'readwrite', (store) => store.put(conflict));
}

export async function listWoundConflicts(includeResolved = false): Promise<WoundConflict[]> {
  const rows = await withStoreCursor<WoundConflict[]>(STORES.conflicts, 'readonly', (store, resolve, reject) => {
    const items: WoundConflict[] = [];
    const request = store.openCursor();

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(items);
        return;
      }

      items.push(cursor.value as WoundConflict);
      cursor.continue();
    };

    request.onerror = () => reject(request.error || new Error('Falha ao listar conflitos.'));
  });

  return rows
    .filter((item) => includeResolved || item.resolvedAt == null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function resolveWoundConflict(conflictId: string): Promise<void> {
  const existing = await withStore<WoundConflict | undefined>(STORES.conflicts, 'readonly', (store) => store.get(conflictId));
  if (!existing) return;

  const updated: WoundConflict = {
    ...existing,
    resolvedAt: Date.now(),
  };

  await withStore(STORES.conflicts, 'readwrite', (store) => store.put(updated));
}

export async function saveWoundPhotoCache(photoId: string, blob: Blob): Promise<void> {
  await withStore(STORES.photoCache, 'readwrite', (store) => 
    store.put({
      photo_id: photoId,
      blob,
      cachedAt: Date.now(),
    })
  );
}

export async function getWoundPhotoCache(photoId: string): Promise<Blob | null> {
  const result = await withStore<{ photo_id: string; blob: Blob } | undefined>(
    STORES.photoCache, 
    'readonly', 
    (store) => store.get(photoId)
  );
  return result?.blob ?? null;
}

export async function deleteWoundPhotoCache(photoId: string): Promise<void> {
  await withStore(STORES.photoCache, 'readwrite', (store) => store.delete(photoId));
}

export async function clearWoundPhotoCache(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.photoCache, 'readwrite');
    const store = tx.objectStore(STORES.photoCache);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
