import { describe, expect, it } from 'vitest';
import {
  BODY_DIAGRAM_REGIONS,
  buildAnatomicalCode,
  getBodyDiagramHistoryCodes,
  getSubregionByCode,
} from './bodyDiagramMapping';

describe('bodyDiagramMapping', () => {
  it('gera código anatômico a partir da região e sub-região', () => {
    expect(buildAnatomicalCode('lower_left', 'maleolo_e')).toBe('MaleoloLE');
  });

  it('resolve código anatômico para região + sub-região', () => {
    const parsed = getSubregionByCode('Sacral');
    expect(parsed?.region.label).toBe('Dorso');
    expect(parsed?.subregion.label).toBe('Sacral');
  });

  it('normaliza histórico de códigos sem duplicação', () => {
    const history = getBodyDiagramHistoryCodes(['MaleoloLE', 'MaleoloLE', 'Sacral']);
    expect(history).toHaveLength(2);
  });

  it('mantém catálogo de regiões com frente e costas', () => {
    const sides = new Set(BODY_DIAGRAM_REGIONS.map((region) => region.side));
    expect(sides.has('front')).toBe(true);
    expect(sides.has('back')).toBe(true);
  });
});
