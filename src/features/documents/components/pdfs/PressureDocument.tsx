import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument, type DocumentFormData } from './PdfCommon';

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

interface PressureDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const PressureDocument: React.FC<PressureDocumentProps> = ({ visibleParagraphs, formData }) => {
  const DAYS = 7;
  const dateColWidth = '8%';
  const morningGroupWidth = '30%';
  const afternoonGroupWidth = '30%';
  const nightGroupWidth = '24%';
  const obsColWidth = '8%';

  return (
    <BaseDocument title="Controle de Pressão Arterial (MRPA)" visibleParagraphs={visibleParagraphs} wrap={false} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
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
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#0d9488' }]}>
              <Text style={pressureStyles.periodTitle}>DIA</Text>
            </View>
            <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: '#f59e0b', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="sun" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>MANHÃ</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: '#ea580c', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="coffee" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>TARDE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: '#4f46e5', borderRightColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="moon" color="#ffffff" />
                <Text style={pressureStyles.periodTitle}>NOITE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#64748b' }]}>
              <Text style={pressureStyles.periodTitle}>OBS</Text>
            </View>
          </View>

          {/* Row 2: Sub-column Headers (Med 1, Med 2 with PAS/PAD) */}
          <View style={[pressureStyles.subHeaderRow, { height: 28 }]}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#f0fdfa' }]}>
              <Text style={pressureStyles.subHeaderText}>Data</Text>
            </View>
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
                <View style={[tableStyles.col, { width: dateColWidth }]}>
                  <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '7.5%', backgroundColor: isEven ? '#fffcf5' : '#fff7ed' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '6%', backgroundColor: isEven ? '#f5f5ff' : '#eef2ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
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
    </BaseDocument>
  );
};
