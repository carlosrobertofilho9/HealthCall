import { useState, useEffect, useCallback } from 'react';
import type { Appointment, AppointmentSlot, AppointmentStatus, CreateAppointmentData, DayScheduleConfig } from '@/types';
import {
  getAppointmentsByDate,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  bulkRescheduleAppointments,
  deleteAppointment,
  generateSlotsForDate,
  getDayConfig,
  formatDateToISO,
  isActiveAppointment,
  isReleasedAppointment,
} from '../services/appointmentService';
import { toast } from 'sonner';

/**
 * Hook para gerenciar marcações do PSF.
 * Fornece estado e operações para a página de marcações.
 */
export function useAppointments() {
  // Estado da data selecionada (padrão: hoje)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  
  // Configuração do dia selecionado
  const [dayConfig, setDayConfig] = useState<DayScheduleConfig>(() => getDayConfig(new Date()));
  
  // Lista de marcações do dia
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Histórico do dia que não ocupa slot
  const [releasedAppointments, setReleasedAppointments] = useState<Appointment[]>([]);
  
  // Slots gerados para o dia
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado de erro
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega as marcações para a data selecionada.
   */
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = formatDateToISO(selectedDate);
      const config = getDayConfig(selectedDate);
      setDayConfig(config);

      if (!config.hasService) {
        setAppointments([]);
        setReleasedAppointments([]);
        setSlots([]);
        return;
      }

      const data = await getAppointmentsByDate(dateStr);
      const activeAppointments = data.filter(isActiveAppointment);
      const releasedData = data.filter(isReleasedAppointment);
      setAppointments(activeAppointments);
      setReleasedAppointments(releasedData);
      
      const generatedSlots = generateSlotsForDate(selectedDate, activeAppointments);
      setSlots(generatedSlots);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar marcações';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  // Carregar marcações quando a data mudar
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  /**
   * Adiciona uma nova marcação.
   * @param data - Os dados da marcação
   */
  const addAppointment = async (data: CreateAppointmentData): Promise<boolean> => {
    try {
      setIsLoading(true);
      await createAppointment(data);
      toast.success('Marcação adicionada com sucesso!');
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar marcação';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza uma marcação existente.
   * @param id - O ID da marcação
   * @param updates - Os campos a serem atualizados
   */
  const editAppointment = async (
    id: string,
    updates: Partial<CreateAppointmentData>
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      await updateAppointment(id, updates);
      toast.success('Marcação atualizada com sucesso!');
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar marcação';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Remove uma marcação.
   * @param id - O ID da marcação
   */
  const removeAppointment = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await deleteAppointment(id);
      toast.success('Marcação removida com sucesso!');
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remover marcação';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, status: AppointmentStatus): Promise<boolean> => {
    try {
      setIsLoading(true);
      await updateAppointmentStatus(id, status);
      toast.success(`Status atualizado para "${status}"`);
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reschedule = async (
    id: string,
    scheduledDate: string,
    slotNumber: number
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      await rescheduleAppointment(id, scheduledDate, slotNumber);
      toast.success('Marcação remarcada com sucesso!');
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao remarcar marcação';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkReschedule = async (targetDate: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const sourceDate = formatDateToISO(selectedDate);
      const result = await bulkRescheduleAppointments(sourceDate, targetDate);
      toast.success(`${result.rescheduled_count} paciente(s) reagendado(s) com sucesso!`);
      await loadAppointments();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reagendar agenda';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Muda a data selecionada.
   * @param date - A nova data
   */
  const changeDate = (date: Date) => {
    setSelectedDate(date);
  };

  /**
   * Vai para o dia anterior.
   */
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  /**
   * Vai para o próximo dia.
   */
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  /**
   * Vai para hoje.
   */
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  /**
   * Conta slots ocupados e disponíveis.
   */
  const slotStats = {
    total: dayConfig.totalSlots,
    occupied: slots.filter(s => s.appointment !== null).length,
    available: slots.filter(s => s.appointment === null).length,
    morningOccupied: slots.filter(s => s.period === 'Manhã' && s.appointment !== null).length,
    afternoonOccupied: slots.filter(s => s.period === 'Tarde' && s.appointment !== null).length,
  };

  return {
    // Estado
    selectedDate,
    dayConfig,
    appointments,
    releasedAppointments,
    slots,
    isLoading,
    error,
    slotStats,
    
    // Ações
    addAppointment,
    editAppointment,
    removeAppointment,
    updateStatus,
    reschedule,
    bulkReschedule,
    changeDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    refresh: loadAppointments,
  };
}
