import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  CholesterolIcon,
  FiberIcon,
} from './LifestyleGraphics';
import {
  FoodIcon,
  WalkIcon,
  ScaleIcon,
  MindIcon,
  BulletIcon,
  AlertBulletIcon,
  TipBulletIcon,
  LeafIcon,
} from './HASLifestyleGraphics';
import {
  BaseDocument,
  type DocumentFormData,
  pdfTheme,
} from './PdfCommon';

const S = StyleSheet.create({
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    marginTop: 10,
  },
  col: {
    flex: 1,
    gap: 12,
  },
  card: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: pdfTheme.colors.bgLight,
    paddingBottom: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: pdfTheme.colors.primary,
    flex: 1,
  },
  subTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.main,
    marginTop: 6,
    marginBottom: 3,
  },
  bodyText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.muted,
    lineHeight: 1.45,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.text.main,
    lineHeight: 1.45,
  },
  bulletBold: {
    fontWeight: 'bold',
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: pdfTheme.colors.lifestyle.foodBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.lifestyle.foodBorder,
    borderRadius: 6,
    padding: 6,
    marginVertical: 5,
    gap: 6,
  },
  highlightText: {
    fontSize: 7.5,
    color: pdfTheme.colors.lifestyle.foodText,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 1.4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    backgroundColor: pdfTheme.colors.lifestyle.positiveBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.lifestyle.positiveBorder,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 6.5,
    color: pdfTheme.colors.lifestyle.positiveText,
    fontWeight: 'bold',
  },
  alertStrip: {
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
  alertText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.danger.text,
    lineHeight: 1.45,
  },
  positiveStrip: {
    flexDirection: 'row',
    backgroundColor: pdfTheme.colors.softBg,
    borderWidth: 1,
    borderColor: pdfTheme.colors.softBg,
    borderRadius: 6,
    padding: 6,
    marginTop: 5,
    gap: 6,
    alignItems: 'flex-start',
  },
  positiveText: {
    flex: 1,
    fontSize: 7.5,
    color: pdfTheme.colors.primary,
    lineHeight: 1.45,
  },
  reminderBanner: {
    marginTop: 10,
    backgroundColor: pdfTheme.colors.primary,
    borderRadius: 6,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.white,
    flex: 1,
    lineHeight: 1.5,
  },
  reminderBold: {
    fontWeight: 'bold',
  },
});

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
      title="Guia Completo: Controle do Colesterol e Triglicerídeos"
      visibleParagraphs={visibleParagraphs}
      wrap={false}
      nomePaciente={formData?.nomePaciente}
      cnsCpf={formData?.cnsCpf}
    >
      <View style={S.twoCol}>
        {/* ---- COLUNA ESQUERDA ---- */}
        <View style={S.col}>
          {/* Card 1 – Conheça os seus Números */}
          <View style={[S.card, { borderColor: pdfTheme.colors.primary }]}>
            <View style={S.cardHeader}>
              <CholesterolIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                1. LDL vs. HDL (Quem é quem?)
              </Text>
            </View>
            <Text style={S.bodyText}>
              O colesterol não é todo igual. Pense neles como funcionários do seu corpo:
            </Text>
            <View style={S.bulletRow}>
              <AlertBulletIcon size={8} color={pdfTheme.colors.danger.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>LDL (Colesterol Ruim):</Text> É o "sujador". Ele deixa gordura nas paredes das artérias, podendo entupi-las.</Text>
            </View>
            <View style={S.bulletRow}>
              <BulletIcon size={8} color={pdfTheme.colors.success.strong} />
              <Text style={S.bulletText}><Text style={S.bulletBold}>HDL (Colesterol Bom):</Text> É o "faxineiro". Ele recolhe a gordura das artérias e leva para o fígado eliminar.</Text>
            </View>
          </View>

          {/* Card 2 – O Perigo dos Triglicerídeos */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <MindIcon size={18} color={pdfTheme.colors.warning.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.strong }]}>
                2. Triglicerídeos: Açúcar e Álcool
              </Text>
            </View>
            <Text style={S.bodyText}>
              Diferente do colesterol, os triglicerídeos sobem muito com o excesso de <Text style={S.bulletBold}>massas, doces e bebidas alcoólicas</Text>.
            </Text>
            <View style={S.alertStrip}>
              <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
              <Text style={S.alertText}>
                O excesso de carboidrato que você come e não queima, o corpo transforma em gordura (triglicerídeos) para guardar.
              </Text>
            </View>
          </View>

          {/* Card 3 – Gorduras: Trocas Inteligentes */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <FoodIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                3. Trocas que Salvam Vidas
              </Text>
            </View>
            <Text style={S.bodyText}>Pequenas mudanças diárias geram grandes resultados nos exames:</Text>
            
            <View style={[S.positiveStrip, { backgroundColor: '#f0fdf4', borderColor: '#bcf0da' }]}>
               <Text style={[S.positiveText, { fontSize: 7, color: '#166534' }]}>
                 <Text style={{ fontWeight: 'bold' }}>Troque:</Text> Manteiga/Banha  |  <Text style={{ fontWeight: 'bold' }}>Por:</Text> Azeite de Oliva{"\n"}
                 <Text style={{ fontWeight: 'bold' }}>Troque:</Text> Carne Gorda/Pele |  <Text style={{ fontWeight: 'bold' }}>Por:</Text> Peixe ou Frango sem pele{"\n"}
                 <Text style={{ fontWeight: 'bold' }}>Troque:</Text> Queijo Amarelo  |  <Text style={{ fontWeight: 'bold' }}>Por:</Text> Queijo Branco (Minas/Ricota)
               </Text>
            </View>
          </View>

          {/* Card 4 – Perigos Silenciosos */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <AlertBulletIcon size={18} color={pdfTheme.colors.danger.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                4. Cuidado com o "Invisível"
              </Text>
            </View>
            <Text style={S.bodyText}>Muitos alimentos não parecem gordurosos, mas são <Text style={S.bulletBold}>bombas de colesterol</Text>:</Text>
            <View style={S.chipRow}>
              {['Biscoito Recheado', 'Sorvete', 'Salgadinho', 'Nuggets', 'Sopa de Pacote'].map((f) => (
                <View key={f} style={[S.chip, { backgroundColor: '#fff5f5', borderColor: '#feb2b2' }]}>
                  <Text style={[S.chipText, { color: '#c53030' }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ---- COLUNA DIREITA ---- */}
        <View style={S.col}>
          {/* Card 5 – Fibras: A Vassoura do Sangue */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <FiberIcon size={18} color={pdfTheme.colors.success.strong} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.success.strong }]}>
                5. Fibras (O Faxineiro do Sangue)
              </Text>
            </View>
            <Text style={S.bodyText}>
              As fibras "grudam" na gordura da comida e impedem que ela entre no seu sangue.
            </Text>
            <View style={S.highlightPill}>
              <LeafIcon size={14} color={pdfTheme.colors.lifestyle.cyanText} />
              <Text style={S.highlightText}>
                Dica: Coma 2 colheres de sopa de Farelo de Aveia por dia. É um remédio natural!
              </Text>
            </View>
            <Text style={S.subTitle}>Super Alimentos:</Text>
            <View style={S.chipRow}>
              {['Berinjela', 'Abóbora', 'Maçã com Casca', 'Feijão', 'Quiabo', 'Linhaça'].map((f) => (
                <View key={f} style={S.chip}>
                  <Text style={S.chipText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card 6 – Movimento e Metabolismo */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <WalkIcon size={18} color={pdfTheme.colors.lifestyle.activityText} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.lifestyle.activityText }]}>
                6. Ative o seu Metabolismo
              </Text>
            </View>
            <Text style={S.bodyText}>
              A atividade física é a única forma natural de <Text style={S.bulletBold}>subir o seu HDL (colesterol bom)</Text>.
            </Text>
            <View style={S.positiveStrip}>
              <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.positiveText}>
                Combine caminhadas (cardio) com pequenos pesos (fortalecimento). Isso faz seu corpo queimar gordura mesmo quando você está em repouso.
              </Text>
            </View>
          </View>

          {/* Card 7 – Peso e Cintura */}
          <View style={S.card}>
            <View style={S.cardHeader}>
              <ScaleIcon size={18} color={pdfTheme.colors.primary} />
              <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                7. Fique de Olho na Cintura
              </Text>
            </View>
            <Text style={S.bodyText}>
              A gordura que fica na barriga (abdominal) é a mais perigosa para o coração e para o fígado.
            </Text>
            <View style={[S.positiveStrip, { marginTop: 4 }]}>
              <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
              <Text style={S.positiveText}>
                 Perder apenas <Text style={{ fontWeight: 'bold' }}>5 a 10%</Text> do seu peso atual já melhora drasticamente todos os seus exames de colesterol.
              </Text>
            </View>
          </View>

          {/* Footer reminder */}
          <View style={S.reminderBanner}>
            <LeafIcon size={22} color={pdfTheme.colors.text.white} />
            <Text style={S.reminderText}>
              <Text style={S.reminderBold}>Colesterol não dói,</Text> mas entope aos poucos. A prevenção através da comida é o seu melhor seguro de vida. Comece hoje!
            </Text>
          </View>
        </View>
      </View>
    </BaseDocument>
  );
};
