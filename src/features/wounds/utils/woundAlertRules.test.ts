import { describe, expect, it } from 'vitest';
import { buildTimelineAlerts, detectWorseningAlerts } from './woundAlertRules';
import type { WoundEntry } from '../types';

const makeEntry = (overrides: Partial<WoundEntry> = {}): WoundEntry => ({
  id: 'entry-1',
  wound_id: 'wound-1',
  recorded_at: '2026-04-01T10:00:00.000Z',
  professional_id: 'user-1',
  measure_length_cm: 4,
  measure_width_cm: 2,
  measure_depth_cm: 1,
  area_cm2: 8,
  bed_aspect: ['Granulação'],
  edges: [],
  exudate: 'ausente',
  odor: 'ausente',
  perilesional_skin: [],
  pain_scale: 2,
  uses_antibiotic: false,
  antibiotic_type: null,
  uses_ointment: false,
  ointment_type: null,
  dressing_type: null,
  dressing_notes: null,
  non_conformity_detected: false,
  non_conformity_type: null,
  non_conformity_description: null,
  non_conformity_action: null,
  observations: null,
  next_change_date: null,
  created_at: '2026-04-01T10:00:00.000Z',
  ...overrides,
});

describe('woundAlertRules', () => {
  it('identifica piora por aumento de área, exsudato, odor fétido e dor', () => {
    const previous = makeEntry();
    const current = makeEntry({
      id: 'entry-2',
      measure_length_cm: 6,
      measure_width_cm: 3,
      exudate: 'purulento',
      odor: 'fetido',
      pain_scale: 8,
      bed_aspect: ['Necrose'],
    });

    const alerts = detectWorseningAlerts(previous, current);
    expect(alerts.map((alert) => alert.type)).toEqual(
      expect.arrayContaining([
        'measure_increase',
        'exudate_worsening',
        'foul_odor_detected',
        'pain_increase',
        'bed_aspect_necrosis',
      ]),
    );
  });

  it('gera alertas na timeline comparando pares de registros', () => {
    const alerts = buildTimelineAlerts([
      makeEntry({ id: 'entry-1', recorded_at: '2026-04-01T10:00:00.000Z' }),
      makeEntry({
        id: 'entry-2',
        recorded_at: '2026-04-02T10:00:00.000Z',
        measure_length_cm: 8,
        measure_width_cm: 4,
        exudate: 'serossanguinolento',
      }),
      makeEntry({
        id: 'entry-3',
        recorded_at: '2026-04-03T10:00:00.000Z',
        odor: 'fetido',
      }),
    ]);

    expect(alerts.length).toBeGreaterThan(0);
  });
});
