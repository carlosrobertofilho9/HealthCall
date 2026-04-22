import { useMemo } from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { getSlotTime } from '@/features/appointments/services/appointmentService';
import { useReceptionChat } from './useReceptionChat';
import { useReceptionCallHistory } from './useReceptionCallHistory';

export function useReception() {
  const appointments = useAppointments();
  const chat = useReceptionChat();
  const callHistory = useReceptionCallHistory(appointments.selectedDate);

  const todayAppointments = useMemo(
    () => appointments.appointments.filter((appointment) => appointment.status !== 'Remarcado'),
    [appointments.appointments],
  );

  const getSlotLabel = (slotNumber: number) => getSlotTime(slotNumber, appointments.dayConfig);

  return {
    ...appointments,
    ...chat,
    ...callHistory,
    todayAppointments,
    getSlotLabel,
  };
}
