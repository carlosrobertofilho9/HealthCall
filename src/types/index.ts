export type PatientStatus = 'Em Atendimento' | 'Aguardando' | 'Atendimento Finalizado' | 'Chamado';

export type Patient = {
	id: string;
	name: string;
	destination: string;
	status: PatientStatus;
	callCount: number;
	lastCalled?: boolean;
	audio_url?: string | null; // Pre-generated TTS audio URL
};

export type CallRecord = {
	id: string;
	name: string;
	destination: string;
	callCount: number;
	calledAt: number;
};

export type UserProfile = {
	id: string;
	updated_at?: string | null;
	default_destination?: string | null;
	clinic_name?: string | null;
	default_message?: string | null;
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
	audio_url?: string | null; // Pre-generated TTS audio URL
}
