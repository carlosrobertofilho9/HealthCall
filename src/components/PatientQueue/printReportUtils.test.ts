import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Appointment, AppointmentSlot } from '@/types';
import { printAppointmentReport, type PrintAppointmentReportOptions } from './printReportUtils';

const createPrintWindow = () => ({
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
});

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'appointment-1',
  scheduled_date: '2026-02-02',
  slot_number: 1,
  patient_name: 'Maria Silva',
  document_type: 'CPF',
  document_value: '12345678901',
  acs_name: 'ACS Centro',
  home_visit_address: null,
  home_visit_reference: null,
  home_visit_reason: null,
  status: 'Agendado',
  status_updated_at: '2026-02-01T10:00:00Z',
  rescheduled_from_id: null,
  rescheduled_to_id: null,
  created_at: '2026-02-01T10:00:00Z',
  updated_at: '2026-02-01T10:00:00Z',
  ...overrides,
});

const makeSlot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot => ({
  slotNumber: 1,
  period: 'Manhã',
  time: '08:00',
  isReserve: false,
  isAutoBlocked: false,
  appointment: null,
  ...overrides,
});

const renderReport = (
  slots: AppointmentSlot[],
  argument?: PrintAppointmentReportOptions | 'Manhã' | 'Tarde'
) => {
  const printWindow = createPrintWindow();
  vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

  printAppointmentReport(slots, argument);

  expect(printWindow.document.close).toHaveBeenCalledTimes(1);
  return printWindow.document.write.mock.calls[0][0] as string;
};

const countRows = (html: string) => (html.match(/<tr class="schedule-row/g) ?? []).length;

describe('printAppointmentReport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 21, 9, 15, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders a full 30-slot day as a single dense A4 report page', () => {
    const slots = Array.from({ length: 30 }, (_, index) => {
      const slotNumber = index + 1;
      const isMorning = slotNumber <= 15;
      return makeSlot({
        slotNumber,
        period: isMorning ? 'Manhã' : 'Tarde',
        time: isMorning ? '08:00' : '13:00',
      });
    });

    const html = renderReport(slots, { selectedDate: new Date(2026, 1, 2) });

    expect((html.match(/<main class="report-page/g) ?? [])).toHaveLength(1);
    expect(html).toContain('<main class="report-page dense">');
    expect(countRows(html)).toBe(30);
    expect(html).toContain('<strong>1</strong>');
    expect(html).toContain('<strong>30</strong>');
    expect(html).toContain('A4 · uma folha');
  });

  it('renders automatic prenatal blocks with pregnancy icon and prenatal row style', () => {
    const slots = [
      makeSlot({
        slotNumber: 16,
        period: 'Tarde',
        time: '13:00',
        isAutoBlocked: true,
        appointment: makeAppointment({
          id: 'auto-prenatal-16',
          slot_number: 16,
          patient_name: 'Pré-Natal',
          document_value: 'BLOQUEIO',
          acs_name: 'Administração',
        }),
      }),
    ];

    const html = renderReport(slots, { selectedDate: new Date(2026, 1, 3) });

    expect(html).toContain('<tr class="schedule-row row-prenatal">');
    expect(html).toContain('data-report-icon="pregnancy"');
    expect(html).toContain('Pré-Natal');
    expect(html).toContain('Turno reservado');
    expect(html).toContain('metric-prenatal');
  });

  it('renders manual blocks with lock icon without using the prenatal row style', () => {
    const slots = [
      makeSlot({
        slotNumber: 8,
        period: 'Manhã',
        time: '10:20',
        appointment: makeAppointment({
          id: 'blocked-8',
          slot_number: 8,
          patient_name: 'Reunião de equipe',
          document_value: 'BLOQUEIO',
          acs_name: 'Administração',
        }),
      }),
    ];

    const html = renderReport(slots, { selectedDate: new Date(2026, 1, 2) });

    expect(html).toContain('<tr class="schedule-row row-blocked">');
    expect(html).not.toContain('<tr class="schedule-row row-prenatal">');
    expect(html).toContain('data-report-icon="block"');
    expect(html).toContain('Reunião de equipe');
    expect(html).toContain('Bloqueio');
  });

  it('formats CPF, CNS and appointment status badges for regular appointments', () => {
    const slots = [
      makeSlot({
        slotNumber: 1,
        appointment: makeAppointment({
          slot_number: 1,
          patient_name: 'Maria Silva',
          document_type: 'CPF',
          document_value: '12345678901',
          status: 'Compareceu',
        }),
      }),
      makeSlot({
        slotNumber: 2,
        time: '08:20',
        appointment: makeAppointment({
          id: 'appointment-2',
          slot_number: 2,
          patient_name: 'João Santos',
          document_type: 'CARTAO_SUS',
          document_value: '705409419029900',
          status: 'Remarcado',
        }),
      }),
    ];

    const html = renderReport(slots, { selectedDate: new Date(2026, 1, 2) });

    expect(html).toContain('CPF: 123.456.789-01');
    expect(html).toContain('CNS: 705.4094.1902.9900');
    expect(html).toContain('Compareceu');
    expect(html).toContain('status-success');
    expect(html).toContain('Remarcado');
    expect(html).toContain('status-purple');
  });

  it('renders empty slots in a simplified available state', () => {
    const html = renderReport([
      makeSlot({ slotNumber: 3, time: '08:40' }),
    ], { selectedDate: new Date(2026, 1, 2) });

    expect(html).toContain('<tr class="schedule-row row-empty">');
    expect(html).toContain('Vaga livre');
    expect(html).toContain('Livre');
    expect(html).toContain('status-empty');
  });

  it('escapes user-provided fields before writing report HTML', () => {
    const html = renderReport([
      makeSlot({
        slotNumber: 4,
        appointment: makeAppointment({
          slot_number: 4,
          patient_name: '<Maria & Ana>',
          acs_name: 'ACS "Leste"',
          document_value: '12345678901',
        }),
      }),
    ], { selectedDate: new Date(2026, 1, 2) });

    expect(html).toContain('&lt;Maria &amp; Ana&gt;');
    expect(html).toContain('ACS &quot;Leste&quot;');
    expect(html).not.toContain('<Maria & Ana>');
    expect(html).not.toContain('ACS "Leste"');
  });

  it('filters slots by period and keeps compatibility with the legacy period argument', () => {
    const html = renderReport([
      makeSlot({
        slotNumber: 1,
        period: 'Manhã',
        appointment: makeAppointment({ patient_name: 'Paciente Manhã' }),
      }),
      makeSlot({
        slotNumber: 16,
        period: 'Tarde',
        time: '13:00',
        appointment: makeAppointment({
          id: 'appointment-afternoon',
          slot_number: 16,
          patient_name: 'Paciente Tarde',
        }),
      }),
    ], 'Tarde');

    expect(countRows(html)).toBe(1);
    expect(html).toContain('Paciente Tarde');
    expect(html).not.toContain('Paciente Manhã');
    expect(html).toContain('Relatório de Marcações - Tarde');
  });

  it('shows the selected agenda date separately from the emission date', () => {
    const html = renderReport([
      makeSlot({ appointment: makeAppointment() }),
    ], { selectedDate: new Date(2026, 1, 2) });

    expect(html).toContain('segunda-feira, 02 de fevereiro de 2026');
    expect(html).toContain('21/04/2026');
    expect(html).toContain('Data da agenda');
    expect(html).toContain('Data de emissão');
  });

  it('alerts and skips printing when the selected period has no configured slots', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const openSpy = vi.spyOn(window, 'open');

    printAppointmentReport([
      makeSlot({ period: 'Manhã' }),
    ], { periodFilter: 'Tarde', selectedDate: new Date(2026, 1, 2) });

    expect(alertSpy).toHaveBeenCalledWith('Não há slots configurados para o turno da tarde.');
    expect(openSpy).not.toHaveBeenCalled();
  });
});
