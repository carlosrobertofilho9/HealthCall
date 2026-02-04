import { supabase } from '@/lib/supabaseClient';
import type { Appointment, CreateAppointmentData, AppointmentSlot, DayScheduleConfig } from '@/types';

// =============================================================================
// Configuração da Grade de Atendimento
// =============================================================================

/**
 * Configuração fixa da grade de atendimento por dia da semana.
 * Segunda: 30 slots (15 manhã + 15 tarde)
 * Terça: 15 slots (15 manhã)
 * Quarta a Domingo: Sem atendimento
 */
export const SCHEDULE_CONFIG: Record<number, DayScheduleConfig> = {
  0: { dayOfWeek: 0, dayName: 'Domingo', hasService: false, morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  1: { 
    dayOfWeek: 1, 
    dayName: 'Segunda-feira', 
    hasService: true, 
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
    morningSlots: 11, 
    morningReserveSlots: 4,
    afternoonSlots: 0, 
    afternoonReserveSlots: 0,
    totalSlots: 15 
  },
  3: { dayOfWeek: 3, dayName: 'Quarta-feira', hasService: false, morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  4: { dayOfWeek: 4, dayName: 'Quinta-feira', hasService: false, morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  5: { dayOfWeek: 5, dayName: 'Sexta-feira', hasService: false, morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
  6: { dayOfWeek: 6, dayName: 'Sábado', hasService: false, morningSlots: 0, afternoonSlots: 0, totalSlots: 0 },
};

/**
 * Obtém a configuração de atendimento para uma data específica.
 * @param date - A data a ser verificada
 * @returns A configuração do dia
 */
export function getDayConfig(date: Date): DayScheduleConfig {
  const dayOfWeek = date.getDay();
  return SCHEDULE_CONFIG[dayOfWeek];
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
  appointments.forEach(apt => {
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

    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
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
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
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
      .select('id')
      .eq('scheduled_date', date)
      .eq('slot_number', slotNumber)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar disponibilidade do slot:', error);
      throw error;
    }

    return data === null;
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
  const occupiedSlots = new Set(appointments.map(a => a.slot_number));
  
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

/**
 * Gera a mensagem de notificação para WhatsApp.
 */
export function getAppointmentMessage(
  patientName: string, 
  date: string, 
  slotNumber: number
): string {
  // Obter data e configuração
  const dateObj = parseISODate(date);
  const config = getDayConfig(dateObj);
  
  const timeStr = getSlotTime(slotNumber, config);
  if (timeStr === 'Reserva') {
    return `Olá *${patientName}*,

Sua consulta por *Encaixe/Reserva* foi agendada para:
📅 *${dateObj.toLocaleDateString('pt-BR')}*

⚠️ *Importante:*
- Por favor, aguarde contato ou dirija-se à unidade conforme orientado.
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
- Cancelamentos devem ser avisados com até *1 dia de antecedência*.

Obrigado,
*Equipe PSF 5 Maria Lucia da Silva*`;
}
