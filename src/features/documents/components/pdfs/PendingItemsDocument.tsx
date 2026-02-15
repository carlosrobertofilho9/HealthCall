import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { BaseDocument } from './PdfCommon';
import { DocumentFormData } from '../DocumentPdf';

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    height: 230, // Fixed height to fit 3 per page
    justifyContent: 'flex-start',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
    width: '65%',
  },
  headerRight: {
     flexDirection: 'column',
     alignItems: 'flex-end',
     width: '35%',
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  typeContainer: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0f766e',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryContainer: {
    flex: 1,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 2,
  },
  summaryText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.5,
  },
  emptyLines: {
    marginTop: 10,
    gap: 18,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: 1,
    width: '100%',
  },
  itemNumber: {
    position: 'absolute',
    top: 6,
    right: 10,
    fontSize: 60,
    color: '#f1f5f9',
    fontWeight: 'bold',
    zIndex: -1,
  }
});

interface PendingItemsDocumentProps {
  visibleParagraphs?: string[];
  formData?: DocumentFormData;
}

export const PendingItemsDocument: React.FC<PendingItemsDocumentProps> = ({ formData }) => {
  // Ensure we have 3 slots
  const slots = [0, 1, 2];
  const items = formData?.pendencias || [];

  return (
    <BaseDocument title="Folha de Pendências da Semana" showFooter={true} hidePatientInfo={true} wrap={false}>
      <View>
        {slots.map((i) => {
          const item = items[i];
          return (
             <View key={i} style={styles.section}>
                {/* Visual number background */}
                <Text style={styles.itemNumber}>{i + 1}</Text>

                {/* Header with Patient Info and Type */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={{ marginBottom: 8 }}>
                            <Text style={styles.label}>Nome do Paciente</Text>
                            <Text style={styles.value}>{item?.nomePaciente || '________________________________________________'}</Text>
                        </View>
                        <View>
                            <Text style={styles.label}>CNS ou CPF</Text>
                            <Text style={[styles.value, { fontSize: 10 }]}>{item?.cnsCpf || '________________________'}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <View style={styles.typeContainer}>
                            <Text style={styles.label}>Tipo de Pendência</Text>
                            {item?.tipo ? (
                                <Text style={styles.typeBadge}>{item.tipo.toUpperCase()}</Text>
                            ) : (
                                <View style={{ height: 20, width: 100, borderBottomWidth: 1, borderBottomColor: '#cbd5e1' }} />
                            )}
                        </View>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.summaryContainer}>
                     <Text style={styles.summaryLabel}>Resumo / Descrição:</Text>
                     {item?.resumo ? (
                        <Text style={styles.summaryText}>{item.resumo}</Text>
                     ) : (
                        <View style={styles.emptyLines}>
                             <View style={styles.line} />
                             <View style={styles.line} />
                             <View style={styles.line} />
                             <View style={styles.line} />
                             <View style={styles.line} />
                        </View>
                     )}
                </View>
             </View>
          );
        })}
      </View>
    </BaseDocument>
  );
};
