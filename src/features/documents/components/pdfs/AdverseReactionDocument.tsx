import React from 'react';
import { Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument, formatDate, pdfTheme, type DocumentFormData } from './PdfCommon';
import { SmartSection, CriticalSection } from './PdfBreakSystem';
const s = StyleSheet.create({
  container: { width: '100%' },
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
  textArea: {
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 4,
    minHeight: 40,
    padding: 6,
  },
  textAreaLabel: {
    fontSize: 7,
    color: pdfTheme.colors.text.light,
  },
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
  infoBox: {
    marginTop: 8,
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
  photoBox: {
    width: 100,
    height: 80,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.neutral.bg,
    overflow: 'hidden',
  },
  photoLabel: {
    fontSize: 6,
    color: pdfTheme.colors.text.light,
    textAlign: 'center',
  },
  consentBlock: {
    marginTop: 6,
    padding: 10,
    backgroundColor: pdfTheme.colors.warning.bg,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
  },
  consentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.warning.text,
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  consentText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.6,
    marginBottom: 4,
    textAlign: 'justify',
  },
});

interface AdverseReactionDocumentProps {
  visibleParagraphs: string[];
  photoUrl?: string;
  formData?: DocumentFormData;
}

export const AdverseReactionDocument: React.FC<AdverseReactionDocumentProps> = ({ visibleParagraphs, photoUrl, formData }) => (
  <BaseDocument title="Termo de Administração de Medicamento / Vacina" visibleParagraphs={visibleParagraphs} nomePaciente={formData?.nomePaciente} cnsCpf={formData?.cnsCpf}>
    <View style={s.container}>
      {/* Badge */}
      <View style={s.badge}>
        <HeaderIcon icon="checkCircle" color={pdfTheme.colors.success.text} />
        <Text style={s.badgeText}>Comprovante de Administração</Text>
      </View>

      {/* Section 1: Medicamento/Vacina Card */}
      <View style={s.medCard}>
        <View style={s.medCardLeft}>
          <HeaderIcon icon="syringe" color={pdfTheme.colors.text.white} />
          <Text style={s.medCardLeftText}>Medicação{'\n'}/ Vacina</Text>
        </View>
        <View style={s.medCardBody}>
          <View style={s.medFieldRow}>
            <View style={{ flex: 2 }}>
              <Text style={s.medFieldLabel}>Nome do Medicamento / Vacina</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.nomeMedicamento || ''}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Apresentação / Dose</Text>
              <View style={s.medFieldValue}><Text style={s.medFieldValueText}>{formData?.apresentacao || ''}</Text></View>
            </View>
          </View>
          <View style={s.medFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Via de Administração</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                {['IM', 'IV', 'SC', 'ID', 'VO', 'Outra'].map((via) => (
                  <View key={via} style={s.checkRow}>
                    <View style={[s.checkBox, { borderColor: pdfTheme.colors.primaryDark }]} />
                    <Text style={[s.checkLabel, { color: pdfTheme.colors.primary, fontWeight: 'bold' }]}>{via}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.medFieldLabel}>Local da Aplicação</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {['Deltóide D', 'Deltóide E', 'Glúteo D', 'Glúteo E', 'Vasto Lateral D', 'Vasto Lateral E', 'Outro'].map((local) => (
                  <View key={local} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{local}</Text>
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
        </View>
      </View>

      {/* Section 3: Observação Pós-Administração */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: pdfTheme.colors.info.strong }]}>
          <HeaderIcon icon="activity" color={pdfTheme.colors.text.white} />
          <Text style={s.sectionHeaderText}>Observação Pós-Administração (preencher se houver reação)</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Reações Observadas</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                {[
                  'Nenhuma', 'Dor local', 'Rubor / Vermelhidão', 'Edema local',
                  'Endurecimento (nódulo)', 'Febre', 'Mal-estar geral',
                  'Urticária', 'Prurido (coceira)', 'Lipotímia / Tontura',
                  'Náusea / Vômito', 'Dispneia', 'Reação Alérgica', 'Outra',
                ].map((item) => (
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
              <Text style={s.fieldLabel}>Gravidade (se houve reação)</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                {['Leve', 'Moderada', 'Grave'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Tempo de Observação na Unidade</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={{ flex: 2 }}>
              <Text style={s.fieldLabel}>Descrição / Conduta (se houve reação)</Text>
              <View style={s.textArea}>
                <Text style={s.textAreaLabel}></Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Foto (se aplicável)</Text>
              <View style={s.photoBox}>
                {photoUrl ? (
                  <Image src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Text style={s.photoLabel}>Anexar foto{'\n'}se necessário</Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Stamp & Signature */}
      <View style={s.stampBox}>
        <Text style={s.stampTitle}>Confirmação da Administração</Text>
        <View style={s.signatureRow}>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Paciente ou Responsável</Text>
          </View>
          <View style={s.signatureBlock}>
            <View style={s.signatureLine} />
            <Text style={s.signatureLabel}>Assinatura do Profissional - Carimbo</Text>
          </View>
        </View>
      </View>

      {/* Termo de ciência */}
      <View style={s.consentBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <HeaderIcon icon="shield" color={pdfTheme.colors.warning.text} />
          <Text style={s.consentTitle}>Termo de Ciência</Text>
        </View>
        <Text style={s.consentText}>
          Eu, abaixo assinado(a), declaro que fui informado(a) sobre o medicamento/vacina administrado(a), incluindo seus benefícios e possíveis reações adversas. Fui orientado(a) a permanecer em observação na unidade pelo tempo indicado e recebi as orientações sobre cuidados pós-administração e sinais de alerta.
        </Text>
        <Text style={s.consentText}>
          Caso tenha apresentado qualquer reação, declaro que fui devidamente atendido(a) e orientado(a) pela equipe de saúde. Estou ciente de que devo informar sobre esta administração em futuros atendimentos.
        </Text>
      </View>

      {/* Orientações */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="clipboard" color={pdfTheme.colors.info.text} />
          <Text style={s.infoTitle}>Orientações ao Paciente:</Text>
        </View>
        <Text style={s.infoText}>- Permanecer no local por pelo menos 30 minutos após a aplicação para observação.</Text>
        <Text style={s.infoText}>- Não massagear o local da aplicação (exceto se orientado pelo profissional).</Text>
        <Text style={s.infoText}>- Aplicar compressa fria se houver dor ou inchaço no local.</Text>
        <Text style={s.infoText}>- Tomar medicação prescrita (antitérmico, anti-histamínico) conforme orientação.</Text>
        <Text style={s.infoText}>- Em caso de reações como falta de ar, inchaço no rosto/garganta, urticária, procurar atendimento de urgência imediatamente.</Text>
        <Text style={s.infoText}>- Informar em atendimentos futuros sobre qualquer reação adversa apresentada.</Text>
      </View>

      {/* Sinais de Alerta */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="alertTriangle" color={pdfTheme.colors.danger.text} />
          <Text style={s.alertTitle}>Sinais de Alerta — Procurar Emergência:</Text>
        </View>
        <Text style={s.alertText}>- Dificuldade para respirar ou engolir.</Text>
        <Text style={s.alertText}>- Inchaço em lábios, língua ou garganta.</Text>
        <Text style={s.alertText}>- Tontura intensa, desmaio ou queda da pressão.</Text>
        <Text style={s.alertText}>- Erupções cutâneas generalizadas (urticária).</Text>
        <Text style={s.alertText}>- Febre alta que não cede com antitérmico.</Text>
        <Text style={s.alertText}>- Piora progressiva dos sintomas após 24 horas.</Text>
      </View>
    </View>
  </BaseDocument>
);
