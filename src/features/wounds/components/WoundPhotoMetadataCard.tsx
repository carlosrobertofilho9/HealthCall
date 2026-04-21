import React from 'react';
import { Activity, AlertTriangle, CalendarClock, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import type { WoundPhoto, WoundPhotoMetadataSource } from '../types';
import { useWoundPhotoMetadata } from '../hooks/useWoundPhotoMetadata';
import { isLegacyPhotoCreatedAt } from '../services/woundPhotoMetadataService';

interface WoundPhotoMetadataCardProps {
  photo:
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
}

function normalizeDisplaySource(
  source: WoundPhotoMetadataSource,
  photoLocationSource?: WoundPhoto['location_source'],
): 'photo' | 'device' | null {
  if (source === 'exif_download') return 'photo';
  if (source === 'photo_row') {
    if (photoLocationSource === 'device') return 'device';
    return 'photo';
  }
  if (photoLocationSource === 'exif') return 'photo';
  if (photoLocationSource === 'device') return 'device';
  return null;
}

function sourceText(source: WoundPhotoMetadataSource): string | null {
  if (!source) return null;
  if (source === 'exif_download') return 'EXIF';
  if (source === 'photo_row') return 'Banco';
  return source;
}

const WoundPhotoMetadataCard: React.FC<WoundPhotoMetadataCardProps> = ({ photo }) => {
  const { status, metadata, error, source, reload } = useWoundPhotoMetadata(photo);

  const latitude = typeof metadata?.latitude === 'number' ? metadata.latitude : undefined;
  const longitude = typeof metadata?.longitude === 'number' ? metadata.longitude : undefined;
  const hasGps = typeof latitude === 'number' && typeof longitude === 'number';
  const displayAddress = metadata?.address;
  const mapUrl = hasGps ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : null;
  const locationSource = normalizeDisplaySource(source, photo?.location_source);
  const isLegacy = isLegacyPhotoCreatedAt(photo?.created_at ?? null);

  return (
    <section className="rounded-xl border border-border/50 bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Metadados da foto</h4>
        {sourceText(source) && <span className="text-[10px] font-semibold uppercase text-muted-foreground">{sourceText(source)}</span>}
      </div>

      {status === 'idle' && <p className="text-xs text-muted-foreground">Selecione uma foto para carregar metadados.</p>}

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Carregando metadados sob demanda...
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error || 'Falha ao extrair metadados.'}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={reload}>
            Tentar novamente
          </Button>
        </div>
      )}

      {status === 'empty' && (
        <p className="text-xs text-muted-foreground">
          {isLegacy
            ? 'Localização indisponível (legado).'
            : 'Metadados indisponíveis para esta imagem (sem EXIF de dispositivo ou localização).'}
        </p>
      )}

      {status === 'ready' && metadata && (
        <div className="space-y-2 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{[metadata.make, metadata.model].filter(Boolean).join(' ') || 'Dispositivo não informado'}</span>
          </div>

          {metadata.software && <p className="text-muted-foreground">Software: {metadata.software}</p>}

          {metadata.dateTimeOriginal && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>{metadata.dateTimeOriginal}</span>
            </div>
          )}

          {hasGps ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <a
                  href={mapUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 underline"
                >
                  Ver no Google Maps
                </a>
              </div>
              {displayAddress ? (
                <p className="text-[11px] text-muted-foreground">{displayAddress}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              )}
              {locationSource && (
                <p className="text-[11px] text-muted-foreground">
                  Origem: {locationSource === 'photo' ? 'GPS da foto' : 'GPS do dispositivo'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{isLegacy ? 'Localização indisponível (legado).' : 'GPS não disponível.'}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default WoundPhotoMetadataCard;
