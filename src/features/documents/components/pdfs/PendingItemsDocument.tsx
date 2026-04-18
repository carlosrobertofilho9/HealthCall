import React from 'react';
import { Text, View, StyleSheet, Svg, Rect } from '@react-pdf/renderer';
import { BaseDocument, pdfTheme } from './PdfCommon';
import { DocumentFormData } from '../DocumentPdf';

const styles = StyleSheet.create({
  // Each pending item card
  card: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 6,
    overflow: 'hidden',
    height: 148,
  },
  // Colored top bar with item number
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  cardHeaderNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
  },
  cardHeaderTitle: {
    fontSize: 9,
    color: pdfTheme.colors.softBg,
    flex: 1,
  },
  resolvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resolvedLabel: {
    fontSize: 7,
    color: pdfTheme.colors.softBg,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  // Card body
  cardBody: {
    padding: 8,
    paddingTop: 6,
    flex: 1,
    justifyContent: 'space-between',
  },
  // Row with fields
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  field: {
    flex: 1,
  },
  fieldSmall: {
    width: '35%',
  },
  fieldLarge: {
    width: '65%',
  },
  fieldLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  fieldLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 14,
    justifyContent: 'center',
  },
  fieldValue: {
    fontSize: 9,
    color: pdfTheme.colors.text.dark,
    fontWeight: 'bold',
  },
  // Type checkboxes row
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 5,
  },
  typeLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginRight: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 6,
  },
  typeOptionText: {
    fontSize: 8,
    color: pdfTheme.colors.text.main,
  },
  // Summary section
  summarySection: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  summaryLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
    height: 14,
    justifyContent: 'center',
  },
  summaryText: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
  },
});

// Checkbox component: a simple square box for hand-marking
const Checkbox = ({ size = 10 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 10 10">
    <Rect
      x={0.5}
      y={0.5}
      width={9}
      height={9}
      rx={1.5}
      ry={1.5}
      stroke={pdfTheme.colors.text.light}
      strokeWidth={1}
      fill="none"
    />
  </Svg>
);

// Types of pending items for the checkboxes
const PENDING_TYPES = ['Encaminhamento', 'Fisioterapia', 'Laudo', 'Medicamento', 'Outro'];

interface PendingItemsDocumentProps {
  visibleParagraphs?: string[];
  formData?: DocumentFormData;
}

export const PendingItemsDocument: React.FC<PendingItemsDocumentProps> = ({ formData }) => {
  const slots = [0, 1, 2, 3];
  const items = formData?.pendencias || [];

  return (
    <BaseDocument title="Folha de Pendências da Semana" showFooter={true} hidePatientInfo={true} wrap={false}>
      <View>
        {slots.map((i) => {
          const item = items[i];
          return (
            <View key={i} style={styles.card}>
              {/* Colored header bar */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderNumber}>#{i + 1}</Text>
                <Text style={styles.cardHeaderTitle}>Pendência</Text>
                <View style={styles.resolvedContainer}>
                  <Text style={styles.resolvedLabel}>Resolvido</Text>
                  <Svg width={10} height={10} viewBox="0 0 10 10">
                    <Rect x={0.5} y={0.5} width={9} height={9} rx={1.5} ry={1.5} stroke={pdfTheme.colors.softBg} strokeWidth={1} fill="none" />
                  </Svg>
                </View>
              </View>

              {/* Card body */}
              <View style={styles.cardBody}>
                {/* Row 1: Nome do Paciente + CNS/CPF */}
                <View style={styles.fieldsRow}>
                  <View style={styles.fieldLarge}>
                    <Text style={styles.fieldLabel}>Nome do Paciente</Text>
                    <View style={styles.fieldLine}>
                      {item?.nomePaciente ? (
                        <Text style={styles.fieldValue}>{item.nomePaciente}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.fieldSmall}>
                    <Text style={styles.fieldLabel}>CNS / CPF</Text>
                    <View style={styles.fieldLine}>
                      {item?.cnsCpf ? (
                        <Text style={styles.fieldValue}>{item.cnsCpf}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {/* Row 2: Tipo checkboxes */}
                <View style={styles.typeRow}>
                  <Text style={styles.typeLabel}>Tipo:</Text>
                  {PENDING_TYPES.map((type) => (
                    <View key={type} style={styles.typeOption}>
                      <Checkbox size={9} />
                      <Text style={styles.typeOptionText}>{type}</Text>
                    </View>
                  ))}
                </View>

                {/* Row 3: Resumo (2 lines for hand-writing) */}
                <View style={styles.summarySection}>
                  <Text style={styles.summaryLabel}>Resumo</Text>
                  {item?.resumo ? (
                    <Text style={styles.summaryText}>{item.resumo}</Text>
                  ) : (
                    <View style={{ gap: 14 }}>
                      <View style={styles.summaryLine} />
                      <View style={styles.summaryLine} />
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </BaseDocument>
  );
};
