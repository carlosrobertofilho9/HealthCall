import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import { BaseDocument, pdfTheme } from '@/features/documents/components/pdfs/PdfCommon';
import type { Prescription } from '../../types';

interface Props {
  prescriptions: Prescription[];
  weekLabel: string;
}

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  ready: 'Pronta',
  delivered: 'Entregue',
  denied: 'Negada',
};

const styles = StyleSheet.create({
  summaryBox: {
    backgroundColor: pdfTheme.colors.bgLight,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  summaryLabel: {
    fontSize: 8,
    color: pdfTheme.colors.text.secondary,
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.primary,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: 'bold',
  },
  flagBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 7,
    marginRight: 2,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 10,
    color: pdfTheme.colors.text.secondary,
    marginTop: 20,
  },
});

const PrescriptionsReportDocument: React.FC<Props> = ({ prescriptions, weekLabel }) => {
  const counts = {
    total: prescriptions.length,
    pending: prescriptions.filter((p) => p.status === 'pending').length,
    ready: prescriptions.filter((p) => p.status === 'ready').length,
    delivered: prescriptions.filter((p) => p.status === 'delivered').length,
    denied: prescriptions.filter((p) => p.status === 'denied').length,
  };

  const statusColors: Record<string, string> = {
    pending: pdfTheme.colors.warning.text,
    ready: pdfTheme.colors.success.dark,
    delivered: pdfTheme.colors.text.secondary,
    denied: pdfTheme.colors.danger.dark,
  };

  const statusBgs: Record<string, string> = {
    pending: pdfTheme.colors.warning.bg,
    ready: pdfTheme.colors.success.bg,
    delivered: pdfTheme.colors.neutral.bg,
    denied: pdfTheme.colors.danger.bg,
  };

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: 'Helvetica' }}>
        <BaseDocument title={`Relatório de Receitas — ${weekLabel}`} hidePatientInfo>
          {/* Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{counts.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{counts.pending}</Text>
              <Text style={styles.summaryLabel}>Pendentes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{counts.ready}</Text>
              <Text style={styles.summaryLabel}>Prontas</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{counts.delivered}</Text>
              <Text style={styles.summaryLabel}>Entregues</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{counts.denied}</Text>
              <Text style={styles.summaryLabel}>Negadas</Text>
            </View>
          </View>

          {/* Table */}
          {prescriptions.length === 0 ? (
            <Text style={styles.emptyState}>Nenhuma receita no período selecionado.</Text>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Paciente</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Documento</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Sinalizações</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Observação</Text>
              </View>

              {prescriptions.map((p) => (
                <View key={p.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{p.patient_name}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {p.document_type}: {p.document_value}
                  </Text>
                  <View style={{ flex: 1.5 }}>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color: statusColors[p.status] || pdfTheme.colors.text.main,
                          backgroundColor: statusBgs[p.status] || pdfTheme.colors.bgLight,
                        },
                      ]}
                    >
                      {statusLabel[p.status] || p.status}
                    </Text>
                  </View>
                  <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {p.flags.length === 0 ? (
                      <Text style={[styles.tableCell, { fontSize: 8, color: pdfTheme.colors.text.light }]}>
                        Manutenção
                      </Text>
                    ) : (
                      p.flags.map((f) => (
                        <Text
                          key={f}
                          style={[
                            styles.flagBadge,
                            {
                              backgroundColor: pdfTheme.colors.bgLight,
                              color: pdfTheme.colors.text.secondary,
                              borderWidth: 1,
                              borderColor: pdfTheme.colors.border,
                            },
                          ]}
                        >
                          {f === 'dosage_change' && 'Dose'}
                          {f === 'new_medication' && 'Novo'}
                          {f === 'medication_suspended' && 'Suspenso'}
                          {f === 'total_change' && 'Total'}
                          {f === 'maintenance' && 'Manutenção'}
                        </Text>
                      ))
                    )}
                  </View>
                  <Text style={[styles.tableCell, { flex: 2.5, color: pdfTheme.colors.text.secondary }]}>
                    {p.observation || '-'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BaseDocument>
      </Page>
    </Document>
  );
};

export async function printPrescriptionsReport(prescriptions: Prescription[], weekLabel: string) {
  const blob = await pdf(
    <PrescriptionsReportDocument prescriptions={prescriptions} weekLabel={weekLabel} />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita popups para imprimir o relatório.');
    return;
  }

  printWindow.document.write(`
    <html>
      <head><title>Relatório de Receitas</title></head>
      <body style="margin:0">
        <iframe src="${url}" style="width:100vw;height:100vh;border:none" onload="this.contentWindow.print()"></iframe>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default PrescriptionsReportDocument;
