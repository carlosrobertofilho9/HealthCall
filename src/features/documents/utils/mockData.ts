import React from 'react';
import {
  Candy,
  Heart,
  Bandage,
  Ear,
  ClipboardList,
  AlertTriangle,
  Syringe,
  Baby,
  ShoppingCart,
  ListChecks,
  Book,
  Activity,
  Apple,
  TrendingDown,
  Moon,
} from 'lucide-react';

// ============================================================================
// Icon Types and Components
// ============================================================================

export interface CustomIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ControleGlicemicoIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Candy, props);

export const ControlePressaoIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Heart, props);

export const FichaCurativosIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Bandage, props);

export const LavagemOuvidoIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Ear, props);

export const ProtocoloProcedimentoIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(ClipboardList, props);

export const ReacaoAdversaIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(AlertTriangle, props);

export const MedicacaoInjetavelIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Syringe, props);

export const FormulaLacteaIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Baby, props);

export const SolicitacaoCurativoIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(ShoppingCart, props);

export const FolhaPendenciasIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(ListChecks, props);

export const CapaCadernetaIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Book, props);

export const HasLifestyleIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Activity, props);

export const DmLifestyleIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Apple, props);

export const DlpLifestyleIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(TrendingDown, props);

export const SleepLifestyleIcon: React.FC<CustomIconProps> = (props) => 
  React.createElement(Moon, props);

// ============================================================================
// Template Types and Data
// ============================================================================

export type CustomIcon = React.FC<CustomIconProps>;

export type TemplateCategory = 
  | 'Monitoramento' 
  | 'Protocolos e Termos' 
  | 'Administrativo' 
  | 'Orientações e Capas';

export interface Template {
  id: string;
  title: string;
  description?: string;
  templateText: string;
  icon?: CustomIcon;
  category: TemplateCategory;
  tags?: string[];
}

export const mockTemplates: Template[] = [
  // --- MONITORAMENTO ---
  {
    id: 'controle_glicemico',
    title: 'Controle Glicêmico',
    category: 'Monitoramento',
    description: 'Tabela para acompanhamento diário das taxas glicêmicas.',
    tags: ['diabetes', 'hgt', 'glicemia', 'insulina'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: ControleGlicemicoIcon
  },
  {
    id: 'controle_pressao',
    title: 'Controle de Pressão Arterial (MAPA)',
    category: 'Monitoramento',
    description: 'Tabela para monitoramento ambulatorial da pressão arterial (manhã, tarde e noite).',
    tags: ['hipertensão', 'has', 'pressão', 'mapa', 'mrpa'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: ControlePressaoIcon
  },
  {
    id: 'lavagem_ouvido',
    title: 'Protocolo de Lavagem de Ouvido',
    category: 'Protocolos e Termos',
    description: 'Protocolo completo com contraindicações, técnica e termo de consentimento.',
    tags: ['ouvido', 'cerume', 'limpeza', 'otoscopia'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: LavagemOuvidoIcon
  },
  {
    id: 'protocolo_procedimento',
    title: 'Protocolo de Procedimento',
    category: 'Protocolos e Termos',
    description: 'Termo de consentimento e orientações para suturas e pequenas cirurgias.',
    tags: ['sutura', 'cirurgia', 'procedimento', 'biópsia'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: ProtocoloProcedimentoIcon
  },
  {
    id: 'reacao_adversa',
    title: 'Termo de Administração de Medicamento / Vacina',
    category: 'Protocolos e Termos',
    description: 'Termo com registro de possíveis reações adversas pós-administração.',
    tags: ['vacina', 'reação', 'alergia', 'anafilaxia'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: ReacaoAdversaIcon
  },
  {
    id: 'medicacao_injetavel',
    title: 'Relatório de Medicação Injetável',
    category: 'Protocolos e Termos',
    description: 'Comprovante de administração de medicação injetável.',
    tags: ['injeção', 'im', 'ev', 'medicação'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: MedicacaoInjetavelIcon
  },

  // --- ADMINISTRATIVO ---
  {
    id: 'formula_lactea',
    title: 'Solicitação de Fórmula Láctea',
    category: 'Administrativo',
    description: 'Solicitação de fórmulas infantis especiais com quantidades.',
    tags: ['leite', 'bebê', 'nutrição', 'puericultura'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}`,
    icon: FormulaLacteaIcon
  },
  {
    id: 'solicitacao_curativo',
    title: 'Solicitação de Curativo',
    category: 'Administrativo',
    description: 'Solicitação de materiais para curativo com seleção por checkboxes.',
    tags: ['curativo', 'materiais', 'ferida', 'enfermagem', 'almoxarifado'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: SolicitacaoCurativoIcon
  },
  // --- ORIENTAÇÕES E CAPAS ---
  {
    id: 'capa_caderneta',
    title: 'Capa de Caderneta',
    category: 'Orientações e Capas',
    description: 'Capa da caderneta com selos de receita opcionais.',
    tags: ['capa', 'identificação', 'receita', 'paciente'],
    templateText: ``,
    icon: CapaCadernetaIcon
  },
  {
    id: 'has_lifestyle',
    title: 'Guia de Estilo de Vida (HAS)',
    category: 'Orientações e Capas',
    description: 'Orientações educativas sobre peso, dieta e exercícios para hipertensos.',
    tags: ['educação', 'hipertensão', 'dieta', 'exercício', 'lifestyle'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: HasLifestyleIcon
  },
  {
    id: 'dm_lifestyle',
    title: 'Guia de Estilo de Vida (Diabetes)',
    category: 'Orientações e Capas',
    description: 'Orientações sobre controle glicêmico, alimentação e cuidado com os pés.',
    tags: ['educação', 'diabetes', 'dieta', 'glicemia', 'lifestyle'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: DmLifestyleIcon
  },
  {
    id: 'dlp_lifestyle',
    title: 'Guia de Estilo de Vida (Dislipidemia)',
    category: 'Orientações e Capas',
    description: 'Orientações sobre controle de colesterol, gorduras e alimentação saudável.',
    tags: ['educação', 'colesterol', 'dieta', 'gordura', 'lifestyle'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: DlpLifestyleIcon
  },
  {
    id: 'sleep_lifestyle',
    title: 'Guia de Higiene do Sono e Saúde Mental',
    category: 'Orientações e Capas',
    description: 'Dicas para melhorar a qualidade do sono e reduzir o estresse.',
    tags: ['educação', 'sono', 'ansiedade', 'estresse', 'lifestyle'],
    templateText: `Nome do Paciente: {{NOME_PACIENTE}}
CNS ou CPF: {{CNS_CPF}}`,
    icon: SleepLifestyleIcon
  }
];

export interface FieldHint {
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'photo' | 'item-list' | 'select' | 'checkbox';
  placeholder?: string;
  options?: string[];
}

export const fieldHints: Record<string, FieldHint> = {
  // --- Campos comuns ---
  NOME_PACIENTE: { label: 'Nome do Paciente', type: 'text', placeholder: 'Opcional' },
  CNS_CPF: { label: 'CNS ou CPF', type: 'text', placeholder: 'Opcional' },
  DATA_PROCEDIMENTO: { label: 'Data do Procedimento', type: 'date', placeholder: 'dd/mm/aaaa' },
  MAPA_DATA_INICIAL: { label: 'Data inicial (MAPA)', type: 'date', placeholder: 'dd/mm/aaaa' },
  GLICEMIA_DATA_INICIAL: { label: 'Data inicial (Controle Glicêmico)', type: 'date', placeholder: 'dd/mm/aaaa' },
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

  // --- Solicitação de Curativo ---
  MATERIAL_CURATIVO_GAZE: { label: 'Gaze estéril', type: 'checkbox' },
  MATERIAL_CURATIVO_MICROPORE: { label: 'Micropore', type: 'checkbox' },
  MATERIAL_CURATIVO_ALGODAO: { label: 'Algodão', type: 'checkbox' },
  MATERIAL_CURATIVO_LUVAS: { label: 'Luvas de procedimento', type: 'checkbox' },
  MATERIAL_CURATIVO_SORO: { label: 'Soro fisiológico 0,9%', type: 'checkbox' },
  MATERIAL_CURATIVO_ATADURA: { label: 'Atadura de crepe', type: 'checkbox' },
  MATERIAL_CURATIVO_ESPARADRAPO: { label: 'Esparadrapo', type: 'checkbox' },
  MATERIAL_CURATIVO_COMPRESSA: { label: 'Compressa estéril', type: 'checkbox' },
  MATERIAL_CURATIVO_MASCARA: { label: 'Máscara cirúrgica', type: 'checkbox' },
  MATERIAL_CURATIVO_CLOREXIDINA: { label: 'Clorexidina aquosa', type: 'checkbox' },
  MATERIAL_CURATIVO_PVPI: { label: 'PVPI tópico', type: 'checkbox' },
  MATERIAL_CURATIVO_ALCOOL_70: { label: 'Álcool 70%', type: 'checkbox' },
  MATERIAL_CURATIVO_HIDROGEL: { label: 'Hidrogel', type: 'checkbox' },
  MATERIAL_CURATIVO_AGE: { label: 'AGE / óleo de girassol', type: 'checkbox' },
  MATERIAL_CURATIVO_ALGINATO: { label: 'Alginato de cálcio', type: 'checkbox' },
  MATERIAL_CURATIVO_RAYON: { label: 'Rayon / gaze não aderente', type: 'checkbox' },
  MATERIAL_CURATIVO_OUTROS: { label: 'Outros materiais', type: 'checkbox' },
  DATA_SOLICITACAO_CURATIVO: { label: 'Data da Solicitação', type: 'date', placeholder: 'dd/mm/aaaa' },
  OUTROS_MATERIAIS_CURATIVO: { label: 'Quais outros materiais?', type: 'textarea', placeholder: 'Descreva outros materiais necessários...' },
  OBSERVACOES_CURATIVO: { label: 'Observações da solicitação', type: 'textarea', placeholder: 'Ex: frequência de troca, quantidade estimada ou justificativa clínica...' },

  // --- Capa de Caderneta ---
  RECEITA_SIMPLES: { label: 'Receita Simples (Verde)', type: 'checkbox' },
  RECEITA_CONTROLE_ESPECIAL: { label: 'Controle Especial (Laranja)', type: 'checkbox' },
  RECEITA_AZUL: { label: 'Receita Azul', type: 'checkbox' },
};

/**
 * Campos extras (como fotos, listas e campos de formulário) que devem aparecer
 * mas NÃO fazem parte do templateText (para evitar renderizar dados brutos como texto).
 */
export const extraFieldsByTemplate: Record<string, string[]> = {
  controle_pressao: ['MAPA_DATA_INICIAL'],
  controle_glicemico: ['GLICEMIA_DATA_INICIAL'],
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
  solicitacao_curativo: [
    'DATA_SOLICITACAO_CURATIVO',
    'MATERIAL_CURATIVO_GAZE', 'MATERIAL_CURATIVO_MICROPORE', 'MATERIAL_CURATIVO_ALGODAO',
    'MATERIAL_CURATIVO_LUVAS', 'MATERIAL_CURATIVO_SORO', 'MATERIAL_CURATIVO_ATADURA',
    'MATERIAL_CURATIVO_ESPARADRAPO', 'MATERIAL_CURATIVO_COMPRESSA', 'MATERIAL_CURATIVO_MASCARA',
    'MATERIAL_CURATIVO_CLOREXIDINA', 'MATERIAL_CURATIVO_PVPI', 'MATERIAL_CURATIVO_ALCOOL_70',
    'MATERIAL_CURATIVO_HIDROGEL', 'MATERIAL_CURATIVO_AGE', 'MATERIAL_CURATIVO_ALGINATO',
    'MATERIAL_CURATIVO_RAYON', 'MATERIAL_CURATIVO_OUTROS',
    'OUTROS_MATERIAIS_CURATIVO', 'OBSERVACOES_CURATIVO',
    'PROFISSIONAL', 'CRM_COREN',
  ],
  capa_caderneta: [
    'NOME_PACIENTE', 'CNS_CPF', 'RECEITA_SIMPLES', 'RECEITA_CONTROLE_ESPECIAL', 'RECEITA_AZUL'
  ],
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
