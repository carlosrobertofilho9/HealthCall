import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildCapacityAnalyticsFromSummaries,
  blockDay,
  createAppointment,
  generateSlotsForDate,
  getDayConfig,
  isActiveAppointment,
  isReleasedAppointment,
  ACTIVE_APPOINTMENT_STATUSES,
  RELEASED_APPOINTMENT_STATUSES,
  rescheduleAppointment,
  bulkRescheduleAppointments,
  getSuggestedAvailableSlot,
  buildDaySummary,
} from './appointmentService';
import type { Appointment } from '@/types';

// =============================================================================
// Mock Setup
// =============================================================================

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSingle = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockUpdate = vi.fn();
  const mockIn = vi.fn();
  const mockRpc = vi.fn();

  const mockSupabaseChain = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
    single: mockSingle,
    gte: mockGte,
    lte: mockLte,
    in: mockIn,
  };

  mockSelect.mockReturnValue(mockSupabaseChain);
  mockEq.mockReturnValue(mockSupabaseChain);
  mockOrder.mockReturnValue(mockSupabaseChain);
  mockInsert.mockReturnValue(mockSupabaseChain);
  mockUpdate.mockReturnValue(mockSupabaseChain);
  mockGte.mockReturnValue(mockSupabaseChain);
  mockLte.mockReturnValue(mockSupabaseChain);
  mockIn.mockReturnValue(mockSupabaseChain);

  const mockFrom = vi.fn(() => mockSupabaseChain);

  return {
    mockFrom,
    mockSelect,
    mockInsert,
    mockUpdate,
    mockEq,
    mockOrder,
    mockSingle,
    mockGte,
    mockLte,
    mockIn,
    mockRpc,
    mockSupabaseChain,
  };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mocks.mockFrom,
    rpc: mocks.mockRpc,
  },
}));

// =============================================================================
// Helpers
// =============================================================================

const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'test-id',
  scheduled_date: '2026-02-02',
  slot_number: 1,
  patient_name: 'Paciente Teste',
  document_type: 'CPF',
  document_value: '12345678901',
  acs_name: 'ACS Teste',
  status: 'Agendado',
  status_updated_at: new Date().toISOString(),
  rescheduled_from_id: null,
  rescheduled_to_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();

  mocks.mockFrom.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockSelect.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockEq.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockOrder.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockInsert.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockUpdate.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockGte.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockLte.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockIn.mockReturnValue(mocks.mockSupabaseChain);
  mocks.mockSingle.mockResolvedValue({ data: { id: 'appointment-id' }, error: null });
});

// =============================================================================
// Slot Config Tests
// =============================================================================

describe('getDayConfig', () => {
  it('should configure Wednesday as HOME_VISIT day with 15 total slots', () => {
    const wednesday = new Date(2026, 1, 4);
    const config = getDayConfig(wednesday);
    expect(config).toMatchObject({
      dayName: 'Quarta-feira',
      hasService: true,
      serviceType: 'HOME_VISIT',
      totalSlots: 15,
      morningSlots: 11,
      morningReserveSlots: 4,
      afternoonSlots: 0,
    });
  });

  it('should generate 15 morning slots for Wednesday (11 normal + 4 reserve)', () => {
    const wednesday = new Date(2026, 1, 4);
    const slots = generateSlotsForDate(wednesday, []);
    expect(slots).toHaveLength(15);
    expect(slots.every(slot => slot.period === 'Manhã')).toBe(true);
    expect(slots.filter(slot => slot.isReserve)).toHaveLength(4);
  });
});

// =============================================================================
// Status Helper Tests
// =============================================================================

describe('isActiveAppointment / isReleasedAppointment', () => {
  it('should identify Agendado as active', () => {
    expect(isActiveAppointment(makeAppointment({ status: 'Agendado' }))).toBe(true);
    expect(isReleasedAppointment(makeAppointment({ status: 'Agendado' }))).toBe(false);
  });

  it('should identify Compareceu as active (occupies slot historically)', () => {
    expect(isActiveAppointment(makeAppointment({ status: 'Compareceu' }))).toBe(true);
  });

  it('should identify Faltou as active (occupies slot historically)', () => {
    expect(isActiveAppointment(makeAppointment({ status: 'Faltou' }))).toBe(true);
  });

  it('should identify Remarcado as released (frees the slot)', () => {
    expect(isReleasedAppointment(makeAppointment({ status: 'Remarcado' }))).toBe(true);
    expect(isActiveAppointment(makeAppointment({ status: 'Remarcado' }))).toBe(false);
  });

  it('should return false for null/undefined appointment', () => {
    expect(isActiveAppointment(null)).toBe(false);
    expect(isActiveAppointment(undefined)).toBe(false);
    expect(isReleasedAppointment(null)).toBe(false);
  });

  it('ACTIVE_APPOINTMENT_STATUSES should contain exactly 3 statuses', () => {
    expect(ACTIVE_APPOINTMENT_STATUSES).toEqual(
      expect.arrayContaining(['Agendado', 'Compareceu', 'Faltou'])
    );
    expect(ACTIVE_APPOINTMENT_STATUSES).toHaveLength(3);
  });

  it('RELEASED_APPOINTMENT_STATUSES should contain apenas Remarcado', () => {
    expect(RELEASED_APPOINTMENT_STATUSES).toEqual(
      expect.arrayContaining(['Remarcado'])
    );
    expect(RELEASED_APPOINTMENT_STATUSES).toHaveLength(1);
  });
});

// =============================================================================
// Slot Occupancy via generateSlotsForDate
// =============================================================================

describe('generateSlotsForDate slot occupancy', () => {
  const monday = new Date(2026, 1, 2); // Monday = 30 slots

  it('Remarcado appointment does NOT occupy its slot', () => {
    const rescheduled = makeAppointment({ slot_number: 5, status: 'Remarcado' });
    const slots = generateSlotsForDate(monday, [rescheduled]);
    const slot5 = slots.find(s => s.slotNumber === 5)!;
    expect(slot5.appointment).toBeNull();
  });

  it('Agendado appointment OCCUPIES its slot', () => {
    const agendado = makeAppointment({ slot_number: 1, status: 'Agendado' });
    const slots = generateSlotsForDate(monday, [agendado]);
    const slot1 = slots.find(s => s.slotNumber === 1)!;
    expect(slot1.appointment).not.toBeNull();
    expect(slot1.appointment!.status).toBe('Agendado');
  });

  it('Compareceu appointment OCCUPIES its slot', () => {
    const compareceu = makeAppointment({ slot_number: 4, status: 'Compareceu' });
    const slots = generateSlotsForDate(monday, [compareceu]);
    const slot4 = slots.find(s => s.slotNumber === 4)!;
    expect(slot4.appointment).not.toBeNull();
  });

  it('Faltou appointment OCCUPIES its slot (historical capacity)', () => {
    const faltou = makeAppointment({ slot_number: 6, status: 'Faltou' });
    const slots = generateSlotsForDate(monday, [faltou]);
    const slot6 = slots.find(s => s.slotNumber === 6)!;
    expect(slot6.appointment).not.toBeNull();
  });
});

// =============================================================================
// buildDaySummary — weekly/capacity summaries ignore released
// =============================================================================

describe('buildDaySummary', () => {
  const monday = new Date(2026, 1, 2);

  it('should separate active and released appointments', () => {
    const appointments: Appointment[] = [
      makeAppointment({ slot_number: 1, status: 'Agendado' }),
      makeAppointment({ slot_number: 3, status: 'Remarcado', id: 'rescheduled-id' }),
      makeAppointment({ slot_number: 4, status: 'Compareceu', id: 'attended-id' }),
    ];

    const summary = buildDaySummary(monday, appointments);
    expect(summary.appointments).toHaveLength(2); // Agendado + Compareceu
    expect(summary.releasedAppointments).toHaveLength(1); // Remarcado
  });

  it('should not count Remarcado in occupiedSlots', () => {
    const appointments: Appointment[] = [
      makeAppointment({ slot_number: 1, status: 'Agendado' }),
      makeAppointment({ slot_number: 1, status: 'Remarcado', id: 'old-rescheduled' }),
    ];

    const summary = buildDaySummary(monday, appointments);
    expect(summary.appointments).toHaveLength(1);
    expect(summary.occupiedSlots).toBe(1);
  });
});

// =============================================================================
// createAppointment — default status
// =============================================================================

describe('createAppointment', () => {
  it('new appointment receives Agendado status by default', async () => {
    const result = await createAppointment({
      scheduled_date: '2026-02-03',
      slot_number: 1,
      patient_name: 'João Silva',
      document_type: 'CPF',
      document_value: '12345678901',
      acs_name: 'ACS Teste',
    });

    expect(result).toEqual({ id: 'appointment-id' });
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
    const payload = mocks.mockInsert.mock.calls[0][0][0];
    expect(payload.status).toBe('Agendado');
  });

  it('new appointment can have explicit status', async () => {
    await createAppointment({
      scheduled_date: '2026-02-03',
      slot_number: 2,
      patient_name: 'Maria Santos',
      document_type: 'CPF',
      document_value: '98765432100',
      acs_name: 'ACS Teste',
      status: 'Faltou',
    });

    const payload = mocks.mockInsert.mock.calls[0][0][0];
    expect(payload.status).toBe('Faltou');
  });

  it('should reject Wednesday appointments without an address', async () => {
    await expect(createAppointment({
      scheduled_date: '2026-02-04',
      slot_number: 1,
      patient_name: 'Maria Silva',
      document_type: 'CPF',
      document_value: '12345678901',
      acs_name: 'ACS Teste',
      home_visit_reason: 'Curativo',
    })).rejects.toThrow('Endereço da visita domiciliar é obrigatório');

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('should reject Wednesday appointments without a reason', async () => {
    await expect(createAppointment({
      scheduled_date: '2026-02-04',
      slot_number: 1,
      patient_name: 'Maria Silva',
      document_type: 'CPF',
      document_value: '12345678901',
      acs_name: 'ACS Teste',
      home_visit_address: 'Rua A, 123',
    })).rejects.toThrow('Motivo da visita domiciliar é obrigatório');

    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('should accept Tuesday appointments without home visit fields', async () => {
    const result = await createAppointment({
      scheduled_date: '2026-02-03',
      slot_number: 1,
      patient_name: 'João Silva',
      document_type: 'CPF',
      document_value: '12345678901',
      acs_name: 'ACS Teste',
    });

    expect(result).toEqual({ id: 'appointment-id' });
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// blockDay — creates active blockers
// =============================================================================

describe('blockDay', () => {
  it('should create appointments for empty slots on a service day', async () => {
    const monday = new Date(2026, 1, 2);

    mocks.mockOrder.mockResolvedValue({
      data: [
        { slot_number: 1, status: 'Agendado' },
        { slot_number: 2, status: 'Agendado' },
      ],
      error: null,
    });

    const count = await blockDay(monday, 'Reunião');

    expect(count).toBe(28);
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);

    const inserted = mocks.mockInsert.mock.calls[0][0];
    expect(inserted).toHaveLength(28);
    expect(inserted[0]).toMatchObject({
      patient_name: 'Reunião',
      document_value: 'BLOQUEIO',
      acs_name: 'Administração',
      status: 'Agendado',
    });
  });

  it('blockDay creates blockers with status Agendado (active, occupies slot)', async () => {
    const monday = new Date(2026, 1, 2);
    mocks.mockOrder.mockResolvedValue({ data: [], error: null });

    await blockDay(monday, 'Férias');

    const inserted = mocks.mockInsert.mock.calls[0][0];
    expect(inserted[0].status).toBe('Agendado');
    expect(inserted[0].document_value).toBe('BLOQUEIO');
  });

  it('should not block if day has no service', async () => {
    const sunday = new Date(2026, 1, 1);
    await expect(blockDay(sunday, 'Reunião')).rejects.toThrow('Este dia não possui atendimento');
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('should return 0 if all slots are full', async () => {
    const monday = new Date(2026, 1, 2);
    const fullSlots = Array.from({ length: 30 }, (_, i) => ({
      slot_number: i + 1,
      status: 'Agendado',
    }));
    mocks.mockOrder.mockResolvedValue({ data: fullSlots, error: null });

    const count = await blockDay(monday, 'Reunião');
    expect(count).toBe(0);
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('should block empty Wednesday home visit slots without home visit fields', async () => {
    const wednesday = new Date(2026, 1, 4);
    mocks.mockOrder.mockResolvedValue({
      data: [{ slot_number: 1, status: 'Agendado' }],
      error: null,
    });

    const count = await blockDay(wednesday, 'Capacitação');

    expect(count).toBe(14);
    const inserted = mocks.mockInsert.mock.calls[0][0];
    expect(inserted[0]).toMatchObject({
      patient_name: 'Capacitação',
      document_value: 'BLOQUEIO',
      acs_name: 'Administração',
    });
    expect(inserted[0]).not.toHaveProperty('home_visit_address');
    expect(inserted[0]).not.toHaveProperty('home_visit_reason');
  });

  it('Remarcado appointments free their slots (no blockDay conflict)', async () => {
    const monday = new Date(2026, 1, 2);
    const releasedSlots = Array.from({ length: 30 }, (_, i) => ({
      slot_number: i + 1,
      status: 'Remarcado',
    }));
    mocks.mockOrder.mockResolvedValue({ data: releasedSlots, error: null });

    const count = await blockDay(monday, 'Reunião');
    expect(count).toBe(30);
  });
});

// =============================================================================
// rescheduleAppointment — calls RPC
// =============================================================================

describe('rescheduleAppointment', () => {
  it('should call reschedule_appointment RPC with correct args', async () => {
    const newAppointment = makeAppointment({ id: 'new-id', slot_number: 5, status: 'Agendado' });
    mocks.mockRpc.mockResolvedValue({ data: newAppointment, error: null });

    const result = await rescheduleAppointment('original-id', '2026-02-09', 5);

    expect(mocks.mockRpc).toHaveBeenCalledWith('reschedule_appointment', {
      p_original_id: 'original-id',
      p_scheduled_date: '2026-02-09',
      p_slot_number: 5,
    });
    expect(result).toEqual(newAppointment);
  });

  it('should throw a descriptive error if slot is already occupied', async () => {
    mocks.mockRpc.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'unique violation' },
    });

    await expect(rescheduleAppointment('original-id', '2026-02-09', 5)).rejects.toThrow(
      'Este slot já está ocupado para esta data'
    );
  });
});

// =============================================================================
// bulkRescheduleAppointments — calls RPC
// =============================================================================

describe('bulkRescheduleAppointments', () => {
  it('should call bulk_reschedule_appointments RPC with correct args', async () => {
    const summary = {
      rescheduled_count: 2,
      source_date: '2026-02-02',
      target_date: '2026-02-09',
      moved_slots: [1, 5],
    };
    mocks.mockRpc.mockResolvedValue({ data: summary, error: null });

    const result = await bulkRescheduleAppointments('2026-02-02', '2026-02-09');

    expect(mocks.mockRpc).toHaveBeenCalledWith('bulk_reschedule_appointments', {
      p_source_date: '2026-02-02',
      p_target_date: '2026-02-09',
    });
    expect(result).toEqual(summary);
  });

  it('should throw a descriptive error if any preserved slot is already occupied', async () => {
    mocks.mockRpc.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'As fichas 1, 5 já estão ocupadas no dia de destino' },
    });

    await expect(bulkRescheduleAppointments('2026-02-02', '2026-02-09')).rejects.toThrow(
      'As fichas 1, 5 já estão ocupadas no dia de destino'
    );
  });

  it('should normalize empty RPC data into a safe summary shape', async () => {
    mocks.mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await bulkRescheduleAppointments('2026-02-02', '2026-02-09');

    expect(result).toEqual({
      rescheduled_count: 0,
      source_date: '2026-02-02',
      target_date: '2026-02-09',
      moved_slots: [],
    });
  });
});

// =============================================================================
// getSuggestedAvailableSlot — lógica de sugestão de slot
// =============================================================================

describe('getSuggestedAvailableSlot', () => {
  const monday = new Date(2026, 1, 2);

  it('should suggest first normal (non-reserve) available slot', () => {
    const slots = generateSlotsForDate(monday, []);
    const suggested = getSuggestedAvailableSlot(slots);
    expect(suggested).not.toBeNull();
    expect(suggested!.isReserve).toBe(false);
    expect(suggested!.slotNumber).toBe(1);
  });

  it('should fall back to first reserve slot when all normal slots are taken', () => {
    const config = getDayConfig(monday); // 11 morning normal + 4 reserves + 9 afternoon + 6 reserves
    // Occupy all non-reserve morning slots (1-11) and afternoon slots (16-24)
    const normalSlots = [
      // Morning normal
      ...Array.from({ length: 11 }, (_, i) => makeAppointment({ slot_number: i + 1, status: 'Agendado', id: `m${i}` })),
      // Afternoon normal
      ...Array.from({ length: 9 }, (_, i) => makeAppointment({ slot_number: i + 16, status: 'Agendado', id: `a${i}` })),
    ];
    const slots = generateSlotsForDate(monday, normalSlots);
    const suggested = getSuggestedAvailableSlot(slots);
    expect(suggested).not.toBeNull();
    expect(suggested!.isReserve).toBe(true);
  });

  it('should return null if all slots are taken', () => {
    const config = getDayConfig(monday);
    const allSlots = Array.from({ length: config.totalSlots }, (_, i) =>
      makeAppointment({ slot_number: i + 1, status: 'Agendado', id: `slot${i}` })
    );
    const slots = generateSlotsForDate(monday, allSlots);
    const suggested = getSuggestedAvailableSlot(slots);
    expect(suggested).toBeNull();
  });

  it('Remarcado appointment frees the slot for suggestion', () => {
    const rescheduledSlot1 = makeAppointment({ slot_number: 1, status: 'Remarcado' });
    const slots = generateSlotsForDate(monday, [rescheduledSlot1]);
    const suggested = getSuggestedAvailableSlot(slots);
    expect(suggested).not.toBeNull();
    expect(suggested!.slotNumber).toBe(1);
    expect(suggested!.appointment).toBeNull();
  });
});

// =============================================================================
// buildCapacityAnalyticsFromSummaries — analytics da dashboard de capacidade
// =============================================================================

describe('buildCapacityAnalyticsFromSummaries', () => {
  const filtersAll = { acsName: 'ALL', status: 'ALL' } as const;

  it('should aggregate KPIs and distributions from summaries', () => {
    const dateA = new Date(2026, 1, 2); // segunda
    const dateB = new Date(2026, 1, 3); // terça

    const current = [
      buildDaySummary(dateA, [
        makeAppointment({ id: 'a1', scheduled_date: '2026-02-02', slot_number: 1, acs_name: 'ACS Ana', status: 'Compareceu' }),
        makeAppointment({ id: 'a2', scheduled_date: '2026-02-02', slot_number: 2, acs_name: 'ACS Ana', status: 'Faltou' }),
        makeAppointment({ id: 'a3', scheduled_date: '2026-02-02', slot_number: 3, acs_name: 'ACS Bia', status: 'Remarcado' }),
      ]),
      buildDaySummary(dateB, [
        makeAppointment({ id: 'b1', scheduled_date: '2026-02-03', slot_number: 1, acs_name: 'ACS Bia', status: 'Agendado' }),
        makeAppointment({ id: 'b2', scheduled_date: '2026-02-03', slot_number: 2, acs_name: 'ACS Ana', status: 'Remarcado' }),
      ]),
    ];

    const previous = [
      buildDaySummary(new Date(2026, 0, 31), [
        makeAppointment({ id: 'p1', scheduled_date: '2026-01-31', slot_number: 1, acs_name: 'ACS Ana', status: 'Compareceu' }),
      ]),
    ];

    const analytics = buildCapacityAnalyticsFromSummaries(current, previous, filtersAll);

    expect(analytics.current.totalSlots).toBe(45); // 30 (seg) + 15 (ter)
    expect(analytics.current.showCount).toBe(1);
    expect(analytics.current.noShowCount).toBe(1);
    expect(analytics.current.rescheduledCount).toBe(2);
    expect(analytics.current.occupiedSlots).toBe(3); // Compareceu + Faltou + Agendado
    expect(analytics.current.showRate).toBe(50);
    expect(analytics.statusDistribution.find(item => item.status === 'Remarcado')?.count).toBe(2);
    expect(analytics.acsRanking[0].acsName).toBe('ACS Ana');
    expect(analytics.trend).toHaveLength(2);
    expect(analytics.busiestDays.length).toBeGreaterThan(0);
  });

  it('should apply ACS and status filters globally', () => {
    const day = new Date(2026, 1, 2);

    const current = [
      buildDaySummary(day, [
        makeAppointment({ id: 'x1', scheduled_date: '2026-02-02', slot_number: 1, acs_name: 'ACS Ana', status: 'Faltou' }),
        makeAppointment({ id: 'x2', scheduled_date: '2026-02-02', slot_number: 2, acs_name: 'ACS Bia', status: 'Faltou' }),
        makeAppointment({ id: 'x3', scheduled_date: '2026-02-02', slot_number: 3, acs_name: 'ACS Ana', status: 'Agendado' }),
      ]),
    ];

    const previous: ReturnType<typeof buildDaySummary>[] = [];

    const analytics = buildCapacityAnalyticsFromSummaries(current, previous, {
      acsName: 'ACS Ana',
      status: 'Faltou',
    });

    expect(analytics.current.noShowCount).toBe(1);
    expect(analytics.current.occupiedSlots).toBe(1);
    expect(analytics.statusDistribution).toEqual([{ status: 'Faltou', count: 1 }]);
    expect(analytics.acsRanking).toHaveLength(1);
    expect(analytics.acsRanking[0].acsName).toBe('ACS Ana');
  });
});
