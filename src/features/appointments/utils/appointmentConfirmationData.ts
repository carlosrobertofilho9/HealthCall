import type { Appointment, AppointmentStatus, DayScheduleConfig } from '@/types';
import { formatCPF, formatCNS } from '@/lib/utils';
import {
  getAppointmentMessage,
  getAppointmentStatus,
  getDayConfig,
  getSlotTime,
  parseISODate,
} from '../services/appointmentService';

export type AppointmentConfirmationData = {
  patientName: string;
  documentLabel: string;
  acsName: string;
  scheduledDateLabel: string;
  serviceLabel: string;
  serviceType: DayScheduleConfig['serviceType'];
  slotNumber: number;
  slotLabel: string;
  timeLabel: string;
  status: AppointmentStatus;
  message: string;
  importantNotes: string[];
  homeVisitAddress?: string;
  homeVisitReference?: string;
  homeVisitReason?: string;
  teamSignature: string;
};

const formatAppointmentDocument = (appointment: Appointment): string => {
  if (appointment.document_type === 'CPF') {
    return formatCPF(appointment.document_value);
  }

  return formatCNS(appointment.document_value);
};

const extractImportantNotes = (message: string): string[] =>
  message
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.replace(/^- /, '').replace(/\*/g, '').trim())
    .filter(Boolean);

const extractTeamSignature = (message: string): string => {
  const lines = message
    .split('\n')
    .map(line => line.trim().replace(/\*/g, ''))
    .filter(Boolean);

  return lines[lines.length - 1] || 'Equipe PSF 5 Maria Lucia da Silva';
};

export function buildAppointmentConfirmationData(appointment: Appointment): AppointmentConfirmationData {
  const date = parseISODate(appointment.scheduled_date);
  const dayConfig = getDayConfig(date);
  const time = getSlotTime(appointment.slot_number, dayConfig);
  const message = getAppointmentMessage(
    appointment.patient_name,
    appointment.scheduled_date,
    appointment.slot_number,
    appointment,
  );

  const isHomeVisit = dayConfig.serviceType === 'HOME_VISIT';
  const isReserve = time === 'Reserva';
  const serviceLabel = isHomeVisit
    ? 'Visita domiciliar'
    : isReserve
      ? 'Consulta por encaixe/reserva'
      : 'Consulta na UBS';

  return {
    patientName: appointment.patient_name,
    documentLabel: formatAppointmentDocument(appointment),
    acsName: appointment.acs_name,
    scheduledDateLabel: date.toLocaleDateString('pt-BR'),
    serviceLabel,
    serviceType: dayConfig.serviceType,
    slotNumber: appointment.slot_number,
    slotLabel: `Ficha ${appointment.slot_number}`,
    timeLabel: isReserve ? 'Encaixe/Reserva' : time,
    status: getAppointmentStatus(appointment),
    message,
    importantNotes: extractImportantNotes(message),
    homeVisitAddress: appointment.home_visit_address?.trim() || undefined,
    homeVisitReference: appointment.home_visit_reference?.trim() || undefined,
    homeVisitReason: appointment.home_visit_reason?.trim() || undefined,
    teamSignature: extractTeamSignature(message),
  };
}
