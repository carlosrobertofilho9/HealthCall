import { describe, expect, it } from 'vitest';
import { PENDENCIA_STATUS, type Pendencia } from '../types';
import {
  getAlertLevel,
  getCurrentWeekRange,
  isDateInRange,
  isDueToday,
  isOverdue,
  sortPendenciasByOperationalSeverity,
} from './pendenciasOperationalUtils';

const createPendencia = (overrides: Partial<Pendencia> = {}): Pendencia => ({
  id: '1',
  nome_paciente: 'Paciente Teste',
  cns_cpf: '12345678901',
  tipo: 'Exame',
  resumo: null,
  status: PENDENCIA_STATUS.ABERTO,
  prioridade: 'normal',
  prazo: '2026-04-18',
  responsavel: 'Carlos',
  created_by: 'user-1',
  created_at: '2026-04-18T08:00:00.000Z',
  updated_at: '2026-04-18T08:00:00.000Z',
  resolved_at: null,
  ...overrides,
});

describe('pendenciasOperationalUtils', () => {
  it('marca atraso somente quando prazo for anterior ao dia atual e não resolvido', () => {
    const referenceDate = new Date(2026, 3, 18);

    expect(isOverdue(createPendencia({ prazo: '2026-04-17' }), referenceDate)).toBe(true);
    expect(isOverdue(createPendencia({ prazo: '2026-04-18' }), referenceDate)).toBe(false);
    expect(
      isOverdue(
        createPendencia({ prazo: '2026-04-17', status: PENDENCIA_STATUS.RESOLVIDO }),
        referenceDate,
      ),
    ).toBe(false);
  });

  it('identifica filtro vence hoje apenas para pendências não resolvidas', () => {
    const referenceDate = new Date(2026, 3, 18);

    expect(isDueToday(createPendencia({ prazo: '2026-04-18' }), referenceDate)).toBe(true);
    expect(isDueToday(createPendencia({ prazo: '2026-04-19' }), referenceDate)).toBe(false);
    expect(
      isDueToday(
        createPendencia({ prazo: '2026-04-18', status: PENDENCIA_STATUS.RESOLVIDO }),
        referenceDate,
      ),
    ).toBe(false);
  });

  it('aplica precedência de alerta: atraso > vence hoje > prioridade alta', () => {
    const referenceDate = new Date(2026, 3, 18);

    expect(getAlertLevel(createPendencia({ prazo: '2026-04-17', prioridade: 'alta' }), referenceDate)).toBe('overdue');
    expect(getAlertLevel(createPendencia({ prazo: '2026-04-18', prioridade: 'alta' }), referenceDate)).toBe('due_today');
    expect(getAlertLevel(createPendencia({ prazo: '2026-04-20', prioridade: 'alta' }), referenceDate)).toBe('high_priority');
    expect(getAlertLevel(createPendencia({ prazo: '2026-04-20', prioridade: 'normal' }), referenceDate)).toBe('none');
  });

  it('ordena por severidade operacional antes da prioridade e criação', () => {
    const referenceDate = new Date(2026, 3, 18);

    const sorted = sortPendenciasByOperationalSeverity([
      createPendencia({ id: 'normal', prazo: '2026-04-20', prioridade: 'normal', created_at: '2026-04-18T08:00:00.000Z' }),
      createPendencia({ id: 'alta', prazo: '2026-04-20', prioridade: 'alta', created_at: '2026-04-18T09:00:00.000Z' }),
      createPendencia({ id: 'hoje', prazo: '2026-04-18', prioridade: 'baixa', created_at: '2026-04-18T10:00:00.000Z' }),
      createPendencia({ id: 'atrasada', prazo: '2026-04-17', prioridade: 'baixa', created_at: '2026-04-18T11:00:00.000Z' }),
    ], referenceDate);

    expect(sorted.map((item) => item.id)).toEqual(['atrasada', 'hoje', 'alta', 'normal']);
  });

  it('calcula semana atual (seg-dom) e valida datas dentro do intervalo', () => {
    const { start, end } = getCurrentWeekRange(new Date(2026, 3, 18));

    expect(start.toISOString().slice(0, 10)).toBe('2026-04-13');
    expect(end.toISOString().slice(0, 10)).toBe('2026-04-19');
    expect(isDateInRange('2026-04-13', start, end)).toBe(true);
    expect(isDateInRange('2026-04-19', start, end)).toBe(true);
    expect(isDateInRange('2026-04-20', start, end)).toBe(false);
  });
});
