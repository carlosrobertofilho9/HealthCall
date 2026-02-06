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
  NOME_PACIENTE: { label: 'Nome do Paciente', type: 'text', placeholder: 'Opcional' },
  CNS_CPF: { label: 'CNS ou CPF', type: 'text', placeholder: 'Opcional' },
  FOTO_LESAO: { label: 'Foto Inicial da Lesão', type: 'photo', placeholder: 'Tire ou selecione uma foto da lesão' },
  FOTO_REACAO: { label: 'Foto da Reação Adversa', type: 'photo', placeholder: 'Tire ou selecione uma foto da reação' },
  FORMULA_ITEMS: { label: 'Fórmulas Solicitadas', type: 'item-list' },
};

/**
 * Campos extras (como fotos) que devem aparecer no formulário
 * mas NÃO fazem parte do templateText (para evitar renderizar base64 como texto).
 */
export const extraFieldsByTemplate: Record<string, string[]> = {
  ficha_curativos: ['FOTO_LESAO'],
  reacao_adversa: ['FOTO_REACAO'],
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
