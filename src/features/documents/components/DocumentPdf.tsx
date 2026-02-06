import React from 'react';
import { Page, Document } from '@react-pdf/renderer';
import { renderTemplate } from '../utils/templateUtils';
import { commonStyles } from './pdfs/PdfCommon';
import { GlycemicDocument } from './pdfs/GlycemicDocument';
import { PressureDocument } from './pdfs/PressureDocument';
import { WoundCareDocument } from './pdfs/WoundCareDocument';
import { ProcedureDocument } from './pdfs/ProcedureDocument';
import { InjectableMedDocument } from './pdfs/InjectableMedDocument';
import { StandardDocument } from './pdfs/StandardDocument';

interface DocumentPdfProps {
  title: string;
  templateText: string;
  values: Record<string, string>;
  templateId?: string;
}

// Mapeamento de títulos para componentes especializados
const specialDocuments: Record<string, {
  component: React.FC<{ visibleParagraphs: string[] }>;
  landscape?: boolean;
}> = {
  'Controle Glicêmico': { component: GlycemicDocument, landscape: true },
  'Controle de Pressão Arterial (MRPA)': { component: PressureDocument, landscape: true },
  'Ficha de Evolução de Curativos': { component: WoundCareDocument, landscape: true },
  'Protocolo de Procedimento': { component: ProcedureDocument },
  'Relatório de Medicação Injetável': { component: InjectableMedDocument },
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

  const specialDoc = specialDocuments[title];
  const orientation = specialDoc?.landscape ? 'landscape' : 'portrait';

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={commonStyles.page}>
        {specialDoc ? (
          <specialDoc.component visibleParagraphs={visibleParagraphs} />
        ) : (
          <StandardDocument title={title} visibleParagraphs={visibleParagraphs} />
        )}
      </Page>
    </Document>
  );
};
