export const PENDENCIA_STATUS = {
  ABERTO: 'aberto',
  EM_ANDAMENTO: 'em_andamento',
  RESOLVIDO: 'resolvido',
} as const;

export type PendenciaStatus = (typeof PENDENCIA_STATUS)[keyof typeof PENDENCIA_STATUS];

export interface Pendencia {
  id: string;
  nome_paciente: string;
  cns_cpf: string;
  tipo: string;
  resumo: string | null;
  status: PendenciaStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface CreatePendenciaDTO {
  nome_paciente: string;
  cns_cpf: string;
  tipo: string;
  resumo?: string;
}

export interface UpdatePendenciaStatusDTO {
  id: string;
  status: PendenciaStatus;
}

export interface UpdatePendenciaDTO {
  id: string;
  nome_paciente: string;
  cns_cpf: string;
  tipo: string;
  resumo?: string;
}

export const PENDENCIA_STATUS_LABEL: Record<PendenciaStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em andamento',
  resolvido: 'Resolvido',
};
