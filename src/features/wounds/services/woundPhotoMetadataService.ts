import * as ExifReader from 'exifreader';
import { supabase } from '@/lib/supabaseClient';
import type { WoundPhotoExifMetadata } from '../types';

const WOUND_STORAGE_BUCKET = 'wound-photos';

const metadataMemoryCache = new Map<string, WoundPhotoExifMetadata | null>();

type ExifTagLike = {
  value?: unknown;
  computed?: unknown;
  description?: unknown;
};

function parseRational(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value) && value.length >= 2) {
    const numerator = Number(value[0]);
    const denominator = Number(value[1]);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  if (typeof value === 'object' && value != null) {
    const maybe = value as { numerator?: number; denominator?: number };
    if (
      typeof maybe.numerator === 'number' &&
      Number.isFinite(maybe.numerator) &&
      typeof maybe.denominator === 'number' &&
      Number.isFinite(maybe.denominator) &&
      maybe.denominator !== 0
    ) {
      return maybe.numerator / maybe.denominator;
    }
  }

  return null;
}

function parseDms(tag?: ExifTagLike): [number, number, number] | null {
  if (!tag) return null;

  const source = tag.computed ?? tag.value;
  if (!Array.isArray(source) || source.length < 3) return null;

  const [rawDeg, rawMin, rawSec] = source as [unknown, unknown, unknown];
  const deg = parseRational(rawDeg);
  const min = parseRational(rawMin);
  const sec = parseRational(rawSec);

  if (deg == null || min == null || sec == null) return null;
  return [deg, min, sec];
}

function parseRef(tag?: ExifTagLike): string | undefined {
  if (!tag) return undefined;

  const source = tag.computed ?? tag.value ?? tag.description;
  if (typeof source === 'string') return source.trim().toUpperCase();

  if (Array.isArray(source) && source.length > 0 && typeof source[0] === 'string') {
    return source[0].trim().toUpperCase();
  }

  return undefined;
}

function parseCoordinate(valueTag?: ExifTagLike, refTag?: ExifTagLike): number | undefined {
  const dms = parseDms(valueTag);
  if (!dms) return undefined;

  const [deg, min, sec] = dms;
  const decimal = Math.abs(deg) + min / 60 + sec / 3600;
  const ref = parseRef(refTag);

  if (ref === 'S' || ref === 'W') return -decimal;
  return decimal;
}

function parseString(tag?: ExifTagLike): string | undefined {
  if (!tag) return undefined;

  if (typeof tag.description === 'string' && tag.description.trim()) {
    return tag.description.trim();
  }

  const source = tag.computed ?? tag.value;
  if (typeof source === 'string' && source.trim()) {
    return source.trim();
  }

  if (Array.isArray(source) && source.length > 0 && typeof source[0] === 'string' && source[0].trim()) {
    return source[0].trim();
  }

  return undefined;
}

function hasUsefulMetadata(metadata: WoundPhotoExifMetadata): boolean {
  return (
    Boolean(metadata.make) ||
    Boolean(metadata.model) ||
    Boolean(metadata.software) ||
    Boolean(metadata.dateTimeOriginal) ||
    (typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number')
  );
}

export async function downloadWoundPhotoBlob(storagePath: string): Promise<Blob> {
  const { data, error } = await supabase
    .storage
    .from(WOUND_STORAGE_BUCKET)
    .download(storagePath);

  if (error) throw error;
  if (!data) throw new Error('Não foi possível baixar foto para extração de metadados.');

  return data;
}

export async function extractWoundPhotoMetadata(blob: Blob): Promise<WoundPhotoExifMetadata | null> {
  const buffer = typeof blob.arrayBuffer === 'function'
    ? await blob.arrayBuffer()
    : await new Response(blob).arrayBuffer();
  const tags = ExifReader.load(buffer) as Record<string, ExifTagLike> | null;

  if (!tags) return null;

  const metadata: WoundPhotoExifMetadata = {
    make: parseString(tags.Make),
    model: parseString(tags.Model),
    software: parseString(tags.Software),
    dateTimeOriginal: parseString(tags.DateTimeOriginal),
    latitude: parseCoordinate(tags.GPSLatitude, tags.GPSLatitudeRef),
    longitude: parseCoordinate(tags.GPSLongitude, tags.GPSLongitudeRef),
  };

  return hasUsefulMetadata(metadata) ? metadata : null;
}

export async function loadWoundPhotoMetadataFromSupabase(storagePath: string): Promise<WoundPhotoExifMetadata | null> {
  const blob = await downloadWoundPhotoBlob(storagePath);
  return extractWoundPhotoMetadata(blob);
}

export function getWoundPhotoMetadataFromMemoryCache(photoId: string): WoundPhotoExifMetadata | null | undefined {
  return metadataMemoryCache.get(photoId);
}

export function setWoundPhotoMetadataInMemoryCache(photoId: string, metadata: WoundPhotoExifMetadata | null): void {
  metadataMemoryCache.set(photoId, metadata);
}

export function deleteWoundPhotoMetadataFromMemoryCache(photoId: string): void {
  metadataMemoryCache.delete(photoId);
}

export function clearWoundPhotoMetadataMemoryCache(): void {
  metadataMemoryCache.clear();
}
