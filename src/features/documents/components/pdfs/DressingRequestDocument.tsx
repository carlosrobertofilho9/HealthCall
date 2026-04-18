import React from 'react';
import { Text, View, StyleSheet, Svg, Rect, Path } from '@react-pdf/renderer';
import { BaseDocument, HeaderIcon, formatDate, pdfTheme, type DocumentFormData } from './PdfCommon';

const MATERIALS = [
  { key: 'MATERIAL_CURATIVO_GAZE', label: 'Gaze estéril' },
  { key: 'MATERIAL_CURATIVO_MICROPORE', label: 'Micropore' },
  { key: 'MATERIAL_CURATIVO_ALGODAO', label: 'Algodão' },
  { key: 'MATERIAL_CURATIVO_LUVAS', label: 'Luvas de procedimento' },
  { key: 'MATERIAL_CURATIVO_SORO', label: 'Soro fisiológico 0,9%' },
  { key: 'MATERIAL_CURATIVO_ATADURA', label: 'Atadura de crepe' },
  { key: 'MATERIAL_CURATIVO_ESPARADRAPO', label: 'Esparadrapo' },
  { key: 'MATERIAL_CURATIVO_COMPRESSA', label: 'Compressa estéril' },
  { key: 'MATERIAL_CURATIVO_MASCARA', label: 'Máscara cirúrgica' },
  { key: 'MATERIAL_CURATIVO_CLOREXIDINA', label: 'Clorexidina aquosa' },
  { key: 'MATERIAL_CURATIVO_PVPI', label: 'PVPI tópico' },
  { key: 'MATERIAL_CURATIVO_ALCOOL_70', label: 'Álcool 70%' },
  { key: 'MATERIAL_CURATIVO_HIDROGEL', label: 'Hidrogel' },
  { key: 'MATERIAL_CURATIVO_AGE', label: 'AGE / óleo de girassol' },
  { key: 'MATERIAL_CURATIVO_ALGINATO', label: 'Alginato de cálcio' },
  { key: 'MATERIAL_CURATIVO_RAYON', label: 'Rayon / gaze não aderente' },
  { key: 'MATERIAL_CURATIVO_OUTROS', label: 'Outros materiais' },
];

const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: pdfTheme.colors.success.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.success.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  intro: {
    fontSize: 11,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  field: {
    flex: 1,
    backgroundColor: pdfTheme.colors.bgLight,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 5,
    padding: 7,
  },
  fieldLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 9,
    color: pdfTheme.colors.text.dark,
    minHeight: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  materialItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.border,
  },
  materialItemLeft: {
    borderRightWidth: 1,
    borderRightColor: pdfTheme.colors.border,
  },
  materialSelected: {
    backgroundColor: pdfTheme.colors.success.softBg,
  },
  materialLabel: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
  },
  materialLabelSelected: {
    color: pdfTheme.colors.success.dark,
    fontWeight: 'bold',
  },
  textBox: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 9,
    minHeight: 44,
  },
  textBoxLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textBoxValue: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
  },
  noteBox: {
    marginTop: 'auto',
    padding: 8,
    backgroundColor: pdfTheme.colors.warning.softBg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
  },
  noteText: {
    fontSize: 7,
    color: pdfTheme.colors.warning.dark,
    lineHeight: 1.35,
  },
  signatureRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 30,
    justifyContent: 'center',
  },
  signatureBlock: {
    alignItems: 'center',
    width: 200,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.text.main,
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.secondary,
    textAlign: 'center',
  },
});

interface DressingRequestDocumentProps {
  visibleParagraphs?: string[];
  formData?: DocumentFormData;
  values?: Record<string, string>;
}

const Checkbox = ({ checked }: { checked: boolean }) => (
  <Svg width={12} height={12} viewBox="0 0 12 12">
    <Rect
      x={0.75}
      y={0.75}
      width={10.5}
      height={10.5}
      rx={2}
      stroke={checked ? pdfTheme.colors.success.dark : pdfTheme.colors.text.light}
      strokeWidth={1.5}
      fill={checked ? pdfTheme.colors.success.bgStrong : 'none'}
    />
    {checked && (
      <Path
        d="M3.1 6.1L5.1 8.1L9 4"
        stroke={pdfTheme.colors.success.dark}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

export const DressingRequestDocument: React.FC<DressingRequestDocumentProps> = ({ formData, values = {} }) => {
  const otherMaterials = values.OUTROS_MATERIAIS_CURATIVO || '';
  const observations = values.OBSERVACOES_CURATIVO || '';
  const requestDate = values.DATA_SOLICITACAO_CURATIVO || getTodayInputDate();

  return (
    <BaseDocument
      title="Solicitação de Curativo"
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
      wrap={false}
    >
      <View style={s.container}>
        <View style={s.badge}>
          <HeaderIcon icon="clipboard" color={pdfTheme.colors.success.dark} />
          <Text style={s.badgeText}>Solicitação de Materiais para Curativo</Text>
        </View>

        <Text style={s.intro}>
          Solicito o fornecimento dos materiais abaixo assinalados para realização e continuidade do curativo.
        </Text>

        <View style={s.fieldsRow}>
          <View style={s.field}>
            <Text style={s.fieldLabel}>Data da Solicitação</Text>
            <Text style={s.fieldValue}>{formatDate(requestDate)}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Materiais Solicitados</Text>
        <View style={s.materialsGrid}>
          {MATERIALS.map((item, index) => {
            const checked = values[item.key] === 'true';
            return (
              <View
                key={item.key}
                style={[
                  s.materialItem,
                  index % 2 === 0 && s.materialItemLeft,
                  checked && s.materialSelected,
                ]}
              >
                <Checkbox checked={checked} />
                <Text style={[s.materialLabel, checked && s.materialLabelSelected]}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.textBox}>
          <Text style={s.textBoxLabel}>Outros Materiais</Text>
          <Text style={s.textBoxValue}>{otherMaterials}</Text>
        </View>

        <View style={s.textBox}>
          <Text style={s.textBoxLabel}>Observações / Justificativa</Text>
          <Text style={s.textBoxValue}>{observations}</Text>
        </View>

        <View style={s.noteBox}>
          <Text style={s.noteText}>- A solicitação deve considerar avaliação da ferida, frequência de troca e disponibilidade da unidade.</Text>
          <Text style={s.noteText}>- Materiais assinalados destinam-se ao cuidado do paciente identificado neste documento.</Text>
        </View>

        <View style={s.signatureRow}>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura e Carimbo do Profissional</Text>
          </View>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>{formData?.profissional || 'Profissional Responsável'} {formData?.crmCoren ? `- ${formData.crmCoren}` : ''}</Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
