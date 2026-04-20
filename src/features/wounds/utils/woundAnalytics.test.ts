import { describe, expect, it } from 'vitest';
import { calculateArea, calculateAreaReductionPercent, estimateHealingDays } from './woundAnalytics';
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
  bed_aspect: [],
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

describe('woundAnalytics', () => {
  it('calcula área corretamente com duas casas decimais', () => {
    expect(calculateArea(3.456, 2.112)).toBe(7.3);
  });

  it('retorna null para medidas inválidas', () => {
    expect(calculateArea(null, 2)).toBeNull();
    expect(calculateArea(-1, 2)).toBeNull();
  });

  it('calcula redução percentual de área entre primeiro e último registro', () => {
    const reduction = calculateAreaReductionPercent([
      makeEntry({ measure_length_cm: 5, measure_width_cm: 5, recorded_at: '2026-04-01T10:00:00.000Z' }),
      makeEntry({ id: 'entry-2', measure_length_cm: 4, measure_width_cm: 4, recorded_at: '2026-04-08T10:00:00.000Z' }),
    ]);

    expect(reduction).toBe(36);
  });

  it('estima dias de cicatrização quando há curva de redução positiva', () => {
    const days = estimateHealingDays([
      makeEntry({ measure_length_cm: 6, measure_width_cm: 6, recorded_at: '2026-04-01T10:00:00.000Z' }),
      makeEntry({ id: 'entry-2', measure_length_cm: 5, measure_width_cm: 5, recorded_at: '2026-04-06T10:00:00.000Z' }),
      makeEntry({ id: 'entry-3', measure_length_cm: 4, measure_width_cm: 4, recorded_at: '2026-04-11T10:00:00.000Z' }),
    ]);

    expect(days).toBeGreaterThan(0);
  });
});
