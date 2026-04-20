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

interface HASLifestyleDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

const HasBadge = ({
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

export const HASLifestyleDocument: React.FC<HASLifestyleDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Prático: Pressão Alta (HAS)"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        <View style={S.col}>
          <View style={S.card}>
            <View style={S.cardHeader}>
              <HasBadge
                name="heart-pulse"
                color={pdfTheme.colors.primary}
                backgroundColor={pdfTheme.colors.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>1. Meta de pressão: combine com a UBS</Text>
            </View>
            <Text style={S.bodyText}>
              A diretriz atual da Sociedade Brasileira de Cardiologia orienta meta mais protegida para a maioria dos adultos.
            </Text>
            <View style={S.infoBox}>
              <HasBadge name="gauge" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>
                Em geral, a meta é ficar <Text style={S.bold}>abaixo de 130 x 80</Text>, se você tolerar bem e sem tontura.
              </Text>
            </View>
            <View style={S.warningBox}>
              <HasBadge name="info" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.softBg} />
              <Text style={S.warningText}>
                Idoso frágil, pessoa com muitas doenças ou sintomas precisa de meta individual. A equipe da UBS ajusta com segurança.
              </Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <HasBadge
                name="soup"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>2. Menos sal no dia a dia</Text>
            </View>
            <Text style={S.bodyText}>
              O excesso de sal sobe a pressão mesmo quando a pessoa não sente nada.
            </Text>
            <View style={S.listRow}>
              <HasBadge name="ruler" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Limite diário:</Text> até 1 colher de chá rasa de sal (aprox. 5g), somando toda a comida do dia.</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="leaf" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Tire o saleiro da mesa e use alho, cebola, cheiro-verde, limão e ervas para dar sabor.</Text>
            </View>
            <View style={S.dangerBox}>
              <HasBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>Evite tempero pronto, macarrão instantâneo, embutidos e enlatados: costumam ter muito sódio.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <HasBadge
                name="footprints"
                color={pdfTheme.colors.info.strong}
                backgroundColor={pdfTheme.colors.info.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.info.strong }]}>3. Movimento que cabe na sua rotina</Text>
            </View>
            <Text style={S.bodyText}>Mexer o corpo ajuda a baixar pressão, açúcar e colesterol.</Text>
            <View style={S.successBox}>
              <HasBadge name="activity" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}><Text style={S.bold}>Meta semanal:</Text> 150 minutos de caminhada/ciclismo/dança + 2 dias de exercício de força.</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="clock" size={10} color={pdfTheme.colors.primary} backgroundColor={pdfTheme.colors.softBg} />
              <Text style={S.listText}>Se for começar agora: inicie com 10 minutos por dia e aumente aos poucos.</Text>
            </View>
          </View>
        </View>

        <View style={S.col}>
          <View style={[S.card, { borderColor: pdfTheme.colors.danger.border, backgroundColor: pdfTheme.colors.danger.bg }]}> 
            <View style={S.cardHeader}>
              <HasBadge
                name="pill"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>4. Remédio: uso correto e seguro</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="siren" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}><Text style={S.bold}>Nunca tome remédio de outra pessoa.</Text> Pode dar reação grave e mascarar risco.</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="alarm-clock" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Tome no horário combinado. Se esquecer dose, pergunte na UBS como retomar com segurança.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <HasBadge
                name="cigarette-off"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>5. Álcool e cigarro pioram o controle</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="triangle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}>Se puder, <Text style={S.bold}>não beba</Text>. Álcool em excesso aumenta a pressão e reduz efeito do tratamento.</Text>
            </View>
            <View style={S.listRow}>
              <HasBadge name="cigarette-off" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}>Cigarro, vape e narguilé lesionam os vasos e aumentam risco de infarto e derrame.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <HasBadge
                name="brain"
                color={pdfTheme.colors.purple.textDark}
                backgroundColor={pdfTheme.colors.purple.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.textDark }]}>6. Sono e estresse também contam</Text>
            </View>
            <View style={S.infoBox}>
              <HasBadge name="moon" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>Dormir melhor ajuda no controle da pressão. Tente horário regular para deitar e levantar.</Text>
            </View>
            <View style={S.successBox}>
              <HasBadge name="wind" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}>Faça 3 respirações lentas quando estiver nervoso: isso ajuda a reduzir tensão na hora.</Text>
            </View>
          </View>

          <View style={S.reminderBanner}>
            <HasBadge
              name="heart"
              color={pdfTheme.colors.text.white}
              backgroundColor={pdfTheme.colors.primaryDark}
              size={22}
            />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Procure urgência imediatamente</Text> se tiver dor forte no peito, falta de ar intensa,
              fraqueza de um lado do corpo, fala enrolada ou pressão muito alta com mal-estar importante.
              {'\n'}
              Continue o acompanhamento na UBS: controle bom evita complicações.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
