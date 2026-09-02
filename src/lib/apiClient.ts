import { localApiBase } from './runtime';

export type HealthCallEvent = {
  type: string;
  [key: string]: unknown;
};

export type LocalMediaKind = 'warnings' | 'prescriptions' | 'wounds' | 'avatars';

export type LocalMediaUpload = {
  storagePath: string;
  url: string;
  mimeType: string;
  size: number;
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${localApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Falha na comunicação local (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function localMediaUrl(storagePath: string): string {
  const [kind, ...rest] = storagePath.split('/');
  return `${localApiBase}/api/media/${encodeURIComponent(kind)}/${encodeURIComponent(rest.join('/'))}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function uploadLocalMedia(kind: LocalMediaKind, file: Blob, fileName = 'arquivo'): Promise<LocalMediaUpload> {
  const buffer = await file.arrayBuffer();
  return apiRequest<LocalMediaUpload>('/api/media', {
    method: 'POST',
    body: JSON.stringify({
      kind,
      fileName,
      mimeType: file.type || 'application/octet-stream',
      dataBase64: arrayBufferToBase64(buffer),
    }),
  });
}

export async function deleteLocalMedia(storagePath?: string | null): Promise<void> {
  if (!storagePath) return;
  await apiRequest<void>('/api/media', {
    method: 'DELETE',
    body: JSON.stringify({ storagePath }),
  });
}

export function subscribeHealthCallEvents(listener: (event: HealthCallEvent) => void): () => void {
  const source = new EventSource(`${localApiBase}/api/events`);
  source.onmessage = (message) => {
    try {
      listener(JSON.parse(message.data) as HealthCallEvent);
    } catch (error) {
      console.warn('[HealthCall] Evento local inválido', error);
    }
  };
  source.onerror = () => {
    // EventSource reconecta automaticamente após quedas breves de rede.
  };
  return () => source.close();
}

export function subscribeDomain(domain: string, listener: () => void): () => void {
  return subscribeHealthCallEvents((event) => {
    if (event.type === `${domain}-changed`) listener();
  });
}
