import { apiRequest } from '@/lib/apiClient';
import type {
  Appointment,
  CapacityAcsRankingItem,
  CapacityAnalyticsFilters,
  CapacityAnalyticsResult,
  CapacityKpiSnapshot,
  CapacityPeriod,
  CapacityStatusDistribution,
  CapacityTurnDistribution,
  CapacityTrendPoint,
  AppointmentDaySummary,
  AppointmentStatus,
  BulkRescheduleResult,
  CreateAppointmentData,
  AppointmentSlot,
  DayScheduleConfig,
} from '@/types';

const TUESDAY_DAY_OF_WEEK = 2;
const PRENATAL_AUTO_BLOCK_REASON = 'Pré-Natal';

export const SCHEDULE_CONFIG: Record<number, DayScheduleConfig> = {
  0: { dayOfWeek: 0, dayName: 'Domingo', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  1: { dayOfWeek: 1, dayName: 'Segunda-feira', hasService: true, serviceType: 'UBS', serviceLabel: 'Atendimento na UBS', morningSlots: 11, morningReserveSlots: 4, afternoonSlots: 9, afternoonReserveSlots: 6, totalSlots: 30 },
  2: { dayOfWeek: 2, dayName: 'Terça-feira', hasService: true, serviceType: 'UBS', serviceLabel: 'Atendimento na UBS', morningSlots: 11, morningReserveSlots: 4, afternoonSlots: 9, afternoonReserveSlots: 6, totalSlots: 30 },
  3: { dayOfWeek: 3, dayName: 'Quarta-feira', hasService: true, serviceType: 'HOME_VISIT', serviceLabel: 'Visitas domiciliares', morningSlots: 11, morningReserveSlots: 4, afternoonSlots: 0, afternoonReserveSlots: 0, totalSlots: 15 },
  4: { dayOfWeek: 4, dayName: 'Quinta-feira', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  5: { dayOfWeek: 5, dayName: 'Sexta-feira', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  6: { dayOfWeek: 6, dayName: 'Sábado', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
};

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['Agendado', 'Compareceu', 'Faltou', 'Remarcado'];
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['Agendado', 'Compareceu', 'Faltou'];
export const RELEASED_APPOINTMENT_STATUSES: AppointmentStatus[] = ['Remarcado'];

export function getDayConfig(date: Date): DayScheduleConfig {
  return SCHEDULE_CONFIG[date.getDay()];
}

export function isHomeVisitDay(date: Date): boolean {
  return getDayConfig(date).serviceType === 'HOME_VISIT';
}

export function isHomeVisitDateString(date: string): boolean {
  return isHomeVisitDay(parseISODate(date));
}

export function requiresHomeVisitFields(date: Date | string): boolean {
  return typeof date === 'string' ? isHomeVisitDateString(date) : isHomeVisitDay(date);
}

export function getSlotTime(slotNumber: number, config: DayScheduleConfig): string {
  const morningReserves = config.morningReserveSlots || 0;
  if (slotNumber <= config.morningSlots) {
    const minutesToAdd = (slotNumber - 1) * 20;
    const hour = 8 + Math.floor(minutesToAdd / 60);
    return `${String(hour).padStart(2, '0')}:${String(minutesToAdd % 60).padStart(2, '0')}`;
  }
  if (slotNumber <= config.morningSlots + morningReserves) return 'Reserva';
  if (slotNumber <= config.morningSlots + morningReserves + config.afternoonSlots) {
    const afternoonSlotIndex = slotNumber - (config.morningSlots + morningReserves);
    const minutesToAdd = (afternoonSlotIndex - 1) * 20;
    const hour = 13 + Math.floor(minutesToAdd / 60);
    return `${String(hour).padStart(2, '0')}:${String(minutesToAdd % 60).padStart(2, '0')}`;
  }
  return 'Reserva';
}

function isTuesdayPrenatalAutoBlockedSlot(slotNumber: number, config: DayScheduleConfig): boolean {
  const morningEnd = config.morningSlots + (config.morningReserveSlots || 0);
  return config.dayOfWeek === TUESDAY_DAY_OF_WEEK && slotNumber > morningEnd && slotNumber <= config.totalSlots;
}

export function isSlotAutoBlocked(date: Date, slotNumber: number): boolean {
  return isTuesdayPrenatalAutoBlockedSlot(slotNumber, getDayConfig(date));
}

function assertSlotIsNotAutoBlocked(date: Date, slotNumber: number): void {
  if (isSlotAutoBlocked(date, slotNumber)) throw new Error('Este horário está bloqueado para Pré-Natal.');
}

function buildPrenatalAutoBlock(date: Date, slotNumber: number): Appointment {
  const dateStr = formatDateToISO(date);
  const timestamp = `${dateStr}T00:00:00.000Z`;
  return {
    id: `auto-block-prenatal-${dateStr}-${slotNumber}`,
    scheduled_date: dateStr,
    slot_number: slotNumber,
    patient_name: PRENATAL_AUTO_BLOCK_REASON,
    document_type: 'CPF',
    document_value: 'BLOQUEIO',
    acs_name: 'Administração',
    home_visit_address: null,
    home_visit_reference: null,
    home_visit_reason: null,
    status: 'Agendado',
    status_updated_at: timestamp,
    rescheduled_from_id: null,
    rescheduled_to_id: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function generateSlotsForDate(date: Date, appointments: Appointment[]): AppointmentSlot[] {
  const config = getDayConfig(date);
  if (!config.hasService) return [];

  const appointmentsBySlot = new Map<number, Appointment>();
  appointments.filter(isActiveAppointment).forEach((apt) => appointmentsBySlot.set(apt.slot_number, apt));

  const getSlotAppointment = (slotNumber: number) => {
    const appointment = appointmentsBySlot.get(slotNumber);
    if (appointment) return { appointment, isAutoBlocked: false };
    if (isTuesdayPrenatalAutoBlockedSlot(slotNumber, config)) {
      return { appointment: buildPrenatalAutoBlock(date, slotNumber), isAutoBlocked: true };
    }
    return { appointment: null, isAutoBlocked: false };
  };

  const slots: AppointmentSlot[] = [];
  const morningReserves = config.morningReserveSlots || 0;
  const afternoonStart = config.morningSlots + morningReserves + 1;
  const afternoonEnd = afternoonStart + config.afternoonSlots - 1;

  for (let i = 1; i <= config.morningSlots; i++) {
    const state = getSlotAppointment(i);
    slots.push({ slotNumber: i, period: 'Manhã', time: getSlotTime(i, config), isReserve: false, isAutoBlocked: state.isAutoBlocked, appointment: state.appointment });
  }
  for (let i = config.morningSlots + 1; i <= config.morningSlots + morningReserves; i++) {
    const state = getSlotAppointment(i);
    slots.push({ slotNumber: i, period: 'Manhã', time: 'Reserva', isReserve: true, isAutoBlocked: state.isAutoBlocked, appointment: state.appointment });
  }
  for (let i = afternoonStart; i <= afternoonEnd; i++) {
    const state = getSlotAppointment(i);
    slots.push({ slotNumber: i, period: 'Tarde', time: getSlotTime(i, config), isReserve: false, isAutoBlocked: state.isAutoBlocked, appointment: state.appointment });
  }
  for (let i = afternoonEnd + 1; i <= config.totalSlots; i++) {
    const state = getSlotAppointment(i);
    slots.push({ slotNumber: i, period: 'Tarde', time: 'Reserva', isReserve: true, isAutoBlocked: state.isAutoBlocked, appointment: state.appointment });
  }
  return slots;
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  return apiRequest<Appointment[]>(`/api/appointments?date=${encodeURIComponent(date)}`);
}

export async function getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
  const params = new URLSearchParams({ start: startDate, end: endDate });
  return apiRequest<Appointment[]>(`/api/appointments?${params.toString()}`);
}

export async function createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment | null> {
  if (!appointmentData.patient_name.trim()) throw new Error('Nome do paciente é obrigatório');
  if (!appointmentData.document_value.trim()) throw new Error('Documento é obrigatório');
  if (!appointmentData.acs_name.trim()) throw new Error('ACS é obrigatório');
  assertSlotIsNotAutoBlocked(parseISODate(appointmentData.scheduled_date), appointmentData.slot_number);
  validateHomeVisitFields(appointmentData);
  return apiRequest<Appointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({ ...appointmentData, status: appointmentData.status ?? 'Agendado' }),
  });
}

export async function updateAppointment(id: string, updates: Partial<CreateAppointmentData>): Promise<Appointment | null> {
  const currentDate = updates.scheduled_date;
  if (currentDate) {
    const existing = (await getAppointmentsByDate(currentDate)).find((item) => item.id === id);
    if (existing) validateHomeVisitFields({ ...existing, ...updates });
  }
  return apiRequest<Appointment>(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment | null> {
  if (!APPOINTMENT_STATUSES.includes(status)) throw new Error('Status de marcação inválido');
  return apiRequest<Appointment>(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function rescheduleAppointment(originalId: string, scheduledDate: string, slotNumber: number): Promise<Appointment | null> {
  assertSlotIsNotAutoBlocked(parseISODate(scheduledDate), slotNumber);
  return apiRequest<Appointment>(`/api/appointments/${encodeURIComponent(originalId)}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduledDate, slotNumber }),
  });
}

export async function bulkRescheduleAppointments(sourceDate: string, targetDate: string): Promise<BulkRescheduleResult> {
  return apiRequest<BulkRescheduleResult>('/api/appointments/bulk-reschedule', {
    method: 'POST',
    body: JSON.stringify({ sourceDate, targetDate }),
  });
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiRequest<void>(`/api/appointments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function isSlotAvailable(date: string, slotNumber: number): Promise<boolean> {
  const result = await apiRequest<{ available: boolean }>(`/api/appointments/slot-available?date=${encodeURIComponent(date)}&slot=${slotNumber}`);
  return result.available;
}

export async function getAvailableSlots(date: Date): Promise<number[]> {
  const config = getDayConfig(date);
  if (!config.hasService) return [];
  const appointments = await getAppointmentsByDate(formatDateToISO(date));
  return generateSlotsForDate(date, appointments).filter((slot) => !slot.appointment).map((slot) => slot.slotNumber);
}

export function formatDateToISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' });
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function validateHomeVisitFields(appointmentData: Partial<CreateAppointmentData>): void {
  if (!appointmentData.scheduled_date || appointmentData.document_value === 'BLOQUEIO') return;
  if (!requiresHomeVisitFields(appointmentData.scheduled_date)) return;
  if (!appointmentData.home_visit_address?.trim()) throw new Error('Endereço da visita domiciliar é obrigatório');
  if (!appointmentData.home_visit_reason?.trim()) throw new Error('Motivo da visita domiciliar é obrigatório');
}

export function isBlockedAppointment(appointment: Appointment | null | undefined): boolean {
  return appointment?.document_value === 'BLOQUEIO';
}

export function getAppointmentStatus(appointment: Pick<Appointment, 'status'> | null | undefined): AppointmentStatus {
  const status = (appointment as { status?: string } | null | undefined)?.status;
  if (status === 'Confirmado') return 'Agendado';
  if (status === 'Cancelado') return 'Faltou';
  if (status === 'Agendado' || status === 'Compareceu' || status === 'Faltou' || status === 'Remarcado') return status;
  return 'Agendado';
}

export function isActiveAppointment(appointment: Appointment | null | undefined): boolean {
  return Boolean(appointment && ACTIVE_APPOINTMENT_STATUSES.includes(getAppointmentStatus(appointment)));
}

export function isReleasedAppointment(appointment: Appointment | null | undefined): boolean {
  return Boolean(appointment && RELEASED_APPOINTMENT_STATUSES.includes(getAppointmentStatus(appointment)));
}

export function getSuggestedAvailableSlot(slots: AppointmentSlot[]): AppointmentSlot | null {
  return slots.find((slot) => !slot.appointment && !slot.isReserve) || slots.find((slot) => !slot.appointment) || null;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function buildDaySummary(date: Date, appointments: Appointment[]): AppointmentDaySummary {
  const dateStr = formatDateToISO(date);
  const dayAppointments = appointments.filter((appointment) => appointment.scheduled_date === dateStr);
  const activeAppointments = dayAppointments.filter(isActiveAppointment);
  const releasedAppointments = dayAppointments.filter(isReleasedAppointment);
  const slots = generateSlotsForDate(date, activeAppointments);
  const occupiedSlots = slots.filter((slot) => slot.appointment).length;
  const blockedSlots = slots.filter((slot) => isBlockedAppointment(slot.appointment)).length;
  const reserveSlots = slots.filter((slot) => slot.isReserve).length;
  const reserveOccupiedSlots = slots.filter((slot) => slot.isReserve && slot.appointment && !isBlockedAppointment(slot.appointment)).length;
  const normalOccupiedSlots = slots.filter((slot) => !slot.isReserve && slot.appointment && !isBlockedAppointment(slot.appointment)).length;
  const totalSlots = slots.length;
  return {
    date: dateStr,
    dateObj: date,
    dayConfig: getDayConfig(date),
    appointments: activeAppointments,
    releasedAppointments,
    slots,
    totalSlots,
    occupiedSlots,
    availableSlots: totalSlots - occupiedSlots,
    blockedSlots,
    reserveSlots,
    reserveOccupiedSlots,
    normalOccupiedSlots,
    occupancyRate: totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
  };
}

export async function getAppointmentSummariesForDates(dates: Date[]): Promise<AppointmentDaySummary[]> {
  if (dates.length === 0) return [];
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const appointments = await getAppointmentsByDateRange(formatDateToISO(sorted[0]), formatDateToISO(sorted[sorted.length - 1]));
  return dates.map((date) => buildDaySummary(date, appointments));
}

const CAPACITY_PERIODS: CapacityPeriod[] = ['Manhã', 'Tarde', 'Reserva'];

function getPeriodBySlot(slotNumber: number, config: DayScheduleConfig): CapacityPeriod {
  const morningReserveSlots = config.morningReserveSlots || 0;
  const afternoonReserveSlots = config.afternoonReserveSlots || 0;
  const morningNormalEnd = config.morningSlots;
  const morningReserveEnd = morningNormalEnd + morningReserveSlots;
  const afternoonNormalEnd = morningReserveEnd + config.afternoonSlots;
  const afternoonReserveEnd = afternoonNormalEnd + afternoonReserveSlots;
  if (slotNumber <= morningNormalEnd) return 'Manhã';
  if (slotNumber <= morningReserveEnd) return 'Reserva';
  if (slotNumber <= afternoonNormalEnd) return 'Tarde';
  if (slotNumber <= afternoonReserveEnd) return 'Reserva';
  return 'Reserva';
}

function buildCapacityKpiSnapshot(partial?: Partial<CapacityKpiSnapshot>): CapacityKpiSnapshot {
  return {
    totalSlots: partial?.totalSlots || 0,
    occupiedSlots: partial?.occupiedSlots || 0,
    blockedSlots: partial?.blockedSlots || 0,
    availableSlots: partial?.availableSlots || 0,
    showCount: partial?.showCount || 0,
    noShowCount: partial?.noShowCount || 0,
    rescheduledCount: partial?.rescheduledCount || 0,
    occupancyRate: partial?.occupancyRate || 0,
    showRate: partial?.showRate || 0,
  };
}

function buildDelta(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

function matchesCapacityFilters(appointment: Appointment, filters: CapacityAnalyticsFilters): boolean {
  return (filters.acsName === 'ALL' || appointment.acs_name === filters.acsName) &&
    (filters.status === 'ALL' || getAppointmentStatus(appointment) === filters.status);
}

function summarizeCapacityKpis(summaries: AppointmentDaySummary[], filters: CapacityAnalyticsFilters) {
  const statusMap = new Map<AppointmentStatus, number>();
  const turnMap = new Map<CapacityPeriod, CapacityTurnDistribution>();
  const acsMap = new Map<string, CapacityAcsRankingItem>();
  const uniqueAcsSet = new Set<string>();
  const trend: CapacityTrendPoint[] = [];
  const totalKpis = buildCapacityKpiSnapshot();

  CAPACITY_PERIODS.forEach((period) => turnMap.set(period, { period, total: 0, occupied: 0, showCount: 0, noShowCount: 0, rescheduledCount: 0 }));

  summaries.forEach((summary) => {
    if (!summary.dayConfig.hasService) return;
    const allAppointments = [...summary.appointments, ...summary.releasedAppointments]
      .filter((appointment) => !isBlockedAppointment(appointment))
      .filter((appointment) => matchesCapacityFilters(appointment, filters));

    allAppointments.forEach((appointment) => {
      const status = getAppointmentStatus(appointment);
      uniqueAcsSet.add(appointment.acs_name);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
      const period = getPeriodBySlot(appointment.slot_number, summary.dayConfig);
      const turnStats = turnMap.get(period)!;
      turnStats.total += 1;
      if (isActiveAppointment(appointment)) turnStats.occupied += 1;
      if (status === 'Compareceu') turnStats.showCount += 1;
      if (status === 'Faltou') turnStats.noShowCount += 1;
      if (status === 'Remarcado') turnStats.rescheduledCount += 1;

      const acs = acsMap.get(appointment.acs_name) || { acsName: appointment.acs_name, total: 0, showCount: 0, noShowCount: 0, rescheduledCount: 0, showRate: 0 };
      acs.total += 1;
      if (status === 'Compareceu') acs.showCount += 1;
      if (status === 'Faltou') acs.noShowCount += 1;
      if (status === 'Remarcado') acs.rescheduledCount += 1;
      acsMap.set(appointment.acs_name, acs);
    });

    const activeCount = allAppointments.filter(isActiveAppointment).length;
    const blockedCount = summary.slots.filter((slot) => Boolean(slot.appointment) && isBlockedAppointment(slot.appointment) && matchesCapacityFilters(slot.appointment!, filters)).length;
    const totalSlots = summary.totalSlots;
    const occupiedCapacity = activeCount + blockedCount;
    const showCount = allAppointments.filter((a) => getAppointmentStatus(a) === 'Compareceu').length;
    const noShowCount = allAppointments.filter((a) => getAppointmentStatus(a) === 'Faltou').length;
    const rescheduledCount = allAppointments.filter((a) => getAppointmentStatus(a) === 'Remarcado').length;
    const showBase = showCount + noShowCount;

    trend.push({
      date: summary.date,
      label: summary.dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      totalSlots,
      occupiedSlots: activeCount,
      blockedSlots: blockedCount,
      occupancyRate: totalSlots > 0 ? Math.round((occupiedCapacity / totalSlots) * 100) : 0,
      showCount,
      noShowCount,
      rescheduledCount,
      showRate: showBase > 0 ? Math.round((showCount / showBase) * 100) : 0,
    });

    totalKpis.totalSlots += totalSlots;
    totalKpis.occupiedSlots += activeCount;
    totalKpis.blockedSlots += blockedCount;
    totalKpis.availableSlots += Math.max(totalSlots - occupiedCapacity, 0);
    totalKpis.showCount += showCount;
    totalKpis.noShowCount += noShowCount;
    totalKpis.rescheduledCount += rescheduledCount;
  });

  const occupiedCapacity = totalKpis.occupiedSlots + totalKpis.blockedSlots;
  totalKpis.occupancyRate = totalKpis.totalSlots > 0 ? Math.round((occupiedCapacity / totalKpis.totalSlots) * 100) : 0;
  const showBase = totalKpis.showCount + totalKpis.noShowCount;
  totalKpis.showRate = showBase > 0 ? Math.round((totalKpis.showCount / showBase) * 100) : 0;

  const statusDistribution: CapacityStatusDistribution[] = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
  const turnDistribution = Array.from(turnMap.values());
  const acsRanking = Array.from(acsMap.values()).map((item) => {
    const base = item.showCount + item.noShowCount;
    return { ...item, showRate: base > 0 ? Math.round((item.showCount / base) * 100) : 0 };
  }).sort((a, b) => b.total - a.total || b.showRate - a.showRate);

  return { kpis: totalKpis, trend, statusDistribution, turnDistribution, acsRanking, uniqueAcs: Array.from(uniqueAcsSet).sort((a, b) => a.localeCompare(b, 'pt-BR')) };
}

export function buildCapacityAnalyticsFromSummaries(currentSummaries: AppointmentDaySummary[], previousSummaries: AppointmentDaySummary[], filters: CapacityAnalyticsFilters): CapacityAnalyticsResult {
  const current = summarizeCapacityKpis(currentSummaries, filters);
  const previous = summarizeCapacityKpis(previousSummaries, filters);
  return {
    current: current.kpis,
    previous: previous.kpis,
    deltas: {
      occupancyRate: buildDelta(current.kpis.occupancyRate, previous.kpis.occupancyRate),
      showRate: buildDelta(current.kpis.showRate, previous.kpis.showRate),
      noShowCount: buildDelta(current.kpis.noShowCount, previous.kpis.noShowCount),
      rescheduledCount: buildDelta(current.kpis.rescheduledCount, previous.kpis.rescheduledCount),
      occupiedSlots: buildDelta(current.kpis.occupiedSlots, previous.kpis.occupiedSlots),
    },
    trend: current.trend,
    statusDistribution: current.statusDistribution,
    turnDistribution: current.turnDistribution,
    acsRanking: current.acsRanking,
    busiestDays: [...current.trend].sort((a, b) => b.occupancyRate - a.occupancyRate || b.occupiedSlots - a.occupiedSlots).slice(0, 5),
    uniqueAcs: current.uniqueAcs,
  };
}

function createDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const final = new Date(endDate);
  final.setHours(0, 0, 0, 0);
  while (current <= final) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function getCapacityAnalyticsForDateRange(startDate: Date, endDate: Date, filters: CapacityAnalyticsFilters): Promise<CapacityAnalyticsResult> {
  const currentDates = createDateRange(startDate, endDate);
  if (currentDates.length === 0) return buildCapacityAnalyticsFromSummaries([], [], filters);
  const previousEnd = addDays(currentDates[0], -1);
  const previousStart = addDays(previousEnd, -(currentDates.length - 1));
  const previousDates = createDateRange(previousStart, previousEnd);
  const [currentSummaries, previousSummaries] = await Promise.all([
    getAppointmentSummariesForDates(currentDates),
    getAppointmentSummariesForDates(previousDates),
  ]);
  return buildCapacityAnalyticsFromSummaries(currentSummaries, previousSummaries, filters);
}

export function getAppointmentMessage(
  patientName: string,
  date: string,
  slotNumber: number,
  appointmentData?: Pick<CreateAppointmentData, 'home_visit_address' | 'home_visit_reference' | 'home_visit_reason'>,
): string {
  const dateObj = parseISODate(date);
  const config = getDayConfig(dateObj);
  const timeStr = getSlotTime(slotNumber, config);

  if (config.serviceType === 'HOME_VISIT') {
    const dateFormatted = dateObj.toLocaleDateString('pt-BR');
    const address = appointmentData?.home_visit_address?.trim();
    const reference = appointmentData?.home_visit_reference?.trim();
    const reason = appointmentData?.home_visit_reason?.trim();
    return `Olá *${patientName}*,\n\nSua visita domiciliar está agendada para:\n📅 *${dateFormatted}*\n🔢 *Ficha:* ${slotNumber}\n⏰ *Início da rota:* 09:00 — a equipe passará pelo endereço durante o período da manhã; não é possível informar horário exato.\n${address ? `📍 *Endereço:* ${address}\n` : ''}${reference ? `📌 *Referência:* ${reference}\n` : ''}${reason ? `📝 *Motivo:* ${reason}\n` : ''}\nA rota começa às *09:00* e o tempo de cada atendimento varia. Por favor, mantenha disponibilidade durante o período da manhã e o telefone acessível.\n\nObrigado,\n*Equipe PSF 5 Maria Lucia da Silva*`;
  }

  if (timeStr === 'Reserva') {
    return `Olá *${patientName}*,\n\nSua consulta por *Encaixe/Reserva* foi agendada para:\n📅 *${dateObj.toLocaleDateString('pt-BR')}*\n\n⚠️ Ao chegar, dirija-se à recepção para confirmar sua chegada.\n\nObrigado,\n*Equipe PSF 5 Maria Lucia da Silva*`;
  }

  return `Olá *${patientName}*,\n\nSua consulta está agendada para:\n📅 *${dateObj.toLocaleDateString('pt-BR')}*\n⏰ *${timeStr}*\n\n⚠️ Por favor, chegue com *40 minutos de antecedência* e confirme sua chegada na recepção.\n\nObrigado,\n*Equipe PSF 5 Maria Lucia da Silva*`;
}

export async function blockDay(date: Date, reason: string, startSlot?: number, endSlot?: number): Promise<number> {
  const config = getDayConfig(date);
  if (!config.hasService) throw new Error('Este dia não possui atendimento para ser bloqueado.');

  const dateStr = formatDateToISO(date);
  const existingAppointments = await getAppointmentsByDate(dateStr);
  const occupiedSlots = new Set(generateSlotsForDate(date, existingAppointments).filter((slot) => slot.appointment).map((slot) => slot.slotNumber));
  const from = startSlot || 1;
  const to = endSlot || config.totalSlots;
  let created = 0;

  for (let i = from; i <= to; i++) {
    if (occupiedSlots.has(i)) continue;
    await createAppointment({
      scheduled_date: dateStr,
      slot_number: i,
      patient_name: reason,
      document_type: 'CPF',
      document_value: 'BLOQUEIO',
      acs_name: 'Administração',
      status: 'Agendado',
    });
    created += 1;
  }
  return created;
}
