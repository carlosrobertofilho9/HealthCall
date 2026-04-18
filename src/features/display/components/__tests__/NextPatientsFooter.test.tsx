import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment, Patient } from '@/types';
import { NextPatientsFooter } from '../NextPatientsFooter';

const patients: Patient[] = [
  {
    id: '1',
    name: 'Paciente Um',
    destination: 'Triagem',
    status: 'Aguardando',
    callCount: 0,
    queue_order: 1,
  },
  {
    id: '2',
    name: 'Paciente Dois',
    destination: 'Consultório Médico',
    status: 'Aguardando',
    callCount: 0,
    queue_order: 2,
  },
  {
    id: '3',
    name: 'Paciente Três',
    destination: 'Sala de Vacinação',
    status: 'Aguardando',
    callCount: 0,
    queue_order: 3,
  },
  {
    id: '4',
    name: 'Paciente Quatro',
    destination: 'Odonto',
    status: 'Aguardando',
    callCount: 0,
    queue_order: 4,
  },
];

const appointments: Appointment[] = [
  {
    id: 'appointment-1',
    scheduled_date: '2026-04-18',
    slot_number: 1,
    patient_name: 'Agendado Um',
    document_type: 'CPF',
    document_value: '00000000000',
    acs_name: 'ACS',
    status: 'Agendado',
    status_updated_at: '2026-04-18T09:00:00.000Z',
    created_at: '2026-04-18T09:00:00.000Z',
    updated_at: '2026-04-18T09:00:00.000Z',
  },
  {
    id: 'appointment-2',
    scheduled_date: '2026-04-18',
    slot_number: 2,
    patient_name: 'Agendado Dois',
    document_type: 'CPF',
    document_value: '00000000001',
    acs_name: 'ACS',
    status: 'Agendado',
    status_updated_at: '2026-04-18T09:00:00.000Z',
    created_at: '2026-04-18T09:00:00.000Z',
    updated_at: '2026-04-18T09:00:00.000Z',
  },
];

describe('NextPatientsFooter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 18, 9, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exibe até 3 próximos pacientes', () => {
    render(<NextPatientsFooter nextPatients={patients} />);

    expect(screen.getByText('Próximos pacientes')).toBeInTheDocument();
    expect(screen.getByText('Paciente Um')).toBeInTheDocument();
    expect(screen.getByText('Paciente Dois')).toBeInTheDocument();
    expect(screen.getByText('Paciente Três')).toBeInTheDocument();
    expect(screen.queryByText('Paciente Quatro')).not.toBeInTheDocument();
  });

  it('alterna para horário e orientações fixas', () => {
    render(<NextPatientsFooter nextPatients={patients} scheduledAppointmentsAwaitingCheckIn={appointments} />);

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText('Pacientes agendados aguardando check-in')).toBeInTheDocument();
    expect(screen.getByText('Agendado Um')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText('Horário atual')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText('Mantenha seu cartão SUS em mãos')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(12000);
    });
    expect(screen.getByText('Aguarde ser chamado')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há pacientes', () => {
    render(<NextPatientsFooter nextPatients={[]} />);

    expect(screen.getByText('Não há pacientes na fila de espera.')).toBeInTheDocument();
  });

  it('mostra estado vazio para pacientes agendados aguardando check-in', () => {
    render(<NextPatientsFooter nextPatients={[]} scheduledAppointmentsAwaitingCheckIn={[]} />);

    act(() => {
      vi.advanceTimersByTime(12000);
    });

    expect(screen.getByText('Não há pacientes agendados aguardando check-in.')).toBeInTheDocument();
  });
});
