import { describe, expect, it } from 'vitest';
import {
  buildCode128BarcodeLayout,
  encodeCode128BValues,
  normalizeBarcodeDigits,
} from './code128Barcode';

describe('code128Barcode', () => {
  it('gera barras para CPF de 11 digitos', () => {
    const layout = buildCode128BarcodeLayout('123.456.789-01', { x: 710, width: 290 });

    expect(layout.value).toBe('12345678901');
    expect(layout.bars.length).toBeGreaterThan(0);
    expect(layout.bars.every((bar) => bar.width > 0)).toBe(true);
    expect(layout.bars[0].x).toBeGreaterThan(710);
  });

  it('gera barras para CNS de 15 digitos', () => {
    const layout = buildCode128BarcodeLayout('705.4094.1902.9900', { x: 710, width: 290 });

    expect(layout.value).toBe('705409419029900');
    expect(layout.bars.length).toBeGreaterThan(0);
    expect(layout.totalModules).toBeGreaterThan(0);
  });

  it('ignora pontuacao e caracteres nao numericos antes da codificacao', () => {
    expect(normalizeBarcodeDigits('ABC123.-45 xyz')).toBe('12345');

    const layout = buildCode128BarcodeLayout('ABC123.-45 xyz');

    expect(layout.value).toBe('12345');
    expect(layout.bars.length).toBeGreaterThan(0);
  });

  it('retorna vazio quando nao ha digitos', () => {
    const layout = buildCode128BarcodeLayout('ABC.-xyz');

    expect(layout.value).toBe('');
    expect(layout.bars).toEqual([]);
    expect(layout.totalModules).toBe(0);
    expect(layout.moduleWidth).toBe(0);
  });

  it('calcula o checksum do Code 128 Set B', () => {
    const encodedValues = encodeCode128BValues('123');

    expect(encodedValues).toEqual([104, 17, 18, 19, 8, 106]);
  });
});
