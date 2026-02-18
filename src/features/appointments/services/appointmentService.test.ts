import { describe, it, expect, vi, beforeEach } from 'vitest';
import { blockDay } from './appointmentService';

// Hoist mocks
const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockMaybeSingle = vi.fn();

  const mockSupabaseChain = {
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
    order: mockOrder,
    maybeSingle: mockMaybeSingle,
  };

  // Setup chain returns inside hoisted block
  mockSelect.mockReturnValue(mockSupabaseChain);
  mockEq.mockReturnValue(mockSupabaseChain);
  mockOrder.mockReturnValue(mockSupabaseChain);
  mockInsert.mockReturnValue(mockSupabaseChain);

  const mockFrom = vi.fn(() => mockSupabaseChain);

  return {
    mockFrom,
    mockSelect,
    mockInsert,
    mockEq,
    mockOrder,
    mockSupabaseChain
  };
});

// Mock the module using hoisted variables
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mocks.mockFrom,
  },
}));

describe('blockDay', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Ensure chain returns are set (in case they were cleared, though clearAllMocks shouldn't clear impls)
    mocks.mockFrom.mockReturnValue(mocks.mockSupabaseChain);
    mocks.mockSelect.mockReturnValue(mocks.mockSupabaseChain);
    mocks.mockEq.mockReturnValue(mocks.mockSupabaseChain);
    mocks.mockOrder.mockReturnValue(mocks.mockSupabaseChain);
    mocks.mockInsert.mockReturnValue(mocks.mockSupabaseChain);

    // Default insert behavior
    mocks.mockInsert.mockResolvedValue({ error: null });
  });

  it('should create appointments for empty slots on a service day', async () => {
    const monday = new Date(2026, 1, 2); // Monday

    // Mock getAppointmentsByDate response
    mocks.mockOrder.mockResolvedValue({
      data: [
        { slot_number: 1 },
        { slot_number: 2 },
      ],
      error: null
    });

    const count = await blockDay(monday, 'Reunião');

    expect(count).toBe(28);
    expect(mocks.mockInsert).toHaveBeenCalledTimes(1);

    const inserted = mocks.mockInsert.mock.calls[0][0];
    expect(inserted).toHaveLength(28);
    expect(inserted[0]).toMatchObject({
        patient_name: 'Reunião',
        document_value: 'BLOQUEIO',
        acs_name: 'Administração'
    });
  });

  it('should not block if day has no service', async () => {
    const sunday = new Date(2026, 1, 1); // Sunday
    await expect(blockDay(sunday, 'Reunião')).rejects.toThrow('Este dia não possui atendimento');
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('should return 0 if all slots are full', async () => {
    const monday = new Date(2026, 1, 2);
    const fullSlots = Array.from({ length: 30 }, (_, i) => ({ slot_number: i + 1 }));
    mocks.mockOrder.mockResolvedValue({
      data: fullSlots,
      error: null
    });

    const count = await blockDay(monday, 'Reunião');
    expect(count).toBe(0);
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});
