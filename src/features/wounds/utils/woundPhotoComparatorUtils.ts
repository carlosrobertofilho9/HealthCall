import type { WoundPhoto } from '../types';

export interface WoundPhotoPair {
  beforeId: string;
  afterId: string;
}

export interface ComparatorViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface ComparatorViewportBounds {
  width: number;
  height: number;
  minScale?: number;
  maxScale?: number;
}

export const COMPARATOR_MIN_SCALE = 1;
export const COMPARATOR_MAX_SCALE = 4;
export const DEFAULT_COMPARATOR_VIEWPORT: ComparatorViewportState = {
  scale: COMPARATOR_MIN_SCALE,
  offsetX: 0,
  offsetY: 0,
};

function toTimestamp(value: string): number {
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return 0;
  return parsed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function getPhotoIndexMap(orderedPhotos: WoundPhoto[]): Map<string, number> {
  return new Map(orderedPhotos.map((photo, index) => [photo.id, index]));
}

export function sortWoundPhotosChronologically(photos: WoundPhoto[]): WoundPhoto[] {
  return [...photos].sort((a, b) => {
    const byCapturedAt = toTimestamp(a.captured_at) - toTimestamp(b.captured_at);
    if (byCapturedAt !== 0) return byCapturedAt;

    const byDisplayOrder = (a.display_order ?? 0) - (b.display_order ?? 0);
    if (byDisplayOrder !== 0) return byDisplayOrder;

    return toTimestamp(a.created_at) - toTimestamp(b.created_at);
  });
}

export function getInitialWoundPhotoPair(orderedPhotos: WoundPhoto[]): WoundPhotoPair | null {
  if (orderedPhotos.length < 2) return null;

  return {
    beforeId: orderedPhotos[0].id,
    afterId: orderedPhotos[orderedPhotos.length - 1].id,
  };
}

export function normalizeWoundPhotoPair(
  beforeId: string,
  afterId: string,
  orderedPhotos: WoundPhoto[],
): WoundPhotoPair | null {
  const fallback = getInitialWoundPhotoPair(orderedPhotos);
  if (!fallback) return null;

  const photoIndexMap = getPhotoIndexMap(orderedPhotos);
  const beforeIndex = photoIndexMap.get(beforeId);
  const afterIndex = photoIndexMap.get(afterId);

  if (beforeIndex == null || afterIndex == null) {
    return fallback;
  }

  if (beforeIndex === afterIndex) {
    if (beforeIndex === 0) {
      return {
        beforeId: orderedPhotos[0].id,
        afterId: orderedPhotos[1].id,
      };
    }

    return {
      beforeId: orderedPhotos[beforeIndex - 1].id,
      afterId: orderedPhotos[beforeIndex].id,
    };
  }

  if (beforeIndex < afterIndex) {
    return { beforeId, afterId };
  }

  return {
    beforeId: afterId,
    afterId: beforeId,
  };
}

export function clampComparatorViewport(
  viewport: ComparatorViewportState,
  bounds: ComparatorViewportBounds,
): ComparatorViewportState {
  const minScale = bounds.minScale ?? COMPARATOR_MIN_SCALE;
  const maxScale = bounds.maxScale ?? COMPARATOR_MAX_SCALE;
  const scale = clamp(viewport.scale, minScale, maxScale);

  const width = Number.isFinite(bounds.width) && bounds.width > 0 ? bounds.width : 0;
  const height = Number.isFinite(bounds.height) && bounds.height > 0 ? bounds.height : 0;

  const maxOffsetX = ((scale - COMPARATOR_MIN_SCALE) * width) / 2;
  const maxOffsetY = ((scale - COMPARATOR_MIN_SCALE) * height) / 2;

  return {
    scale,
    offsetX: clamp(viewport.offsetX, -maxOffsetX, maxOffsetX),
    offsetY: clamp(viewport.offsetY, -maxOffsetY, maxOffsetY),
  };
}

export function getPhotoDiffDays(beforePhoto: WoundPhoto, afterPhoto: WoundPhoto): number {
  const diffMs = toTimestamp(afterPhoto.captured_at) - toTimestamp(beforePhoto.captured_at);
  const days = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(days));
}
