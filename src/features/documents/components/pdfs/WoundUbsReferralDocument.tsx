import React from 'react';
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { BaseDocument, pdfTheme } from './PdfCommon';

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: pdfTheme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    color: pdfTheme.colors.text.white,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionBody: {
    padding: 10,
    backgroundColor: pdfTheme.colors.text.white,
  },
  line: {
    marginBottom: 6,
  },
  label: {
    fontSize: 7,
    color: pdfTheme.colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    color: pdfTheme.colors.text.main,
  },
  disclaimer: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
    backgroundColor: pdfTheme.colors.warning.softBg,
    borderRadius: 6,
  },
  disclaimerText: {
    fontSize: 8,
    color: pdfTheme.colors.warning.dark,
    lineHeight: 1.4,
  },
});

interface WoundUbsReferralDocumentProps {
  values?: Record<string, string>;
  visibleParagraphs: string[];
}

const get = (values: Record<string, string> | undefined, key: string, fallback = ''): string => {
  return values?.[key] || fallback;
};

export const WoundUbsReferralDocument: React.FC<WoundUbsReferralDocumentProps> = ({ values }) => {
  return (
    <BaseDocument
      title="Referência UBS - Curativo"
      nomePaciente={get(values, 'NOME_PACIENTE')}
      cnsCpf={get(values, 'CNS_CPF')}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Resumo da lesão</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.line}>
            <Text style={styles.label}>Localização anatômica</Text>
            <Text style={styles.value}>{get(values, 'LOCALIZACAO_LESAO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Data de início</Text>
            <Text style={styles.value}>{get(values, 'DATA_INICIO_LESAO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Classificação</Text>
            <Text style={styles.value}>{get(values, 'CLASSIFICACAO_LESAO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Última medida registrada</Text>
            <Text style={styles.value}>{get(values, 'ULTIMA_MEDIDA')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Última cobertura</Text>
            <Text style={styles.value}>{get(values, 'ULTIMA_COBERTURA')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Dados do encerramento</Text>
        </View>
        <View style={styles.sectionBody}>
          <View style={styles.line}>
            <Text style={styles.label}>Tipo de fechamento</Text>
            <Text style={styles.value}>{get(values, 'TIPO_FECHAMENTO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Data do fechamento</Text>
            <Text style={styles.value}>{get(values, 'DATA_FECHAMENTO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Motivo/observações</Text>
            <Text style={styles.value}>{get(values, 'MOTIVO_ENCERRAMENTO')}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Última observação clínica</Text>
            <Text style={styles.value}>{get(values, 'ULTIMA_OBSERVACAO')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Orientações para continuidade do cuidado</Text>
        </View>
        <View style={styles.sectionBody}>
          <Text style={styles.value}>{get(values, 'ORIENTACOES_UBS')}</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Documento de referência para continuidade do cuidado na UBS. Manter o histórico clínico anexado ao prontuário do paciente.
        </Text>
      </View>
    </BaseDocument>
  );
};

export default WoundUbsReferralDocument;
