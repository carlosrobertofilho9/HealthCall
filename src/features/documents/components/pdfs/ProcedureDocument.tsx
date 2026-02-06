import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument } from './PdfCommon';

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
  // --- Text areas ---
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    minHeight: 50,
    padding: 6,
  },
  textAreaLabel: {
    fontSize: 7,
    color: '#94a3b8',
  },
  // --- Consent block ---
  consentBlock: {
    marginTop: 4,
    padding: 10,
    backgroundColor: '#fefce8',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  consentTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  consentText: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 4,
    textAlign: 'justify',
  },
  // --- Signature ---
  signatureRow: {
    flexDirection: 'row',
    marginTop: 20,
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
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  infoTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f766e',
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
});

interface ProcedureDocumentProps {
  visibleParagraphs: string[];
}

export const ProcedureDocument: React.FC<ProcedureDocumentProps> = ({ visibleParagraphs }) => (
  <BaseDocument title="Protocolo de Procedimento" visibleParagraphs={visibleParagraphs}>
    <View style={s.container}>
      {/* Section 1: Dados do Procedimento */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: '#0369a1' }]}>
          <HeaderIcon icon="scissors" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Dados do Procedimento</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Tipo de Procedimento</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Lavagem de Ouvido (Ceruminólise)', 'Pequena Cirurgia / Sutura', 'Retirada de Corpo Estranho', 'Cantoplastia (Unha Encravada)', 'Drenagem de Abscesso', 'Outro'].map((item) => (
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
              <Text style={s.fieldLabel}>Data do Procedimento</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>___/___/______</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Hora</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>___:___</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Local / Região Anatômica</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Indicação Clínica</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Anestésico Utilizado</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Descrição do Procedimento</Text>
              <View style={s.textArea}>
                <Text style={s.textAreaLabel}></Text>
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Profissional Responsável</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CRM / COREN</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2: Termo de Consentimento */}
      <View style={s.consentBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <HeaderIcon icon="shield" color="#92400e" />
          <Text style={s.consentTitle}>Termo de Consentimento Livre e Esclarecido</Text>
        </View>

        <Text style={s.consentText}>
          Eu, abaixo assinado(a), declaro que fui devidamente informado(a) pelo profissional de saúde responsável sobre:
        </Text>
        <Text style={s.consentText}>
          1. A natureza e os objetivos do procedimento proposto;{'\n'}
          2. Os benefícios esperados e os riscos inerentes, incluindo possíveis complicações como dor, sangramento, infecção, reações alérgicas e cicatrizes;{'\n'}
          3. As alternativas terapêuticas disponíveis;{'\n'}
          4. Os cuidados necessários após a realização do procedimento.
        </Text>
        <Text style={s.consentText}>
          Declaro que tive a oportunidade de esclarecer todas as minhas dúvidas e que <Text style={{ fontWeight: 'bold' }}>autorizo a realização do procedimento acima descrito</Text>.
        </Text>

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

      {/* Section 3: Orientações Pós-Procedimento */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="clipboard" color="#0f766e" />
          <Text style={s.infoTitle}>Orientações Pós-Procedimento:</Text>
        </View>
        <Text style={s.infoText}>- Manter o curativo limpo e seco nas primeiras 24 horas.</Text>
        <Text style={s.infoText}>- Não coçar, molhar ou expor a área ao sol até a cicatrização completa.</Text>
        <Text style={s.infoText}>- Retornar para avaliação / retirada de pontos conforme orientado: ___/___/______.</Text>
        <Text style={s.infoText}>- Tomar a medicação prescrita conforme orientação.</Text>
        <Text style={s.infoText}>- Em caso de sinais de infecção (vermelhidão, inchaço, dor intensa, febre), procurar atendimento imediatamente.</Text>
      </View>

      {/* Alert Box */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
          <Text style={s.alertTitle}>Sinais de Alerta — Procurar Atendimento:</Text>
        </View>
        <Text style={s.alertText}>- Febre acima de 38°C nas primeiras 48h após o procedimento.</Text>
        <Text style={s.alertText}>- Sangramento que não cessa com compressão local.</Text>
        <Text style={s.alertText}>- Secreção purulenta ou odor fétido no local.</Text>
        <Text style={s.alertText}>- Dor intensa e progressiva que não alivia com a medicação prescrita.</Text>
      </View>
    </View>
  </BaseDocument>
);
