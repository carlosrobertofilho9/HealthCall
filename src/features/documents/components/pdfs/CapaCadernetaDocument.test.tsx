import React from 'react';
import { Document, Page, renderToString } from '@react-pdf/renderer';
import { describe, expect, it } from 'vitest';
import { CapaCadernetaDocument } from './CapaCadernetaDocument';

describe('CapaCadernetaDocument', () => {
  it('renderiza a capa v2 com dados do paciente e barcode', async () => {
    const pdf = await renderToString(
      <Document>
        <Page size="A4" orientation="landscape">
          <CapaCadernetaDocument
            visibleParagraphs={[]}
            formData={{
              nomePaciente: 'Maria Aparecida dos Santos',
              cnsCpf: '123.456.789-01',
              dataNascimento: '1987-04-22',
              endereco: 'Rua Clinica Operacional, 123, Centro',
              receitaSimples: 'true',
              receitaControleEspecial: 'true',
              receitaAzul: 'true',
            }}
          />
        </Page>
      </Document>
    );

    expect(pdf).toContain('%PDF');
  });
});
