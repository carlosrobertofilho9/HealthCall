import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { HeaderIcon, BaseDocument, formatDate, type DocumentFormData } from './PdfCommon';

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
  stepNumber: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepNumberText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  stepText: {
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.5,
    flex: 1,
    paddingTop: 1,
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
});

interface EarWashDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const EarWashDocument: React.FC<EarWashDocumentProps> = ({ visibleParagraphs, formData }) => (
  <BaseDocument title="Protocolo de Lavagem de Ouvido (Ceruminólise)" visibleParagraphs={visibleParagraphs}>
    <View style={s.container}>
      {/* Section 1: Dados do Procedimento */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: '#0369a1' }]}>
          <HeaderIcon icon="ear" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Dados do Procedimento</Text>
        </View>
        <View style={s.sectionBody}>
          <View style={s.fieldRow}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Data do Procedimento</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formatDate(formData?.dataProcedimento)}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Hora</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.horaProcedimento || '___:___'}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Ouvido</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                {['Direito', 'Esquerdo', 'Bilateral'].map((item) => (
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
              <Text style={s.fieldLabel}>Indicação Clínica</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Cerúmen impactado', 'Hipoacusia por cerúmen', 'Preparo para otoscopia', 'Otalgia por obstrução', 'Outro'].map((item) => (
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
              <Text style={s.fieldLabel}>Queixa Principal</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.queixaPrincipal || ''}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Uso prévio de ceruminolítico?</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 2 }}>
                {['Sim', 'Não'].map((item) => (
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
              <Text style={s.fieldLabel}>Profissional Responsável</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.profissional || ''}</Text></View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CRM / COREN</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}>{formData?.crmCoren || ''}</Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 2: Contraindicações verificadas */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: '#dc2626' }]}>
          <HeaderIcon icon="alertTriangle" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Contraindicações — Verificar antes do procedimento</Text>
        </View>
        <View style={s.sectionBody}>
          <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 6 }}>Marcar as contraindicações verificadas e AUSENTES (procedimento liberado):</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              'Perfuração timpânica conhecida',
              'Otite média aguda',
              'Cirurgia otológica prévia',
              'Corpo estranho no canal',
              'Otorréia ativa (secreção)',
              'Tubo de ventilação (timpanostomia)',
              'Dor intensa ao toque',
              'História de reação prévia ao procedimento',
            ].map((item) => (
              <View key={item} style={s.checkRow}>
                <View style={s.checkBox} />
                <Text style={s.checkLabel}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={[s.fieldRow, { marginTop: 6 }]}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Observações sobre contraindicações</Text>
              <View style={s.fieldLine}><Text style={s.fieldLineText}></Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 3: Descrição do Procedimento */}
      <View style={s.sectionBox}>
        <View style={[s.sectionHeader, { backgroundColor: '#0d9488' }]}>
          <HeaderIcon icon="clipboard" color="#ffffff" />
          <Text style={s.sectionHeaderText}>Descrição Técnica do Procedimento</Text>
        </View>
        <View style={s.sectionBody}>
          {[
            { n: '1', text: 'Otoscopia prévia: inspecionar o canal auditivo externo (CAE) e a membrana timpânica. Verificar integridade e ausência de contraindicações.' },
            { n: '2', text: 'Posicionar o paciente sentado com a cabeça levemente inclinada para o lado oposto ao ouvido a ser lavado. Colocar cuba rim sob o ouvido.' },
            { n: '3', text: 'Preparar a solução para irrigação: soro fisiológico 0,9% aquecido (37°C) ou água morna estéril. NUNCA utilizar água fria (risco de vertigem).' },
            { n: '4', text: 'Utilizar seringa de 20mL (ou irrigador otológico). Direcionar o jato de água para a parede posterossuperior do canal auditivo, NUNCA diretamente na membrana timpânica.' },
            { n: '5', text: 'Realizar irrigação com pressão suave e constante. Repetir o procedimento até a remoção completa do cerúmen ou até 3-4 tentativas.' },
            { n: '6', text: 'Após remoção, realizar nova otoscopia para confirmar limpeza do canal e integridade da membrana timpânica.' },
            { n: '7', text: 'Secar delicadamente o canal com algodão ou gaze estéril. Orientar o paciente a não introduzir objetos no ouvido.' },
          ].map((step) => (
            <View key={step.n} style={s.stepRow}>
              <View style={s.stepNumber}>
                <Text style={s.stepNumberText}>{step.n}</Text>
              </View>
              <Text style={s.stepText}>{step.text}</Text>
            </View>
          ))}
          <View style={[s.fieldRow, { marginTop: 6 }]}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Material retirado / Aspecto</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Rolha de cerúmen', 'Cerúmen parcial', 'Descamação', 'Outro'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Resultado</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
                {['Remoção total', 'Remoção parcial', 'Insucesso — Encaminhar'].map((item) => (
                  <View key={item} style={s.checkRow}>
                    <View style={s.checkBox} />
                    <Text style={s.checkLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={s.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Observações do Procedimento</Text>
              <View style={s.textArea}>
                <Text style={s.textAreaLabel}></Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 4: Riscos e Complicações */}
      <View style={s.alertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
          <Text style={s.alertTitle}>Riscos e Complicações Possíveis</Text>
        </View>
        <Text style={{ fontSize: 7, color: '#7f1d1d', marginBottom: 4, lineHeight: 1.3 }}>
          Todo procedimento de lavagem de ouvido, mesmo quando realizado corretamente, pode apresentar riscos e complicações, incluindo:
        </Text>
        {[
          { title: 'Dor ou desconforto:', desc: 'sensação de pressão durante a irrigação, podendo persistir por algumas horas após o procedimento.' },
          { title: 'Vertigem / Tontura:', desc: 'pode ocorrer se a solução estiver em temperatura inadequada ou por estímulo do aparelho vestibular. Geralmente é transitória.' },
          { title: 'Zumbido (tinnitus):', desc: 'pode surgir temporariamente após o procedimento e tende a desaparecer espontaneamente.' },
          { title: 'Otite externa:', desc: 'infecção do canal auditivo externo por entrada de água ou microlesões na pele do canal. Sinais: dor, secreção, coceira intensa.' },
          { title: 'Perfuração timpânica:', desc: 'risco raro porém possível, especialmente em casos de membrana timpânica previamente fragilizada ou com pressão excessiva na irrigação.' },
          { title: 'Sangramento:', desc: 'pequeno sangramento por lesão da pele do canal auditivo, geralmente autolimitado.' },
          { title: 'Reação vagal:', desc: 'estimulação do nervo vago pode causar bradicardia, hipotensão, palidez, sudorese e síncope (desmaio).' },
        ].map((risk) => (
          <View key={risk.title} style={s.riskItem}>
            <Text style={s.riskBullet}>•</Text>
            <Text style={s.riskText}>
              <Text style={{ fontWeight: 'bold' }}>{risk.title}</Text> {risk.desc}
            </Text>
          </View>
        ))}
      </View>

      {/* Section 5: Termo de Consentimento */}
      <View style={s.consentBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          <HeaderIcon icon="shield" color="#92400e" />
          <Text style={s.consentTitle}>Termo de Consentimento Livre e Esclarecido</Text>
        </View>

        <Text style={s.consentText}>
          Eu, abaixo assinado(a), declaro que fui devidamente informado(a) pelo profissional de saúde responsável sobre:
        </Text>
        <Text style={s.consentText}>
          1. A natureza, objetivos e a técnica do procedimento de Lavagem de Ouvido (Ceruminólise / Irrigação Otológica);{'\n'}
          2. Os benefícios esperados, incluindo melhora da audição, alívio de sintomas obstrutivos e possibilidade de exame otoscópico adequado;{'\n'}
          3. Os riscos inerentes ao procedimento, incluindo dor, vertigem, zumbido, otite externa, sangramento, perfuração timpânica e reação vagal;{'\n'}
          4. As contraindicações que foram devidamente investigadas e descartadas;{'\n'}
          5. As alternativas ao procedimento, como uso de ceruminolíticos tópicos ou encaminhamento ao especialista (otorrinolaringologista);{'\n'}
          6. Os cuidados necessários após a realização do procedimento.
        </Text>
        <Text style={s.consentText}>
          Declaro que tive a oportunidade de esclarecer todas as minhas dúvidas e que{' '}
          <Text style={{ fontWeight: 'bold' }}>autorizo a realização do procedimento acima descrito</Text>, ciente dos riscos informados.
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

      {/* Section 6: Orientações Pós-Procedimento */}
      <View style={s.infoBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <HeaderIcon icon="clipboard" color="#0f766e" />
          <Text style={s.infoTitle}>Orientações Pós-Procedimento:</Text>
        </View>
        <Text style={s.infoText}>- Não introduzir objetos no canal auditivo (cotonetes, grampos, palitos, etc.).</Text>
        <Text style={s.infoText}>- Evitar entrada de água no ouvido por 48 a 72 horas (usar algodão com vaselina durante o banho).</Text>
        <Text style={s.infoText}>- Sensação de ouvido "aberto" ou diferente é normal e deve melhorar em poucas horas.</Text>
        <Text style={s.infoText}>- Em caso de dor persistente, secreção, febre ou diminuição da audição, retornar à unidade de saúde.</Text>
        <Text style={s.infoText}>- Se prescrito ceruminolítico para uso domiciliar, aplicar conforme orientação: ___ gotas, ___ vezes ao dia, por ___ dias.</Text>
        <Text style={s.infoText}>- Retorno para reavaliação: ___/___/______.</Text>
      </View>

      {/* Section 7: Sinais de Alerta */}
      <View style={[s.alertBox, { marginTop: 6 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="alertTriangle" color="#991b1b" />
          <Text style={s.alertTitle}>Sinais de Alerta — Procurar Atendimento Imediato:</Text>
        </View>
        <Text style={s.alertText}>- Dor intensa e progressiva no ouvido após o procedimento.</Text>
        <Text style={s.alertText}>- Saída de secreção com sangue ou pus pelo ouvido.</Text>
        <Text style={s.alertText}>- Febre acima de 38°C.</Text>
        <Text style={s.alertText}>- Vertigem persistente (tontura forte que não passa).</Text>
        <Text style={s.alertText}>- Perda auditiva súbita ou piora significativa da audição.</Text>
        <Text style={s.alertText}>- Zumbido contínuo que não melhora após 48 horas.</Text>
      </View>

      {/* Nota importante */}
      <View style={s.noteBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <HeaderIcon icon="fileText" color="#1e40af" />
          <Text style={s.noteTitle}>Informações Importantes:</Text>
        </View>
        <Text style={s.noteText}>• O cerúmen (cera de ouvido) é uma substância protetora natural. Sua remoção só é indicada quando há obstrução sintomática ou necessidade de avaliação otoscópica.</Text>
        <Text style={s.noteText}>• Em caso de insucesso na primeira tentativa, pode ser necessário uso de ceruminolítico por 3 a 5 dias antes de nova tentativa.</Text>
        <Text style={s.noteText}>• Pacientes com histórico de perfuração timpânica, cirurgia otológica ou uso de aparelho auditivo devem informar antes do procedimento.</Text>
        <Text style={s.noteText}>• Este documento é parte integrante do prontuário do paciente e deve ser arquivado na unidade de saúde.</Text>
      </View>
    </View>
  </BaseDocument>
);
