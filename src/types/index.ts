export type PatientStatus = 'Em Atendimento' | 'Aguardando' | 'Atendimento Finalizado' | 'Chamado';

export type Patient = {
	id: string;
	name: string;
	destination: string;
	status: PatientStatus;
	callCount: number;
	lastCalled?: boolean;
    queue_order: number;
};

export type CallRecord = {
	id: string;
	name: string;
	destination: string;
	callCount: number;
	calledAt: number;
};

// =============================================================================
// Tipos para Marcações (PSF - Estratégia de Saúde da Família)
// =============================================================================

/**
 * Tipo do documento do paciente
 */
export type DocumentType = 'CPF' | 'CARTAO_SUS';

export type AppointmentStatus =
	| 'Agendado'
	| 'Compareceu'
	| 'Faltou'
	| 'Remarcado';

/**
 * Representa uma marcação de consulta no PSF
 */
export type Appointment = {
	id: string;
	scheduled_date: string; // formato YYYY-MM-DD
	slot_number: number;
	patient_name: string;
	document_type: DocumentType;
	document_value: string;
	acs_name: string;
	home_visit_address?: string | null;
	home_visit_reference?: string | null;
	home_visit_reason?: string | null;
	status: AppointmentStatus;
	status_updated_at: string;
	rescheduled_from_id?: string | null;
	rescheduled_to_id?: string | null;
	created_at: string;
	updated_at: string;
};

/**
 * Dados para criar uma nova marcação
 */
export type CreateAppointmentData = {
	scheduled_date: string;
	slot_number: number;
	patient_name: string;
	document_type: DocumentType;
	document_value: string;
	acs_name: string;
	home_visit_address?: string | null;
	home_visit_reference?: string | null;
	home_visit_reason?: string | null;
	status?: AppointmentStatus;
};

/**
 * Representa um slot na grade de marcações
 */
export type AppointmentSlot = {
	slotNumber: number;
	period: 'Manhã' | 'Tarde' | 'Reserva';
	time?: string;
	isReserve?: boolean;
	appointment: Appointment | null;
};

/**
 * Resumo operacional de um dia de agenda.
 */
export type AppointmentDaySummary = {
	date: string;
	dateObj: Date;
	dayConfig: DayScheduleConfig;
	appointments: Appointment[];
	releasedAppointments: Appointment[];
	slots: AppointmentSlot[];
	totalSlots: number;
	occupiedSlots: number;
	availableSlots: number;
	blockedSlots: number;
	reserveSlots: number;
	reserveOccupiedSlots: number;
	normalOccupiedSlots: number;
	occupancyRate: number;
};

/**
 * Configuração da grade de atendimento por dia da semana
 * 0 = Domingo, 1 = Segunda, 2 = Terça, etc.
 */
export type DayScheduleConfig = {
	dayOfWeek: number;
	dayName: string;
	hasService: boolean;
	serviceType: 'UBS' | 'HOME_VISIT';
	serviceLabel: string;
	morningSlots: number;
    morningReserveSlots?: number;
	afternoonSlots: number;
    afternoonReserveSlots?: number;
	totalSlots: number;
};

export type CapacityStatusFilter = AppointmentStatus | 'ALL';
export type CapacityPeriod = 'Manhã' | 'Tarde' | 'Reserva';

export type CapacityAnalyticsFilters = {
	acsName: string | 'ALL';
	status: CapacityStatusFilter;
};

export type CapacityKpiSnapshot = {
	totalSlots: number;
	occupiedSlots: number;
	blockedSlots: number;
	availableSlots: number;
	showCount: number;
	noShowCount: number;
	rescheduledCount: number;
	occupancyRate: number;
	showRate: number;
};

export type CapacityTrendPoint = {
	date: string;
	label: string;
	totalSlots: number;
	occupiedSlots: number;
	blockedSlots: number;
	occupancyRate: number;
	showCount: number;
	noShowCount: number;
	rescheduledCount: number;
	showRate: number;
};

export type CapacityStatusDistribution = {
	status: AppointmentStatus;
	count: number;
};

export type CapacityTurnDistribution = {
	period: CapacityPeriod;
	total: number;
	occupied: number;
	showCount: number;
	noShowCount: number;
	rescheduledCount: number;
};

export type CapacityAcsRankingItem = {
	acsName: string;
	total: number;
	showCount: number;
	noShowCount: number;
	rescheduledCount: number;
	showRate: number;
};

export type CapacityKpiDeltas = {
	occupancyRate: number;
	showRate: number;
	noShowCount: number;
	rescheduledCount: number;
	occupiedSlots: number;
};

export type CapacityAnalyticsResult = {
	current: CapacityKpiSnapshot;
	previous: CapacityKpiSnapshot;
	deltas: CapacityKpiDeltas;
	trend: CapacityTrendPoint[];
	statusDistribution: CapacityStatusDistribution[];
	turnDistribution: CapacityTurnDistribution[];
	acsRanking: CapacityAcsRankingItem[];
	busiestDays: CapacityTrendPoint[];
	uniqueAcs: string[];
};
