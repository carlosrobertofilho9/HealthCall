import { useCallback, useEffect, useState } from 'react';
import type { WoundPhoto, WoundPhotoMetadataResult, WoundPhotoMetadataSource, WoundPhotoMetadataStatus } from '../types';
import {
  getWoundPhotoMetadataCache,
  saveWoundPhotoMetadataCache,
} from '../services/woundOfflineStore';
import {
  getWoundPhotoMetadataFromMemoryCache,
  loadWoundPhotoMetadataFromSupabase,
  setWoundPhotoMetadataInMemoryCache,
} from '../services/woundPhotoMetadataService';

type PhotoInput = Pick<WoundPhoto, 'id' | 'wound_id' | 'storage_path' | 'captured_at'> | null | undefined;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Falha ao extrair metadados da foto.';
}

export function useWoundPhotoMetadata(photo: PhotoInput): WoundPhotoMetadataResult {
  const [status, setStatus] = useState<WoundPhotoMetadataStatus>('idle');
  const [metadata, setMetadata] = useState<WoundPhotoMetadataResult['metadata']>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<WoundPhotoMetadataSource>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const reload = useCallback(() => {
    setReloadNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!photo) {
      setStatus('idle');
      setMetadata(null);
      setError(null);
      setSource(null);
      return;
    }

    let isMounted = true;
    const bypassCache = reloadNonce > 0;

    // Check if metadata is already present in the photo object (hydrated by service)
    if (!bypassCache && (photo as any)?.metadata !== undefined) {
      setMetadata((photo as any).metadata);
      setSource('memory');
      setStatus((photo as any).metadata ? 'ready' : 'empty');
      return;
    }

    const run = async () => {
      setStatus('loading');
      setError(null);
      setSource(null);

      try {
        if (!bypassCache) {
          const memoryValue = getWoundPhotoMetadataFromMemoryCache(photo.id);
          if (memoryValue !== undefined) {
            if (!isMounted) return;
            setMetadata(memoryValue);
            setSource('memory');
            setStatus(memoryValue ? 'ready' : 'empty');
            return;
          }
        }

        if (!bypassCache) {
          const cached = await getWoundPhotoMetadataCache(photo.id);
          if (cached && cached.storage_path === photo.storage_path) {
            setWoundPhotoMetadataInMemoryCache(photo.id, cached.metadata);

            if (!isMounted) return;
            setMetadata(cached.metadata);
            setSource('indexeddb');
            setStatus(cached.metadata ? 'ready' : 'empty');
            return;
          }
        }

        const extracted = await loadWoundPhotoMetadataFromSupabase(photo.storage_path);
        setWoundPhotoMetadataInMemoryCache(photo.id, extracted);

        await saveWoundPhotoMetadataCache({
          photo_id: photo.id,
          wound_id: photo.wound_id,
          storage_path: photo.storage_path,
          captured_at: photo.captured_at,
          metadata: extracted,
        }).catch(() => undefined);

        if (!isMounted) return;
        setMetadata(extracted);
        setSource('supabase');
        setStatus(extracted ? 'ready' : 'empty');
      } catch (err) {
        if (!isMounted) return;
        setMetadata(null);
        setError(toErrorMessage(err));
        setSource(null);
        setStatus('error');
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [photo, reloadNonce]);

  return { status, metadata, error, source, reload };
}
