import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, tableStyles, BaseDocument, pdfTheme, type DocumentFormData } from './PdfCommon';

const glycemicStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  periodTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textAlign: 'center',
    paddingVertical: 3,
  },
  subHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.primaryDark,
    height: 24,
    alignItems: 'center',
  },
  subHeaderText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    marginTop: 6,
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
    color: pdfTheme.colors.text.muted,
  },
  refBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: pdfTheme.colors.warning.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
  },
  refTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.warning.text,
    marginBottom: 3,
  },
  refRow: {
    flexDirection: 'row',
    gap: 20,
  },
  refText: {
    fontSize: 7,
    color: pdfTheme.colors.warning.dark,
  },
});

interface GlycemicDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const GlycemicDocument: React.FC<GlycemicDocumentProps> = ({ visibleParagraphs, formData }) => {
  const DAYS = 14;
  const dateColWidth = '8%';
  const morningGroupWidth = '23%';
  const afternoonGroupWidth = '23%';
  const nightGroupWidth = '23%';
  const madrugadaColWidth = '11.5%';
  const obsColWidth = '11.5%';

  return (
    <BaseDocument title="Controle Glicêmico" visibleParagraphs={visibleParagraphs} showFooter={false} wrap={false} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
      <View style={glycemicStyles.container}>
        {/* Legend */}
        <View style={glycemicStyles.legendRow}>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.period.morning }]} />
            <Text style={glycemicStyles.legendText}>Manhã (Jejum + Pós Café)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.period.lunch }]} />
            <Text style={glycemicStyles.legendText}>Tarde (Pré + Pós Almoço)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.purple.strong }]} />
            <Text style={glycemicStyles.legendText}>Noite (Pré + Pós Jantar)</Text>
          </View>
          <View style={glycemicStyles.legendItem}>
            <View style={[glycemicStyles.legendColor, { backgroundColor: pdfTheme.colors.text.dark }]} />
            <Text style={glycemicStyles.legendText}>Madrugada (3h)</Text>
          </View>
        </View>

        <View style={{ marginTop: 6 }} />

        {/* Main Table */}
        <View style={tableStyles.table}>
          {/* Row 1: Period Group Headers */}
          <View style={[tableStyles.row, { height: 20, backgroundColor: pdfTheme.colors.bgLight }]}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.primaryDark }]}>
              <Text style={glycemicStyles.periodTitle}>DIA</Text>
            </View>
            <View style={[tableStyles.col, { width: morningGroupWidth, backgroundColor: pdfTheme.colors.period.morning }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="sun" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>MANHÃ</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: afternoonGroupWidth, backgroundColor: pdfTheme.colors.period.lunch }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="utensils" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>TARDE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: nightGroupWidth, backgroundColor: pdfTheme.colors.purple.text }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <HeaderIcon icon="moon" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>NOITE</Text>
              </View>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: pdfTheme.colors.text.dark }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <HeaderIcon icon="bed" color={pdfTheme.colors.text.white} />
                <Text style={glycemicStyles.periodTitle}>3:00h</Text>
              </View>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.text.secondary }]}>
              <Text style={glycemicStyles.periodTitle}>OBS</Text>
            </View>
          </View>

          {/* Row 2: Sub-column Headers */}
          <View style={glycemicStyles.subHeaderRow}>
            <View style={[tableStyles.col, { width: dateColWidth, backgroundColor: pdfTheme.colors.softBg }]}>
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.primary }]}>Data</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
              <HeaderIcon icon="sun" color={pdfTheme.colors.period.morningIcon} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.warning.text, marginTop: 1 }]}>Jejum</Text>
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.period.morningText, fontSize: 5 }]}>(ao acordar)</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.warning.softBg }]}>
              <HeaderIcon icon="coffee" color={pdfTheme.colors.warning.text} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.warning.text, marginTop: 1 }]}>2h pós Café</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.period.lunchSoft }]}>
              <HeaderIcon icon="utensils" color={pdfTheme.colors.info.strong} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.period.lunchText, marginTop: 1 }]}>Pré Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.period.lunchSoft }]}>
              <HeaderIcon icon="clock" color={pdfTheme.colors.info.strong} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.period.lunchText, marginTop: 1 }]}>2h pós Almoço</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.purple.bg }]}>
              <HeaderIcon icon="utensils" color={pdfTheme.colors.purple.icon} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.purple.iconDark, marginTop: 1 }]}>Pré Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: '11.5%', backgroundColor: pdfTheme.colors.purple.bg }]}>
              <HeaderIcon icon="clock" color={pdfTheme.colors.purple.icon} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.purple.iconDark, marginTop: 1 }]}>2h pós Jantar</Text>
            </View>
            <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
              <HeaderIcon icon="bed" color={pdfTheme.colors.text.main} />
              <Text style={[glycemicStyles.subHeaderText, { color: pdfTheme.colors.text.dark, marginTop: 1 }]}>Madrugada</Text>
            </View>
            <View style={[tableStyles.col, tableStyles.lastCol, { width: obsColWidth, backgroundColor: pdfTheme.colors.bgLight }]}>
              <Text style={glycemicStyles.subHeaderText}></Text>
            </View>
          </View>

          {/* Data Rows */}
          {Array.from({ length: DAYS }).map((_, i) => {
            const isEven = i % 2 === 0;
            const bgColor = isEven ? pdfTheme.colors.text.white : pdfTheme.colors.bgLight;
            const isLast = i === DAYS - 1;
            return (
              <View style={[tableStyles.row, { backgroundColor: bgColor, height: 19 }, isLast ? { borderBottomWidth: 0 } : {}]} key={i}>
                <View style={[tableStyles.col, { width: dateColWidth }]}>
                  <Text style={[tableStyles.cellText, { fontSize: 8 }]}>___/___</Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.morningAlt : pdfTheme.colors.warning.softBg }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.lunchAlt : pdfTheme.colors.period.lunchSoft }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.period.lunchAlt : pdfTheme.colors.period.lunchSoft }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.purple.bgSoft : pdfTheme.colors.purple.bg }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: '11.5%', backgroundColor: isEven ? pdfTheme.colors.purple.bgSoft : pdfTheme.colors.purple.bg }]}>
                  <Text style={tableStyles.cellText}></Text>
                </View>
                <View style={[tableStyles.col, { width: madrugadaColWidth, backgroundColor: isEven ? pdfTheme.colors.bgLight : pdfTheme.colors.bgLight }]}>
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
