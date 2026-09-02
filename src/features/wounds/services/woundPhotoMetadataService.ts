import * as ExifReader from 'exifreader';
import { localMediaUrl } from '@/lib/apiClient';
import type { WoundPhoto, WoundPhotoExifMetadata, WoundPhotoMetadataSource } from '../types';
import { reverseGeocode } from './geocodingService';

export const LEGACY_GEO_CUTOFF_ISO = '2026-04-21T00:00:00.000Z';
const LEGACY_GEO_CUTOFF_MS = Date.parse(LEGACY_GEO_CUTOFF_ISO);

const metadataMemoryCache = new Map<string, WoundPhotoExifMetadata | null>();
const metadataSourceMemoryCache = new Map<string, WoundPhotoMetadataSource>();

type ExifTagLike = {
  value?: unknown;
  computed?: unknown;
  description?: unknown;
};

type PhotoMetadataTarget = Pick<
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
>;

export interface ResolveWoundPhotoMetadataResult {
  metadata: WoundPhotoExifMetadata | null;
  source: WoundPhotoMetadataSource;
}

function parseRational(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

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
      typeof maybe.numerator === 'number' && Number.isFinite(maybe.numerator) &&
      typeof maybe.denominator === 'number' && Number.isFinite(maybe.denominator) &&
      maybe.denominator !== 0
    ) return maybe.numerator / maybe.denominator;
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
  return ref === 'S' || ref === 'W' ? -decimal : decimal;
}

function parseString(tag?: ExifTagLike): string | undefined {
  if (!tag) return undefined;
  if (typeof tag.description === 'string' && tag.description.trim()) return tag.description.trim();
  const source = tag.computed ?? tag.value;
  if (typeof source === 'string' && source.trim()) return source.trim();
  if (Array.isArray(source) && source.length > 0 && typeof source[0] === 'string' && source[0].trim()) {
    return source[0].trim();
  }
  return undefined;
}

function hasUsefulMetadata(metadata: WoundPhotoExifMetadata): boolean {
  return Boolean(
    metadata.make || metadata.model || metadata.software || metadata.dateTimeOriginal ||
    (typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number')
  );
}

function hasValidCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return (
    typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
  );
}

function buildMetadataFromPhotoRow(photo: PhotoMetadataTarget): WoundPhotoExifMetadata | null {
  if (!hasValidCoordinates(photo.latitude, photo.longitude)) return null;
  return {
    latitude: photo.latitude as number,
    longitude: photo.longitude as number,
    dateTimeOriginal: photo.location_captured_at ?? photo.captured_at,
    address: null,
  };
}

export function isLegacyPhotoCreatedAt(createdAt?: string | null): boolean {
  if (!createdAt) return true;
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return true;
  return timestamp < LEGACY_GEO_CUTOFF_MS;
}

async function withBestEffortAddress(metadata: WoundPhotoExifMetadata | null): Promise<WoundPhotoExifMetadata | null> {
  if (!metadata) return null;
  if (typeof metadata.latitude === 'number' && typeof metadata.longitude === 'number' && !metadata.address) {
    metadata.address = await reverseGeocode(metadata.latitude, metadata.longitude);
  }
  return metadata;
}

export async function downloadWoundPhotoBlob(storagePath: string): Promise<Blob> {
  const response = await fetch(localMediaUrl(storagePath));
  if (!response.ok) throw new Error(`Não foi possível baixar foto (${response.status}).`);
  return response.blob();
}

export async function extractWoundPhotoMetadata(blob: Blob): Promise<WoundPhotoExifMetadata | null> {
  const buffer = typeof blob.arrayBuffer === 'function' ? await blob.arrayBuffer() : await new Response(blob).arrayBuffer();
  const tags = ExifReader.load(buffer) as Record<string, ExifTagLike> | null;
  if (!tags) return null;

  const metadata: WoundPhotoExifMetadata = {
    make: parseString(tags.Make),
    model: parseString(tags.Model),
    software: parseString(tags.Software),
    dateTimeOriginal: parseString(tags.DateTimeOriginal),
    latitude: parseCoordinate(tags.GPSLatitude, tags.GPSLatitudeRef),
    longitude: parseCoordinate(tags.GPSLongitude, tags.GPSLongitudeRef),
    address: null,
  };

  await withBestEffortAddress(metadata);
  return hasUsefulMetadata(metadata) ? metadata : null;
}

export async function loadWoundPhotoMetadataFromServer(storagePath: string): Promise<WoundPhotoExifMetadata | null> {
  try {
    const blob = await downloadWoundPhotoBlob(storagePath);
    return extractWoundPhotoMetadata(blob);
  } catch (error) {
    console.error(`Falha ao carregar metadados da foto ${storagePath}:`, error);
    return null;
  }
}

function getMemoryCacheEntry(photoId: string): ResolveWoundPhotoMetadataResult | null {
  if (!metadataMemoryCache.has(photoId)) return null;
  const source = metadataSourceMemoryCache.has(photoId)
    ? (metadataSourceMemoryCache.get(photoId) ?? null)
    : 'memory';
  return { metadata: metadataMemoryCache.get(photoId) ?? null, source };
}

export async function resolveWoundPhotoMetadataOnDemand(
  photo: PhotoMetadataTarget,
  options?: { bypassMemoryCache?: boolean },
): Promise<ResolveWoundPhotoMetadataResult> {
  if (!options?.bypassMemoryCache) {
    const cached = getMemoryCacheEntry(photo.id);
    if (cached) return cached;
  }

  const rowMetadata = await withBestEffortAddress(buildMetadataFromPhotoRow(photo));
  if (rowMetadata) {
    setWoundPhotoMetadataInMemoryCache(photo.id, rowMetadata, 'photo_row');
    return { metadata: rowMetadata, source: 'photo_row' };
  }

  const exifMetadata = await loadWoundPhotoMetadataFromServer(photo.storage_path);
  if (exifMetadata) {
    setWoundPhotoMetadataInMemoryCache(photo.id, exifMetadata, 'exif_download');
    return { metadata: exifMetadata, source: 'exif_download' };
  }

  setWoundPhotoMetadataInMemoryCache(photo.id, null, null);
  return { metadata: null, source: null };
}

export async function resolveAndCacheMetadata(photo: WoundPhoto): Promise<WoundPhotoExifMetadata | null> {
  const resolved = await resolveWoundPhotoMetadataOnDemand(photo);
  return resolved.metadata;
}

export function getWoundPhotoMetadataFromMemoryCache(photoId: string): WoundPhotoExifMetadata | null | undefined {
  return metadataMemoryCache.get(photoId);
}

export function setWoundPhotoMetadataInMemoryCache(
  photoId: string,
  metadata: WoundPhotoExifMetadata | null,
  source: WoundPhotoMetadataSource = metadata ? 'memory' : null,
): void {
  metadataMemoryCache.set(photoId, metadata);
  metadataSourceMemoryCache.set(photoId, source);
}

export function deleteWoundPhotoMetadataFromMemoryCache(photoId: string): void {
  metadataMemoryCache.delete(photoId);
  metadataSourceMemoryCache.delete(photoId);
}

export function clearWoundPhotoMetadataMemoryCache(): void {
  metadataMemoryCache.clear();
  metadataSourceMemoryCache.clear();
}
