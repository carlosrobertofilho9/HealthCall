import { describe, expect, it } from 'vitest';
import { getDestinationPresentation } from '../displayPresentation';

describe('getDestinationPresentation', () => {
  it('classifica triagem', () => {
    expect(getDestinationPresentation('Triagem').kind).toBe('triagem');
  });

  it('classifica consultório médico com e sem acento', () => {
    expect(getDestinationPresentation('Consultório Médico').kind).toBe('medico');
    expect(getDestinationPresentation('Consultorio Medico').kind).toBe('medico');
    expect(getDestinationPresentation('Cons. Medico').kind).toBe('medico');
  });

  it('classifica enfermagem', () => {
    expect(getDestinationPresentation('Consultório Enfermagem').kind).toBe('enfermagem');
  });

  it('classifica vacina', () => {
    expect(getDestinationPresentation('Sala de Vacinação').kind).toBe('vacina');
  });

  it('classifica odonto', () => {
    expect(getDestinationPresentation('Consultório Odontológico').kind).toBe('odonto');
  });

  it('classifica visita ou administrativo', () => {
    expect(getDestinationPresentation('Visita administrativa').kind).toBe('administrativo');
  });

  it('usa padrão para destino desconhecido', () => {
    expect(getDestinationPresentation('Sala Azul').kind).toBe('padrao');
  });
});
