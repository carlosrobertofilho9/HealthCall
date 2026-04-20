import type { WoundEntry } from '../types';

export interface WoundAreaPoint {
  recorded_at: string;
  length: number | null;
  width: number | null;
  depth: number | null;
  area: number | null;
}

export function calculateArea(length: number | null | undefined, width: number | null | undefined): number | null {
  if (length == null || width == null) return null;
  if (!Number.isFinite(length) || !Number.isFinite(width)) return null;
  if (length < 0 || width < 0) return null;
  return Number((length * width).toFixed(2));
}

export function buildAreaSeries(entries: WoundEntry[]): WoundAreaPoint[] {
  return [...entries]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((entry) => ({
      recorded_at: entry.recorded_at,
      length: entry.measure_length_cm,
      width: entry.measure_width_cm,
      depth: entry.measure_depth_cm,
      area: calculateArea(entry.measure_length_cm, entry.measure_width_cm),
    }));
}

export function calculateAreaReductionPercent(entries: WoundEntry[]): number | null {
  const series = buildAreaSeries(entries).filter((point) => point.area != null) as Array<WoundAreaPoint & { area: number }>;
  if (series.length < 2) return null;

  const initial = series[0].area;
  const current = series[series.length - 1].area;

  if (initial <= 0) return null;

  const reduction = ((initial - current) / initial) * 100;
  return Number(reduction.toFixed(2));
}

export function estimateHealingDays(entries: WoundEntry[]): number | null {
  const series = buildAreaSeries(entries).filter((point) => point.area != null) as Array<WoundAreaPoint & { area: number }>;
  if (series.length < 2) return null;

  const first = series[0];
  const last = series[series.length - 1];

  const elapsedDays = Math.max(
    1,
    Math.ceil(
      (new Date(last.recorded_at).getTime() - new Date(first.recorded_at).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  if (first.area <= 0 || last.area >= first.area) {
    return null;
  }

  const dailyReduction = (first.area - last.area) / elapsedDays;
  if (dailyReduction <= 0) return null;

  const remaining = Math.max(last.area, 0);
  return Math.ceil(remaining / dailyReduction);
}
