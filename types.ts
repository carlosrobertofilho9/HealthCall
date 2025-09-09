export type PatientStatus = "Em Atendimento" | "Aguardando" | "Atendimento Finalizado";

export interface Patient {
  id: number;
  name: string;
  destination: string;
  status: PatientStatus;
}
