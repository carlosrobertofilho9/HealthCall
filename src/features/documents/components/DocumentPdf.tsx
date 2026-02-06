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
import { StandardDocument } from './pdfs/StandardDocument';

interface DocumentPdfProps {
  title: string;
  templateText: string;
  values: Record<string, string>;
  templateId?: string;
}

// Mapeamento de títulos para componentes especializados
const specialDocuments: Record<string, {
  component: React.FC<{ visibleParagraphs: string[]; photoUrl?: string; formulaItems?: FormulaItem[] }>;
  landscape?: boolean;
  multiPage?: boolean;
}> = {
  'Controle Glicêmico': { component: GlycemicDocument, landscape: true },
  'Controle de Pressão Arterial (MRPA)': { component: PressureDocument, landscape: true },
  'Ficha de Evolução de Curativos': { component: WoundCareDocument, landscape: true, multiPage: true },
  'Protocolo de Procedimento': { component: ProcedureDocument, multiPage: true },
  'Protocolo de Lavagem de Ouvido': { component: EarWashDocument, multiPage: true },
  'Termo de Administração de Medicamento / Vacina': { component: AdverseReactionDocument, multiPage: true },
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

  const specialDoc = specialDocuments[title];
  const orientation = specialDoc?.landscape ? 'landscape' : 'portrait';

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={commonStyles.page} wrap={specialDoc?.multiPage}>
        {specialDoc ? (
          <specialDoc.component visibleParagraphs={visibleParagraphs} photoUrl={photoUrl} formulaItems={formulaItems} />
        ) : (
          <StandardDocument title={title} visibleParagraphs={visibleParagraphs} />
        )}
      </Page>
    </Document>
  );
};
