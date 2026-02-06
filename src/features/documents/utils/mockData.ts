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
    description: 'Ficha para acompanhamento de feridas crônicas com medidas da lesão e coberturas.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'protocolo_procedimento',
    title: 'Protocolo de Procedimento',
    description: 'Termo de consentimento e orientações para lavagem de ouvido, pequena cirurgia e outros.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  },
  {
    id: 'medicacao_injetavel',
    title: 'Relatório de Medicação Injetável',
    description: 'Comprovante de administração de medicação injetável com lote, validade e via.',
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`
  }
];

export interface FieldHint {
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number';
  placeholder?: string;
}

export const fieldHints: Record<string, FieldHint> = {
  NOME_PACIENTE: { label: 'Nome do Paciente', type: 'text', placeholder: 'Opcional' },
  CNS_CPF: { label: 'CNS ou CPF', type: 'text', placeholder: 'Opcional' },
};
