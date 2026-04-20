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

const DyslipidemiaBadge = ({
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

interface DyslipidemiaDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

export const DyslipidemiaDocument: React.FC<DyslipidemiaDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <BaseDocument
      title="Guia Simples: Colesterol e Triglicerídeos"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        <View style={S.col}>
          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="heart-pulse"
                color={pdfTheme.colors.primary}
                backgroundColor={pdfTheme.colors.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>1. Entenda seus números</Text>
            </View>
            <Text style={S.bodyText}>
              O exame mostra três pontos principais. A equipe da UBS usa isso para montar sua meta.
            </Text>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="circle-alert" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.listText}>
                <Text style={S.bold}>Colesterol ruim (LDL):</Text> quando sobe, gruda na veia e pode causar infarto e derrame.
              </Text>
            </View>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>
                <Text style={S.bold}>Colesterol bom (HDL):</Text> ajuda a limpar a gordura do sangue.
              </Text>
            </View>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="droplet" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.bg} />
              <Text style={S.listText}>
                <Text style={S.bold}>Triglicerídeos:</Text> sobem com muito açúcar, farinha branca e bebida alcoólica.
              </Text>
            </View>
          </View>

          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="soup"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>2. Comida de verdade no prato</Text>
            </View>
            <Text style={S.bodyText}>
              A base do tratamento é comida simples do dia a dia, sem precisar gastar muito.
            </Text>
            <View style={S.infoBox}>
              <DyslipidemiaBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.infoText}>
                Prefira: feijão, arroz, verduras, legumes, aveia, frutas com casca, peixe quando possível, frango sem pele.
              </Text>
            </View>
            <View style={S.warningBox}>
              <DyslipidemiaBadge name="info" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.softBg} />
              <Text style={S.warningText}>
                Cozinhar em casa e reduzir fritura já ajuda muito. Trocas pequenas, feitas todo dia, funcionam melhor.
              </Text>
            </View>
          </View>

          <View style={[S.card, { borderColor: pdfTheme.colors.danger.border, backgroundColor: pdfTheme.colors.danger.bg }]}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="circle-alert"
                color={pdfTheme.colors.danger.strong}
                backgroundColor={pdfTheme.colors.danger.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.text }]}>3. O que piora o exame</Text>
            </View>
            <Text style={S.bodyText}>Evite no dia a dia:</Text>
            <View style={S.chipRow}>
              {[
                'Biscoito recheado',
                'Salgadinho',
                'Embutidos',
                'Fritura frequente',
                'Margarina dura',
                'Doces todo dia',
              ].map((item) => (
                <View key={item} style={[S.chip, { borderColor: pdfTheme.colors.danger.border }]}> 
                  <Text style={[S.chipText, { color: pdfTheme.colors.danger.text }]}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={S.dangerBox}>
              <DyslipidemiaBadge name="siren" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>
                Evite bebida alcoólica em excesso. Ela sobe muito os triglicerídeos.
              </Text>
            </View>
          </View>

          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="coffee"
                color={pdfTheme.colors.warning.text}
                backgroundColor={pdfTheme.colors.warning.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.text }]}>4. Triglicerídeo alto: ação rápida</Text>
            </View>
            <Text style={S.bodyText}>
              Se o triglicerídeo estiver alto, sua prioridade é cortar açúcar e álcool.
            </Text>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Reduza refrigerante, suco de caixinha, bolo, biscoito e pão em excesso.</Text>
            </View>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="badge-check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Coma nos horários e não “belisque” o dia inteiro.</Text>
            </View>
            <View style={S.warningBox}>
              <DyslipidemiaBadge name="info" size={10} color={pdfTheme.colors.warning.text} backgroundColor={pdfTheme.colors.warning.softBg} />
              <Text style={S.warningText}>
                Meta de colesterol é diferente para cada pessoa. Quem define é o profissional da UBS, conforme seu risco do coração.
              </Text>
            </View>
          </View>
        </View>

        <View style={S.col}>
          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="footprints"
                color={pdfTheme.colors.info.strong}
                backgroundColor={pdfTheme.colors.info.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.info.strong }]}>5. Corpo em movimento</Text>
            </View>
            <Text style={S.bodyText}>
              Caminhar, pedalar ou dançar ajuda a baixar gordura no sangue e melhorar o colesterol bom.
            </Text>
            <View style={S.successBox}>
              <DyslipidemiaBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}>
                Meta prática: pelo menos 30 minutos, 5 dias na semana, no seu ritmo.
              </Text>
            </View>
            <View style={S.infoBox}>
              <DyslipidemiaBadge name="waves" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>
                Se sentir dor no peito, falta de ar importante ou mal-estar forte, pare a atividade e procure atendimento.
              </Text>
            </View>
          </View>

          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="clipboard-plus"
                color={pdfTheme.colors.success.strong}
                backgroundColor={pdfTheme.colors.success.softBg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.success.strong }]}>6. Remédio e retorno na UBS</Text>
            </View>
            <Text style={S.bodyText}>
              Muitas pessoas precisam de remédio junto com alimentação e exercício.
            </Text>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Tome no horário orientado. Não pare por conta própria, mesmo sem sintomas.</Text>
            </View>
            <View style={S.listRow}>
              <DyslipidemiaBadge name="check" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.listText}>Leve exames, receitas e lista de remédios em todo retorno no postinho.</Text>
            </View>
            <View style={S.dangerBox}>
              <DyslipidemiaBadge name="siren" size={10} color={pdfTheme.colors.danger.strong} backgroundColor={pdfTheme.colors.danger.bg} />
              <Text style={S.dangerText}>
                Não use remédio de vizinho e não faça automedicação. Isso pode fazer mal ao fígado e aos rins.
              </Text>
            </View>
          </View>

          <View style={S.card}> 
            <View style={S.cardHeader}>
              <DyslipidemiaBadge
                name="weight"
                color={pdfTheme.colors.purple.textDark}
                backgroundColor={pdfTheme.colors.purple.bg}
                size={22}
              />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.textDark }]}>7. Cintura e peso importam</Text>
            </View>
            <Text style={S.bodyText}>
              A gordura da barriga aumenta o risco de pressão alta, diabetes e problema no coração.
            </Text>
            <View style={S.successBox}>
              <DyslipidemiaBadge name="sparkles" size={10} color={pdfTheme.colors.success.strong} backgroundColor={pdfTheme.colors.success.softBg} />
              <Text style={S.successText}>
                Perder um pouco de peso já melhora muito os exames e o bem-estar.
              </Text>
            </View>
            <View style={S.infoBox}>
              <DyslipidemiaBadge name="info" size={10} color={pdfTheme.colors.info.strong} backgroundColor={pdfTheme.colors.info.bg} />
              <Text style={S.infoText}>
                Evite “dieta da moda”. Faça mudanças que você consegue manter.
              </Text>
            </View>
          </View>

          <View style={S.reminderBanner}>
            <DyslipidemiaBadge
              name="hand"
              color={pdfTheme.colors.text.white}
              backgroundColor={pdfTheme.colors.primaryDark}
              size={22}
            />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Resumo final:</Text> colesterol alto geralmente não dá dor. Por isso, mantenha o cuidado todo dia e retorne à UBS na data combinada.
              {'\n'}
              Procure atendimento antes se tiver dor no peito, falta de ar, fraqueza súbita ou fala enrolada.
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
