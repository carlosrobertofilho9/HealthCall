import { useCallback, useEffect, useRef, useState } from 'react';
import type { WoundPhoto, WoundPhotoMetadataResult, WoundPhotoMetadataStatus } from '../types';
import { resolveWoundPhotoMetadataOnDemand } from '../services/woundPhotoMetadataService';
import { reverseGeocode } from '../services/geocodingService';

type PhotoInput =
  | Pick<
      WoundPhoto,
      | 'id'
      | 'wound_id'
      | 'storage_path'
      | 'captured_at'
      | 'created_at'
      | 'latitude'
      | 'longitude'
      | 'location_source'
      | 'location_captured_at'
      | 'metadata'
    >
  | null
  | undefined;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Falha ao extrair metadados da foto.';
}

function hasCoordinatesWithoutAddress(metadata: WoundPhoto['metadata']): metadata is NonNullable<WoundPhoto['metadata']> {
  return (
    !!metadata &&
    typeof metadata.latitude === 'number' &&
    typeof metadata.longitude === 'number' &&
    !metadata.address
  );
}

export function useWoundPhotoMetadata(photo: PhotoInput): WoundPhotoMetadataResult {
  const [status, setStatus] = useState<WoundPhotoMetadataStatus>('idle');
  const [metadata, setMetadata] = useState<WoundPhotoMetadataResult['metadata']>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<WoundPhotoMetadataResult['source']>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const handledReloadNonceRef = useRef(0);

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
    const bypassMemoryCache = reloadNonce > handledReloadNonceRef.current;
    if (bypassMemoryCache) {
      handledReloadNonceRef.current = reloadNonce;
    }

    // Se a foto já veio hidratada com metadata útil, usa imediatamente.
    if (!bypassMemoryCache && photo.metadata) {
      setMetadata(photo.metadata);
      setSource('memory');
      setStatus('ready');
      setError(null);

      // Enriquecimento preguiçoso para converter coordenadas em endereço legível.
      if (hasCoordinatesWithoutAddress(photo.metadata)) {
        void reverseGeocode(photo.metadata.latitude, photo.metadata.longitude)
          .then((address) => {
            if (!isMounted || !address) return;
            setMetadata((current) => {
              if (!current || current.address) return current;
              return { ...current, address };
            });
          })
          .catch(() => {
            // Falha de geocoding não deve quebrar o fluxo principal dos metadados.
          });
      }

      return;
    }

    const run = async () => {
      setStatus('loading');
      setError(null);
      setSource(null);

      try {
        const resolved = await resolveWoundPhotoMetadataOnDemand(photo, { bypassMemoryCache });

        if (!isMounted) return;
        setMetadata(resolved.metadata);
        setSource(resolved.source);
        setStatus(resolved.metadata ? 'ready' : 'empty');
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
