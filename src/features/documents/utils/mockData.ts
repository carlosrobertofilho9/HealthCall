export interface Template {
  id: string;
  title: string;
  description?: string;
  templateText: string;
}

export const mockTemplates: Template[] = [
  {
    id: 'controle_glicemico',
    title: 'Controle Glicêmico',
    description: 'Tabela para acompanhamento diário das taxas glicêmicas.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'controle_pressao',
    title: 'Controle de Pressão Arterial (MRPA)',
    description: 'Tabela para monitoramento residencial da pressão arterial (manhã, tarde e noite).',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'ficha_curativos',
    title: 'Ficha de Evolução de Curativos',
    description: 'Ficha para acompanhamento de feridas crônicas com registro fotográfico, medidas da lesão e coberturas.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'lavagem_ouvido',
    title: 'Protocolo de Lavagem de Ouvido',
    description: 'Protocolo completo com contraindicações, descrição técnica, riscos, termo de consentimento e orientações.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'protocolo_procedimento',
    title: 'Protocolo de Procedimento',
    description: 'Termo de consentimento e orientações para sutura, cantoplastia, drenagem de abscesso e outros procedimentos.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'reacao_adversa',
    title: 'Termo de Administração de Medicamento / Vacina',
    description: 'Termo de administração de medicamento/vacina com registro de possíveis reações adversas.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'medicacao_injetavel',
    title: 'Relatório de Medicação Injetável',
    description: 'Comprovante de administração de medicação injetável com dados do medicamento e profissional.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'formula_lactea',
    title: 'Solicitação de Fórmula Láctea',
    description: 'Solicitação de fórmulas lácteas (Aptamil e outras) com quantidades.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}`
  }
];

export interface FieldHint {
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'photo' | 'item-list';
  placeholder?: string;
}

export const fieldHints: Record<string, FieldHint> = {
  // --- Campos comuns ---
  NOME_PACIENTE: { label: 'Nome do Paciente', type: 'text', placeholder: 'Opcional' },
  CNS_CPF: { label: 'CNS ou CPF', type: 'text', placeholder: 'Opcional' },
  DATA_PROCEDIMENTO: { label: 'Data do Procedimento', type: 'date', placeholder: 'dd/mm/aaaa' },
  HORA_PROCEDIMENTO: { label: 'Hora', type: 'text', placeholder: 'Ex: 14:30' },
  PROFISSIONAL: { label: 'Profissional Responsável', type: 'text', placeholder: 'Nome do profissional' },
  CRM_COREN: { label: 'CRM / COREN', type: 'text', placeholder: 'Registro profissional' },

  // --- Medicação Injetável / Reação Adversa ---
  NOME_MEDICAMENTO: { label: 'Nome do Medicamento / Vacina', type: 'text', placeholder: 'Ex: Benzetacil 1.200.000 UI' },
  APRESENTACAO: { label: 'Apresentação / Dose', type: 'text', placeholder: 'Ex: 1.200.000 UI - FA' },
  DOSE_ADMINISTRADA: { label: 'Dose Administrada', type: 'text', placeholder: 'Ex: 1.200.000 UI' },
  LOTE: { label: 'Lote', type: 'text', placeholder: 'Lote do medicamento' },
  VALIDADE: { label: 'Validade do Medicamento', type: 'date', placeholder: 'dd/mm/aaaa' },
  FABRICANTE: { label: 'Fabricante', type: 'text', placeholder: 'Fabricante do medicamento' },
  MEDICO_PRESCRITOR: { label: 'Médico Prescritor', type: 'text', placeholder: 'Nome do médico que prescreveu' },

  // --- Lavagem de Ouvido ---
  QUEIXA_PRINCIPAL: { label: 'Queixa Principal', type: 'text', placeholder: 'Ex: Diminuição da audição há 2 semanas' },

  // --- Procedimento ---
  LOCAL_ANATOMICO: { label: 'Local / Região Anatômica', type: 'text', placeholder: 'Ex: Membro inferior direito' },
  INDICACAO_CLINICA: { label: 'Indicação Clínica', type: 'text', placeholder: 'Ex: Abscesso cutâneo' },
  VOLUME_ANESTESICO: { label: 'Volume do Anestésico (mL)', type: 'number', placeholder: 'Ex: 5' },
  DESCRICAO_PROCEDIMENTO: { label: 'Descrição do Procedimento', type: 'textarea', placeholder: 'Descreva detalhadamente...' },
  NUM_PONTOS: { label: 'Nº de Pontos', type: 'number', placeholder: 'Ex: 3' },

  // --- Curativos ---
  LOCALIZACAO_LESAO: { label: 'Localização da Lesão', type: 'text', placeholder: 'Ex: Maléolo lateral esquerdo' },
  DATA_INICIO_LESAO: { label: 'Data de Início da Lesão', type: 'date', placeholder: 'dd/mm/aaaa' },
  CLASSIFICACAO_LESAO: { label: 'Classificação (Grau/Estágio)', type: 'text', placeholder: 'Ex: Grau II' },
  MEDIDA_LESAO: { label: 'Medida da Lesão (C x L x P cm)', type: 'text', placeholder: 'Ex: 5 x 3 x 0.5' },
  COBERTURA_INICIAL: { label: 'Cobertura Inicial', type: 'text', placeholder: 'Ex: Hidrogel + Gaze' },
  DOR_ESCALA: { label: 'Dor (Escala 0-10)', type: 'number', placeholder: '0-10' },
  OBSERVACOES_PLANO: { label: 'Observações / Plano Terapêutico', type: 'textarea', placeholder: 'Descreva o plano...' },

  // --- Fotos ---
  FOTO_LESAO: { label: 'Foto Inicial da Lesão', type: 'photo', placeholder: 'Tire ou selecione uma foto da lesão' },
  FOTO_REACAO: { label: 'Foto da Reação Adversa', type: 'photo', placeholder: 'Tire ou selecione uma foto da reação' },

  // --- Fórmula Láctea ---
  FORMULA_ITEMS: { label: 'Fórmulas Solicitadas', type: 'item-list' },
};

/**
 * Campos extras (como fotos, listas e campos de formulário) que devem aparecer
 * mas NÃO fazem parte do templateText (para evitar renderizar dados brutos como texto).
 */
export const extraFieldsByTemplate: Record<string, string[]> = {
  ficha_curativos: [
    'LOCALIZACAO_LESAO', 'DATA_INICIO_LESAO', 'CLASSIFICACAO_LESAO',
    'MEDIDA_LESAO', 'COBERTURA_INICIAL', 'DOR_ESCALA', 'OBSERVACOES_PLANO',
    'FOTO_LESAO',
  ],
  lavagem_ouvido: [
    'DATA_PROCEDIMENTO', 'HORA_PROCEDIMENTO',
    'QUEIXA_PRINCIPAL', 'PROFISSIONAL', 'CRM_COREN',
  ],
  protocolo_procedimento: [
    'DATA_PROCEDIMENTO', 'HORA_PROCEDIMENTO',
    'LOCAL_ANATOMICO', 'INDICACAO_CLINICA', 'VOLUME_ANESTESICO',
    'DESCRICAO_PROCEDIMENTO', 'NUM_PONTOS',
    'PROFISSIONAL', 'CRM_COREN',
  ],
  reacao_adversa: [
    'NOME_MEDICAMENTO', 'APRESENTACAO',
    'LOTE', 'VALIDADE', 'FABRICANTE',
    'DATA_PROCEDIMENTO', 'HORA_PROCEDIMENTO',
    'MEDICO_PRESCRITOR', 'PROFISSIONAL', 'CRM_COREN',
    'FOTO_REACAO',
  ],
  medicacao_injetavel: [
    'NOME_MEDICAMENTO', 'APRESENTACAO', 'DOSE_ADMINISTRADA',
    'LOTE', 'VALIDADE', 'FABRICANTE',
    'DATA_PROCEDIMENTO', 'HORA_PROCEDIMENTO',
    'MEDICO_PRESCRITOR', 'PROFISSIONAL', 'CRM_COREN',
  ],
  formula_lactea: ['FORMULA_ITEMS'],
};

/**
 * Configuração para campos do tipo "item-list" (lista de itens dinâmicos).
 * Cada template pode ter uma lista pré-configurada de sugestões.
 */
export interface ItemListConfig {
  label: string;
  itemLabel: string;
  qtyLabel: string;
  suggestions: string[];
  qtyUnit: string;
}

export const itemListConfigByTemplate: Record<string, ItemListConfig> = {
  formula_lactea: {
    label: 'Fórmulas Solicitadas',
    itemLabel: 'Fórmula',
    qtyLabel: 'Quantidade',
    suggestions: [
      'Aptamil 1 (0-6 meses)',
      'Aptamil 2 (6-12 meses)',
      'Aptamil 3 (acima de 12 meses)',
      'NAN 1 Comfor',
      'NAN 2 Comfor',
      'NAN Soy (soja)',
      'Enfamil Gentlease',
      'Similac',
      'Pregomin Pepti',
      'Neocate',
    ],
    qtyUnit: 'Lata(s)',
  },
};
