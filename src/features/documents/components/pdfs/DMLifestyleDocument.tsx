import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { PdfIconBadge, type PdfIconName } from './icons';
import {
  BaseDocument,
  type DocumentFormData,
  pdfTheme,
} from './PdfCommon';

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

const DMBadge = ({
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

interface DMLifestyleDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const DMLifestyleDocument: React.FC<DMLifestyleDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Prático: Controle do Diabetes no Dia a Dia"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        <View style={S.col}>
          <View style={S.card}>
            <View style={S.cardHeader}>
              <DMBadge
                name="droplet"
                color={pdfTheme.colors.primary}
                backgroundColor={pdfTheme.colors.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>1. Metas simples para guiar seu cuidado</Text>
            </View>
            <Text style={S.bodyText}>
              Segundo a Diretriz SBD 2025, a maioria dos adultos busca <Text style={S.bold}>HbA1c menor que 7%</Text>, sem crises de açúcar baixo.
            </Text>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Jejum:</Text> meta comum entre 80 e 130 mg/dL.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>2h após refeição:</Text> meta comum abaixo de 180 mg/dL.</Text>
            </View>
            <View style={S.infoBox}>
              <DMBadge name="info" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>
                Idosos frágeis ou com várias doenças podem ter meta menos rígida. Combine sua meta com a equipe da UBS.
              </Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <DMBadge
                name="utensils"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>2. Comida de verdade no prato</Text>
            </View>
            <Text style={S.bodyText}>No SUS, o melhor plano é o que cabe no bolso e na rotina da família.</Text>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Metade do prato:</Text> verduras e legumes.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Um quarto:</Text> feijão, ovo, frango ou outra proteína.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Um quarto:</Text> arroz, macaxeira, batata ou outro carboidrato.</Text>
            </View>
            <View style={S.warningBox}>
              <DMBadge name="circle-alert" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.softBg} />
              <Text style={S.warningText}>
                Troque refrigerante e suco de caixinha por água. Prefira fruta inteira no lugar de suco.
              </Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <DMBadge
                name="activity"
                color={pdfTheme.colors.info.strong}
                backgroundColor={pdfTheme.colors.info.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.info.strong }]}>3. Movimento: remédio sem custo</Text>
            </View>
            <Text style={S.bodyText}>A diretriz reforça: exercício regular ajuda a baixar glicose e proteger coração.</Text>
            <View style={S.listRow}>
              <DMBadge name="timer" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.listText}><Text style={S.bold}>Meta prática:</Text> 150 minutos por semana.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="activity" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.listText}><Text style={S.bold}>Força 2 a 3x/semana:</Text> pode ser com peso do corpo.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="triangle-alert" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
              <Text style={S.listText}>Evite ficar mais de 2 dias seguidos sem atividade e levante a cada 30 minutos sentado.</Text>
            </View>
            <View style={S.successBox}>
              <DMBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}>Caminhada de 10 a 15 minutos depois de comer já pode ajudar no controle.</Text>
            </View>
          </View>
        </View>

        <View style={S.col}>
          <View style={[S.card, { borderColor: pdfTheme.colors.danger.border, backgroundColor: pdfTheme.colors.danger.bg }]}>
            <View style={S.cardHeader}>
              <DMBadge
                name="siren"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>4. Crise de açúcar: aja rápido</Text>
            </View>
            <View style={S.dangerBox}>
              <DMBadge name="triangle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>
                <Text style={S.bold}>Hipoglicemia (menos de 70):</Text> suor frio, tremor, tontura. Tome 15 g de açúcar (ex.: 1 colher de sopa de açúcar em água ou 150 ml de suco comum) e repita a medição em 15 minutos.
              </Text>
            </View>
            <View style={S.warningBox}>
              <DMBadge name="droplet" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
              <Text style={S.warningText}>
                <Text style={S.bold}>Hiperglicemia:</Text> muita sede, urina demais, cansaço. Hidrate-se e procure a UBS se persistir.
              </Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}><Text style={S.bold}>Se desmaiar, confusão mental ou vômitos:</Text> acione urgência.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <DMBadge
                name="syringe"
                color={pdfTheme.colors.purple.textDark}
                backgroundColor={pdfTheme.colors.purple.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.textDark }]}>5. Remédio e insulina com segurança</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="pill" size={10} color={pdfTheme.colors.purple.textDark} backgroundColor={pdfTheme.colors.purple.bg} />
              <Text style={S.listText}><Text style={S.bold}>Não se automedique:</Text> não mude dose por conta própria.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}><Text style={S.bold}>Nunca use remédio de outra pessoa,</Text> mesmo que “pareça igual”.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}><Text style={S.bold}>Rodízio da aplicação:</Text> alterne locais da insulina para evitar caroços.</Text>
            </View>
            <View style={S.infoBox}>
              <DMBadge name="info" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>Leve sua receita e dúvidas para revisão nas consultas da UBS.</Text>
            </View>
          </View>

          <View style={S.card}>
            <View style={S.cardHeader}>
              <DMBadge
                name="footprints"
                color={pdfTheme.colors.success.strong}
                backgroundColor={pdfTheme.colors.success.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.success.strong }]}>6. Pés e acompanhamento na UBS</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Olhe os pés todos os dias (inclusive sola e entre os dedos).</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Não ande descalço. Use sapato confortável e fechado.</Text>
            </View>
            <View style={S.listRow}>
              <DMBadge name="stethoscope" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Ferida, bolha ou unha inflamada por mais de 24h: procure a UBS.</Text>
            </View>
            <View style={S.chipRow}>
              {['HbA1c', 'Fundo de olho', 'Rim (urina)', 'Pé diabético'].map((item) => (
                <View key={item} style={S.chip}>
                  <Text style={S.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={S.reminderBanner}>
            <DMBadge name="heart-pulse" size={22} color={pdfTheme.colors.text.white} backgroundColor={pdfTheme.colors.primaryDark} />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Você não está sozinho.</Text> Cuidado diário, remédio correto e acompanhamento na UBS reduzem complicações e melhoram sua qualidade de vida.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
