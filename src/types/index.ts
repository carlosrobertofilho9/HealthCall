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
