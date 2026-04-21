import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { getSlotTime } from '@/features/appointments/services/appointmentService';
import { useReceptionChat } from './useReceptionChat';
import type { Appointment } from '@/types';
import type { ReceptionCall, ReceptionQueueItem } from '../types';

function getStatusTimestamp(appointment: Appointment): number {
  const timestamp = new Date(appointment.status_updated_at).getTime();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

export function useReception() {
  const appointments = useAppointments();
  const chat = useReceptionChat();
  const [lastCall, setLastCall] = useState<ReceptionCall | null>(null);

  const todayAppointments = useMemo(
    () => appointments.appointments.filter((appointment) => appointment.status !== 'Remarcado'),
    [appointments.appointments],
  );

  const waitingQueue = useMemo<ReceptionQueueItem[]>(() => {
    const now = Date.now();

    return todayAppointments
      .filter((appointment) => appointment.status === 'Compareceu')
      .sort((a, b) => {
        const byStatusTime = getStatusTimestamp(a) - getStatusTimestamp(b);
        if (byStatusTime !== 0) return byStatusTime;
        return a.slot_number - b.slot_number;
      })
      .map((appointment) => ({
        ...appointment,
        waitMinutes: Math.max(0, Math.floor((now - getStatusTimestamp(appointment)) / 60000)),
      }));
  }, [todayAppointments]);

  const nextInQueue = waitingQueue[0] ?? null;

  const markAsShowedUp = async (appointmentId: string) => {
    await appointments.updateStatus(appointmentId, 'Compareceu');
  };

  const markAsNoShow = async (appointmentId: string) => {
    await appointments.updateStatus(appointmentId, 'Faltou');
  };

  const callNextPatient = () => {
    if (!nextInQueue) {
      toast.info('Não há paciente aguardando para chamar agora.');
      return;
    }

    const newCall: ReceptionCall = {
      patientName: nextInQueue.patient_name,
      slotNumber: nextInQueue.slot_number,
      calledAt: Date.now(),
    };

    setLastCall(newCall);
    toast.success(`Paciente ${nextInQueue.patient_name} chamado para atendimento.`);
  };

  const getSlotLabel = (slotNumber: number) => getSlotTime(slotNumber, appointments.dayConfig);

  return {
    ...appointments,
    ...chat,
    todayAppointments,
    waitingQueue,
    nextInQueue,
    lastCall,
    markAsShowedUp,
    markAsNoShow,
    callNextPatient,
    getSlotLabel,
  };
}
