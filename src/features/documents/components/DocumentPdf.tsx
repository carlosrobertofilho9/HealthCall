import React from 'react';
import { Page, Document } from '@react-pdf/renderer';
import { renderTemplate } from '../utils/templateUtils';
import { GlycemicDocument } from './pdfs/GlycemicDocument';
import { PressureDocument } from './pdfs/PressureDocument';
import { ProcedureDocument } from './pdfs/ProcedureDocument';
import { EarWashDocument } from './pdfs/EarWashDocument';
import { AdverseReactionDocument } from './pdfs/AdverseReactionDocument';
import { FormulaRequestDocument } from './pdfs/FormulaRequestDocument';
import type { FormulaItem } from './pdfs/FormulaRequestDocument';
import { InjectableMedDocument } from './pdfs/InjectableMedDocument';
import { StandardDocument } from './pdfs/StandardDocument';
import { CapaCadernetaDocument } from './pdfs/CapaCadernetaDocument';
import { HASLifestyleDocument } from './pdfs/HASLifestyleDocument';
import { DMLifestyleDocument } from './pdfs/DMLifestyleDocument';
import { DyslipidemiaDocument } from './pdfs/DyslipidemiaDocument';
import { MentalHealthDocument } from './pdfs/MentalHealthDocument';
import { DressingRequestDocument } from './pdfs/DressingRequestDocument';

/** Estrutura para itens de pendência */
export interface PendingItem {
  nomePaciente: string;
  cnsCpf: string;
  tipo: string;
  resumo: string;
}

/** Dados de formulário que podem ser pré-preenchidos via widget */
export interface DocumentFormData {
  // Identificação do paciente (sempre visível no PDF)
  nomePaciente?: string;
  cnsCpf?: string;
  // Medicação / Vacina
  nomeMedicamento?: string;
  apresentacao?: string;
  doseAdministrada?: string;
  lote?: string;
  validade?: string;
  fabricante?: string;
  // Administração / Procedimento
  dataProcedimento?: string;
  horaProcedimento?: string;
  medicoPrescritor?: string;
  profissional?: string;
  crmCoren?: string;
  // Procedimento específico
  localAnatomico?: string;
  indicacaoClinica?: string;
  volumeAnestesico?: string;
  descricaoProcedimento?: string;
  numPontos?: string;
  // Lavagem de ouvido
  queixaPrincipal?: string;
  // Curativos
  localizacaoLesao?: string;
  dataInicioLesao?: string;
  classificacaoLesao?: string;
  medidaLesao?: string;
  coberturaInicial?: string;
  dorEscala?: string;
  observacoesPlano?: string;
  // Pendências
  pendencias?: PendingItem[];
  // Capa Caderneta
  dataNascimento?: string;
  endereco?: string;
  receitaSimples?: string;
  receitaControleEspecial?: string;
  receitaAzul?: string;
}

interface DocumentPdfProps {
  title: string;
  templateText: string;
  values: Record<string, string>;
  templateId?: string;
}

// Extrai os dados do formulário a partir dos values do widget
function extractFormData(values: Record<string, string>): DocumentFormData {
  // Extrair pendências (1 a 3)
  const pendencias: PendingItem[] = [];
  for (let i = 1; i <= 4; i++) {
    // Adicionar se tiver pelo menos o nome ou o tipo preenchido
    if (values[`NOME_PACIENTE_${i}`] || values[`TIPO_PENDENCIA_${i}`] || values[`RESUMO_PENDENCIA_${i}`]) {
      pendencias.push({
        nomePaciente: values[`NOME_PACIENTE_${i}`] || '',
        cnsCpf: values[`CNS_CPF_${i}`] || '',
        tipo: values[`TIPO_PENDENCIA_${i}`] || '',
        resumo: values[`RESUMO_PENDENCIA_${i}`] || '',
      });
    }
  }

  return {
    nomePaciente: values['NOME_PACIENTE'] || undefined,
    cnsCpf: values['CNS_CPF'] || undefined,
    nomeMedicamento: values['NOME_MEDICAMENTO'] || undefined,
    apresentacao: values['APRESENTACAO'] || undefined,
    doseAdministrada: values['DOSE_ADMINISTRADA'] || undefined,
    lote: values['LOTE'] || undefined,
    validade: values['VALIDADE'] || undefined,
    fabricante: values['FABRICANTE'] || undefined,
    dataProcedimento: values['DATA_PROCEDIMENTO'] || undefined,
    horaProcedimento: values['HORA_PROCEDIMENTO'] || undefined,
    medicoPrescritor: values['MEDICO_PRESCRITOR'] || undefined,
    profissional: values['PROFISSIONAL'] || undefined,
    crmCoren: values['CRM_COREN'] || undefined,
    localAnatomico: values['LOCAL_ANATOMICO'] || undefined,
    indicacaoClinica: values['INDICACAO_CLINICA'] || undefined,
    volumeAnestesico: values['VOLUME_ANESTESICO'] || undefined,
    descricaoProcedimento: values['DESCRICAO_PROCEDIMENTO'] || undefined,
    numPontos: values['NUM_PONTOS'] || undefined,
    queixaPrincipal: values['QUEIXA_PRINCIPAL'] || undefined,
    localizacaoLesao: values['LOCALIZACAO_LESAO'] || undefined,
    dataInicioLesao: values['DATA_INICIO_LESAO'] || undefined,
    classificacaoLesao: values['CLASSIFICACAO_LESAO'] || undefined,
    medidaLesao: values['MEDIDA_LESAO'] || undefined,
    coberturaInicial: values['COBERTURA_INICIAL'] || undefined,
    dorEscala: values['DOR_ESCALA'] || undefined,
    observacoesPlano: values['OBSERVACOES_PLANO'] || undefined,
    dataNascimento: values['DATA_NASCIMENTO'] || undefined,
    endereco: values['ENDERECO'] || undefined,
    receitaSimples: values['RECEITA_SIMPLES'] || undefined,
    receitaControleEspecial: values['RECEITA_CONTROLE_ESPECIAL'] || undefined,
    receitaAzul: values['RECEITA_AZUL'] || undefined,
    pendencias: pendencias.length > 0 ? pendencias : undefined,
  };
}

// Mapeamento de títulos para componentes especializados
const specialDocuments: Record<string, {
  component: React.FC<{ visibleParagraphs: string[]; photoUrl?: string; formulaItems?: FormulaItem[]; formData?: DocumentFormData; values?: Record<string, string> }>;
  landscape?: boolean;
  multiPage?: boolean;
}> = {
  'Controle Glicêmico': { component: GlycemicDocument, landscape: true },
  'Controle de Pressão Arterial (MRPA)': { component: PressureDocument, landscape: true, multiPage: true },
  'Controle de Pressão Arterial (MAPA)': { component: PressureDocument, landscape: true, multiPage: true },
  'Protocolo de Procedimento': { component: ProcedureDocument, multiPage: true },
  'Protocolo de Lavagem de Ouvido': { component: EarWashDocument, multiPage: true },
  'Termo de Administração de Medicamento / Vacina': { component: AdverseReactionDocument, multiPage: true },
  'Relatório de Medicação Injetável': { component: InjectableMedDocument, multiPage: true },
  'Solicitação de Fórmula Láctea': { component: FormulaRequestDocument },
  'Solicitação de Curativo': { component: DressingRequestDocument },
  'Capa de Caderneta': { component: CapaCadernetaDocument as any, landscape: true },
  'Guia de Estilo de Vida (HAS)': { component: HASLifestyleDocument as any },
  'Guia de Estilo de Vida (Diabetes)': { component: DMLifestyleDocument as any },
  'Guia de Estilo de Vida (Dislipidemia)': { component: DyslipidemiaDocument as any },
  'Guia de Higiene do Sono e Saúde Mental': { component: MentalHealthDocument as any },
};

export const DocumentPdf: React.FC<DocumentPdfProps> = ({ title, templateText, values }) => {
  const renderedContent = renderTemplate(templateText, values);
  const paragraphs = renderedContent.split('\n');
  
  const visibleParagraphs = paragraphs.filter(para => {
    const trimmed = para.trim();
    if (!trimmed) return false;
    if (/:\s*$/.test(trimmed)) return false;
    return true;
  });

  // Extrair URL da foto se fornecida via valores do formulário
  const photoUrl = values['FOTO_LESAO'] || values['FOTO_REACAO'] || undefined;

  // Extrair itens de fórmula láctea (armazenados como JSON nos values)
  const formulaItems: FormulaItem[] = values['FORMULA_ITEMS']
    ? (() => { try { return JSON.parse(values['FORMULA_ITEMS']); } catch { return []; } })()
    : [];

  // Extrair dados do formulário para preenchimento do PDF
  const formData = extractFormData(values);

  const specialDoc = specialDocuments[title];
  const orientation = specialDoc?.landscape ? 'landscape' : 'portrait';

  return (
    <Document>
      <Page size="A4" orientation={orientation}>
        {specialDoc ? (
          <specialDoc.component
            visibleParagraphs={visibleParagraphs}
            photoUrl={photoUrl}
            formulaItems={formulaItems}
            formData={formData}
            values={values}
          />
        ) : (
          <StandardDocument title={title} visibleParagraphs={visibleParagraphs} />
        )}
      </Page>
    </Document>
  );
};
