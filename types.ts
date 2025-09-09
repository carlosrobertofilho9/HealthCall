export type PatientStatus = "Em Atendimento" | "Aguardando" | "Atendimento Finalizado";

export type Patient = {
  id: number;
  name: string;
  destination: string;
  status: PatientStatus;
  callCount: number;
  lastCalled?: boolean;
};

// Registro de chamadas para histórico na tela de exibição
export type CallRecord = {
  id: number;
  name: string;
  destination: string;
  callCount: number; // contagem no momento da chamada
  calledAt: number; // timestamp (ms)
};
