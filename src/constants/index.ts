/**
 * Uma lista predefinida de salas de destino disponíveis na clínica.
 * Usada para preencher campos de seleção e garantir consistência nos dados.
 */
export const DESTINATION_ROOMS = [
  'Triagem',
  'Consultório Enfermagem',
  'Consultório Médico',
  'Consultório Odontológico',
  'Sala de Vacinação',
] as const;

/**
 * Lista de Agentes Comunitários de Saúde (ACS) e opções de área
 */
export const ACS_OPTIONS = [
  'Margarete',
  'Layne',
  'Jô',
  'Vanessa',
  'Lurdinha',
  'Fora de área',
  'Área descoberta',
] as const;

/**
 * Um objeto que define chaves consistentes para uso com `localStorage`.
 * Ajuda a evitar erros de digitação e a manter o gerenciamento de armazenamento centralizado.
 */
export const STORAGE_KEYS = {
  /** A chave para armazenar o último paciente chamado. */
  calledPatient: 'calledPatient',
  /** A chave para armazenar a lista de próximos pacientes. */
  nextPatients: 'nextPatients',
  /** A chave para armazenar o histórico de chamadas. */
  callHistory: 'callHistory',
  /** A chave para a preferência do usuário sobre o uso da síntese de voz do navegador. */
  USE_BROWSER_VOICE: 'useBrowserVoice',
} as const;

/**
 * O número máximo de registros a serem mantidos no histórico de chamadas.
 */
export const CALL_HISTORY_LIMIT = 20;

/**
 * Tabelas do Banco de Dados Supabase.
 * Centraliza os nomes das tabelas para evitar erros de digitação e facilitar refatoração.
 */
export const SUPABASE_TABLES = {
  PATIENTS: 'patients',
  WARNINGS: 'warnings',
  SETTINGS: 'settings',
  CALLS: 'calls',
  MEDIA: 'media', // storage bucket
} as const;
