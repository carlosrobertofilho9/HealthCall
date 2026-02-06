import React from 'react';
import { Page, Document } from '@react-pdf/renderer';
import { renderTemplate } from '../utils/templateUtils';
import { commonStyles } from './pdfs/PdfCommon';
import { GlycemicDocument } from './pdfs/GlycemicDocument';
import { PressureDocument } from './pdfs/PressureDocument';
import { WoundCareDocument } from './pdfs/WoundCareDocument';
import { ProcedureDocument } from './pdfs/ProcedureDocument';
import { EarWashDocument } from './pdfs/EarWashDocument';
import { AdverseReactionDocument } from './pdfs/AdverseReactionDocument';
import { FormulaRequestDocument } from './pdfs/FormulaRequestDocument';
import type { FormulaItem } from './pdfs/FormulaRequestDocument';
import { InjectableMedDocument } from './pdfs/InjectableMedDocument';
import { StandardDocument } from './pdfs/StandardDocument';

/** Dados de formulário que podem ser pré-preenchidos via widget */
export interface DocumentFormData {
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
}

interface DocumentPdfProps {
  title: string;
  templateText: string;
  values: Record<string, string>;
  templateId?: string;
}

// Extrai os dados do formulário a partir dos values do widget
function extractFormData(values: Record<string, string>): DocumentFormData {
  return {
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
  };
}

// Mapeamento de títulos para componentes especializados
const specialDocuments: Record<string, {
  component: React.FC<{ visibleParagraphs: string[]; photoUrl?: string; formulaItems?: FormulaItem[]; formData?: DocumentFormData }>;
  landscape?: boolean;
  multiPage?: boolean;
}> = {
  'Controle Glicêmico': { component: GlycemicDocument, landscape: true },
  'Controle de Pressão Arterial (MRPA)': { component: PressureDocument, landscape: true },
  'Ficha de Evolução de Curativos': { component: WoundCareDocument, landscape: true, multiPage: true },
  'Protocolo de Procedimento': { component: ProcedureDocument, multiPage: true },
  'Protocolo de Lavagem de Ouvido': { component: EarWashDocument, multiPage: true },
  'Termo de Administração de Medicamento / Vacina': { component: AdverseReactionDocument, multiPage: true },
  'Relatório de Medicação Injetável': { component: InjectableMedDocument, multiPage: true },
  'Solicitação de Fórmula Láctea': { component: FormulaRequestDocument },
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
      <Page size="A4" orientation={orientation} style={commonStyles.page} wrap={specialDoc?.multiPage || false}>
        {specialDoc ? (
          <specialDoc.component
            visibleParagraphs={visibleParagraphs}
            photoUrl={photoUrl}
            formulaItems={formulaItems}
            formData={formData}
          />
        ) : (
          <StandardDocument title={title} visibleParagraphs={visibleParagraphs} />
        )}
      </Page>
    </Document>
  );
};
