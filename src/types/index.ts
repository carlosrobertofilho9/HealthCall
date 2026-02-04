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
 * Configuração da grade de atendimento por dia da semana
 * 0 = Domingo, 1 = Segunda, 2 = Terça, etc.
 */
export type DayScheduleConfig = {
	dayOfWeek: number;
	dayName: string;
	hasService: boolean;
	morningSlots: number;
    morningReserveSlots?: number;
	afternoonSlots: number;
    afternoonReserveSlots?: number;
	totalSlots: number;
};
