import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import {
  ScaleIcon,
  FoodIcon,
  WalkIcon,
  NoSmokingIcon,
  MindIcon,
  BulletIcon,
  AlertBulletIcon,
  TipBulletIcon,
  SaltIcon,
  LeafIcon,
} from './HASLifestyleGraphics';
import {
  BaseDocument,
  type DocumentFormData,
  PageFooter,
  DocTitle,
  commonStyles,
  pdfTheme,
} from './PdfCommon';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = StyleSheet.create({
  /* Two-column grid */
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

  /* Section card */
  card: {
    backgroundColor: pdfTheme.colors.text.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: pdfTheme.colors.border,
    padding: 12,
  },

  /* Card header (icon + colored title) */
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

  /* Section subtitle inside a card */
  subTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: pdfTheme.colors.text.main,
    marginTop: 6,
    marginBottom: 3,
  },

  /* Standard body text */
  bodyText: {
    fontSize: 7.5,
    color: pdfTheme.colors.text.muted,
    lineHeight: 1.45,
  },

  /* Bullet row */
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

  /* Highlight pill (e.g. "1 colherzinha por dia") */
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

  /* Food chip list */
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

  /* No-drink/smoke alert strip */
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

  /* Positive strip (teal) */
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

  /* Footer reminder banner */
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface HASLifestyleDocumentProps {
  visibleParagraphs: string[];
  formData?: DocumentFormData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const HASLifestyleDocument: React.FC<HASLifestyleDocumentProps> = ({
  visibleParagraphs,
  formData,
}) => {
  return (
    <React.Fragment>
      {/* ======================================================
          ÚNICA PÁGINA                                         
      ====================================================== */}
      <BaseDocument
        title="Guia de Estilo de Vida para Controle da HAS"
        visibleParagraphs={visibleParagraphs}
        wrap={false}
        nomePaciente={formData?.nomePaciente}
        cnsCpf={formData?.cnsCpf}
      >
        {/* Two-column layout */}
        <View style={S.twoCol}>

          {/* ---- COLUNA ESQUERDA ---- */}
          <View style={S.col}>

            {/* Card 1 – Peso */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <ScaleIcon size={18} color={pdfTheme.colors.primary} />
                <Text style={[S.cardTitle, { color: pdfTheme.colors.primary }]}>
                  1. Mantenha um Peso Saudável
                </Text>
              </View>
              <Text style={S.bodyText}>
                Estar no peso certo ajuda o seu coração a trabalhar melhor e protege suas articulações.
              </Text>
              <View style={S.positiveStrip}>
                <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
                <Text style={S.positiveText}>
                  A equipe do postinho vai medir seu{' '}
                  <Text style={{ fontWeight: 'bold' }}>peso e altura</Text> nas consultas.
                  O objetivo é manter a balança em um número saudável para a sua idade.
                </Text>
              </View>
            </View>

            {/* Card 2 – Alimentação */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <FoodIcon size={18} color={pdfTheme.colors.warning.strong} />
                <Text style={[S.cardTitle, { color: pdfTheme.colors.warning.strong }]}>
                  2. Alimentação Saudável (Menos Sal!)
                </Text>
              </View>

              {/* Salt highlight */}
              <View style={S.highlightPill}>
                <SaltIcon size={14} color={pdfTheme.colors.lifestyle.cyanText} />
                <Text style={S.highlightText}>
                  Limite: <Text style={{ fontSize: 8 }}>1 colherzinha de chá (rasa) de sal por dia</Text> para toda a comida.
                </Text>
              </View>

              {/* Tips */}
              <Text style={S.subTitle}>Dicas práticas:</Text>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.success.strong} />
                <Text style={S.bulletText}>
                  Tire o <Text style={S.bulletBold}>saleiro da mesa</Text>.
                </Text>
              </View>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.success.strong} />
                <Text style={S.bulletText}>
                  Use <Text style={S.bulletBold}>alho, cebola, coentro, cebolinha, colorau e cominho</Text> para dar sabor.
                </Text>
              </View>
              <View style={S.bulletRow}>
                <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
                <Text style={[S.bulletText, { color: pdfTheme.colors.danger.text }]}>
                  Evite <Text style={S.bulletBold}>temperos prontos em tablete</Text> — são puro sal!
                </Text>
              </View>

              {/* Potassium foods */}
              <Text style={S.subTitle}>Coma mais (Potássio):</Text>
              <View style={S.chipRow}>
                {['Banana', 'Laranja', 'Mamão', 'Jerimum', 'Macaxeira', 'Batata-doce', 'Feijão'].map((f) => (
                  <View key={f} style={S.chip}>
                    <Text style={S.chipText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Card 3 – Atividade */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <WalkIcon size={18} color={pdfTheme.colors.lifestyle.activityText} />
                <Text style={[S.cardTitle, { color: pdfTheme.colors.lifestyle.activityText }]}>
                  3. Movimente o Seu Corpo
                </Text>
              </View>
              <Text style={S.bodyText}>
                Ficar parado enfraquece o corpo. Qualquer movimento já ajuda muito!
              </Text>

              <View style={[S.positiveStrip, { marginTop: 6 }]}>
                <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
                <Text style={S.positiveText}>
                  <Text style={{ fontWeight: 'bold' }}>Meta:</Text> 30 minutos por dia, pelo menos 5 dias na semana.
                </Text>
              </View>

              <Text style={S.subTitle}>Exemplos de exercícios (Cardio):</Text>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.lifestyle.activityText} />
                <Text style={S.bulletText}>Caminhar rápido na rua ou na praça.</Text>
              </View>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.lifestyle.activityText} />
                <Text style={S.bulletText}>Andar de bicicleta, capinar o quintal ou varrer a casa com vontade.</Text>
              </View>

              <Text style={S.subTitle}>Para fortalecer os músculos (Resistência):</Text>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.lifestyle.activityText} />
                <Text style={S.bulletText}>Sentar e levantar da cadeira várias vezes seguidas.</Text>
              </View>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.lifestyle.activityText} />
                <Text style={S.bulletText}>
                  Usar <Text style={S.bulletBold}>garrafas PET</Text> cheias de água ou areia para exercícios com os braços.
                </Text>
              </View>
            </View>

          </View>

          {/* ---- COLUNA DIREITA ---- */}
          <View style={S.col}>

            {/* Card 4 – Álcool e Fumo */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <NoSmokingIcon size={18} color={pdfTheme.colors.danger.strong} />
                <Text style={[S.cardTitle, { color: pdfTheme.colors.danger.strong }]}>
                  4. Cuidado com a Bebida e o Fumo
                </Text>
              </View>
              <Text style={[S.bodyText, { color: pdfTheme.colors.danger.dark, fontWeight: 'bold', marginBottom: 4 }]}>
                Esses dois são os maiores inimigos do seu tratamento.
              </Text>

              {/* Alcohol */}
              <Text style={S.subTitle}>Bebida Alcoólica:</Text>
              <View style={S.alertStrip}>
                <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
                <Text style={S.alertText}>
                  O melhor para a saúde é <Text style={{ fontWeight: 'bold' }}>não beber</Text>. Se beber, o limite máximo
                  por dia é de <Text style={{ fontWeight: 'bold' }}>2 latinhas (homens)</Text> e{' '}
                  <Text style={{ fontWeight: 'bold' }}>1 latinha (mulheres)</Text>.
                </Text>
              </View>

              {/* Smoking */}
              <Text style={S.subTitle}>Fumo:</Text>
              <View style={S.alertStrip}>
                <AlertBulletIcon size={10} color={pdfTheme.colors.danger.strong} />
                <Text style={S.alertText}>
                  <Text style={{ fontWeight: 'bold' }}>Corte totalmente.</Text> Cigarro, vape, fumo de rolo e narguilé{' '}
                  entopem as veias e causam doenças graves.
                </Text>
              </View>
              <View style={[S.positiveStrip, { marginTop: 6 }]}>
                <TipBulletIcon size={10} color={pdfTheme.colors.primary} />
                <Text style={S.positiveText}>
                  Se precisar de ajuda para parar, <Text style={{ fontWeight: 'bold' }}>fale com a gente no posto!</Text>
                </Text>
              </View>
            </View>

            {/* Card 5 – Saúde Mental */}
            <View style={S.card}>
              <View style={S.cardHeader}>
                <MindIcon size={18} color={pdfTheme.colors.purple.text} />
                <Text style={[S.cardTitle, { color: pdfTheme.colors.purple.text }]}>
                  5. Cuide da Cabeça e da Alma
                </Text>
              </View>
              <Text style={S.bodyText}>
                O estresse e o nervosismo fazem a pressão subir.{' '}
                <Text style={{ fontWeight: 'bold' }}>Cuidar do coração também é cuidar da mente.</Text>
              </Text>

              <Text style={S.subTitle}>Respire:</Text>
              <View style={S.bulletRow}>
                <BulletIcon size={10} color={pdfTheme.colors.purple.text} />
                <Text style={S.bulletText}>
                  Tire <Text style={S.bulletBold}>5 minutinhos</Text> do seu dia. Sente em um lugar silencioso, feche os olhos,
                  puxe o ar pelo nariz bem devagar e solte pela boca.
                </Text>
              </View>

              <Text style={S.subTitle}>Fé e Esperança:</Text>
              <View style={[S.positiveStrip]}>
                <TipBulletIcon size={10} color={pdfTheme.colors.purple.text} />
                <Text style={[S.positiveText, { color: pdfTheme.colors.purple.textDark }]}>
                  Praticar sua fé, rezar, ir à igreja ou ao templo, ou cuidar das plantas no quintal —
                  essas coisas trazem <Text style={{ fontWeight: 'bold' }}>paz e ajudam a controlar o estresse</Text> do dia a dia.
                </Text>
              </View>
            </View>

            {/* Footer reminder */}
            <View style={S.reminderBanner}>
              <LeafIcon size={22} color={pdfTheme.colors.text.white} />
              <Text style={S.reminderText}>
                <Text style={S.reminderBold}>Lembre-se: </Text>
                Essas mudanças no estilo de vida, junto com os seus remédios, são fundamentais para
                manter a pressão controlada e ter uma vida saudável. A equipe do posto está aqui para te apoiar!
              </Text>
            </View>

          </View>
        </View>
      </BaseDocument>
    </React.Fragment>
  );
};
