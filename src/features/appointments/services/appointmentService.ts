import { supabase } from '@/lib/supabaseClient';
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

// =============================================================================
// Configuração da Grade de Atendimento
// =============================================================================

/**
 * Configuração fixa da grade de atendimento por dia da semana.
 * Segunda: 30 slots (15 manhã + 15 tarde)
 * Terça: 15 slots (15 manhã)
 * Quarta: 15 visitas domiciliares (15 manhã)
 * Quinta a Domingo: Sem atendimento
 */
export const SCHEDULE_CONFIG: Record<number, DayScheduleConfig> = {
  0: { dayOfWeek: 0, dayName: 'Domingo', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  1: { 
    dayOfWeek: 1, 
    dayName: 'Segunda-feira', 
    hasService: true, 
    serviceType: 'UBS',
    serviceLabel: 'Atendimento na UBS',
    morningSlots: 11, 
    morningReserveSlots: 4,
    afternoonSlots: 9, 
    afternoonReserveSlots: 6,
    totalSlots: 30 
  },
  2: { 
    dayOfWeek: 2, 
    dayName: 'Terça-feira', 
    hasService: true, 
    serviceType: 'UBS',
    serviceLabel: 'Atendimento na UBS',
    morningSlots: 11, 
    morningReserveSlots: 4,
    afternoonSlots: 0, 
    afternoonReserveSlots: 0,
    totalSlots: 15 
  },
  3: {
    dayOfWeek: 3,
    dayName: 'Quarta-feira',
    hasService: true,
    serviceType: 'HOME_VISIT',
    serviceLabel: 'Visitas domiciliares',
    morningSlots: 11,
    morningReserveSlots: 4,
    afternoonSlots: 0,
    afternoonReserveSlots: 0,
    totalSlots: 15
  },
  4: { dayOfWeek: 4, dayName: 'Quinta-feira', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  5: { dayOfWeek: 5, dayName: 'Sexta-feira', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  6: { dayOfWeek: 6, dayName: 'Sábado', hasService: false, serviceType: 'UBS', serviceLabel: 'Sem atendimento', morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
};

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Agendado',
  'Compareceu',
  'Faltou',
  'Remarcado',
];

export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Agendado',
  'Compareceu',
  'Faltou',
];

export const RELEASED_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Remarcado',
];

/**
 * Obtém a configuração de atendimento para uma data específica.
 * @param date - A data a ser verificada
 * @returns A configuração do dia
 */
export function getDayConfig(date: Date): DayScheduleConfig {
  const dayOfWeek = date.getDay();
  return SCHEDULE_CONFIG[dayOfWeek];
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

/**
 * Gera os slots da grade para uma data específica.
 * @param date - A data para gerar os slots
 * @param appointments - As marcações existentes para o dia
 * @returns Array de slots com ou sem marcações
 */
export function getSlotTime(slotNumber: number, config: DayScheduleConfig): string {
  const morningReserves = config.morningReserveSlots || 0;
  const afternoonReserves = config.afternoonReserveSlots || 0;

  // 1. Manhã Normal
  if (slotNumber <= config.morningSlots) {
    const startHour = 8;
    const intervalMinutes = 20;
    const minutesToAdd = (slotNumber - 1) * intervalMinutes;
    
    const hour = startHour + Math.floor(minutesToAdd / 60);
    const minute = minutesToAdd % 60;
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // 2. Reserva Manhã
  if (slotNumber <= config.morningSlots + morningReserves) {
    return 'Reserva';
  }

  // 3. Tarde Normal
  if (slotNumber <= config.morningSlots + morningReserves + config.afternoonSlots) {
    const startHour = 13;
    const intervalMinutes = 20;
    // Slots anteriores a serem descontados: Manhã Normal + Reserva Manhã
    const slotsBefore = config.morningSlots + morningReserves;
    const afternoonSlotIndex = slotNumber - slotsBefore;
    
    const minutesToAdd = (afternoonSlotIndex - 1) * intervalMinutes;
    
    const hour = startHour + Math.floor(minutesToAdd / 60);
    const minute = minutesToAdd % 60;
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // 4. Reserva Tarde (ou qualquer outra reserva final)
  return 'Reserva';
}

export function generateSlotsForDate(date: Date, appointments: Appointment[]): AppointmentSlot[] {
  const config = getDayConfig(date);
  
  if (!config.hasService) {
    return [];
  }

  const slots: AppointmentSlot[] = [];
  const appointmentsBySlot = new Map<number, Appointment>();
  
  // Indexar marcações por número de slot
  appointments.filter(isActiveAppointment).forEach(apt => {
    appointmentsBySlot.set(apt.slot_number, apt);
  });

  const morningReserves = config.morningReserveSlots || 0;
  const afternoonReserves = config.afternoonReserveSlots || 0;

  // 1. Gerar slots da manhã Normal
  for (let i = 1; i <= config.morningSlots; i++) {
    slots.push({
      slotNumber: i,
      period: 'Manhã',
      time: getSlotTime(i, config),
      isReserve: false,
      appointment: appointmentsBySlot.get(i) || null,
    });
  }

  // 2. Gerar slots de Reserva da Manhã
  for (let i = config.morningSlots + 1; i <= config.morningSlots + morningReserves; i++) {
    slots.push({
      slotNumber: i,
      period: 'Manhã',
      time: 'Reserva',
      isReserve: true,
      appointment: appointmentsBySlot.get(i) || null,
    });
  }

  // 3. Gerar slots da Tarde Normal
  const afternoonStart = config.morningSlots + morningReserves + 1;
  const afternoonEnd = afternoonStart + config.afternoonSlots - 1;
  
  for (let i = afternoonStart; i <= afternoonEnd; i++) {
    slots.push({
      slotNumber: i,
      period: 'Tarde',
      time: getSlotTime(i, config),
      isReserve: false,
      appointment: appointmentsBySlot.get(i) || null,
    });
  }

  // 4. Gerar slots de Reserva da Tarde
  const finalReserveStart = afternoonEnd + 1;
  for (let i = finalReserveStart; i <= config.totalSlots; i++) {
    slots.push({
      slotNumber: i,
      period: 'Tarde',
      time: 'Reserva',
      isReserve: true,
      appointment: appointmentsBySlot.get(i) || null,
    });
  }

  return slots;
}

// =============================================================================
// Operações CRUD para Marcações
// =============================================================================

/**
 * Busca todas as marcações de uma data específica.
 * @param date - A data no formato YYYY-MM-DD
 * @returns Array de marcações do dia
 */
export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('scheduled_date', date)
      .order('slot_number', { ascending: true });

    if (error) {
      console.error('Erro ao buscar marcações:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exceção em getAppointmentsByDate:', error);
    throw error;
  }
}

/**
 * Busca marcações em um intervalo fechado de datas.
 * @param startDate - Data inicial no formato YYYY-MM-DD
 * @param endDate - Data final no formato YYYY-MM-DD
 */
export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })
      .order('slot_number', { ascending: true });

    if (error) {
      console.error('Erro ao buscar marcações por intervalo:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Exceção em getAppointmentsByDateRange:', error);
    throw error;
  }
}

/**
 * Cria uma nova marcação.
 * @param appointmentData - Os dados da marcação
 * @returns A marcação criada ou null em caso de erro
 */
export async function createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment | null> {
  try {
    // Validações antes de inserir
    if (!appointmentData.patient_name.trim()) {
      throw new Error('Nome do paciente é obrigatório');
    }
    if (!appointmentData.document_value.trim()) {
      throw new Error('Documento é obrigatório');
    }
    if (!appointmentData.acs_name.trim()) {
      throw new Error('ACS é obrigatório');
    }
    validateHomeVisitFields(appointmentData);

    const payload: CreateAppointmentData = {
      ...appointmentData,
      status: appointmentData.status ?? 'Agendado',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert([payload])
      .select()
      .single();

    if (error) {
      // Verifica se é erro de duplicidade (slot já ocupado)
      if (error.code === '23505') {
        throw new Error('Este slot já está ocupado para esta data');
      }
      console.error('Erro ao criar marcação:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exceção em createAppointment:', error);
    throw error;
  }
}

/**
 * Atualiza uma marcação existente.
 * @param id - O ID da marcação
 * @param updates - Os campos a serem atualizados
 * @returns A marcação atualizada ou null em caso de erro
 */
export async function updateAppointment(
  id: string, 
  updates: Partial<CreateAppointmentData>
): Promise<Appointment | null> {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar marcação para atualização:', fetchError);
      throw fetchError;
    }

    const mergedAppointment = {
      ...existing,
      ...updates,
    } as CreateAppointmentData;

    validateHomeVisitFields(mergedAppointment);

    const payload = updates.status
      ? { ...updates, status_updated_at: new Date().toISOString() }
      : updates;

    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar marcação:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exceção em updateAppointment:', error);
    throw error;
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<Appointment | null> {
  if (!APPOINTMENT_STATUSES.includes(status)) {
    throw new Error('Status de marcação inválido');
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({
      status,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status da marcação:', error);
    throw error;
  }

  return data;
}

export async function rescheduleAppointment(
  originalId: string,
  scheduledDate: string,
  slotNumber: number
): Promise<Appointment | null> {
  const { data, error } = await supabase.rpc('reschedule_appointment', {
    p_original_id: originalId,
    p_scheduled_date: scheduledDate,
    p_slot_number: slotNumber,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este slot já está ocupado para esta data');
    }
    console.error('Erro ao remarcar marcação:', error);
    throw error;
  }

  return data;
}

export async function bulkRescheduleAppointments(
  sourceDate: string,
  targetDate: string
): Promise<BulkRescheduleResult> {
  const { data, error } = await supabase.rpc('bulk_reschedule_appointments', {
    p_source_date: sourceDate,
    p_target_date: targetDate,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error(error.message || 'Uma ou mais fichas já estão ocupadas no dia de destino');
    }

    if (error.code === 'P0002' || error.code === '22023') {
      throw new Error(error.message);
    }

    console.error('Erro ao reagendar agenda em massa:', error);
    throw error;
  }

  return {
    rescheduled_count: Number(data?.rescheduled_count ?? 0),
    source_date: String(data?.source_date ?? sourceDate),
    target_date: String(data?.target_date ?? targetDate),
    moved_slots: Array.isArray(data?.moved_slots) ? data.moved_slots.map(Number) : [],
  };
}

/**
 * Remove uma marcação.
 * @param id - O ID da marcação a ser removida
 */
export async function deleteAppointment(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover marcação:', error);
      throw error;
    }
  } catch (error) {
    console.error('Exceção em deleteAppointment:', error);
    throw error;
  }
}

/**
 * Verifica se um slot está disponível para uma data específica.
 * @param date - A data no formato YYYY-MM-DD
 * @param slotNumber - O número do slot
 * @returns true se o slot está disponível
 */
export async function isSlotAvailable(date: string, slotNumber: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('scheduled_date', date)
      .eq('slot_number', slotNumber)
      .in('status', ACTIVE_APPOINTMENT_STATUSES);

    if (error) {
      console.error('Erro ao verificar disponibilidade do slot:', error);
      throw error;
    }

    return (data || []).length === 0;
  } catch (error) {
    console.error('Exceção em isSlotAvailable:', error);
    throw error;
  }
}

/**
 * Obtém os slots disponíveis para uma data específica.
 * @param date - A data para verificar
 * @returns Array de números de slots disponíveis
 */
export async function getAvailableSlots(date: Date): Promise<number[]> {
  const config = getDayConfig(date);
  
  if (!config.hasService) {
    return [];
  }

  const dateStr = formatDateToISO(date);
  const appointments = await getAppointmentsByDate(dateStr);
  const occupiedSlots = new Set(
    appointments.filter(isActiveAppointment).map(a => a.slot_number)
  );
  
  const availableSlots: number[] = [];
  for (let i = 1; i <= config.totalSlots; i++) {
    if (!occupiedSlots.has(i)) {
      availableSlots.push(i);
    }
  }

  return availableSlots;
}

// =============================================================================
// Utilitários de Data
// =============================================================================

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD).
 * @param date - A data a ser formatada
 * @returns A data no formato YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição em português.
 * @param date - A data a ser formatada
 * @returns A data formatada (ex: "Segunda-feira, 03 de Fevereiro de 2026")
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
}

/**
 * Converte uma string ISO para objeto Date.
 * @param dateStr - A data no formato YYYY-MM-DD
 * @returns O objeto Date
 */
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function validateHomeVisitFields(appointmentData: Partial<CreateAppointmentData>): void {
  if (!appointmentData.scheduled_date || appointmentData.document_value === 'BLOQUEIO') {
    return;
  }

  if (!requiresHomeVisitFields(appointmentData.scheduled_date)) {
    return;
  }

  if (!appointmentData.home_visit_address?.trim()) {
    throw new Error('Endereço da visita domiciliar é obrigatório');
  }

  if (!appointmentData.home_visit_reason?.trim()) {
    throw new Error('Motivo da visita domiciliar é obrigatório');
  }
}

export function isBlockedAppointment(appointment: Appointment | null | undefined): boolean {
  return appointment?.document_value === 'BLOQUEIO';
}

export function getAppointmentStatus(
  appointment: Pick<Appointment, 'status'> | null | undefined
): AppointmentStatus {
  const status = (appointment as { status?: string } | null | undefined)?.status;

  if (status === 'Confirmado') {
    return 'Agendado';
  }

  if (status === 'Cancelado') {
    return 'Faltou';
  }

  if (status === 'Agendado' || status === 'Compareceu' || status === 'Faltou' || status === 'Remarcado') {
    return status;
  }

  return 'Agendado';
}

export function isActiveAppointment(appointment: Appointment | null | undefined): boolean {
  if (!appointment) {
    return false;
  }

  return ACTIVE_APPOINTMENT_STATUSES.includes(getAppointmentStatus(appointment));
}

export function isReleasedAppointment(appointment: Appointment | null | undefined): boolean {
  if (!appointment) {
    return false;
  }

  return RELEASED_APPOINTMENT_STATUSES.includes(getAppointmentStatus(appointment));
}

export function getSuggestedAvailableSlot(slots: AppointmentSlot[]): AppointmentSlot | null {
  return (
    slots.find(slot => !slot.appointment && !slot.isReserve) ||
    slots.find(slot => !slot.appointment) ||
    null
  );
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function buildDaySummary(date: Date, appointments: Appointment[]): AppointmentDaySummary {
  const dateStr = formatDateToISO(date);
  const dayAppointments = appointments.filter(appointment => appointment.scheduled_date === dateStr);
  const activeAppointments = dayAppointments.filter(isActiveAppointment);
  const releasedAppointments = dayAppointments.filter(isReleasedAppointment);
  const slots = generateSlotsForDate(date, activeAppointments);
  const occupiedSlots = slots.filter(slot => slot.appointment).length;
  const blockedSlots = slots.filter(slot => isBlockedAppointment(slot.appointment)).length;
  const reserveSlots = slots.filter(slot => slot.isReserve).length;
  const reserveOccupiedSlots = slots.filter(slot => slot.isReserve && slot.appointment && !isBlockedAppointment(slot.appointment)).length;
  const normalOccupiedSlots = slots.filter(slot => !slot.isReserve && slot.appointment && !isBlockedAppointment(slot.appointment)).length;
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
  if (dates.length === 0) {
    return [];
  }

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const startDate = formatDateToISO(sortedDates[0]);
  const endDate = formatDateToISO(sortedDates[sortedDates.length - 1]);
  const appointments = await getAppointmentsByDateRange(startDate, endDate);

  return dates.map(date => buildDaySummary(date, appointments));
}

const CAPACITY_PERIODS: CapacityPeriod[] = ['Manhã', 'Tarde', 'Reserva'];

function getPeriodBySlot(slotNumber: number, config: DayScheduleConfig): CapacityPeriod {
  const morningReserveSlots = config.morningReserveSlots || 0;
  const afternoonReserveSlots = config.afternoonReserveSlots || 0;
  const morningNormalEnd = config.morningSlots;
  const morningReserveEnd = morningNormalEnd + morningReserveSlots;
  const afternoonNormalEnd = morningReserveEnd + config.afternoonSlots;
  const afternoonReserveEnd = afternoonNormalEnd + afternoonReserveSlots;

  if (slotNumber <= morningNormalEnd) {
    return 'Manhã';
  }

  if (slotNumber <= morningReserveEnd) {
    return 'Reserva';
  }

  if (slotNumber <= afternoonNormalEnd) {
    return 'Tarde';
  }

  if (slotNumber <= afternoonReserveEnd) {
    return 'Reserva';
  }

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
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function matchesCapacityFilters(appointment: Appointment, filters: CapacityAnalyticsFilters): boolean {
  const acsMatches = filters.acsName === 'ALL' || appointment.acs_name === filters.acsName;
  const statusMatches = filters.status === 'ALL' || getAppointmentStatus(appointment) === filters.status;
  return acsMatches && statusMatches;
}

function summarizeCapacityKpis(
  summaries: AppointmentDaySummary[],
  filters: CapacityAnalyticsFilters,
): {
  kpis: CapacityKpiSnapshot;
  trend: CapacityTrendPoint[];
  statusDistribution: CapacityStatusDistribution[];
  turnDistribution: CapacityTurnDistribution[];
  acsRanking: CapacityAcsRankingItem[];
  uniqueAcs: string[];
} {
  const statusMap = new Map<AppointmentStatus, number>();
  const turnMap = new Map<CapacityPeriod, CapacityTurnDistribution>();
  const acsMap = new Map<string, CapacityAcsRankingItem>();
  const uniqueAcsSet = new Set<string>();
  const trend: CapacityTrendPoint[] = [];
  const totalKpis = buildCapacityKpiSnapshot();

  CAPACITY_PERIODS.forEach(period => {
    turnMap.set(period, {
      period,
      total: 0,
      occupied: 0,
      showCount: 0,
      noShowCount: 0,
      rescheduledCount: 0,
    });
  });

  summaries.forEach(summary => {
    if (!summary.dayConfig.hasService) {
      return;
    }

    const allAppointments = [...summary.appointments, ...summary.releasedAppointments]
      .filter(appointment => !isBlockedAppointment(appointment))
      .filter(appointment => matchesCapacityFilters(appointment, filters));

    allAppointments.forEach(appointment => {
      const status = getAppointmentStatus(appointment);
      uniqueAcsSet.add(appointment.acs_name);

      statusMap.set(status, (statusMap.get(status) || 0) + 1);

      const period = getPeriodBySlot(appointment.slot_number, summary.dayConfig);
      const turnStats = turnMap.get(period);
      if (turnStats) {
        turnStats.total += 1;

        if (isActiveAppointment(appointment)) {
          turnStats.occupied += 1;
        }
        if (status === 'Compareceu') {
          turnStats.showCount += 1;
        }
        if (status === 'Faltou') {
          turnStats.noShowCount += 1;
        }
        if (status === 'Remarcado') {
          turnStats.rescheduledCount += 1;
        }
      }

      const acs = acsMap.get(appointment.acs_name) || {
        acsName: appointment.acs_name,
        total: 0,
        showCount: 0,
        noShowCount: 0,
        rescheduledCount: 0,
        showRate: 0,
      };

      acs.total += 1;
      if (status === 'Compareceu') {
        acs.showCount += 1;
      }
      if (status === 'Faltou') {
        acs.noShowCount += 1;
      }
      if (status === 'Remarcado') {
        acs.rescheduledCount += 1;
      }

      acsMap.set(appointment.acs_name, acs);
    });

    const activeCount = allAppointments.filter(isActiveAppointment).length;
    const blockedCount = summary.slots.filter(
      slot =>
        Boolean(slot.appointment) &&
        isBlockedAppointment(slot.appointment) &&
        matchesCapacityFilters(slot.appointment!, filters)
    ).length;
    const totalSlots = summary.totalSlots;
    const occupiedCapacity = activeCount + blockedCount;
    const availableSlots = Math.max(totalSlots - occupiedCapacity, 0);
    const showCount = allAppointments.filter(appointment => getAppointmentStatus(appointment) === 'Compareceu').length;
    const noShowCount = allAppointments.filter(appointment => getAppointmentStatus(appointment) === 'Faltou').length;
    const rescheduledCount = allAppointments.filter(appointment => getAppointmentStatus(appointment) === 'Remarcado').length;
    const showBase = showCount + noShowCount;

    const dayPoint: CapacityTrendPoint = {
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
    };

    trend.push(dayPoint);

    totalKpis.totalSlots += totalSlots;
    totalKpis.occupiedSlots += activeCount;
    totalKpis.blockedSlots += blockedCount;
    totalKpis.availableSlots += availableSlots;
    totalKpis.showCount += showCount;
    totalKpis.noShowCount += noShowCount;
    totalKpis.rescheduledCount += rescheduledCount;
  });

  const occupiedCapacity = totalKpis.occupiedSlots + totalKpis.blockedSlots;
  totalKpis.occupancyRate = totalKpis.totalSlots > 0
    ? Math.round((occupiedCapacity / totalKpis.totalSlots) * 100)
    : 0;

  const showBase = totalKpis.showCount + totalKpis.noShowCount;
  totalKpis.showRate = showBase > 0 ? Math.round((totalKpis.showCount / showBase) * 100) : 0;

  const statusDistribution = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const turnDistribution = Array.from(turnMap.values());

  const acsRanking = Array.from(acsMap.values())
    .map(item => {
      const showBaseByAcs = item.showCount + item.noShowCount;
      return {
        ...item,
        showRate: showBaseByAcs > 0 ? Math.round((item.showCount / showBaseByAcs) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total || b.showRate - a.showRate);

  const uniqueAcs = Array.from(uniqueAcsSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return {
    kpis: totalKpis,
    trend,
    statusDistribution,
    turnDistribution,
    acsRanking,
    uniqueAcs,
  };
}

export function buildCapacityAnalyticsFromSummaries(
  currentSummaries: AppointmentDaySummary[],
  previousSummaries: AppointmentDaySummary[],
  filters: CapacityAnalyticsFilters,
): CapacityAnalyticsResult {
  const current = summarizeCapacityKpis(currentSummaries, filters);
  const previous = summarizeCapacityKpis(previousSummaries, filters);

  const busiestDays = [...current.trend]
    .sort((a, b) => b.occupancyRate - a.occupancyRate || b.occupiedSlots - a.occupiedSlots)
    .slice(0, 5);

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
    busiestDays,
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

export async function getCapacityAnalyticsForDateRange(
  startDate: Date,
  endDate: Date,
  filters: CapacityAnalyticsFilters,
): Promise<CapacityAnalyticsResult> {
  const currentDates = createDateRange(startDate, endDate);

  if (currentDates.length === 0) {
    return buildCapacityAnalyticsFromSummaries([], [], filters);
  }

  const previousEnd = addDays(currentDates[0], -1);
  const previousStart = addDays(previousEnd, -(currentDates.length - 1));
  const previousDates = createDateRange(previousStart, previousEnd);

  const [currentSummaries, previousSummaries] = await Promise.all([
    getAppointmentSummariesForDates(currentDates),
    getAppointmentSummariesForDates(previousDates),
  ]);

  return buildCapacityAnalyticsFromSummaries(currentSummaries, previousSummaries, filters);
}

/**
 * Gera a mensagem de notificação para WhatsApp.
 */
export function getAppointmentMessage(
  patientName: string, 
  date: string, 
  slotNumber: number,
  appointmentData?: Pick<CreateAppointmentData, 'home_visit_address' | 'home_visit_reference' | 'home_visit_reason'>
): string {
  // Obter data e configuração
  const dateObj = parseISODate(date);
  const config = getDayConfig(dateObj);
  
  const timeStr = getSlotTime(slotNumber, config);

  if (config.serviceType === 'HOME_VISIT') {
    const dateFormatted = dateObj.toLocaleDateString('pt-BR');
    const address = appointmentData?.home_visit_address?.trim();
    const reference = appointmentData?.home_visit_reference?.trim();
    const reason = appointmentData?.home_visit_reason?.trim();
    return `Olá *${patientName}*,

  Sua visita domiciliar está agendada para:
  📅 *${dateFormatted}*
  🔢 *Ficha:* ${slotNumber}
  ⏰ *Início da rota:* 09:00 — a equipe passará pelo endereço durante o período da manhã; não é possível informar horário exato.
  ${address ? `📍 *Endereço:* ${address}
  ` : ''}${reference ? `📌 *Referência:* ${reference}
  ` : ''}${reason ? `📝 *Motivo:* ${reason}
  ` : ''}

  Entendemos que é importante saber um horário preciso. As visitas domiciliares, no entanto, seguem uma rota: a equipe inicia a rota às *09:00* e visita vários domicílios em sequência. O tempo necessário em cada atendimento depende da complexidade do caso, de eventual deslocamento entre endereços, condições de acesso, e do tráfego local. Por isso não conseguimos garantir um horário exato para cada residência — informar uma hora estimada poderia gerar expectativas incorretas e atrapalhar a organização do serviço.

  Por favor, mantenha disponibilidade durante o período da manhã, deixe um responsável no local quando possível, e mantenha o telefone acessível para contato. Se houver necessidade de cancelar ou alterar o endereço, avise com antecedência para replanejarmos a rota.

  ⚠️ *Importante:*
  - ⚠️ *A ROTA COMEÇA ÀS 09:00:* aguarde a equipe no endereço informado durante o período da manhã.
  - Caso precise cancelar ou alterar o endereço, avise com antecedência.

  Obrigado,
  *Equipe PSF 5 Maria Lucia da Silva*`;
  }

  if (timeStr === 'Reserva') {
    return `Olá *${patientName}*,

Sua consulta por *Encaixe/Reserva* foi agendada para:
📅 *${dateObj.toLocaleDateString('pt-BR')}*

⚠️ *Importante:*
 - Por favor, aguarde contato ou dirija-se à unidade conforme orientado.
 - ⚠️ *AO CHEGAR:* dirija-se à recepção para *CONFIRMAR* sua chegada.
 - Cancelamentos devem ser avisados com antecedência.

Obrigado,
*Equipe PSF 5 Maria Lucia da Silva*`;
  }

  // Formatar data
  const dateFormatted = dateObj.toLocaleDateString('pt-BR');

  return `Olá *${patientName}*,

Sua consulta está agendada para:
📅 *${dateFormatted}*
⏰ *${timeStr}*

⚠️ *Importante:*
 - Por favor, chegue com *40 minutos de antecedência*.
 - ⚠️ *AO CHEGAR:* dirija-se à recepção para *CONFIRMAR* sua chegada.
 - Cancelamentos devem ser avisados com até *1 dia de antecedência*.

Obrigado,
*Equipe PSF 5 Maria Lucia da Silva*`;
}

/**
 * Bloqueia horários vazios de um dia com um motivo específico.
 * @param date - A data a ser bloqueada
 * @param reason - O motivo do bloqueio (ex: "Reunião", "Férias")
 * @param startSlot - Slot inicial (opcional, padrão 1)
 * @param endSlot - Slot final (opcional, padrão totalSlots)
 * @returns O número de slots bloqueados
 */
export async function blockDay(
  date: Date, 
  reason: string,
  startSlot?: number,
  endSlot?: number
): Promise<number> {
  const config = getDayConfig(date);
  if (!config.hasService) {
    throw new Error('Este dia não possui atendimento para ser bloqueado.');
  }

  const dateStr = formatDateToISO(date);
  const existingAppointments = await getAppointmentsByDate(dateStr);
  const occupiedSlots = new Set(
    existingAppointments.filter(isActiveAppointment).map(a => a.slot_number)
  );

  const newAppointments: CreateAppointmentData[] = [];
  
  const from = startSlot || 1;
  const to = endSlot || config.totalSlots;

  for (let i = from; i <= to; i++) {
    if (!occupiedSlots.has(i)) {
      newAppointments.push({
        scheduled_date: dateStr,
        slot_number: i,
        patient_name: reason,
        document_type: 'CPF',
        document_value: 'BLOQUEIO',
        acs_name: 'Administração',
        status: 'Agendado',
      });
    }
  }

  if (newAppointments.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from('appointments')
    .insert(newAppointments);

  if (error) {
    console.error('Erro ao bloquear dia:', error);
    throw error;
  }

  return newAppointments.length;
}
