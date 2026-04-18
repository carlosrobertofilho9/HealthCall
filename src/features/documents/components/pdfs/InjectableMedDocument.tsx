import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument, FieldValue, formatDate, pdfTheme, type DocumentFormData } from './PdfCommon';
import { SmartSection, CriticalSection } from './PdfBreakSystem';
const s = StyleSheet.create({
  container: { width: '100%' },
  // --- Section ---
  sectionBox: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    padding: 10,
    backgroundColor: pdfTheme.colors.text.white,
  },
  // --- Fields ---
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 12,
  },
  fieldGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.secondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldLine: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.borderDark,
    height: 18,
    justifyContent: 'center',
  },
  fieldLineText: {
    fontSize: 9,
    color: pdfTheme.colors.text.main,
  },
  // --- Checkboxes ---
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: pdfTheme.colors.text.light,
    borderRadius: 2,
  },
  checkLabel: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.main,
  },
  // --- Medication highlight card ---
  medCard: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: pdfTheme.colors.primaryDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  medCardLeft: {
    backgroundColor: pdfTheme.colors.primaryDark,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  medCardLeftText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.white,
    textAlign: 'center',
    marginTop: 4,
  },
  medCardBody: {
    flex: 1,
    padding: 10,
    backgroundColor: pdfTheme.colors.softBg,
  },
  medFieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 5,
  },
  medFieldLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  medFieldValue: {
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.softBg,
    height: 16,
    justifyContent: 'center',
  },
  medFieldValueText: {
    fontSize: 9,
    color: pdfTheme.colors.primary,
  },
  // --- Stamp box ---
  stampBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: pdfTheme.colors.bgLight,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
  },
  stampTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.main,
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  // --- Signature ---
  signatureRow: {
    flexDirection: 'row',
    marginTop: 16,
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
  // --- Info box ---
  infoBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: pdfTheme.colors.info.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.info.border,
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.info.text,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 7,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  // --- Alert box ---
  alertBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: pdfTheme.colors.danger.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.danger.border,
  },
  alertTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: pdfTheme.colors.danger.text,
    marginBottom: 3,
  },
  alertText: {
    fontSize: 7,
    color: pdfTheme.colors.danger.dark,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  // --- Comprovante badge ---
  badge: {
    alignSelf: 'center',
    backgroundColor: pdfTheme.colors.success.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.border,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.success.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

interface InjectableMedDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const InjectableMedDocument: React.FC<InjectableMedDocumentProps> = ({ visibleParagraphs, formData }) => (
  <BaseDocument title="Relatório de Medicação Injetável" visibleParagraphs={visibleParagraphs} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
    <View style={s.container}>
      {/* Badge Comprovante */}
      <View style={s.badge}>
        <HeaderIcon icon="checkCircle" color={pdfTheme.colors.success.text} />
        <Text style={s.badgeText}>Comprovante de Administração</Text>
      </View>

      {/* Section 1: Medicação Card */}
      <View style={s.medCard}>
        <View style={s.medCardLeft}>
          <HeaderIcon icon="syringe" color={pdfTheme.colors.text.white} />
          <Text style={s.medCardLeftText}>Medicação{'\n'}Injetável</Text>
        </View>
        <View style={s.medCardBody}>
          <View style={s.medFieldRow}>
            <View style={{ flex: 2 }}>
              <Text style={s.medFieldLabel}>Nome da Medicação</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.nomeMedicamento || ''}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Apresentação</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.apresentacao || ''}</Text></View>
            </View>
          </View>
          <View style={s.medFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Dose Administrada</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.doseAdministrada || ''}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Via de Administração</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                {['IM', 'IV', 'SC', 'ID'].map((via) => (
                  <View key={via} style={s.checkRow}>
                    <View style={[s.checkBox, { borderColor: pdfTheme.colors.primaryDark }]} />
                    <Text style={[s.checkLabel, { color: pdfTheme.colors.primary, fontWeight: 'bold' }]}>{via}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={s.medFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Lote</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.lote || ''}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Validade</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formatDate(formData?.validade)}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Fabricante</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.fabricante || ''}</Text></View>
            </View>
          </View>
          <View style={s.medFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Local da Aplicação</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Deltóide D', 'Deltóide E', 'Glúteo D', 'Glúteo E', 'Vasto Lateral D', 'Vasto Lateral E', 'Outro'].map((local) => (
                  <View key={local} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{local}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2: Dados da Administração */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: pdfTheme.colors.purple.text }]}>
          <HeaderIcon icon="clock" color={pdfTheme.colors.text.white} />
          <Text style={s.sectionHeaderText}>Dados da Administração</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Data da Administração</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formatDate(formData?.dataProcedimento)}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Hora</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.horaProcedimento || '___:___'}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Médico Prescritor</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.medicoPrescritor || ''}</Text></View>
            </View>
          </View>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Profissional que Administrou</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.profissional || ''}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>COREN / Registro</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.crmCoren || ''}</Text></View>
            </View>
          </View>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Reações Imediatas Observadas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Nenhuma', 'Dor local', 'Rubor', 'Edema', 'Lipotímia', 'Reação Alérgica', 'Outra'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Observações</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
              <View style={[s.fieldLine, { marginTop: 2 }]}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Stamp & Signature box */}
      <View style={s.stampBox}>
        <Text style={s.stampTitle}>Confirmação da Administração</Text>
        <View style={s.signatureRow}>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Paciente</Text>
          </View>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Profissional - Carimbo</Text>
          </View>
        </View>
      </View>

      {/* Info box */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="clipboard" color={pdfTheme.colors.info.text} />
          <Text style={s.infoTitle}>Orientações ao Paciente:</Text>
        </View>
        <Text style={s.infoText}>- Permanecer no local por pelo menos 30 minutos após a aplicação para observação.</Text>
        <Text style={s.infoText}>- Não massagear o local da aplicação (exceto se orientado pelo profissional).</Text>
        <Text style={s.infoText}>- Aplicar compressa fria se houver dor ou inchaço no local.</Text>
        <Text style={s.infoText}>- Em caso de reações como falta de ar, inchaço no rosto/garganta, urticária, procurar atendimento de urgência imediatamente.</Text>
      </View>

      {/* Alert box */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="alertTriangle" color={pdfTheme.colors.danger.text} />
          <Text style={s.alertTitle}>Reações Alérgicas Graves — Procurar Emergência:</Text>
        </View>
        <Text style={s.alertText}>- Dificuldade para respirar ou engolir.</Text>
        <Text style={s.alertText}>- Inchaço em lábios, língua ou garganta.</Text>
        <Text style={s.alertText}>- Tontura intensa, desmaio ou queda da pressão.</Text>
        <Text style={s.alertText}>- Erupções cutâneas generalizadas (urticária).</Text>
      </View>
    </View>
  </BaseDocument>
);
