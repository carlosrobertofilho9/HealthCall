import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  BaseDocument,
  type DocumentFormData,
  pdfTheme,
} from './PdfCommon';
import { PdfIconBadge, type PdfIconName } from './icons';

const S = StyleSheet.create({
  twoCol: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
    marginTop: 8,
  },
  col: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: pdfTheme.colors.border,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: pdfTheme.colors.bgLight,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.dark,
    flex: 1,
  },
  bodyText: {
    fontSize: 8.4,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.45,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  listText: {
    flex: 1,
    fontSize: 8.3,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.45,
  },
  bold: {
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: pdfTheme.colors.info.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.info.borderStrong,
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
    gap: 6,
  },
  infoText: {
    fontSize: 8,
    color: pdfTheme.colors.info.strong,
    flex: 1,
    lineHeight: 1.42,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.warning.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.warning.border,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 8,
    color: pdfTheme.colors.warning.dark,
    lineHeight: 1.42,
  },
  dangerBox: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.danger.bg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.danger.border,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  dangerText: {
    flex: 1,
    fontSize: 8,
    color: pdfTheme.colors.danger.dark,
    lineHeight: 1.42,
  },
  successBox: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.success.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.success.borderStrong,
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
    gap: 6,
    alignItems: 'flex-start',
  },
  successText: {
    flex: 1,
    fontSize: 8,
    color: pdfTheme.colors.success.dark,
    lineHeight: 1.42,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  chip: {
    backgroundColor: pdfTheme.colors.bgLight,
    borderWidth: 1,
    borderColor: pdfTheme.colors.borderDark,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 7,
    color: pdfTheme.colors.text.dark,
    fontWeight: 'bold',
  },
  reminderBanner: {
    marginTop: 10,
    backgroundColor: pdfTheme.colors.primary,
    borderWidth: 1,
    borderColor: pdfTheme.colors.primaryDark,
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reminderText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.white,
    flex: 1,
    lineHeight: 1.45,
  },
  reminderBold: {
    fontWeight: 'bold',
  },
});

const MentalBadge = ({
  name,
  color,
  backgroundColor,
  size = 16,
}: {
  name: PdfIconName;
  color: string;
  backgroundColor: string;
  size?: number;
}) => (
  <PdfIconBadge
    name={name}
    size={size}
    color={color}
    backgroundColor={backgroundColor}
    strokeWidth={1.8}
  />
);

interface MentalHealthDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const MentalHealthDocument: React.FC<MentalHealthDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Direto: Higiene do Sono e Saúde Mental"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        <View style={S.col}>
          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="clock"
                color={pdfTheme.colors.purple.textDark}
                backgroundColor={pdfTheme.colors.purple.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.textDark }]}>1. O Relógio de Dormir</Text>
            </View>
            <Text style={S.bodyText}>Ter horário para dormir e acordar ajuda o cérebro a pegar no sono mais rápido.</Text>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Tente deitar e levantar no mesmo horário, inclusive no fim de semana.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Se não vier sono, saia da cama e volte só quando o sono chegar.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="moon"
                color={pdfTheme.colors.info.strong}
                backgroundColor={pdfTheme.colors.info.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.info.strong }]}>2. Quarto Preparado para Dormir</Text>
            </View>
            <Text style={S.bodyText}>Ambiente calmo ajuda seu corpo a entender que é hora de descansar.</Text>
            <View style={S.infoBox}>
              <MentalBadge name="eye-off" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>Evite TV e celular por 1 hora antes de dormir. A luz da tela espanta o sono.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Quarto escuro, silencioso e com pouco barulho melhora a noite.</Text>
            </View>
          </View>

          <View style={[S.card, { borderColor: pdfTheme.colors.danger.border, backgroundColor: pdfTheme.colors.danger.bg }]}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="coffee"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>3. O que Rouba Seu Sono</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}><Text style={S.bold}>Café e chimarrão:</Text> evite depois das 15h.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}><Text style={S.bold}>Álcool à noite:</Text> pode até dar sonolência, mas piora a qualidade do sono.</Text>
            </View>
            <View style={S.dangerBox}>
              <MentalBadge name="siren" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>Jantar muito pesado perto da hora de dormir também atrapalha.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="bed"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>4. Cochilo sem Exagero</Text>
            </View>
            <Text style={S.bodyText}>Cochilo longo durante o dia pode tirar seu sono da noite.</Text>
            <View style={S.warningBox}>
              <MentalBadge name="info" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.softBg} />
              <Text style={S.warningText}>Se precisar dormir de dia, prefira até 20 minutos e nunca no fim da tarde.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="wind"
                color={pdfTheme.colors.purple.textDark}
                backgroundColor={pdfTheme.colors.purple.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.textDark }]}>5. Ronco e Falta de Ar</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="circle-alert" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
              <Text style={S.listText}><Text style={S.bold}>Ronco alto, engasgo ou parada de respiração</Text> não é normal.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Procure avaliação na UBS. Dormir de lado pode ajudar enquanto aguarda.</Text>
            </View>
          </View>
        </View>

        <View style={S.col}>
          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="sun"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>6. O Dia Ajuda a Noite</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Pegue 15 minutos de luz do sol pela manhã para regular o relógio do corpo.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Atividade física durante o dia melhora o sono; evite exercício intenso tarde da noite.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="eye-off"
                color={pdfTheme.colors.info.strong}
                backgroundColor={pdfTheme.colors.info.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.info.strong }]}>7. Cama é para Dormir</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="info" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.listText}>Evite ficar olhando a hora no celular. Isso aumenta a ansiedade e tira o sono.</Text>
            </View>
            <View style={S.listRow}>
              <MentalBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Na cama, evite comer e assistir TV. Isso ajuda seu cérebro a associar cama com descanso.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="heart-pulse"
                color={pdfTheme.colors.primary}
                backgroundColor={pdfTheme.colors.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>8. Mente Mais Calma</Text>
            </View>
            <Text style={S.bodyText}>Quando os pensamentos acelerarem, use uma estratégia simples:</Text>
            <View style={S.infoBox}>
              <MentalBadge name="clipboard-plus" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>Anote a preocupação em um papel e deixe para resolver no dia seguinte, em horário marcado.</Text>
            </View>
            <View style={S.successBox}>
              <MentalBadge name="waves" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}>Respire fundo 3 vezes, soltando o ar devagar. Isso ajuda o corpo a desacelerar.</Text>
            </View>
          </View>

          <View style={[S.card, { borderColor: pdfTheme.colors.danger.border, backgroundColor: pdfTheme.colors.danger.bg }]}>
            <View style={S.cardHeader}>
              <MentalBadge
                name="circle-alert"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>9. Alerta com Remédios e Humor</Text>
            </View>
            <View style={S.dangerBox}>
              <MentalBadge name="siren" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>Nunca use remédio controlado de outra pessoa. Pode causar dependência e piorar o sono.</Text>
            </View>
            <View style={S.chipRow}>
              {['Isolamento', 'Irritação forte', 'Tristeza contínua'].map((item) => (
                <View key={item} style={[S.chip, { borderColor: pdfTheme.colors.danger.border }]}> 
                  <Text style={[S.chipText, { color: pdfTheme.colors.danger.text }]}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={S.warningBox}>
              <MentalBadge name="circle-alert" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
              <Text style={S.warningText}>Se esses sinais piorarem, procure a UBS o quanto antes para receber ajuda.</Text>
            </View>
          </View>

          <View style={S.reminderBanner}>
            <MentalBadge
              name="moon"
              color={pdfTheme.colors.text.white}
              backgroundColor={pdfTheme.colors.primaryDark}
              size={22}
            />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Dormir não é luxo, é cuidado.</Text> Sono bom ajuda a memória, o humor e a saúde do coração.
              {'\n'}
              Se o problema persistir, retorne à UBS e converse com a equipe.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
