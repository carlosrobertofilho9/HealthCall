import { describe, expect, it, vi, afterEach } from 'vitest';
import type { AppointmentSlot } from '@/types';
import { printHomeVisitRoute } from './printHomeVisitRouteUtils';

const createPrintWindow = () => ({
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
});

describe('printHomeVisitRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include home visit data and observations column in the generated HTML', () => {
    const printWindow = createPrintWindow();
    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

    const slots: AppointmentSlot[] = [
      {
        slotNumber: 1,
        period: 'Manhã',
        time: '08:00',
        isReserve: false,
        appointment: {
          id: 'appointment-1',
          scheduled_date: '2026-02-04',
          slot_number: 1,
          patient_name: 'Maria Silva',
          document_type: 'CPF',
          document_value: '12345678901',
          acs_name: 'ACS Teste',
          home_visit_address: 'Rua A, 123',
          home_visit_reference: 'Portão azul',
          home_visit_reason: 'Curativo',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z',
        },
      },
    ];

    printHomeVisitRoute(slots, new Date(2026, 1, 4));

    const html = printWindow.document.write.mock.calls[0][0] as string;
    expect(html).toContain('Roteiro de Visitas Domiciliares');
    expect(html).toContain('Maria Silva');
    expect(html).toContain('Rua A, 123');
    expect(html).toContain('Portão azul');
    expect(html).toContain('Curativo');
    expect(html).toContain('Observações');
    expect(printWindow.document.close).toHaveBeenCalledTimes(1);
  });

  it('should render empty slots and blocked slots', () => {
    const printWindow = createPrintWindow();
    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

    const slots: AppointmentSlot[] = [
      {
        slotNumber: 1,
        period: 'Manhã',
        time: '08:00',
        isReserve: false,
        appointment: null,
      },
      {
        slotNumber: 2,
        period: 'Manhã',
        time: '08:20',
        isReserve: false,
        appointment: {
          id: 'appointment-2',
          scheduled_date: '2026-02-04',
          slot_number: 2,
          patient_name: 'Reunião',
          document_type: 'CPF',
          document_value: 'BLOQUEIO',
          acs_name: 'Administração',
          created_at: '2026-02-01T00:00:00Z',
          updated_at: '2026-02-01T00:00:00Z',
        },
      },
    ];

    printHomeVisitRoute(slots, new Date(2026, 1, 4));

    const html = printWindow.document.write.mock.calls[0][0] as string;
    expect(html).toContain('BLOQUEADO: Reunião');
    expect(html).toContain('08:00');
    expect(html).toContain('&nbsp;');
  });

  it('should alert when there are no configured slots', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const openSpy = vi.spyOn(window, 'open');

    printHomeVisitRoute([], new Date(2026, 1, 4));

    expect(alertSpy).toHaveBeenCalledWith('Não há visitas configuradas para este dia.');
    expect(openSpy).not.toHaveBeenCalled();
  });
});
