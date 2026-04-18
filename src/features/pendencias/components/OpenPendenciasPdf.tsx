import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatCPF, formatCNS } from '@/lib/utils';
import type { Pendencia } from '../types';
import { BaseDocument, pdfTheme } from '@/features/documents/components/pdfs/PdfCommon';
import {
  getAlertLevel,
  isDueToday,
  isOverdue,
} from '../utils/pendenciasOperationalUtils';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 8,
    backgroundColor: pdfTheme.colors.bgLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  listHeader: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.primary,
    borderRadius: 8,
    backgroundColor: pdfTheme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 9,
    color: pdfTheme.colors.text.accent,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  card: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIndex: {
    fontSize: 11,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  statusPill: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: {
    fontSize: 7,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  field: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  valueLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
    minHeight: 16,
    justifyContent: 'center',
    paddingBottom: 1,
  },
  value: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    fontWeight: 'bold',
  },
  tipoTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tipoTag: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: pdfTheme.colors.bgLight,
  },
  tipoTagText: {
    fontSize: 7,
    color: pdfTheme.colors.primary,
    fontWeight: 'bold',
  },
  resumoBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    backgroundColor: pdfTheme.colors.bgLight,
    padding: 8,
  },
  resumoText: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.35,
  },
});

interface OpenPendenciasPdfProps {
  pendencias: Pendencia[];
  title?: string;
  subtitle?: string;
}

const formatDocument = (doc: string): string => {
  const onlyDigits = doc.replace(/\D/g, '');

  if (onlyDigits.length === 11) return formatCPF(doc);
  if (onlyDigits.length === 15) return formatCNS(doc);

  return doc;
};

const formatStatus = (status: Pendencia['status']) => {
  if (status === 'aberto') return 'Aberto';
  if (status === 'em_andamento') return 'Em andamento';
  return 'Resolvido';
};

const getStatusTextColor = (status: Pendencia['status']) => {
  if (status === 'aberto') return pdfTheme.colors.primaryDark;
  if (status === 'em_andamento') return pdfTheme.colors.secondary;
  return pdfTheme.colors.primary;
};

const parseTipoTags = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const formatDueDate = (value: string | null) => {
  if (!value) return 'Não definido';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
};

const formatAlert = (pendencia: Pendencia) => {
  const level = getAlertLevel(pendencia);
  if (level === 'overdue') return 'Atrasado';
  if (level === 'due_today') return 'Vence hoje';
  if (level === 'high_priority') return 'Prioridade alta';
  return 'Sem alerta';
};

export const OpenPendenciasPdf: React.FC<OpenPendenciasPdfProps> = ({
  pendencias,
  title = 'Relatório Semanal de Pendências',
  subtitle = 'Semana atual (segunda a domingo) • Pendências não resolvidas',
}) => {
  const abertoCount = pendencias.filter((item) => item.status === 'aberto').length;
  const andamentoCount = pendencias.filter((item) => item.status === 'em_andamento').length;
  const overdueCount = pendencias.filter((item) => isOverdue(item)).length;
  const dueTodayCount = pendencias.filter((item) => isDueToday(item)).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <BaseDocument title={title} hidePatientInfo={true}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total de registros</Text>
              <Text style={styles.summaryValue}>{pendencias.length}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Status aberto</Text>
              <Text style={styles.summaryValue}>{abertoCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Em andamento</Text>
              <Text style={styles.summaryValue}>{andamentoCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Atrasadas</Text>
              <Text style={styles.summaryValue}>{overdueCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Vence hoje</Text>
              <Text style={styles.summaryValue}>{dueTodayCount}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Gerado em</Text>
              <Text style={styles.summaryValue}>{new Date().toLocaleDateString('pt-BR')}</Text>
            </View>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>{subtitle.toUpperCase()}</Text>
          </View>

          {pendencias.map((pendencia, index) => {
            const tipos = parseTipoTags(pendencia.tipo);

            return (
              <View key={pendencia.id} style={styles.card} wrap={false}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardIndex}>#{index + 1}</Text>
                  <View style={styles.statusPill}>
                    <Text style={[styles.statusPillText, { color: getStatusTextColor(pendencia.status) }]}>
                      {formatStatus(pendencia.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Nome do paciente</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{pendencia.nome_paciente}</Text>
                    </View>
                  </View>
                  <View style={[styles.field, { maxWidth: 180 }]}>
                    <Text style={styles.label}>CNS / CPF</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{formatDocument(pendencia.cns_cpf)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Responsável</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{pendencia.responsavel || 'Não definido'}</Text>
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Prioridade</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{pendencia.prioridade}</Text>
                    </View>
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.label}>Prazo</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{formatDueDate(pendencia.prazo)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.field}>
                    <Text style={styles.label}>Alerta operacional</Text>
                    <View style={styles.valueLine}>
                      <Text style={styles.value}>{formatAlert(pendencia)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Tipos</Text>
                <View style={styles.tipoTagsRow}>
                  {tipos.length > 0 ? (
                    tipos.map((tipoTag) => (
                      <View key={`${pendencia.id}-${tipoTag}`} style={styles.tipoTag}>
                        <Text style={styles.tipoTagText}>{tipoTag}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tipoTag}>
                      <Text style={styles.tipoTagText}>Não informado</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.label}>Resumo da pendência</Text>
                <View style={styles.resumoBox}>
                  <Text style={styles.resumoText}>{pendencia.resumo || '-'}</Text>
                </View>
              </View>
            );
          })}
        </BaseDocument>
      </Page>
    </Document>
  );
};
