export type PatientStatus = 'Em Atendimento' | 'Aguardando' | 'Atendimento Finalizado' | 'Chamado';

export type Patient = {
	id: string;
	name: string;
	destination: string;
	status: PatientStatus;
	callCount: number;
	lastCalled?: boolean;
};

export type CallRecord = {
	id: string;
	name: string;
	destination: string;
	callCount: number;
	calledAt: number;
};

export interface Warning {
	id: string;
	text: string;
	background_url: string | null;
	active: boolean;
	created_at: string;
	media_type?: 'image' | 'video' | 'youtube';
	qrcode_url?: string;
	start_time?: string;
	end_time?: string;
	duration?: number; // Duration in seconds for video/youtube
	priority?: boolean; // Mark warning as priority
	order?: number; // Custom display order
}
