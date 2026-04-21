import { describe, expect, it, vi } from 'vitest';
import type { Appointment } from '@/types';
import { buildAppointmentConfirmationData } from './appointmentConfirmationData';

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {},
}));

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'appointment-id',
  scheduled_date: '2026-02-02',
  slot_number: 1,
  patient_name: 'Maria Silva',
  document_type: 'CPF',
  document_value: '12345678901',
  acs_name: 'ACS Ana',
  status: 'Agendado',
  status_updated_at: '2026-02-01T10:00:00.000Z',
  rescheduled_from_id: null,
  rescheduled_to_id: null,
  created_at: '2026-02-01T10:00:00.000Z',
  updated_at: '2026-02-01T10:00:00.000Z',
  ...overrides,
});

describe('buildAppointmentConfirmationData', () => {
  it('monta confirmação para consulta UBS com horário normal', () => {
    const data = buildAppointmentConfirmationData(makeAppointment());

    expect(data).toMatchObject({
      patientName: 'Maria Silva',
      documentLabel: '123.456.789-01',
      acsName: 'ACS Ana',
      scheduledDateLabel: '02/02/2026',
      serviceLabel: 'Consulta na UBS',
      serviceType: 'UBS',
      slotNumber: 1,
      slotLabel: 'Ficha 1',
      timeLabel: '08:00',
      status: 'Agendado',
      teamSignature: 'Equipe PSF 5 Maria Lucia da Silva',
    });
    expect(data.message).toContain('Sua consulta está agendada para:');
    expect(data.message).toContain('⏰ *08:00*');
    expect(data.importantNotes).toEqual([
      'Por favor, chegue com 40 minutos de antecedência.',
      'Cancelamentos devem ser avisados com até 1 dia de antecedência.',
    ]);
  });

  it('monta confirmação para consulta em ficha de reserva', () => {
    const data = buildAppointmentConfirmationData(makeAppointment({ slot_number: 12 }));

    expect(data.serviceLabel).toBe('Consulta por encaixe/reserva');
    expect(data.slotLabel).toBe('Ficha 12');
    expect(data.timeLabel).toBe('Encaixe/Reserva');
    expect(data.message).toContain('Sua consulta por *Encaixe/Reserva* foi agendada para:');
    expect(data.importantNotes).toEqual([
      'Por favor, aguarde contato ou dirija-se à unidade conforme orientado.',
      'Cancelamentos devem ser avisados com antecedência.',
    ]);
  });

  it('monta confirmação para visita domiciliar com endereço, referência e motivo', () => {
    const data = buildAppointmentConfirmationData(makeAppointment({
      scheduled_date: '2026-02-04',
      slot_number: 3,
      document_type: 'CARTAO_SUS',
      document_value: '123456789012345',
      home_visit_address: 'Rua das Flores, 100',
      home_visit_reference: 'Ao lado da escola',
      home_visit_reason: 'Curativo domiciliar',
    }));

    expect(data).toMatchObject({
      documentLabel: '123.4567.8901.2345',
      scheduledDateLabel: '04/02/2026',
      serviceLabel: 'Visita domiciliar',
      serviceType: 'HOME_VISIT',
      slotLabel: 'Ficha 3',
      timeLabel: '08:40',
      homeVisitAddress: 'Rua das Flores, 100',
      homeVisitReference: 'Ao lado da escola',
      homeVisitReason: 'Curativo domiciliar',
    });
    expect(data.message).toContain('Sua visita domiciliar está agendada para:');
    expect(data.message).toContain('📍 *Endereço:* Rua das Flores, 100');
    expect(data.message).toContain('📌 *Referência:* Ao lado da escola');
    expect(data.message).toContain('📝 *Motivo:* Curativo domiciliar');
  });

  it('mantém visita domiciliar sem campos opcionais como não informada no helper', () => {
    const data = buildAppointmentConfirmationData(makeAppointment({
      scheduled_date: '2026-02-04',
      slot_number: 1,
      home_visit_address: null,
      home_visit_reference: '',
      home_visit_reason: null,
    }));

    expect(data.serviceLabel).toBe('Visita domiciliar');
    expect(data.homeVisitAddress).toBeUndefined();
    expect(data.homeVisitReference).toBeUndefined();
    expect(data.homeVisitReason).toBeUndefined();
  });

  it('formata documento CNS e data para exibição no PDF', () => {
    const data = buildAppointmentConfirmationData(makeAppointment({
      scheduled_date: '2026-02-03',
      document_type: 'CARTAO_SUS',
      document_value: '987654321098765',
    }));

    expect(data.documentLabel).toBe('987.6543.2109.8765');
    expect(data.scheduledDateLabel).toBe('03/02/2026');
  });
});
