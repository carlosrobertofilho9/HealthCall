import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument, FieldValue, formatDate, type DocumentFormData } from './PdfCommon';

const s = StyleSheet.create({
  container: { width: '100%' },
  // --- Section ---
  sectionBox: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    padding: 10,
    backgroundColor: '#ffffff',
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
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    height: 18,
    justifyContent: 'center',
  },
  fieldLineText: {
    fontSize: 9,
    color: '#334155',
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
    borderColor: '#94a3b8',
    borderRadius: 2,
  },
  checkLabel: {
    fontSize: 7.5,
    color: '#334155',
  },
  // --- Medication highlight card ---
  medCard: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#0d9488',
    borderRadius: 6,
    overflow: 'hidden',
  },
  medCardLeft: {
    backgroundColor: '#0d9488',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  medCardLeftText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  medCardBody: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0fdfa',
  },
  medFieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 5,
  },
  medFieldLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  medFieldValue: {
    borderBottomWidth: 1,
    borderBottomColor: '#99f6e4',
    height: 16,
    justifyContent: 'center',
  },
  medFieldValueText: {
    fontSize: 9,
    color: '#134e4a',
  },
  // --- Stamp box ---
  stampBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stampTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
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
    borderBottomColor: '#334155',
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
  },
  // --- Info box ---
  infoBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 7,
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  // --- Alert box ---
  alertBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 3,
  },
  alertText: {
    fontSize: 7,
    color: '#7f1d1d',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  // --- Comprovante badge ---
  badge: {
    alignSelf: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
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
    color: '#166534',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

interface InjectableMedDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const InjectableMedDocument: React.FC<InjectableMedDocumentProps> = ({ visibleParagraphs, formData }) => (
  <BaseDocument title="Relatório de Medicação Injetável" visibleParagraphs={visibleParagraphs}>
    <View style={s.container}>
      {/* Badge Comprovante */}
      <View style={s.badge}>
        <HeaderIcon icon="checkCircle" color="#166534" />
        <Text style={s.badgeText}>Comprovante de Administração</Text>
      </View>

      {/* Section 1: Medicação Card */}
      <View style={s.medCard}>
        <View style={s.medCardLeft}>
          <HeaderIcon icon="syringe" color="#ffffff" />
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
                    <View style={[s.checkBox, { borderColor: '#0d9488' }]} />
                    <Text style={[s.checkLabel, { color: '#0f766e', fontWeight: 'bold' }]}>{via}</Text>
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
        <View style={[s.sectionHeader, { backgroundColor: '#7c3aed' }]}>
          <HeaderIcon icon="clock" color="#ffffff" />
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
          <HeaderIcon icon="clipboard" color="#1e40af" />
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
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
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
