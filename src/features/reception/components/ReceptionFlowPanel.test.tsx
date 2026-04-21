import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceptionFlowPanel } from './ReceptionFlowPanel';
import type { AppointmentSlot } from '@/types';

const writeTextMock = vi.fn().mockResolvedValue(undefined);

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: writeTextMock,
  },
});

vi.mock('framer-motion', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
    layout?: unknown;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    whileTap?: unknown;
  };
  type MotionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    layout?: unknown;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    whileTap?: unknown;
  };
  type MotionSectionProps = React.HTMLAttributes<HTMLElement> & {
    layout?: unknown;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
  };

  const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(
    ({ children, layout, initial, animate, exit, whileTap, ...props }, ref) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  );
  MotionDiv.displayName = 'MotionDiv';

  const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
    ({ children, layout, initial, animate, exit, whileTap, ...props }, ref) => (
      <button ref={ref} {...props}>
        {children}
      </button>
    )
  );
  MotionButton.displayName = 'MotionButton';

  const MotionSection = React.forwardRef<HTMLElement, MotionSectionProps>(
    ({ children, layout, initial, animate, exit, ...props }, ref) => (
      <section ref={ref} {...props}>
        {children}
      </section>
    )
  );
  MotionSection.displayName = 'MotionSection';

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: MotionDiv,
      button: MotionButton,
      section: MotionSection,
    },
  };
});

vi.mock('@/components/PatientQueue/printReportUtils', () => ({
  printAppointmentReport: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

type ReceptionAppointment = React.ComponentProps<typeof ReceptionFlowPanel>['todayAppointments'][number];

const makeAppointment = (overrides: Partial<ReceptionAppointment> = {}): ReceptionAppointment => ({
  id: 'appointment-1',
  patient_name: 'Maria Sebastiao',
  slot_number: 1,
  status: 'Agendado',
  document_type: 'CARTAO_SUS',
  document_value: '70540941902990',
  ...overrides,
});

const makeSlot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot => ({
  slotNumber: 1,
  period: 'Manhã',
  time: '08:00',
  isReserve: false,
  appointment: null,
  ...overrides,
});

const renderPanel = (overrides: Partial<React.ComponentProps<typeof ReceptionFlowPanel>> = {}) => {
  const updateStatus = vi.fn().mockResolvedValue(true);
  const props: React.ComponentProps<typeof ReceptionFlowPanel> = {
    todayAppointments: [makeAppointment()],
    presenceSummary: {
      showedUp: 0,
      noShow: 0,
      scheduled: 1,
      total: 1,
    },
    isLoading: false,
    updateStatus,
    getSlotLabel: (slot) => (slot === 1 ? '08:00' : '09:00'),
    goToToday: vi.fn(),
    changeDate: vi.fn(),
    selectedDate: new Date(2026, 3, 21, 12),
    refresh: vi.fn(),
    slots: [makeSlot()],
    ...overrides,
  };

  render(<ReceptionFlowPanel {...props} />);

  return {
    updateStatus,
  };
};

describe('ReceptionFlowPanel', () => {
  beforeEach(() => {
    writeTextMock.mockClear();
  });

  it('destaca a ficha como número sem exibir a palavra Slot no card do paciente', () => {
    renderPanel();

    expect(screen.getByLabelText('Ficha 1')).toBeInTheDocument();
    expect(screen.queryByText(/Slot/i)).not.toBeInTheDocument();
  });

  it('destaca o horário em área própria do card', () => {
    renderPanel();

    expect(screen.getByLabelText('Horário 08:00')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('mostra Agendado pequeno abaixo do horário somente para pacientes agendados', () => {
    renderPanel();

    const timeBlock = screen.getByLabelText('Horário 08:00');
    expect(within(timeBlock).getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Maria Sebastiao/i })).not.toHaveTextContent('Agendado');
  });

  it('oculta o status abaixo do horário quando o paciente está presente ou faltou', () => {
    renderPanel({
      todayAppointments: [
        makeAppointment({
          status: 'Compareceu',
        }),
      ],
    });

    expect(screen.getByLabelText('Horário 08:00')).not.toHaveTextContent('Agendado');
    expect(screen.queryByText('Compareceu')).not.toBeInTheDocument();
    expect(screen.queryByText('Faltou')).not.toBeInTheDocument();
  });

  it('separa a lista de pacientes entre manhã e tarde', () => {
    renderPanel({
      todayAppointments: [
        makeAppointment({ id: 'appointment-1', patient_name: 'Maria Sebastiao', slot_number: 1 }),
        makeAppointment({ id: 'appointment-2', patient_name: 'Joao da Tarde', slot_number: 16 }),
      ],
      slots: [
        makeSlot({ slotNumber: 1, period: 'Manhã', time: '08:00' }),
        makeSlot({ slotNumber: 16, period: 'Tarde', time: '13:00' }),
      ],
    });

    expect(screen.getByRole('heading', { name: 'Manhã' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tarde' })).toBeInTheDocument();
    expect(screen.getByText('Maria Sebastiao')).toBeInTheDocument();
    expect(screen.getByText('Joao da Tarde')).toBeInTheDocument();
  });

  it('formata CARTAO_SUS como CNS visível no chip de documento', () => {
    renderPanel();

    expect(screen.getByText('CNS')).toBeInTheDocument();
    expect(screen.getByText('705.4094.1902.990')).toBeInTheDocument();
    expect(screen.queryByText(/CARTAO_SUS/i)).not.toBeInTheDocument();
  });

  it('formata CPF quando esse é o documento do paciente', () => {
    renderPanel({
      todayAppointments: [
        makeAppointment({
          document_type: 'CPF',
          document_value: '12345678901',
        }),
      ],
    });

    expect(screen.getByText('CPF')).toBeInTheDocument();
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument();
  });

  it('aciona os botões principais de presença e falta com os status corretos', () => {
    const { updateStatus } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /PRESENTE/i }));
    fireEvent.click(screen.getByRole('button', { name: /FALTA/i }));

    expect(updateStatus).toHaveBeenNthCalledWith(1, 'appointment-1', 'Compareceu');
    expect(updateStatus).toHaveBeenNthCalledWith(2, 'appointment-1', 'Faltou');
  });

  it('mantém o botão do status atual marcado como ativo', () => {
    renderPanel({
      todayAppointments: [
        makeAppointment({
          status: 'Compareceu',
        }),
      ],
    });

    const presentButton = screen.getByRole('button', { name: /PRESENTE/i });
    const noShowButton = screen.getByRole('button', { name: /FALTA/i });

    expect(presentButton).toHaveAttribute('aria-pressed', 'true');
    expect(noShowButton).toHaveAttribute('aria-pressed', 'false');
    expect(within(presentButton).getByText('PRESENTE')).toBeInTheDocument();
  });

  it('permite voltar para Agendado quando presença ou falta foi marcada por engano', () => {
    const { updateStatus } = renderPanel({
      todayAppointments: [
        makeAppointment({
          status: 'Compareceu',
        }),
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: /Voltar para agendado/i }));

    expect(updateStatus).toHaveBeenCalledWith('appointment-1', 'Agendado');
  });

  it('não mostra a ação de voltar quando o paciente já está agendado', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: /Voltar para agendado/i })).not.toBeInTheDocument();
  });

  it('copia o nome do paciente ao clicar no nome', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /Maria Sebastiao/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('Maria Sebastiao');
    });
  });

  it('copia os dígitos do CNS/CPF ao clicar no documento', async () => {
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: /CNS 705\.4094\.1902\.990/i }));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('70540941902990');
    });
  });
});
