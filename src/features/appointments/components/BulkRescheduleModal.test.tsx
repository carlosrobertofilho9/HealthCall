import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BulkRescheduleModal from './BulkRescheduleModal';
import { getDayConfig } from '../services/appointmentService';
import type { Appointment } from '@/types';

vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual<typeof import('@/components/ui')>('@/components/ui');
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    DatePicker: ({ value, onChange }: { value?: string; onChange: (value: string) => void }) =>
      React.createElement('input', {
        'aria-label': 'Nova data',
        value: value || '',
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      }),
  };
});

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'appointment-1',
  scheduled_date: '2026-02-02',
  slot_number: 1,
  patient_name: 'Maria Silva',
  document_type: 'CPF',
  document_value: '12345678901',
  acs_name: 'ACS Ana',
  status: 'Agendado',
  status_updated_at: '2026-02-02T08:00:00.000Z',
  rescheduled_from_id: null,
  rescheduled_to_id: null,
  created_at: '2026-02-01T08:00:00.000Z',
  updated_at: '2026-02-01T08:00:00.000Z',
  ...overrides,
});

describe('BulkRescheduleModal', () => {
  const sourceDate = new Date(2026, 1, 2); // Segunda-feira
  const sourceConfig = getDayConfig(sourceDate);

  it('mostra a contagem e a prévia dos pacientes elegíveis', () => {
    render(
      <BulkRescheduleModal
        sourceDate={sourceDate}
        sourceConfig={sourceConfig}
        appointments={[
          makeAppointment({ slot_number: 1, patient_name: 'Maria Silva', acs_name: 'ACS Ana' }),
          makeAppointment({ id: 'appointment-2', slot_number: 5, patient_name: 'João Souza', acs_name: 'ACS Bia' }),
        ]}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('João Souza')).toBeInTheDocument();
    expect(screen.getByText('1, 5')).toBeInTheDocument();
  });

  it('confirma usando a data de destino compatível', () => {
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <BulkRescheduleModal
        sourceDate={sourceDate}
        sourceConfig={sourceConfig}
        appointments={[makeAppointment()]}
        onConfirm={onConfirm}
        onClose={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirmar reagendamento/i }));

    expect(onConfirm).toHaveBeenCalledWith('2026-02-03');
  });

  it('impede confirmação quando a data de destino é incompatível', () => {
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <BulkRescheduleModal
        sourceDate={sourceDate}
        sourceConfig={sourceConfig}
        appointments={[makeAppointment()]}
        onConfirm={onConfirm}
        onClose={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.change(screen.getByLabelText('Nova data'), { target: { value: '2026-02-04' } });

    expect(screen.getByText(/mesmo tipo de atendimento/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar reagendamento/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar reagendamento/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('impede confirmação quando a ficha preservada está bloqueada para Pré-Natal', () => {
    const onConfirm = vi.fn().mockResolvedValue(true);

    render(
      <BulkRescheduleModal
        sourceDate={sourceDate}
        sourceConfig={sourceConfig}
        appointments={[makeAppointment({ slot_number: 20 })]}
        onConfirm={onConfirm}
        onClose={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText(/fichas 20 bloqueadas para Pré-Natal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar reagendamento/i })).toBeDisabled();
  });
});
