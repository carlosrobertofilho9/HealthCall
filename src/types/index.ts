export type PatientStatus = 'Em Atendimento' | 'Aguardando' | 'Atendimento Finalizado';

export type Patient = {
	id: number;
	name: string;
	destination: string;
	status: PatientStatus;
	callCount: number;
	lastCalled?: boolean;
};

export type CallRecord = {
	id: number;
	name: string;
	destination: string;
	callCount: number;
	calledAt: number;
};
