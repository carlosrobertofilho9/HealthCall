import type { WoundEntry } from '../types';

export type WoundAlertType =
  | 'measure_increase'
  | 'exudate_worsening'
  | 'foul_odor_detected'
  | 'pain_increase'
  | 'bed_aspect_necrosis';

export interface WoundAlert {
  type: WoundAlertType;
  message: string;
  previousEntryId: string;
  currentEntryId: string;
}

const exudateRank: Record<string, number> = {
  ausente: 0,
  seroso: 1,
  sanguinolento: 2,
  serossanguinolento: 3,
  purulento: 4,
};

const odorRank: Record<string, number> = {
  ausente: 0,
  discreto: 1,
  fetido: 2,
};

export function detectWorseningAlerts(previous: WoundEntry, current: WoundEntry): WoundAlert[] {
  const alerts: WoundAlert[] = [];

  const prevArea = (previous.measure_length_cm ?? 0) * (previous.measure_width_cm ?? 0);
  const currentArea = (current.measure_length_cm ?? 0) * (current.measure_width_cm ?? 0);

  if (currentArea > prevArea && prevArea > 0) {
    alerts.push({
      type: 'measure_increase',
      message: 'Aumento da área da ferida em relação ao registro anterior.',
      previousEntryId: previous.id,
      currentEntryId: current.id,
    });
  }

  const prevExudate = exudateRank[previous.exudate ?? 'ausente'] ?? 0;
  const currentExudate = exudateRank[current.exudate ?? 'ausente'] ?? 0;
  if (currentExudate > prevExudate) {
    alerts.push({
      type: 'exudate_worsening',
      message: 'Aumento do exsudato identificado na evolução.',
      previousEntryId: previous.id,
      currentEntryId: current.id,
    });
  }

  const prevOdor = odorRank[previous.odor ?? 'ausente'] ?? 0;
  const currentOdor = odorRank[current.odor ?? 'ausente'] ?? 0;
  if (currentOdor > prevOdor && (current.odor ?? 'ausente') === 'fetido') {
    alerts.push({
      type: 'foul_odor_detected',
      message: 'Odor fétido detectado na evolução atual.',
      previousEntryId: previous.id,
      currentEntryId: current.id,
    });
  }

  if ((current.pain_scale ?? 0) > (previous.pain_scale ?? 0)) {
    alerts.push({
      type: 'pain_increase',
      message: 'Aumento de dor em relação ao registro anterior.',
      previousEntryId: previous.id,
      currentEntryId: current.id,
    });
  }

  const currentBedAspects = current.bed_aspect.map((item) => item.toLowerCase());
  const hasNecrosisOrSlough = currentBedAspects.some((item) => item.includes('necrose') || item.includes('esfacelo'));
  if (hasNecrosisOrSlough) {
    alerts.push({
      type: 'bed_aspect_necrosis',
      message: 'Aspecto de leito com necrose/esfacelo identificado.',
      previousEntryId: previous.id,
      currentEntryId: current.id,
    });
  }

  return alerts;
}

export function buildTimelineAlerts(entries: WoundEntry[]): WoundAlert[] {
  const ordered = [...entries].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const alerts: WoundAlert[] = [];

  for (let index = 1; index < ordered.length; index += 1) {
    alerts.push(...detectWorseningAlerts(ordered[index - 1], ordered[index]));
  }

  return alerts;
}
