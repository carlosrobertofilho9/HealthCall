import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument } from './PdfCommon';

const glycemicStyles = StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: '#0d9488',
    height: 30,
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    textAlign: 'center',
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
  refBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fefce8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  refTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 3,
  },
  refRow: {
    flexDirection: 'row',
    gap: 20,
  },
  refText: {
    fontSize: 7,
    color: '#78350f',
  },
});

interface GlycemicDocumentProps {
  visibleParagraphs: string[];
}

export const GlycemicDocument: React.FC<GlycemicDocumentProps> = ({ visibleParagraphs }) => {
  const DAYS = 14;
  const dateColWidth = '8%';
  const morningGroupWidth = '23%';
  const afternoonGroupWidth = '23%';
  const nightGroupWidth = '23%';
  const madrugadaColWidth = '11.5%';
  const obsColWidth = '11.5%';

  return (
    <BaseDocument title="Controle Glicêmico" visibleParagraphs={visibleParagraphs} showFooter={false}>
      <View style={glycemicStyles.container}>
        {/* Legend */}
        <View style={glycemicStyles.legendRow}>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: '#f59e0b' }]} />
            <Text style={glycemicStyles.legendText}>Manhã (Jejum + Pós Café)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: '#0ea5e9' }]} />
            <Text style={glycemicStyles.legendText}>Tarde (Pré + Pós Almoço)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: '#8b5cf6' }]} />
            <Text style={glycemicStyles.legendText}>Noite (Pré + Pós Jantar)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: '#1e293b' }]} />
            <Text style={glycemicStyles.legendText}>Madrugada (3h)</Text>
          </View>
        </View>

        <View style={{ marginTop: 6 }} />

        {/* Main Table */}
        <View style={tableStyles.table}>
          {/* Row 1: Period Group Headers */}
          <View style={[tableStyles.row, { height: 20, backgroundColor: '#f8fafc' }]}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#0d9488' }]}>
              <Text style={glycemicStyles.periodTitle}>DIA</Text>
            </View>
            <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: '#f59e0b' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="sun" color="#ffffff" />
                <Text style={glycemicStyles.periodTitle}>MANHÃ</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: '#0ea5e9' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="utensils" color="#ffffff" />
                <Text style={glycemicStyles.periodTitle}>TARDE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: '#7c3aed' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="moon" color="#ffffff" />
                <Text style={glycemicStyles.periodTitle}>NOITE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: '#1e293b' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <HeaderIcon icon="bed" color="#ffffff" />
                <Text style={glycemicStyles.periodTitle}>3:00h</Text>
              </View>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#64748b' }]}>
              <Text style={glycemicStyles.periodTitle}>OBS</Text>
            </View>
          </View>

          {/* Row 2: Sub-column Headers */}
          <View style={glycemicStyles.subHeaderRow}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: '#f0fdfa' }]}>
              <Text style={[glycemicStyles.subHeaderText, { color: '#0f766e' }]}>Data</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#fffbeb' }]}>
              <HeaderIcon icon="sun" color="#d97706" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#92400e', marginTop: 1 }]}>Jejum</Text>
              <Text style={[glycemicStyles.subHeaderText, { color: '#b45309', fontSize: 5 }]}>(ao acordar)</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#fffbeb' }]}>
              <HeaderIcon icon="coffee" color="#92400e" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#92400e', marginTop: 1 }]}>2h pós Café</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#f0f9ff' }]}>
              <HeaderIcon icon="utensils" color="#0369a1" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#0c4a6e', marginTop: 1 }]}>Pré Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#f0f9ff' }]}>
              <HeaderIcon icon="clock" color="#0369a1" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#0c4a6e', marginTop: 1 }]}>2h pós Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#f5f3ff' }]}>
              <HeaderIcon icon="utensils" color="#6d28d9" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#4c1d95', marginTop: 1 }]}>Pré Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: '#f5f3ff' }]}>
              <HeaderIcon icon="clock" color="#6d28d9" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#4c1d95', marginTop: 1 }]}>2h pós Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: '#f1f5f9' }]}>
              <HeaderIcon icon="bed" color="#334155" />
              <Text style={[glycemicStyles.subHeaderText, { color: '#1e293b', marginTop: 1 }]}>Madrugada</Text>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: '#f8fafc' }]}>
              <Text style={glycemicStyles.subHeaderText}></Text>
            </View>
          </View>

          {/* Data Rows */}
          {Array.from({ length: DAYS }).map((_, i) => {
            const isEven = i % 2 === 0;
            const bgColor = isEven ? '#ffffff' : '#f8fafc';
            const isLast = i === DAYS - 1;
            return (
              <View style={[tableStyles.row, { backgroundColor: bgColor, height: 22 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                <View style={[tableStyles.col, { width: dateColWidth }]}>
                  <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#fffef5' : '#fffbeb' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#f5fbff' : '#f0f9ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#f5fbff' : '#f0f9ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#faf8ff' : '#f5f3ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? '#faf8ff' : '#f5f3ff' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: isEven ? '#f8fafc' : '#f1f5f9' }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Reference Values Box */}
        <View style={glycemicStyles.refBox}>
          <Text style={glycemicStyles.refTitle}>Valores de Referência (mg/dL):</Text>
          <View style={glycemicStyles.refRow}>
            <Text style={glycemicStyles.refText}>• Jejum: 70 - 100</Text>
            <Text style={glycemicStyles.refText}>• 2h após refeição: até 140</Text>
            <Text style={glycemicStyles.refText}>• Ao dormir: 100 - 140</Text>
            <Text style={glycemicStyles.refText}>• Madrugada: acima de 70</Text>
          </View>
        </View>

      </View>
    </BaseDocument>
  );
};
