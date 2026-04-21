import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Appointment } from '@/types';
import {
  BaseDocument,
  HeaderIcon,
  pdfTheme,
} from '@/features/documents/components/pdfs/PdfCommon';
import { PdfIcon } from '@/features/documents/components/pdfs/icons';
import { buildAppointmentConfirmationData } from '../utils/appointmentConfirmationData';

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.primary,
    borderRadius: 8,
    backgroundColor: pdfTheme.colors.bgLight,
    padding: 12,
    marginBottom: 10,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: pdfTheme.colors.success.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.borderStrong,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.success.dark,
    textTransform: 'uppercase',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    padding: 9,
  },
  detailLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.dark,
  },
  section: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 7,
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
    minHeight: 16,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
    justifyContent: 'center',
    paddingBottom: 2,
  },
  value: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    fontWeight: 'bold',
  },
  noteList: {
    gap: 6,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  noteBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: pdfTheme.colors.warning.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.35,
  },
  preparationBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.borderStrong,
    borderRadius: 8,
    backgroundColor: pdfTheme.colors.success.softBg,
    padding: 10,
  },
  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  preparationLabel: {
    fontSize: 7,
    color: pdfTheme.colors.success.dark,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  preparationGrid: {
    gap: 6,
  },
  preparationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  preparationIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparationText: {
    flex: 1,
    fontSize: 8,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.35,
  },
  signature: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  signatureText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
  },
});

interface AppointmentConfirmationPdfProps {
  appointment: Appointment;
}

const getPreparationItems = (serviceType: 'UBS' | 'HOME_VISIT') => {
  if (serviceType === 'HOME_VISIT') {
    return [
      { icon: 'file-text' as const, text: 'Deixe documento, Cartão SUS/CPF e receitas separados para a equipe.' },
      { icon: 'map' as const, text: 'Garanta que alguém no endereço possa receber a equipe no período previsto.' },
      { icon: 'clipboard-check' as const, text: 'Separe dúvidas, exames recentes e materiais relacionados ao motivo da visita.' },
    ];
  }

  return [
    { icon: 'file-text' as const, text: 'Leve documento com foto, Cartão SUS/CPF.' },
    { icon: 'clipboard-check' as const, text: 'Leve receitas, exames recentes e lista de medicamentos em uso.' },
    { icon: 'badge-check' as const, text: 'Ao chegar, apresente-se na recepção para confirmar sua presença.' },
  ];
};

export const AppointmentConfirmationPdf: React.FC<AppointmentConfirmationPdfProps> = ({ appointment }) => {
  const data = buildAppointmentConfirmationData(appointment);
  const preparationItems = getPreparationItems(data.serviceType);

  return (
    <Document>
      <Page size="A4">
        <BaseDocument
          title="Confirmação de Marcação"
          nomePaciente={data.patientName}
          cnsCpf={data.documentLabel}
        >
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroTitleGroup}>
                <HeaderIcon icon="calendar" color={pdfTheme.colors.primary} />
                <Text style={styles.heroTitle}>{data.serviceLabel}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{data.status}</Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Data</Text>
                <Text style={styles.detailValue}>{data.scheduledDateLabel}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Ficha</Text>
                <Text style={styles.detailValue}>{data.slotNumber}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Horário</Text>
                <Text style={styles.detailValue}>{data.timeLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <HeaderIcon icon="file-text" color={pdfTheme.colors.primary} />
              <Text style={styles.sectionTitle}>Dados da marcação</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>ACS responsável</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.value}>{data.acsName}</Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Tipo de atendimento</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.value}>{data.serviceLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Identificação da ficha</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.value}>{data.slotLabel}</Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Horário informado</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.value}>{data.timeLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {data.serviceType === 'HOME_VISIT' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <HeaderIcon icon="map" color={pdfTheme.colors.info.strong} />
                <Text style={styles.sectionTitle}>Dados da visita domiciliar</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>Endereço</Text>
                  <View style={styles.valueLine}>
                    <Text style={styles.value}>{data.homeVisitAddress || 'Não informado'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>Referência</Text>
                  <View style={styles.valueLine}>
                    <Text style={styles.value}>{data.homeVisitReference || 'Não informado'}</Text>
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Motivo</Text>
                  <View style={styles.valueLine}>
                    <Text style={styles.value}>{data.homeVisitReason || 'Não informado'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <HeaderIcon icon="circle-alert" color={pdfTheme.colors.warning.text} />
              <Text style={styles.sectionTitle}>Orientações importantes</Text>
            </View>

            <View style={styles.noteList}>
              {data.importantNotes.map((note, index) => (
                <View key={note} style={styles.noteRow}>
                  <View style={styles.noteBullet}>
                    <PdfIcon
                      name={index === 0 ? 'clock' : 'circle-alert'}
                      size={10}
                      color={pdfTheme.colors.warning.text}
                    />
                  </View>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.preparationBox}>
            <View style={styles.preparationHeader}>
              <HeaderIcon icon="list-checks" color={pdfTheme.colors.success.dark} />
              <Text style={styles.preparationLabel}>Preparar para o atendimento</Text>
            </View>

            <View style={styles.preparationGrid}>
              {preparationItems.map((item) => (
                <View key={item.text} style={styles.preparationItem}>
                  <View style={styles.preparationIcon}>
                    <PdfIcon name={item.icon} size={9} color={pdfTheme.colors.success.dark} />
                  </View>
                  <Text style={styles.preparationText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.signature}>
            <Text style={styles.signatureText}>{data.teamSignature}</Text>
          </View>
        </BaseDocument>
      </Page>
    </Document>
  );
};

export default AppointmentConfirmationPdf;
