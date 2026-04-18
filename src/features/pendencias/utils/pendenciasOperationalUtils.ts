import { PENDENCIA_PRIORIDADE, PENDENCIA_STATUS, type Pendencia, type PendenciaPrioridade } from '../types';

export type PendenciaAlertLevel = 'none' | 'high_priority' | 'due_today' | 'overdue';

const toLocalDate = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const parseDateInput = (value: string | null | undefined) => {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

export const isPendenciaResolved = (pendencia: Pick<Pendencia, 'status'>) =>
  pendencia.status === PENDENCIA_STATUS.RESOLVIDO;

export const isOverdue = (pendencia: Pick<Pendencia, 'prazo' | 'status'>, referenceDate = new Date()) => {
  if (isPendenciaResolved(pendencia)) return false;

  const dueDate = parseDateInput(pendencia.prazo);
  if (!dueDate) return false;

  return toLocalDate(dueDate).getTime() < toLocalDate(referenceDate).getTime();
};

export const isDueToday = (pendencia: Pick<Pendencia, 'prazo' | 'status'>, referenceDate = new Date()) => {
  if (isPendenciaResolved(pendencia)) return false;

  const dueDate = parseDateInput(pendencia.prazo);
  if (!dueDate) return false;

  return toLocalDate(dueDate).getTime() === toLocalDate(referenceDate).getTime();
};

export const getAlertLevel = (
  pendencia: Pick<Pendencia, 'prazo' | 'status' | 'prioridade'>,
  referenceDate = new Date(),
): PendenciaAlertLevel => {
  if (isOverdue(pendencia, referenceDate)) return 'overdue';
  if (isDueToday(pendencia, referenceDate)) return 'due_today';
  if (!isPendenciaResolved(pendencia) && pendencia.prioridade === PENDENCIA_PRIORIDADE.ALTA) {
    return 'high_priority';
  }

  return 'none';
};

const prioridadeScore: Record<PendenciaPrioridade, number> = {
  alta: 3,
  normal: 2,
  baixa: 1,
};

export const sortPendenciasByOperationalSeverity = (items: Pendencia[], referenceDate = new Date()) =>
  [...items].sort((left, right) => {
    const alertOrder = {
      overdue: 3,
      due_today: 2,
      high_priority: 1,
      none: 0,
    } as const;

    const leftAlert = alertOrder[getAlertLevel(left, referenceDate)];
    const rightAlert = alertOrder[getAlertLevel(right, referenceDate)];

    if (rightAlert !== leftAlert) return rightAlert - leftAlert;

    const prioridadeDiff = prioridadeScore[right.prioridade] - prioridadeScore[left.prioridade];
    if (prioridadeDiff !== 0) return prioridadeDiff;

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

export const getCurrentWeekRange = (referenceDate = new Date()) => {
  const current = toLocalDate(referenceDate);
  const day = current.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;

  const start = new Date(current);
  start.setDate(current.getDate() - distanceToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
};

export const isDateInRange = (value: string | null | undefined, start: Date, end: Date) => {
  const date = parseDateInput(value);
  if (!date) return false;

  const normalized = toLocalDate(date).getTime();
  return normalized >= toLocalDate(start).getTime() && normalized <= toLocalDate(end).getTime();
};

export const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return '';

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || value;
};
