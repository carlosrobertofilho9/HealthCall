const fs = require('fs');

const svgPath = '/Users/carlosrobertofilho/Documents/Apps/HealthCall/public/Capa_Caderneta.svg';
const tsxPath = '/Users/carlosrobertofilho/Documents/Apps/HealthCall/src/features/documents/components/pdfs/CapaCadernetaDocument.tsx';

let svg = fs.readFileSync(svgPath, 'utf8');
const lines = svg.split('\n');

// Drop the {NomePaciente} and CNS... lines
const filteredLines = lines.filter(line => !line.includes('id="{NomePaciente}"') && !line.includes('id="CNS: {NumeroDoSUS}"'));

let content = filteredLines.join('\n');

// Convert tags to React-PDF syntax
content = content.replace(/<svg.*?>/g, '<Svg viewBox="0 0 1142 787" width="100%" height="100%">');
content = content.replace(/<\/svg>/g, '</Svg>');
content = content.replace(/<g/g, '<G').replace(/<\/g>/g, '</G>');
content = content.replace(/<rect/g, '<Rect').replace(/<\/rect>/g, '</Rect>');
content = content.replace(/<path/g, '<Path').replace(/<\/path>/g, '</Path>');

// Convert camelCase styles
content = content.replace(/stroke-opacity/g, 'strokeOpacity');

// Now, split into chunks so we can make them conditional
let c = content;

// Badge substitution
const badge1Start = c.indexOf('<G id="Badge">');
const badge1EndIdx = c.indexOf('</G>', c.indexOf('</G>', c.indexOf('</G>', badge1Start) + 4) + 4) + 4; // Badge has two 
// actually let's use straightforward regex for Badge, Badge_2, Badge_3 using their exact lines if we can
// or just wrap them manually

const wrapper = `import React from 'react';
import { Page, View, Text, StyleSheet, Svg, Path, G, Rect } from '@react-pdf/renderer';
import type { DocumentFormData } from '../DocumentPdf';

const styles = StyleSheet.create({
  page: { padding: 0, backgroundColor: '#ffffff' },
  container: { display: 'flex', position: 'relative', width: '100%', height: '100%' },
  textOverlay: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  nomeText: { position: 'absolute', left: '58.5%', top: '53.3%', fontSize: 13, fontFamily: 'Helvetica', color: '#000000' },
  susText: { position: 'absolute', left: '66.5%', top: '42.9%', fontSize: 13, fontFamily: 'Helvetica', color: '#064B87' },
});

interface CapaCadernetaDocumentProps {
  formData?: DocumentFormData;
  visibleParagraphs: string[];
}

export const CapaCadernetaDocument: React.FC<CapaCadernetaDocumentProps> = ({ formData }) => {
  const receitaAzul = formData?.receitaAzul === 'true';
  const receitaControleEspecial = formData?.receitaControleEspecial === 'true';
  const receitaSimples = formData?.receitaSimples === 'true';

  return (
    <View style={styles.container}>
      {/* SVG Background */}
      __SVG_CONTENT__

      {/* Text overlays mapped directly over where the paths were */}
      <View style={styles.textOverlay}>
        <Text style={styles.susText}>{formData?.cnsCpf ? \`CNS: \${formData.cnsCpf}\` : ''}</Text>
        <Text style={styles.nomeText}>{formData?.nomePaciente || ''}</Text>
      </View>
    </View>
  );
};
`;

c = c.replace('<G id="Badge">', '{receitaAzul && (\n<G id="Badge">');
c = c.replace('</G>\n<G id="Badge_2">', '</G>\n)}\n{receitaControleEspecial && (\n<G id="Badge_2">');
c = c.replace('</G>\n<G id="Badge_3">', '</G>\n)}\n{receitaSimples && (\n<G id="Badge_3">');
c = c.replace('</G>\n</G>\n</G>\n</Svg>', '</G>\n)}\n</G>\n</G>\n</Svg>');

fs.writeFileSync(tsxPath, wrapper.replace('__SVG_CONTENT__', c), 'utf8');
