import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Path, G } from '@react-pdf/renderer';
import { renderTemplate } from '../utils/templateUtils';

// Configuração de estilos
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Slate 700 - Professional Dark Line
    paddingBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b', // Slate 800
  },
  subtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155', // Slate 700
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  patientInfo: {
    marginBottom: 10,
    fontSize: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '11.1%', 
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#ccfbf1',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center', // Center content horizontally
  },
  tableCol: {
    width: '11.1%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    height: 22,
    justifyContent: 'center',
  },
  tableCellHeader: {
    fontSize: 6, // Reduced font size further to fit icons
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0f766e',
    marginTop: 2,
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

// --- Icons (SVG Paths) ---
// Using simple paths adapted from Lucide/Heroicons/Standard SVGs
const icons = {
  calendar: "M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z M16 2V6 M8 2V6 M3 10H21", // Calendar
  sun: "M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z M12 1V3 M12 21V23 M4.22 4.22L5.64 5.64 M18.36 18.36L19.78 19.78 M1 12H3 M21 12H23 M4.22 19.78L5.64 18.36 M18.36 5.64L19.78 4.22", // Sun
  coffee: "M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3", // Coffee Cup
  utensils: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7", // Fork/Knife
  clock: "M12 22A10 10 0 0 0 12 2a10 10 0 0 0 0 20z M12 6v6l4 2", // Clock
  soup: "M12 21a9 9 0 0 0 9-9h-2a7 7 0 0 1-7 7 7 7 0 0 1-7-7H3a9 9 0 0 0 9 9z M12 6v6 M12 3v0", // Bowl/Soup (Simplified)
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z", // Moon
  bed: "M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9", // Bed
  clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6v4H9z", // Clipboard
};

const HeaderIcon = ({ icon, color = "#0f766e" }: { icon: keyof typeof icons, color?: string }) => (
  <Svg width={12} height={12} viewBox="0 0 24 24">
    <Path d={icons[icon]} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface DocumentPdfProps {
  title: string;
  templateText: string;
  values: Record<string, string>;
  templateId?: string;
}

export const DocumentPdf: React.FC<DocumentPdfProps> = ({ title, templateText, values, templateId }) => {
  const isGlycemicControl = title === 'Controle Glicêmico'; 
  const isPressureControl = title === 'Controle de Pressão Arterial (MRPA)';
  
  const renderedContent = renderTemplate(templateText, values);
  const paragraphs = renderedContent.split('\n');
  
  const visibleParagraphs = paragraphs.filter(para => {
    const trimmed = para.trim();
    if (!trimmed) return false;
    if (/:\s*$/.test(trimmed)) return false;
    return true;
  });

  const tableStyles = StyleSheet.create({
    table: {
      display: 'flex',
      width: 'auto',
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#e2e8f0', // Back to delicate outer border
      borderRadius: 6,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1', // Visible internal horizontal divisors
      height: 24,
      alignItems: 'center',
    },
    headerRow: {
      backgroundColor: '#f0fdfa',
      borderBottomWidth: 1,
      borderBottomColor: '#0d9488',
      height: 35,
    },
    col: {
      width: '11.1%',
      height: '100%', // FORCE vertical border rendering
      borderRightWidth: 1,
      borderRightColor: '#cbd5e1', // Visible internal vertical divisors
      justifyContent: 'center',
      alignItems: 'center',
    },
    lastCol: {
      borderRightWidth: 0,
    },
    cellText: {
      fontSize: 9,
      color: '#334155',
    },
    headerText: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#0f766e',
      marginTop: 2,
    },
  });

  const GlycemicTable = () => (
    <View style={tableStyles.table}>
      {/* Header Row */}
      <View style={[tableStyles.row, tableStyles.headerRow]}>
        <View style={tableStyles.col}>
          <HeaderIcon icon="calendar" color="#0f766e" />
          <Text style={tableStyles.headerText}>Data</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="sun" color="#f59e0b" />
          <Text style={tableStyles.headerText}>Ao Acordar</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="coffee" color="#854d0e" />
          <Text style={tableStyles.headerText}>2h pós Café</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="utensils" color="#0ea5e9" />
          <Text style={tableStyles.headerText}>Antes Almoço</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="clock" color="#64748b" />
          <Text style={tableStyles.headerText}>2h pós Almoço</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="utensils" color="#0ea5e9" />
          <Text style={tableStyles.headerText}>Antes Jantar</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="clock" color="#64748b" />
          <Text style={tableStyles.headerText}>2h pós Jantar</Text>
        </View>
        
        <View style={tableStyles.col}>
          <HeaderIcon icon="bed" color="#6366f1" />
          <Text style={tableStyles.headerText}>Ao Dormir</Text>
        </View>
        
        <View style={[tableStyles.col, tableStyles.lastCol]}>
          <HeaderIcon icon="moon" color="#4f46e5" />
          <Text style={tableStyles.headerText}>Madrugada (3:00h)</Text>
        </View>
      </View>
      
      {/* Rows */}
      {Array.from({ length: 16 }).map((_, i) => (
         <View style={[tableStyles.row, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }, i === 15 ? { borderBottomWidth: 0 } : {}]} key={i}>
            {[...Array(9)].map((_, j) => (
              <View style={[tableStyles.col, j === 8 ? tableStyles.lastCol : {}]} key={j}>
                  <Text style={tableStyles.cellText}></Text>
              </View>
            ))}
         </View>
      ))}
    </View>
  );

  const pressureStyles = StyleSheet.create({
    container: {
      width: '100%',
    },
    periodTitle: {
      fontSize: 7,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      paddingVertical: 3,
    },
    subHeaderRow: {
      flexDirection: 'row',
      backgroundColor: '#f0fdfa',
      borderBottomWidth: 1,
      borderBottomColor: '#0d9488',
      height: 22,
      alignItems: 'center',
    },
    subHeaderText: {
      fontSize: 6,
      fontWeight: 'bold',
      color: '#0f766e',
      textAlign: 'center',
    },
    instructionBox: {
      marginTop: 12,
      padding: 10,
      backgroundColor: '#f0fdfa',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#99f6e4',
    },
    instructionTitle: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#0f766e',
    },
    instructionText: {
      fontSize: 7,
      color: '#334155',
      lineHeight: 1.5,
      marginBottom: 2,
    },
    legendRow: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 16,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendColor: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 7,
      color: '#475569',
    },
  });

  const PressureTable = () => {
    const DAYS = 7;
    const dateColWidth = '8%';
    const morningGroupWidth = '30%';
    const afternoonGroupWidth = '30%';
    const nightGroupWidth = '24%';
    const obsColWidth = '8%';

    const subColWidth = '50%'; // PAS/PAD dentro de cada medição

    return (
      <View style={pressureStyles.container}>
        {/* Legend */}
        <View style={pressureStyles.legendRow}>
          <View style={pressureStyles.legendItem}>
            <View style={[pressureStyles.legendColor, { backgroundColor: '#fbbf24' }]} />
            <Text style={pressureStyles.legendText}>Manhã (PSF / Casa)</Text>
          </View>
          <View style={pressureStyles.legendItem}>
            <View style={[pressureStyles.legendColor, { backgroundColor: '#f97316' }]} />
            <Text style={pressureStyles.legendText}>Tarde (PSF / Casa)</Text>
          </View>
          <View style={pressureStyles.legendItem}>
            <View style={[pressureStyles.legendColor, { backgroundColor: '#6366f1' }]} />
            <Text style={pressureStyles.legendText}>Noite (Hospital / Casa)</Text>
          </View>
        </View>

        <View style={{ marginTop: 6 }} />

        {/* Main Table */}
        <View style={tableStyles.table}>
          {/* Row 1: Period Group Headers */}
          <View style={[tableStyles.row, { height: 20, backgroundColor: '#f8fafc' }]}>
            {/* Data column */}
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#0d9488' }]}>
              <Text style={pressureStyles.periodTitle}>DIA</Text>
            </View>
            {/* Manhã group */}
            <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: '#f59e0b', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="sun" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>MANHÃ</Text>
              </View>
            </View>
            {/* Tarde group */}
            <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: '#ea580c', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="coffee" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>TARDE</Text>
              </View>
            </View>
            {/* Noite group */}
            <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: '#4f46e5', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="moon" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>NOITE</Text>
              </View>
            </View>
            {/* Obs column */}
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#64748b' }]}>
              <Text style={pressureStyles.periodTitle}>OBS</Text>
            </View>
          </View>

          {/* Row 2: Sub-column Headers (Med 1, Med 2 with PAS/PAD) */}
          <View style={[pressureStyles.subHeaderRow, { height: 28 }]}>
            {/* Data sub-header */}
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#f0fdfa' }]}>
              <Text style={pressureStyles.subHeaderText}>Data</Text>
            </View>
            {/* Manhã: Med 1 (PAS/PAD) + Med 2 (PAS/PAD) */}
            <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fffbeb' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#92400e' }]}>1ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fffbeb' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#92400e' }]}>2ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#b45309', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            {/* Tarde: Med 1 (PAS/PAD) + Med 2 (PAS/PAD) */}
            <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fff7ed' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#9a3412' }]}>1ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: '15%', backgroundColor: '#fff7ed' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#9a3412' }]}>2ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#c2410c', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            {/* Noite: Med 1 (PAS/PAD) + Med 2 (PAS/PAD) */}
            <View style={[tableStyles.col, { width: '12%', backgroundColor: '#eef2ff' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#3730a3' }]}>1ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: '12%', backgroundColor: '#eef2ff' }]}>
              <Text style={[pressureStyles.subHeaderText, { color: '#3730a3' }]}>2ª Medição</Text>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAS</Text>
                <Text style={[pressureStyles.subHeaderText, { flex: 1, color: '#4338ca', fontSize: 5 }]}>PAD</Text>
              </View>
            </View>
            {/* Obs */}
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#f8fafc' }]}>
              <Text style={pressureStyles.subHeaderText}></Text>
            </View>
          </View>

          {/* Data Rows - 7 days */}
          {Array.from({ length: DAYS }).map((_, i) => {
            const isEven = i % 2 === 0;
            const bgColor = isEven ? '#ffffff' : '#f8fafc';
            const isLast = i === DAYS - 1;
            return (
              <View style={[tableStyles.row, { backgroundColor: bgColor, height: 26 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                {/* Data */}
                <View style={[tableStyles.col, { width: dateColWidth }]}>
                  <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                </View>
                {/* Manhã Med 1: PAS | PAD */}
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Manhã Med 2: PAS | PAD */}
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Tarde Med 1: PAS | PAD */}
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Tarde Med 2: PAS | PAD */}
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Noite Med 1: PAS | PAD */}
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Noite Med 2: PAS | PAD */}
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                {/* Obs */}
                <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Instructions Box */}
        <View style={pressureStyles.instructionBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <HeaderIcon icon="clipboard" color="#0f766e" />
            <Text style={pressureStyles.instructionTitle}>Instruções para o Paciente:</Text>
          </View>
          <Text style={pressureStyles.instructionText}>- Realizar 2 medições em cada período, com intervalo de 1 a 2 minutos entre elas.</Text>
          <Text style={pressureStyles.instructionText}>- <Text style={{ fontWeight: 'bold' }}>Manhã:</Text> medir antes do café da manhã e antes de tomar a medicação.</Text>
          <Text style={pressureStyles.instructionText}>- <Text style={{ fontWeight: 'bold' }}>Tarde:</Text> medir antes do almoço ou no início da tarde (entre 13h e 15h).</Text>
          <Text style={pressureStyles.instructionText}>- <Text style={{ fontWeight: 'bold' }}>Noite:</Text> medir antes do jantar ou ao deitar (se possível — hospital ou aparelho próprio).</Text>
          <Text style={pressureStyles.instructionText}>- Permanecer sentado e em repouso por 5 minutos antes de cada medição.</Text>
          <Text style={pressureStyles.instructionText}>- Anotar PAS (sistólica) e PAD (diastólica). Ex: 120 / 80.</Text>
          <Text style={pressureStyles.instructionText}>- Usar a coluna OBS para registrar sintomas, esquecimento de medicação ou situações especiais.</Text>
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" orientation={isGlycemicControl || isPressureControl ? "landscape" : "portrait"} style={styles.page}>
        <View style={styles.header}>
            <View>
              <Text style={styles.title}>PSF 5 Maria Lucia da Silva</Text>
              <Text style={styles.subtitle}>Unidade Básica de Saúde</Text>
            </View>
        </View>

        <View style={styles.patientInfo}>
          {visibleParagraphs.map((para, index) => (
              <Text key={index} style={{ marginRight: 20 }}>{para}</Text>
          ))}
        </View>

        {isGlycemicControl && (
            <View>
                <Text style={styles.mainTitle}>Controle de Glicêmico</Text>
                <GlycemicTable />
            </View>
        )}

        {isPressureControl && (
            <View>
                <Text style={styles.mainTitle}>Controle de Pressão Arterial (MRPA)</Text>
                <PressureTable />
            </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
             Impresso em {new Date().toLocaleDateString('pt-BR')} - HealthCall
          </Text>
        </View>
      </Page>
    </Document>
  );
};
