import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument } from './PdfCommon';

const s = StyleSheet.create({
  container: { width: '100%' },
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
  consentBlock: {
    marginTop: 6,
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
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.6,
    marginBottom: 4,
    textAlign: 'justify',
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
    borderBottomColor: '#334155',
    width: '100%',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
  },
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
  riskItem: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  riskBullet: {
    fontSize: 7,
    color: '#991b1b',
    fontWeight: 'bold',
    marginTop: 0.5,
  },
  riskText: {
    fontSize: 7,
    color: '#334155',
    lineHeight: 1.4,
    flex: 1,
  },
  noteBox: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noteTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 3,
  },
  noteText: {
    fontSize: 7,
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f766e',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
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
                {['Pequena Cirurgia / Sutura', 'Retirada de Corpo Estranho', 'Cantoplastia (Unha Encravada)', 'Drenagem de Abscesso', 'Cauterização Química', 'Exérese de Lesão', 'Outro'].map((item) => (
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
              <Text style={s.fieldLabel}>Lateralidade</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
                {['Direita', 'Esquerda', 'Bilateral', 'N/A'].map((item) => (
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
              <Text style={s.fieldLabel}>Anestésico Utilizado</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Lidocaína 2% s/ vaso', 'Lidocaína 2% c/ vaso', 'Lidocaína 1%', 'Bupivacaína', 'Nenhum', 'Outro'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Volume do Anestésico (mL)</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Descrição Detalhada do Procedimento</Text>
              <View style={[s.textArea, { minHeight: 60 }]}>
                <Text style={s.textAreaLabel}></Text>
              </View>
            </View>
          </View>

          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Material de Sutura (se aplicável)</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Nylon 3-0', 'Nylon 4-0', 'Nylon 5-0', 'Catgut simples', 'Catgut cromado', 'Steri-Strip', 'N/A'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Nº de Pontos</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
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

      {/* Section 2: Riscos por tipo de procedimento */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
          <Text style={s.alertTitle}>Riscos e Complicações Possíveis</Text>
        </View>
        <Text style={{ fontSize: 7, color: '#7f1d1d', marginBottom: 6, lineHeight: 1.3 }}>
          Todo procedimento, mesmo quando realizado com técnica adequada e por profissional habilitado, pode apresentar riscos e complicações. O paciente deve estar ciente dos seguintes riscos:
        </Text>

        <Text style={[s.subTitle, { color: '#991b1b' }]}>Riscos Gerais (comuns a todos os procedimentos):</Text>
        {[
          { title: 'Dor:', desc: 'durante e após o procedimento, podendo necessitar de analgesia. A intensidade varia conforme o tipo de procedimento e sensibilidade individual.' },
          { title: 'Sangramento:', desc: 'esperado em qualquer procedimento que envolva incisão ou manipulação de tecidos. Geralmente controlado com compressão local.' },
          { title: 'Infecção:', desc: 'risco presente mesmo com antissepsia adequada. Sinais: vermelhidão progressiva, calor, edema, secreção purulenta, febre.' },
          { title: 'Reação alérgica:', desc: 'ao anestésico local (lidocaína), antissépticos (iodo, clorexidina), luvas de látex ou materiais de sutura. Pode variar de leve (urticária) a grave (anafilaxia).' },
          { title: 'Cicatriz:', desc: 'toda lesão de pele resulta em cicatriz. A qualidade depende de fatores individuais (genética, localização, tensão na pele). Quelóides e cicatrizes hipertróficas são possíveis.' },
          { title: 'Hematoma / Equimose:', desc: 'acúmulo de sangue sob a pele, geralmente autolimitado. Mais frequente em pacientes que usam anticoagulantes.' },
          { title: 'Lesão de estruturas adjacentes:', desc: 'nervos, vasos ou tendões próximos podem ser afetados, resultando em dormência, formigamento ou limitação de movimento.' },
          { title: 'Deiscência:', desc: 'abertura dos pontos ou da ferida, podendo necessitar de nova sutura.' },
        ].map((risk) => (
          <View key={risk.title} style={s.riskItem}>
            <Text style={s.riskBullet}>•</Text>
            <Text style={s.riskText}>
              <Text style={{ fontWeight: 'bold' }}>{risk.title}</Text> {risk.desc}
            </Text>
          </View>
        ))}

        <Text style={[s.subTitle, { color: '#991b1b', marginTop: 8 }]}>Riscos Específicos por Procedimento:</Text>
        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#7f1d1d', marginBottom: 2 }}>Cantoplastia (Unha Encravada):</Text>
        <Text style={s.alertText}>• Recidiva da unha encravada (recrescimento). • Infecção do leito ungueal. • Deformidade ungueal permanente. • Dor ao caminhar por 7-14 dias.</Text>

        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#7f1d1d', marginBottom: 2, marginTop: 4 }}>Drenagem de Abscesso:</Text>
        <Text style={s.alertText}>• Recidiva do abscesso. • Formação de fístula. • Necessidade de nova drenagem. • Disseminação da infecção (celulite, sepse em casos graves).</Text>

        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#7f1d1d', marginBottom: 2, marginTop: 4 }}>Sutura / Pequena Cirurgia:</Text>
        <Text style={s.alertText}>• Deiscência de sutura (abertura dos pontos). • Corpo estranho residual. • Granuloma de corpo estranho. • Resultado estético insatisfatório.</Text>

        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#7f1d1d', marginBottom: 2, marginTop: 4 }}>Retirada de Corpo Estranho:</Text>
        <Text style={s.alertText}>• Remoção incompleta. • Lesão tecidual durante extração. • Necessidade de encaminhamento cirúrgico se profundo.</Text>
      </View>

      {/* Section 3: Termo de Consentimento */}
      <View style={s.consentBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <HeaderIcon icon="shield" color="#92400e" />
          <Text style={s.consentTitle}>Termo de Consentimento Livre e Esclarecido</Text>
        </View>

        <Text style={s.consentText}>
          Eu, abaixo assinado(a), declaro que fui devidamente informado(a) pelo profissional de saúde responsável sobre:
        </Text>
        <Text style={s.consentText}>
          1. A natureza, os objetivos e a técnica do procedimento proposto;{'\n'}
          2. Os benefícios esperados com a realização do procedimento;{'\n'}
          3. Os riscos inerentes ao procedimento, incluindo dor, sangramento, infecção, reações alérgicas, cicatrizes, hematomas, lesão de estruturas adjacentes e deiscência;{'\n'}
          4. Os riscos específicos relacionados ao tipo de procedimento a ser realizado;{'\n'}
          5. As alternativas terapêuticas disponíveis, incluindo a opção de não realizar o procedimento;{'\n'}
          6. Os cuidados necessários antes e após a realização do procedimento;{'\n'}
          7. A possibilidade de intercorrências durante ou após o procedimento, podendo ser necessárias medidas adicionais.
        </Text>
        <Text style={s.consentText}>
          Declaro que tive a oportunidade de esclarecer todas as minhas dúvidas e que{' '}
          <Text style={{ fontWeight: 'bold' }}>autorizo a realização do procedimento acima descrito</Text>, ciente de todos os riscos informados.
        </Text>
        <Text style={s.consentText}>
          Declaro ainda que informei ao profissional sobre alergias conhecidas, uso de medicamentos (anticoagulantes, anti-inflamatórios), doenças crônicas e cirurgias prévias.
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

      {/* Section 4: Orientações Pré-Procedimento */}
      <View style={s.noteBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="fileText" color="#1e40af" />
          <Text style={s.noteTitle}>Orientações Pré-Procedimento:</Text>
        </View>
        <Text style={s.noteText}>• Informar ao profissional sobre alergias a medicamentos, especialmente a anestésicos locais (lidocaína), iodo, látex.</Text>
        <Text style={s.noteText}>• Informar uso de anticoagulantes (Varfarina, Rivaroxabana, AAS) — pode ser necessário suspender antes do procedimento.</Text>
        <Text style={s.noteText}>• Informar sobre doenças crônicas: diabetes, hipertensão, cardiopatias, coagulopatias.</Text>
        <Text style={s.noteText}>• Pacientes com marcapasso devem informar antes do uso de qualquer equipamento elétrico (cautério).</Text>
        <Text style={s.noteText}>• Não é necessário jejum para procedimentos com anestesia local (exceto se orientado diferentemente).</Text>
      </View>

      {/* Section 5: Orientações Pós-Procedimento */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="clipboard" color="#0f766e" />
          <Text style={s.infoTitle}>Orientações Pós-Procedimento:</Text>
        </View>
        <Text style={s.infoText}>- Manter o curativo limpo e seco nas primeiras 24 a 48 horas.</Text>
        <Text style={s.infoText}>- Após 24h, lavar o local com água e sabão neutro e trocar o curativo diariamente, ou conforme orientação.</Text>
        <Text style={s.infoText}>- Não coçar, puxar ou molhar excessivamente a área até a cicatrização completa.</Text>
        <Text style={s.infoText}>- Evitar exposição solar direta na região por pelo menos 30 dias (risco de hiperpigmentação da cicatriz).</Text>
        <Text style={s.infoText}>- Não realizar esforço físico intenso nas primeiras 48-72 horas.</Text>
        <Text style={s.infoText}>- Tomar a medicação prescrita (antibiótico, anti-inflamatório, analgésico) conforme orientação médica.</Text>
        <Text style={s.infoText}>- Se prescrito antibiótico, completar TODO o tratamento mesmo que os sintomas melhorem.</Text>
        <Text style={s.infoText}>- Verificar situação vacinal: Tétano (dT) — atualizar se necessário.</Text>
        <Text style={s.infoText}>- Retornar para avaliação / retirada de pontos conforme orientado: ___/___/______.</Text>
        <Text style={s.infoText}>  • Pontos em face: 5 a 7 dias</Text>
        <Text style={s.infoText}>  • Pontos em tronco/membros: 7 a 10 dias</Text>
        <Text style={s.infoText}>  • Pontos em áreas de tensão (articulações): 10 a 14 dias</Text>
      </View>

      {/* Section 6: Sinais de Alerta */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
          <Text style={s.alertTitle}>Sinais de Alerta — Procurar Atendimento Imediato:</Text>
        </View>
        <Text style={s.alertText}>- Febre acima de 38°C nas primeiras 48h após o procedimento.</Text>
        <Text style={s.alertText}>- Sangramento que não cessa com compressão local por 15 minutos.</Text>
        <Text style={s.alertText}>- Secreção purulenta (amarelada/esverdeada) ou odor fétido no local.</Text>
        <Text style={s.alertText}>- Dor intensa e progressiva que não alivia com a medicação prescrita.</Text>
        <Text style={s.alertText}>- Vermelhidão que se espalha além da área do procedimento (celulite).</Text>
        <Text style={s.alertText}>- Inchaço excessivo ou endurecimento progressivo.</Text>
        <Text style={s.alertText}>- Dormência, formigamento ou perda de movimento na região.</Text>
        <Text style={s.alertText}>- Abertura dos pontos (deiscência) com exposição do tecido.</Text>
        <Text style={s.alertText}>- Qualquer sinal de reação alérgica: urticária, inchaço facial, dificuldade respiratória.</Text>
      </View>

      {/* Nota final */}
      <View style={s.noteBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="fileText" color="#1e40af" />
          <Text style={s.noteTitle}>Informações Importantes:</Text>
        </View>
        <Text style={s.noteText}>• Este documento é parte integrante do prontuário do paciente e deve ser arquivado na unidade de saúde.</Text>
        <Text style={s.noteText}>• O paciente (ou responsável) recebe uma via deste documento com todas as orientações.</Text>
        <Text style={s.noteText}>• Qualquer intercorrência durante ou após o procedimento deve ser registrada neste documento e no prontuário.</Text>
        <Text style={s.noteText}>• Em caso de menores de idade ou pacientes incapazes, o responsável legal deve assinar o termo de consentimento.</Text>
      </View>
    </View>
  </BaseDocument>
);
