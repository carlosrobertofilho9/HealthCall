const fs = require('fs');

const svgPath = '/Users/carlosrobertofilho/Documents/Apps/HealthCall/public/Capa_CadernetaV2.svg';
const tsxPath = '/Users/carlosrobertofilho/Documents/Apps/HealthCall/src/features/documents/components/pdfs/CapaCadernetaDocument.tsx';

const dropSvgPlaceholderLine = (line) =>
  line.includes('id="{NomePaciente}"') ||
  line.includes('id="{DiaNascimento}"') ||
  line.includes('id="{MesNascimento}"') ||
  line.includes('id="{AnoNascimento}"') ||
  line.includes('id="CNS: {NumeroDoSUS}"') ||
  line.includes('id="{Endere') ||
  line.includes('id="Barcode"');

const insertOrThrow = (content, search, replacement) => {
  if (!content.includes(search)) {
    throw new Error(`Could not find expected SVG segment: ${search}`);
  }

  return content.replace(search, replacement);
};

const svg = fs.readFileSync(svgPath, 'utf8');
const filteredLines = svg.split('\n').filter((line) => !dropSvgPlaceholderLine(line));

let content = filteredLines.join('\n');

content = content.replace(/<svg.*?>/g, '<Svg viewBox="0 0 1142 787" width="100%" height="100%">');
content = content.replace(/<\/svg>/g, '</Svg>');
content = content.replace(/<g/g, '<G').replace(/<\/g>/g, '</G>');
content = content.replace(/<rect/g, '<Rect').replace(/<\/rect>/g, '</Rect>');
content = content.replace(/<path/g, '<Path').replace(/<\/path>/g, '</Path>');
content = content.replace(/stroke-opacity/g, 'strokeOpacity');

let c = content;

c = insertOrThrow(c, '<G id="Badge">', '{receitaAzul && (\n<G id="Badge">');
c = insertOrThrow(c, '</G>\n<G id="Badge_2">', '</G>\n)}\n{receitaControleEspecial && (\n<G id="Badge_2">');
c = insertOrThrow(c, '</G>\n<G id="Badge_3">', '</G>\n)}\n{receitaSimples && (\n<G id="Badge_3">');
c = insertOrThrow(
  c,
  '</G>\n</G>\n</G>\n</Svg>',
  `</G>
)}
</G>
{barcodeLayout.bars.length > 0 && (
<G id="Barcode">
{barcodeLayout.bars.map((bar, index) => (
<Rect key={\`barcode-\${index}\`} x={bar.x} y={575} width={bar.width} height={41} fill="#111111" />
))}
</G>
)}
</G>
</Svg>`
);

const wrapper = `import React from 'react';
import { View, Text, StyleSheet, Svg, Path, G, Rect } from '@react-pdf/renderer';
import type { DocumentFormData } from '../DocumentPdf';
import { formatCPF, formatCNS } from '@/lib/utils';
import { buildCode128BarcodeLayout } from '../../utils/code128Barcode';

const styles = StyleSheet.create({
  container: { display: 'flex', position: 'relative', width: '100%', height: '100%' },
  textOverlay: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  nomeText: { position: 'absolute', left: '58.65%', top: '51.85%', width: '31%', fontSize: 13, fontFamily: 'Helvetica', color: '#000000' },
  susText: { position: 'absolute', left: '66.7%', top: '42.9%', width: '23%', fontSize: 13, fontFamily: 'Helvetica', color: '#064B87' },
  birthDayText: { position: 'absolute', left: '59.9%', top: '56.3%', width: '3%', fontSize: 13, fontFamily: 'Helvetica', color: '#000000', textAlign: 'center' },
  birthMonthText: { position: 'absolute', left: '64.3%', top: '56.3%', width: '3%', fontSize: 13, fontFamily: 'Helvetica', color: '#000000', textAlign: 'center' },
  birthYearText: { position: 'absolute', left: '68.85%', top: '56.3%', width: '5%', fontSize: 13, fontFamily: 'Helvetica', color: '#000000', textAlign: 'center' },
  enderecoText: { position: 'absolute', left: '59.4%', top: '59.85%', width: '32%', fontSize: 10.5, fontFamily: 'Helvetica', color: '#000000' },
});

interface CapaCadernetaDocumentProps {
  formData?: DocumentFormData;
  visibleParagraphs: string[];
}

const truncatePdfText = (value: string | undefined, maxLength: number): string => {
  const trimmed = (value || '').trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.slice(0, Math.max(0, maxLength - 3)).trimEnd() + '...';
};

const getBirthDateParts = (value: string | undefined) => {
  const trimmed = (value || '').trim();
  const isoDate = trimmed.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);

  if (isoDate) {
    return { day: isoDate[3], month: isoDate[2], year: isoDate[1] };
  }

  const brDate = trimmed.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2,4})$/);

  if (brDate) {
    return {
      day: brDate[1].padStart(2, '0'),
      month: brDate[2].padStart(2, '0'),
      year: brDate[3],
    };
  }

  return { day: '', month: '', year: '' };
};

export const CapaCadernetaDocument: React.FC<CapaCadernetaDocumentProps> = ({ formData }) => {
  const receitaAzul = formData?.receitaAzul === 'true';
  const receitaControleEspecial = formData?.receitaControleEspecial === 'true';
  const receitaSimples = formData?.receitaSimples === 'true';
  const rawDocument = (formData?.cnsCpf || '').replace(/\\D/g, '');
  const birthDate = getBirthDateParts(formData?.dataNascimento);
  const barcodeLayout = buildCode128BarcodeLayout(rawDocument, { x: 710, width: 290 });
  let documentLabel = '';

  if (rawDocument.length === 11) {
    documentLabel = 'CPF: ' + formatCPF(rawDocument);
  } else if (rawDocument.length === 15) {
    documentLabel = 'CNS: ' + formatCNS(rawDocument);
  } else if (formData?.cnsCpf) {
    documentLabel = 'DOC: ' + formData.cnsCpf;
  }

  return (
    <View style={styles.container}>
      __SVG_CONTENT__

      <View style={styles.textOverlay}>
        <Text style={styles.susText}>{documentLabel}</Text>
        <Text style={styles.nomeText}>{truncatePdfText(formData?.nomePaciente, 42)}</Text>
        <Text style={styles.birthDayText}>{birthDate.day}</Text>
        <Text style={styles.birthMonthText}>{birthDate.month}</Text>
        <Text style={styles.birthYearText}>{birthDate.year}</Text>
        <Text style={styles.enderecoText}>{truncatePdfText(formData?.endereco, 68)}</Text>
      </View>
    </View>
  );
};
`;

fs.writeFileSync(tsxPath, wrapper.replace('__SVG_CONTENT__', c), 'utf8');
