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
