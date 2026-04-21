import { describe, expect, it } from 'vitest';
import type { WoundPhoto } from '../types';
import {
  clampComparatorViewport,
  getInitialWoundPhotoPair,
  normalizeWoundPhotoPair,
  sortWoundPhotosChronologically,
} from './woundPhotoComparatorUtils';

function makePhoto(id: string, capturedAt: string, displayOrder = 0): WoundPhoto {
  return {
    id,
    wound_id: 'wound-1',
    entry_id: null,
    storage_path: `${id}.jpg`,
    captured_at: capturedAt,
    display_order: displayOrder,
    description: null,
    is_primary: false,
    created_by: 'professional-1',
    created_at: capturedAt,
    deleted_at: null,
    deleted_by: null,
    signed_url: `https://example.com/${id}.jpg`,
  };
}

describe('woundPhotoComparatorUtils', () => {
  it('ordena as fotos em ordem cronológica crescente', () => {
    const ordered = sortWoundPhotosChronologically([
      makePhoto('p3', '2026-04-03T10:00:00.000Z'),
      makePhoto('p1', '2026-04-01T10:00:00.000Z'),
      makePhoto('p2', '2026-04-02T10:00:00.000Z'),
    ]);

    expect(ordered.map((photo) => photo.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('retorna par inicial com foto mais antiga e mais recente', () => {
    const ordered = sortWoundPhotosChronologically([
      makePhoto('p2', '2026-04-02T10:00:00.000Z'),
      makePhoto('p1', '2026-04-01T10:00:00.000Z'),
      makePhoto('p3', '2026-04-03T10:00:00.000Z'),
    ]);

    expect(getInitialWoundPhotoPair(ordered)).toEqual({ beforeId: 'p1', afterId: 'p3' });
  });

  it('auto corrige par temporal invertido', () => {
    const ordered = sortWoundPhotosChronologically([
      makePhoto('p1', '2026-04-01T10:00:00.000Z'),
      makePhoto('p2', '2026-04-02T10:00:00.000Z'),
      makePhoto('p3', '2026-04-03T10:00:00.000Z'),
    ]);

    expect(normalizeWoundPhotoPair('p3', 'p1', ordered)).toEqual({ beforeId: 'p1', afterId: 'p3' });
  });

  it('resolve seleção duplicada escolhendo foto imediatamente anterior', () => {
    const ordered = sortWoundPhotosChronologically([
      makePhoto('p1', '2026-04-01T10:00:00.000Z'),
      makePhoto('p2', '2026-04-02T10:00:00.000Z'),
      makePhoto('p3', '2026-04-03T10:00:00.000Z'),
    ]);

    expect(normalizeWoundPhotoPair('p2', 'p2', ordered)).toEqual({ beforeId: 'p1', afterId: 'p2' });
  });

  it('faz clamp de zoom e offsets conforme dimensões do viewport', () => {
    const clamped = clampComparatorViewport(
      {
        scale: 8,
        offsetX: 700,
        offsetY: -500,
      },
      {
        width: 400,
        height: 200,
      },
    );

    expect(clamped.scale).toBe(4);
    expect(clamped.offsetX).toBe(600);
    expect(clamped.offsetY).toBe(-300);
  });
});
