const DB_NAME = 'healthcall-local-media';
const DB_VERSION = 1;
const STORE_NAME = 'warningMedia';
const LOCAL_WARNING_MEDIA_PREFIX = 'local-media:';
const REMOTE_WARNING_MEDIA_PREFIX = 'remote:';

type LocalWarningMediaRecord = {
  id: string;
  blob: Blob;
  contentType: string;
  fileName: string;
  size: number;
  createdAt: number;
  sourceUrl?: string | null;
  lastAccessedAt?: number;
};

const inFlightDownloads = new Map<string, Promise<LocalWarningMediaRecord | null>>();

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRemoteCacheId(url: string): string {
  return `${REMOTE_WARNING_MEDIA_PREFIX}${url}`;
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('Armazenamento local de mídia indisponível neste navegador.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir armazenamento local.'));
  });
}

async function getStore(mode: IDBTransactionMode): Promise<{
  db: IDBDatabase;
  store: IDBObjectStore;
  tx: IDBTransaction;
}> {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  return { db, store, tx };
}

function waitForTransaction(tx: IDBTransaction, db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Falha na transação de mídia local.'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error('Transação de mídia local abortada.'));
    };
  });
}

async function requestPersistentStorage(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // O navegador pode negar persistência; o IndexedDB continua funcionando.
  }
}

export function isLocalWarningMediaUrl(url?: string | null): boolean {
  return !!url && url.startsWith(LOCAL_WARNING_MEDIA_PREFIX);
}

export function getLocalWarningMediaId(url?: string | null): string | null {
  if (!isLocalWarningMediaUrl(url)) return null;
  return url.slice(LOCAL_WARNING_MEDIA_PREFIX.length);
}

function readRecord(id: string): Promise<LocalWarningMediaRecord | null> {
  return getStore('readonly').then(({ db, store, tx }) => (
    new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const record = (request.result || null) as LocalWarningMediaRecord | null;
        resolve(record);
      };

      request.onerror = () => {
        reject(request.error || new Error('Falha ao ler mídia local.'));
      };

      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Falha na leitura de mídia local.'));
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error || new Error('Leitura de mídia local abortada.'));
      };
    })
  ));
}

async function putRecord(record: LocalWarningMediaRecord): Promise<void> {
  const { db, store, tx } = await getStore('readwrite');
  store.put(record);
  await waitForTransaction(tx, db);
}

async function deleteRecord(id: string): Promise<void> {
  const { db, store, tx } = await getStore('readwrite');
  store.delete(id);
  await waitForTransaction(tx, db);
}

export async function saveLocalWarningMedia(file: File): Promise<string> {
  await requestPersistentStorage();

  const id = createId();
  const record: LocalWarningMediaRecord = {
    id,
    blob: file,
    contentType: file.type || 'application/octet-stream',
    fileName: file.name,
    size: file.size,
    createdAt: Date.now(),
    sourceUrl: null,
    lastAccessedAt: Date.now(),
  };

  await putRecord(record);

  return `${LOCAL_WARNING_MEDIA_PREFIX}${id}`;
}

export async function cacheRemoteWarningMedia(
  sourceUrl: string,
  blob: Blob,
  fileName?: string
): Promise<LocalWarningMediaRecord> {
  await requestPersistentStorage();

  const record: LocalWarningMediaRecord = {
    id: getRemoteCacheId(sourceUrl),
    blob,
    contentType: blob.type || 'application/octet-stream',
    fileName: fileName || sourceUrl.split('/').pop() || 'warning-media',
    size: blob.size,
    createdAt: Date.now(),
    sourceUrl,
    lastAccessedAt: Date.now(),
  };

  await putRecord(record);
  return record;
}

export async function getLocalWarningMedia(url: string): Promise<LocalWarningMediaRecord | null> {
  const localId = getLocalWarningMediaId(url);
  const id = localId || getRemoteCacheId(url);
  return readRecord(id);
}

export async function resolveWarningMedia(url: string): Promise<LocalWarningMediaRecord | null> {
  const cached = await getLocalWarningMedia(url);
  if (cached) {
    cached.lastAccessedAt = Date.now();
    putRecord(cached).catch(() => undefined);
    return cached;
  }

  if (isLocalWarningMediaUrl(url)) return null;

  const existingDownload = inFlightDownloads.get(url);
  if (existingDownload) return existingDownload;

  const download = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Falha ao baixar mídia do aviso: ${response.status}`);
      }

      const blob = await response.blob();
      return cacheRemoteWarningMedia(url, blob);
    })
    .catch(() => null)
    .finally(() => {
      inFlightDownloads.delete(url);
    });

  inFlightDownloads.set(url, download);
  return download;
}

export async function deleteLocalWarningMedia(url: string): Promise<void> {
  const localId = getLocalWarningMediaId(url);
  const id = localId || getRemoteCacheId(url);

  await deleteRecord(id);
}
